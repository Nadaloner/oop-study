# 4 · const-correctness

## Teoria

### La regola

Marca `const` ogni cosa che **non modifichi**. Il test da applicare a ogni metodo è uno solo: *dopo averlo chiamato, l'oggetto è cambiato?* Se no, è `const`.

### `const` su variabili e puntatori

Il `const` si legge **da destra verso sinistra**: `const int* p` = "puntatore a `int` costante".

| Dichiarazione | Cosa è costante | Si può riassegnare `p`? | Si può modificare `*p`? |
|---|---|---|---|
| `int* p` | nulla | sì | sì |
| `const int* p` (= `int const* p`) | il dato | sì | **no** |
| `int* const p` | il puntatore | **no** | sì |
| `const int* const p` | entrambi | **no** | **no** |

Un `const` deve essere inizializzato (`const int k;` non compila), e un `int* const p` pure.

### `const` sui riferimenti

- `const int& r = x;` è un **riferimento a dato costante**: non puoi scrivere `r = 5`, ma `x` resta modificabile.
- `int& const r` non è valido: un riferimento non si riassegna già. (Vedi `ref-4` nel modulo 3.)
- `const T&` si lega anche a temporanei: `fun(4)` compila.

### `const` sui metodi

```cpp
class Orario {
public:
    int getOre() const;          // NON modifica l'oggetto
    void setOre(int h);          // modifica
};
```

Dentro un metodo `const`, `this` è `const Orario* const`: non puoi modificare i membri, e puoi chiamare solo altri metodi `const`. Gli oggetti `const` possono chiamare solo i metodi `const`.

**Overloading su `const`**: una classe può avere due versioni dello stesso metodo, una per oggetti `const` e una per non-`const` (è il meccanismo di `std::vector::operator[]`). Vedi `const-3`.

### `const` è superficiale

`const` protegge il **puntatore** all'interno di un metodo `const`, non il **dato puntato**. In un metodo `const`, `p` diventa `Orario* const`: non puoi riassegnarlo, ma `p->setOre(3)` compila. Vedi `const-5`.

### `mutable`

`mutable` permette a un membro di cambiare anche dentro un metodo `const`. Serve per **cache** e **contatori** che non cambiano lo stato *logico* dell'oggetto. Distinzione importante: la *constness logica* (chi osserva l'oggetto non vede cambiamenti) e quella *bit a bit* (nessun byte cambia). `mutable` permette la prima, non la seconda.

### Costanti di classe

`static constexpr int ORE = 24;` è una costante del tipo, valutata a tempo di compilazione. Un membro `const` non statico invece va inizializzato nella lista di inizializzazione, e fa sì che la classe non sia più assegnabile (`const-7`).

### Passaggio dei parametri

- oggetto che leggi → `const T&`;
- oggetto che modifichi → `T&`;
- tipo piccolo (`int`, `double`, ...) → per valore.

## Checklist

- [ ] ex:const-1 · Durata: trova i cinque errori (B1)
- [ ] ex:const-2 · Orario const-corretto (B2)
- [ ] ex:const-3 · Agenda: due operator[] (B3)
- [ ] ex:const-4 · Leggere le dichiarazioni (B4)
- [ ] ex:const-5 · const superficiale (B5)
- [ ] ex:const-6 · mutable e cache (B6)
- [ ] ex:const-7 · Costanti di classe (B7)
- [ ] ex:const-8 · Costo delle copie (B8)

## Esercizi e soluzioni

#### ex:const-1 · Durata: trova i cinque errori

*(B1)* Questa classe non compila nella funzione `report`. Trova i cinque punti da correggere.

```cpp nocheck
class Durata {
    int minuti;
public:
    Durata(int m) : minuti(m) {}
    int getMinuti() { return minuti; }
    void aggiungi(Durata d) { minuti += d.getMinuti(); }
    bool piuLungaDi(Durata d) { return minuti > d.getMinuti(); }
    void stampa() { std::cout << minuti << " min"; }
};

void report(const Durata& d) {
    d.stampa();
    std::cout << d.getMinuti();
}
```

<details>
<summary>Soluzione</summary>

