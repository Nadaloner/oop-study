# 2 · Risorse e strutture dinamiche

## Teoria

### Stack e heap

Le variabili locali vivono sullo **stack** e vengono distrutte automaticamente alla fine del blocco. Con `new` alloci sullo **heap**: la memoria resta allocata finché non la liberi con `delete`. Il compilatore non la libera per te.

| Allocazione | Liberazione |
|---|---|
| `new T` | `delete` |
| `new T[n]` | `delete[]` |

Usare la forma sbagliata è **undefined behavior**: mai `delete` su un array, mai `delete[]` su un singolo oggetto.

### Copia superficiale e copia profonda

Se una classe ha un membro puntatore, la copia automatica del compilatore copia **il puntatore**, non i dati. Due oggetti finiscono per puntare allo stesso array, e il distruttore li libera entrambi: **double free**.

- **Copia superficiale**: copia i puntatori (default del compilatore).
- **Copia profonda**: alloca un nuovo blocco e copia i valori (quello che serve quasi sempre).

### La regola dei tre

Se una classe gestisce una risorsa, deve definire **tutti e tre**:

1. il **distruttore** (libera la risorsa);
2. il **costruttore di copia** (copia profonda);
3. l'**operatore di assegnazione** `operator=` (copia profonda, libera la vecchia risorsa, gestisce `a = a`).

Schema di `operator=` corretto:

```cpp
Matrice& operator=(const Matrice& altra) {
    if (this == &altra) return *this;     // auto-assegnazione
    // 1) alloca la nuova risorsa PRIMA di liberare la vecchia (sicurezza in caso di eccezione)
    // 2) copia i dati
    // 3) libera la vecchia risorsa e aggiorna i membri
    return *this;
}
```

> Dal C++11 esiste anche la *regola dei cinque* (move constructor e move assignment). Per ora ti basta la regola dei tre: se ti servono le mosse, lo vedrai in seguito.

### RAII

*Resource Acquisition Is Initialization*: la risorsa viene acquisita nel costruttore e rilasciata nel distruttore. Quando l'oggetto esce dallo scope, la risorsa viene liberata automaticamente. È il motivo per cui in C++ si evitano `new`/`delete` sparsi nel codice.

### Strutture dinamiche

Liste, code, alberi: nodi allocati con `new`, collegati con puntatori. Per ogni struttura, tre domande:

- **Invariante**: quali condizioni valgono sempre? (es. in una lista vuota `first == nullptr`).
- **Ricorsione**: la copia e la distruzione si scrivono quasi sempre ricorsivamente sui nodi.
- **Proprietà**: chi possiede un nodo? Con gestione *senza condivisione*, ogni nodo ha un solo proprietario.

Gli esercizi del PDF `Esercizi_strutture_dinamiche_CPP.pdf` (cartella OOP) applicano queste idee a liste e alberi: fanno da complemento a questo modulo.

## Checklist

- [ ] ex:res-1 · Matrice: il bug della copia superficiale (A9)
- [ ] ex:res-2 · Matrice con la regola dei tre (A10)
- [ ] ex:res-3 · Matrice: somma, prodotto, trasposta (A11)
- [ ] ex:res-4 · Coda FIFO in C++ con RAII (A12)
- [ ] ex:res-5 · Vettore: copia profonda e operatori (dagli esercizi svolti)
- [ ] ex:res-6 · Tree: alberi binari con copia e distruzione profonde (dagli esercizi svolti)

## Esercizi e soluzioni

#### ex:res-1 · Matrice: il bug della copia superficiale

*(A9)* Scrivi `Matrice` che alloca un array di `double` di dimensione `righe × colonne` (un solo blocco, elemento `(i, j)` in posizione `i*colonne + j`), con costruttore, distruttore, `at(i, j)` in due versioni (`double&` e `double` const) e `stampa() const`. Nel `main` scrivi `Matrice b = a;` e osserva cosa succede con `-fsanitize=address`.

<details>
<summary>Soluzione</summary>