I cinque punti:

1. `getMinuti()` non modifica l'oggetto → va marcato `const` (altrimenti `report` non può chiamarlo).
2. `stampa()` non modifica l'oggetto → `const` (anche `report` lo chiama).
3. `piuLungaDi()` non modifica l'oggetto → `const`.
4. Il parametro di `piuLungaDi` viene passato per **valore**: copia inutile → `const Durata&`.
5. Il parametro di `aggiungi` viene passato per valore → `const Durata&`. (Il metodo `aggiungi` invece modifica `this`, quindi non è `const`.)

```cpp
#include <iostream>

class Durata {
    int minuti;
public:
    Durata(int m) : minuti(m) {}
    int getMinuti() const { return minuti; }                               // 1
    void aggiungi(const Durata& d) { minuti += d.getMinuti(); }            // 5
    bool piuLungaDi(const Durata& d) const { return minuti > d.getMinuti(); }  // 3, 4
    void stampa() const { std::cout << minuti << " min"; }                 // 2
};

void report(const Durata& d) {
    d.stampa();
    std::cout << d.getMinuti();
}

int main() {
    const Durata x(30);
    Durata y(10);
    y.aggiungi(x);                              // y = 40
    std::cout << y.piuLungaDi(x) << '\n';       // 1
    report(x);                                  // 30 min30
    std::cout << '\n';
}
```

</details>

#### ex:const-2 · Orario const-corretto

*(B2)* Rendi `Orario` (modulo 1, `cls-5`) completamente const-corretta. Poi la funzione `riepilogo` deve compilare senza modifiche. Infine dichiara `const Orario mezzogiorno(12, 0, 0);` e prova `setOre(13)`: leggi il messaggio del compilatore.

<details>
<summary>Soluzione</summary>

Nella classe `Orario` di `cls-5`, i metodi che non modificano l'oggetto sono già `const` (`getOre`, `inSecondi`, `isValido`, `stampa`). Il codice rilevante è:

```cpp nocheck
void riepilogo(const Orario& o) {
    o.stampa();                                                  // deve essere const
    std::cout << " = " << o.inSecondi() << " s, valido: " << o.isValido() << "\n";
}

int main() {
    const Orario mezzogiorno(12, 0, 0);
    riepilogo(mezzogiorno);       // compila: tutti i metodi usati sono const
    mezzogiorno.setOre(13);       // ERRORE
}
```

Il messaggio di g++ è questo:

```
error: passing 'const Orario' as 'this' argument discards qualifiers [-fpermissive]
```

Traduzione: stai chiamando un metodo **non** `const` su un oggetto `const`. Due strade: rendere `const` il metodo, se non modifica nulla; oppure, se modifica davvero, non chiamarlo su un oggetto `const`. Il compilatore ti sta proteggendo, non ostacolando.

</details>

#### ex:const-3 · Agenda: due `operator[]`

*(B3)* La classe `Agenda` contiene un array di 24 `Orario`. Implementa due versioni di `operator[]`: una non-`const` che restituisce `Orario&`, una `const` che restituisce `const Orario&`. Metti un `cout` distintivo in ciascuna.

<details>
<summary>Soluzione</summary>

```cpp
#include <iostream>

class Orario {
public:
    Orario(int h = 0) : ore(h) {}
    int getOre() const { return ore; }
    void setOre(int h) { ore = h; }
private:
    int ore;
};

class Agenda {
public:
    Orario& operator[](int i) {                      // oggetto non const
        std::cout << "non-const\n";
        return ore[i];
    }
    const Orario& operator[](int i) const {          // oggetto const
        std::cout << "const\n";
        return ore[i];
    }
private:
    Orario ore[24];
};

int main() {
    Agenda a;
    a[9].setOre(10);                 // sceglie la non-const: stampa "non-const"
    const Agenda c;
    std::cout << c[9].getOre() << '\n';   // sceglie la const: stampa "const" poi "0"
}
```

Output: `non-const`, `const`, `0`.

**Perché.** Il compilatore sceglie la versione in base alla `const`-ness dell'oggetto su cui chiami l'operatore. È il meccanismo con cui funzionano `std::vector` e `std::string`: ti danno un riferimento modificabile solo se l'oggetto lo è.