```cpp nocheck
class Matrice {
public:
    Matrice(int righe, int colonne)
        : righe_(righe), colonne_(colonne),
          dati_(new double[static_cast<std::size_t>(righe) * colonne]()) {}
    ~Matrice() { delete[] dati_; }
    double& at(int i, int j) { return dati_[i * colonne_ + j]; }
    double at(int i, int j) const { return dati_[i * colonne_ + j]; }
private:
    int righe_, colonne_;
    double* dati_;
};

int main() {
    Matrice a(2, 2);
    Matrice b = a;   // copia SUPERFICIALE: b.dati_ == a.dati_
}                    // ~b libera dati_; ~a libera di nuovo la stessa memoria
```

Con `-fsanitize=address` ottieni un errore di tipo **attempting double-free**. Il motivo è la copia superficiale: il costruttore di copia generato dal compilatore copia il puntatore. Nel prossimo esercizio lo correggiamo.

**Perché è importante.** Il sintomo non è sempre immediato: a volte il programma sembra funzionare e crasha molto dopo. Per questo il sanitizer va sempre attivato su questi esercizi.

</details>

#### ex:res-2 · Matrice con la regola dei tre

*(A10)* Risolvi il problema di `res-1` implementando: distruttore, costruttore di copia profondo, `operator=` profondo che gestisce `a = a` e libera la memoria vecchia.

<details>
<summary>Soluzione</summary>

```cpp
#include <cstddef>
#include <iostream>

class Matrice {
public:
    Matrice(int righe, int colonne)
        : righe_(righe), colonne_(colonne),
          dati_(new double[static_cast<std::size_t>(righe) * colonne]()) {}   // () = tutti a 0

    // 2. costruttore di copia profondo
    Matrice(const Matrice& altra)
        : righe_(altra.righe_), colonne_(altra.colonne_), dati_(new double[altra.elementi()]) {
        for (std::size_t k = 0; k < elementi(); ++k) dati_[k] = altra.dati_[k];
    }

    // 3. assegnazione profonda
    Matrice& operator=(const Matrice& altra) {
        if (this == &altra) return *this;                  // a = a
        double* nuovi = new double[altra.elementi()];      // alloco prima...
        for (std::size_t k = 0; k < altra.elementi(); ++k) nuovi[k] = altra.dati_[k];
        delete[] dati_;                                    // ...libero dopo
        dati_ = nuovi;
        righe_ = altra.righe_;
        colonne_ = altra.colonne_;
        return *this;
    }

    // 1. distruttore
    ~Matrice() { delete[] dati_; }

    double& at(int i, int j) { return dati_[i * colonne_ + j]; }
    double at(int i, int j) const { return dati_[i * colonne_ + j]; }

    void stampa() const {
        for (int i = 0; i < righe_; ++i) {
            for (int j = 0; j < colonne_; ++j) std::cout << at(i, j) << ' ';
            std::cout << '\n';
        }
    }

private:
    std::size_t elementi() const { return static_cast<std::size_t>(righe_) * colonne_; }
    int righe_, colonne_;
    double* dati_;
};

int main() {
    Matrice a(2, 2);
    a.at(0, 0) = 1; a.at(0, 1) = 2;
    a.at(1, 0) = 3; a.at(1, 1) = 4;

    Matrice b = a;        // copia profonda: b ha un array tutto suo
    b.at(0, 0) = 99;

    a.stampa();           // 1 2 / 3 4
    b.stampa();           // 99 2 / 3 4
    a = a;                // auto-assegnazione: nessun danno
    a.stampa();           // 1 2 / 3 4
    a = b;                // assegnazione profonda
    a.stampa();           // 99 2 / 3 4
}
```

**Nota.** La versione con `new` *prima* di `delete[]` è più robusta: se `new` lancia un'eccezione, l'oggetto `*this` resta intatto. È la stessa idea di *copy-and-swap*, che vedrai in seguito.

</details>

#### ex:res-3 · Matrice: somma, prodotto, trasposta

*(A11)* Aggiungi `operator+`, `operator*` (prodotto matriciale, con controllo di compatibilità) e `trasposta()`. Tutte e tre devono essere metodi `const` che restituiscono una **nuova** `Matrice`.

<details>
<summary>Soluzione</summary>

Sono metodi da aggiungere alla classe dell'esercizio precedente. Servono anche i getter delle dimensioni:

```cpp nocheck
// nella classe Matrice (res-2), aggiungi:
int getRighe() const { return righe_; }
int getColonne() const { return colonne_; }

Matrice operator+(const Matrice& b) const {
    if (righe_ != b.righe_ || colonne_ != b.colonne_)
        throw std::invalid_argument("somma: dimensioni diverse");
    Matrice r(righe_, colonne_);
    for (int i = 0; i < righe_; ++i)
        for (int j = 0; j < colonne_; ++j)
            r.at(i, j) = at(i, j) + b.at(i, j);
    return r;
}

Matrice operator*(const Matrice& b) const {
    if (colonne_ != b.righe_) throw std::invalid_argument("prodotto: dimensioni incompatibili");
    Matrice r(righe_, b.colonne_);
    for (int i = 0; i < righe_; ++i)
        for (int j = 0; j < b.colonne_; ++j) {
            double s = 0;
            for (int k = 0; k < colonne_; ++k) s += at(i, k) * b.at(k, j);
            r.at(i, j) = s;
        }
    return r;
}

Matrice trasposta() const {
    Matrice t(colonne_, righe_);
    for (int i = 0; i < righe_; ++i)
        for (int j = 0; j < colonne_; ++j)
            t.at(j, i) = at(i, j);
    return t;
}
```