</details>

#### ex:const-4 · Leggere le dichiarazioni

*(B4)* Per ciascuna riga dì se compila e perché. Poi riscrivi le tre dichiarazioni mettendo `const` a destra del tipo (`int const *p`).

```cpp nocheck
int a = 1, b = 2;
const int *p1 = &a;   *p1 = 5;   p1 = &b;
int *const p2 = &a;   *p2 = 5;   p2 = &b;
const int *const p3 = &a;  *p3 = 5;  p3 = &b;
```

<details>
<summary>Soluzione</summary>

Regola: parti dal nome e leggi verso sinistra.

- `p1`: puntatore a `int` costante. `*p1 = 5` **non** compila (il dato è costante). `p1 = &b` **compila** (il puntatore non è costante).
- `p2`: puntatore costante a `int`. `*p2 = 5` **compila**. `p2 = &b` **non** compila.
- `p3`: puntatore costante a `int` costante. Entrambe le scritture **non** compilano.

Riscrittura equivalente: `int const *p1`, `int *const p2`, `int const *const p3`. `const int` e `int const` sono sinonimi: il `const` vale per ciò che precede (o per ciò che lo segue, se è all'inizio).

</details>

#### ex:const-5 · `const` superficiale

*(B5)* Dimostra che `const` è superficiale: in un metodo `const`, prova a decommentare `p = nullptr;` e poi `p->setOre(3);`. Qual è il tipo di `p` dentro il metodo?

<details>
<summary>Soluzione</summary>

```cpp
#include <iostream>

class Orario {
public:
    Orario(int h = 0) : ore(h) {}
    void setOre(int h) { ore = h; }
    int getOre() const { return ore; }
private:
    int ore;
};

class Contenitore {
    Orario* p;
public:
    Contenitore(Orario* ptr) : p(ptr) {}
    void prova() const {
        // p = nullptr;      // ERRORE: dentro un metodo const, p è 'Orario* const'
        p->setOre(3);        // COMPILA: il puntatore è const, l'oggetto puntato no
    }
    int leggi() const { return p->getOre(); }
};

int main() {
    Orario o(1);
    Contenitore c(&o);
    c.prova();
    std::cout << c.leggi() << '\n';   // 3
}
```

Dentro un metodo `const`, `p` ha tipo `Orario* const` (puntatore costante a `Orario` non costante). Il compilatore impedisce di riassegnare `p`, ma non impedisce di modificare `*p`. È la conseguenza del fatto che `const` vale solo per il livello direttamente annotato.

**Conseguenza pratica.** Un metodo `const` non garantisce che l'oggetto a cui un membro punta non cambi. Se serve quella garanzia, il membro deve essere `const Orario*`.

</details>

#### ex:const-6 · `mutable` e cache

*(B6)* Usa `mutable` per una cache dell'area di un poligono, calcolata solo la prima volta. Aggiungi anche un contatore dei calcoli effettuati, che cambia anche su oggetti `const`.

<details>
<summary>Soluzione</summary>

```cpp
#include <cstddef>
#include <iostream>
#include <vector>

struct Punto2D { double x, y; };

class Poligono {
public:
    void aggiungiVertice(const Punto2D& p) {
        vertici.push_back(p);
        cacheValida = false;                 // invalida la cache
    }

    double area() const {                    // const: non cambia la figura
        if (!cacheValida) {
            areaCache = calcola();           // modifica un membro mutable: legale in un metodo const
            cacheValida = true;
            ++calcoli;
        }
        return areaCache;
    }

    int calcoliEffettuati() const { return calcoli; }

private:
    double calcola() const {                 // formula dei lacci (shoelace)
        double s = 0;
        std::size_t n = vertici.size();
        for (std::size_t i = 0; i < n; ++i) {
            const Punto2D& a = vertici[i];
            const Punto2D& b = vertici[(i + 1) % n];
            s += a.x * b.y - b.x * a.y;
        }
        return (s < 0 ? -s : s) / 2;
    }

    std::vector<Punto2D> vertici;
    mutable double areaCache = 0;
    mutable bool cacheValida = false;
    mutable int calcoli = 0;                 // cambia anche dentro metodi const
};

int main() {
    Poligono q;
    q.aggiungiVertice({0, 0});
    q.aggiungiVertice({4, 0});
    q.aggiungiVertice({4, 3});

    const Poligono& c = q;                   // lo osserviamo come const
    std::cout << c.area() << '\n';           // 6 (calcolata)
    std::cout << c.area() << '\n';           // 6 (dalla cache)
    std::cout << c.calcoliEffettuati() << '\n';   // 1
}
```

**Constness logica.** Dall'esterno, l'area di un triangolo non cambia mai: `area()` è `const`. Internamente la cache cambia, ed è proprio il caso per cui esiste `mutable`.

</details>

#### ex:const-7 · Costanti di classe

*(B7)* Aggiungi a `Orario` le costanti `static constexpr int SECONDI_AL_GIORNO = 86400;` e `ORE_AL_GIORNO = 24`, e usale dentro un metodo. Poi prova a dichiarare un membro `const int ore;` non statico: dove va inizializzato, e perché la classe non è più assegnabile?

<details>
<summary>Soluzione</summary>

```cpp
#include <iostream>

class Orario {
public:
    static constexpr int SECONDI_AL_GIORNO = 86400;
    static constexpr int ORE_AL_GIORNO = 24;

    explicit Orario(int h) : ore(h) {}
    int getOre() const { return ore; }
    int inSecondiApprossimati() const {
        return ore * (SECONDI_AL_GIORNO / ORE_AL_GIORNO);
    }
private:
    int ore;
};

int main() {
    Orario o(2);
    std::cout << o.inSecondiApprossimati() << '\n';   // 7200
    std::cout << Orario::SECONDI_AL_GIORNO << '\n';   // 86400
}
```

**Il membro `const` non statico.** Va inizializzato **nella lista di inizializzazione**, perché non può essere assegnato dopo:

```cpp nocheck
class Ora {
public:
    Ora(int h) : ore(h) {}     // corretto
    const int ore;
};

Ora a(1), b(2);
a = b;                          // ERRORE: operator= implicito cancellato, perché 'ore' è const
```

Il compilatore non riesce a generare l'assegnazione (che modificherebbe `ore`), quindi la classe non è assegnabile. Una costante di classe `static` è invece condivisa e non appartiene a un oggetto: non crea questo problema.

</details>

#### ex:const-8 · Costo delle copie

*(B8)* Aggiungi a `Studente` un costruttore di copia che stampa `COPIA!`. Scrivi `f1(Studente)`, `f2(Studente&)` e `f3(const Studente&)`. Chiamale e conta le stampe. Poi spiega perché `f2(Studente("Rossi"))` non compila.

<details>
<summary>Soluzione</summary>

```cpp
#include <iostream>
#include <string>
#include <utility>

class Studente {
public:
    explicit Studente(std::string n) : nome(std::move(n)) {}
    Studente(const Studente& altro) : nome(altro.nome) { std::cout << "COPIA!\n"; }
private:
    std::string nome;
};

void f1(Studente) {}              // per valore: crea una copia
void f2(Studente&) {}             // per riferimento: nessuna copia
void f3(const Studente&) {}       // per riferimento costante: nessuna copia, non modifica

int main() {
    Studente s("Mario");
    f1(s);                        // stampa COPIA!
    f2(s);                        // nessuna stampa
    f3(s);                        // nessuna stampa
    // f2(Studente("Rossi"));     // ERRORE: un Studente& non si lega a un temporaneo
    f3(Studente("Rossi"));        // ok: const Studente& accetta temporanei, nessuna copia
}
```

Output: una sola riga `COPIA!`, prodotta da `f1`.

**Perché `const&` e non abitudine.** `f2` non accetta temporanei perché potrebbe modificarli e l'effetto sarebbe inutile: il temporaneo sparisce subito. `f3` accetta temporanei e garantisce di non modificare nulla: è la forma più flessibile e sicura per leggere un oggetto.

</details>