**Punti chiave.** Restituire `Matrice` per valore è sicuro: grazie alla copia profonda, il risultato è indipendente. Il compilatore di solito evita la copia (*copy elision*). Anche `r` vive sullo stack del metodo, ma la sua risorsa (l'array) viene "consegnata" al chiamante tramite la copia.

</details>

#### ex:res-4 · Coda FIFO in C++ con RAII

*(A12)* Riscrivi in C++ la coda FIFO: nodi allocati con `new`, distruttore che libera tutto, `enqueue`, `dequeue`, `front() const`, `isEmpty() const`, `size() const`. Verifica che non ci siano leak con `-fsanitize=address`.

<details>
<summary>Soluzione</summary>

```cpp
#include <cstddef>
#include <iostream>
#include <stdexcept>

class Coda {
public:
    Coda() = default;
    Coda(const Coda&) = delete;             // per ora la copia è vietata (la regola dei tre è rispettata
    Coda& operator=(const Coda&) = delete;  // dicendo esplicitamente "non si copia")

    ~Coda() {                               // RAII: libera tutto quando la coda esce dallo scope
        while (!isEmpty()) dequeue();
    }

    void enqueue(int valore) {
        Nodo* n = new Nodo{valore, nullptr};
        if (tail) tail->next = n;
        else      head = n;                 // coda vuota: il nuovo nodo è anche la testa
        tail = n;
        ++n_;
    }

    void dequeue() {
        if (isEmpty()) throw std::underflow_error("coda vuota");
        Nodo* vecchio = head;
        head = head->next;
        if (!head) tail = nullptr;          // la coda si è svuotata
        delete vecchio;
        --n_;
    }

    int front() const {
        if (isEmpty()) throw std::underflow_error("coda vuota");
        return head->valore;
    }
    bool isEmpty() const { return head == nullptr; }
    std::size_t size() const { return n_; }

private:
    struct Nodo {
        int valore;
        Nodo* next;
    };
    Nodo* head = nullptr;   // primo da estrarre
    Nodo* tail = nullptr;   // ultimo inserito
    std::size_t n_ = 0;
};

int main() {
    Coda c;
    for (int i = 1; i <= 3; ++i) c.enqueue(i * 10);
    std::cout << c.front() << ' ' << c.size() << '\n';   // 10 3
    c.dequeue();
    std::cout << c.front() << ' ' << c.size() << '\n';   // 20 2
}   // il distruttore libera i nodi rimasti: nessun leak
```

**Punti chiave.** Il distruttore non può essere "dimenticato": la liberazione è automatica. Vietare la copia con `= delete` è una scelta legittima quando non serve: il compilatore ti impedisce il double free invece di lasciarlo succedere.

</details>

#### ex:res-5 · Vettore: copia profonda e operatori

*(Dalla cartella «Soluzioni esercizi svolti», file `Vettore.cpp`)* Classe `Vettore` per array di interi: costruttore di default, costruttore "opportuno", concatenazione `v1 + v2` che restituisce un nuovo vettore, `append`, uguaglianza, output, indicizzazione, copia profonda, assegnazione profonda, distruzione profonda. Prima di tutto: **prevedi l'output** del `main` del file.

<details>
<summary>Soluzione</summary>

Il `main` del file stampa tre righe. Ecco l'output reale (verificato con `-fsanitize=address,undefined`, nessun errore):

```
0 0 0 0 0 0 0 0 0 0 0 0 3 3 3 3 3 3 3 3 3 0 0 0 0 0
0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
3 3 3 3 3 3 3 3 3 0 0 0 0 0 0 0 0 0 0 0 0 3 3 3 3 3 3 3 3 3 0 0 0 0 0
```

Come si ricava, passo per passo:

1. `v2 = 8 zeri`, `v3 = 9 tre`.
2. `v1 = v2 + v3` → 8 zeri seguiti da 9 tre (17 elementi).
3. `v1 = v1 + 5` → `5` diventa `Vettore(5, 0)` tramite il costruttore non `explicit` (conversione implicita) → 22 elementi.
4. `v1 = 4 + v1` → `4` diventa `Vettore(4, 0)`: 4 zeri in testa → 26 elementi (12 zeri, 9 tre, 5 zeri).
5. `v2.append(v2)` → 16 zeri.
6. `v3.append(v1)` → 9 tre seguiti dai 26 elementi di `v1`.

**Tre punti da discutere (domande d'esame):**

- **Il design di `operator[]`.** Nel file è dichiarato `int& operator[](unsigned int k) const`. È un metodo `const` che restituisce un riferimento modificabile: quindi un oggetto `const` può essere modificato. Versione corretta:

```cpp nocheck
int& operator[](unsigned int k) { return a[k]; }               // oggetto non const
const int& operator[](unsigned int k) const { return a[k]; }   // oggetto const
```

- **Perché `friend`.** `operator+` e `operator==` vogliono accedere a `size` e `a` di *due* oggetti; con `friend` l'accesso è dichiarato esplicitamente invece di essere aperto a tutti.
- **Il costruttore da `unsigned int`.** Non è `explicit`, quindi permette `v1 + 5`. Comodo, ma è proprio la conversione implicita del modulo 6.

</details>

#### ex:res-6 · Tree: alberi binari con copia e distruzione profonde

*(Dalla cartella «Soluzioni esercizi svolti», file `Tree.cpp`)* Gli oggetti di `Tree` rappresentano alberi binari ricorsivi di `char`. Ridefinisci assegnazione, costruttore di copia e distruttore come copia e distruzione **profonde**. Scrivi esplicitamente le eventuali dichiarazioni `friend` necessarie.

<details>
<summary>Soluzione</summary>

Il file contiene già la soluzione. Il punto da capire è questo:

- `Nodo` ha il costruttore **privato** e dichiara `friend class Tree;`: solo `Tree` può creare e manipolare i nodi. È l'uso corretto di `friend`: concedi l'accesso a una classe che è parte dello stesso progetto.
- Le funzioni di supporto `copia` e `distruggi` sono `static` e ricorsive:

```cpp nocheck
static Nodo* copia(Nodo* r) {
    return r == nullptr ? nullptr : new Nodo(r->info, copia(r->sx), copia(r->dx));
}
static void distruggi(Nodo* r) {
    if (r != nullptr) { distruggi(r->sx); distruggi(r->dx); delete r; }
}
```

- `operator=` distrugge prima l'albero vecchio e poi copia quello nuovo, con il controllo `this != &t`.
- Il `main` del file non stampa nulla: si verifica con i sanitizer (nessun leak, nessun double free). Prova a commentare il distruttore e osserva la differenza.

**Perché la ricorsione è naturale.** Un albero è per definizione un nodo più due sottoalberi: la copia e la distruzione seguono la stessa struttura. Quando una funzione ricorsiva rispecchia la definizione ricorsiva dei dati, la correttezza si dimostra quasi da sola.

</details>
