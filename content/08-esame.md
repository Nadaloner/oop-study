# 8 · Esame integrato

*Gli esercizi di questo modulo sono nello stile dell'esame: più concetti insieme, e il criterio è la correttezza complessiva.*

## Teoria: come si affronta un esercizio d'esame

1. **Leggi tutto il testo prima di scrivere.** Segna i vincoli (const-correctness, regola dei tre, niente leak).
2. **Disegna le classi** e le relazioni: ereditarietà (`è un`), composizione (`ha un`), proprietà delle risorse (chi libera cosa).
3. **Scrivi prima l'interfaccia** (firme con `const` e `const&`), poi l'implementazione.
4. **Gestisci la memoria dall'inizio**: se una classe alloca, scrivi subito la regola dei tre (o `= delete`).
5. **Controlla con i sanitizer** e con un `main` che usi tutto.

Errori che costano più punti all'esame: `const` mancante su metodi o parametri; `delete` sbagliato; copie superficiali; distruttori non virtuali nelle basi polimorfiche; accessi fuori range.

## Checklist

- [ ] ex:esa-1 · Biblioteca: gerarchia, `dynamic_cast`, `const` (E1)
- [ ] ex:esa-2 · Registro voti: puntatori e `const` (E2)
- [ ] ex:esa-3 · Trova gli errori in `Vettore` (E3)
- [ ] ex:esa-4 · Valuta: conversioni controllate (E4)
- [ ] ex:esa-5 · Dal C al C++: archivio studenti (E5)

## Esercizi e soluzioni

#### ex:esa-1 · Biblioteca: gerarchia, `dynamic_cast`, `const`

*(E1)* Classe base astratta `Documento` (titolo, anno, codice; `virtual descrizione() const = 0`; distruttore virtuale). Derivate `Libro` (autore, pagine), `Rivista` (numero, mese), `DVD` (durata in minuti). Classe `Biblioteca` con `std::vector<Documento*>`: `aggiungi`, `cercaPerTitolo(const std::string&) const`, `stampaTutti() const`, distruttore che libera tutto, `durataTotaleDVD() const` che usa `dynamic_cast`. Zero leak.

<details>
<summary>Soluzione</summary>

```cpp
#include <iostream>
#include <string>
#include <utility>
#include <vector>

class Documento {
public:
    Documento(std::string titolo, int anno, std::string codice)
        : titolo_(std::move(titolo)), anno_(anno), codice_(std::move(codice)) {}
    virtual ~Documento() = default;                    // base polimorfica: distruttore virtual
    virtual std::string descrizione() const = 0;       // classe astratta

    const std::string& titolo() const { return titolo_; }
    int anno() const { return anno_; }

protected:
    std::string titolo_;
    int anno_;
    std::string codice_;
};

class Libro : public Documento {
public:
    Libro(std::string t, int a, std::string c, std::string autore, int pagine)
        : Documento(std::move(t), a, std::move(c)), autore_(std::move(autore)), pagine_(pagine) {}
    std::string descrizione() const override {
        return "Libro: " + titolo_ + " di " + autore_ + " (" + std::to_string(anno_)
             + ", " + std::to_string(pagine_) + " p.)";
    }
private:
    std::string autore_;
    int pagine_;
};

class Rivista : public Documento {
public:
    Rivista(std::string t, int a, std::string c, int numero, std::string mese)
        : Documento(std::move(t), a, std::move(c)), numero_(numero), mese_(std::move(mese)) {}
    std::string descrizione() const override {
        return "Rivista: " + titolo_ + " n. " + std::to_string(numero_) + " " + mese_
             + " " + std::to_string(anno_);
    }
private:
    int numero_;
    std::string mese_;
};

class DVD : public Documento {
public:
    DVD(std::string t, int a, std::string c, int minuti)
        : Documento(std::move(t), a, std::move(c)), durata_(minuti) {}
    std::string descrizione() const override {
        return "DVD: " + titolo_ + " (" + std::to_string(durata_) + " min)";
    }
    int durata() const { return durata_; }
private:
    int durata_;
};

class Biblioteca {
public:
    Biblioteca() = default;
    Biblioteca(const Biblioteca&) = delete;               // niente copia: evita la condivisione
    Biblioteca& operator=(const Biblioteca&) = delete;

    ~Biblioteca() { for (Documento* d : docs_) delete d; }   // libera tutto

    void aggiungi(Documento* d) { docs_.push_back(d); }      // la biblioteca prende la proprietà

    const Documento* cercaPerTitolo(const std::string& t) const {
        for (const Documento* d : docs_)
            if (d->titolo() == t) return d;
        return nullptr;
    }

    void stampaTutti() const {
        for (const Documento* d : docs_) std::cout << d->descrizione() << '\n';
    }

    int durataTotaleDVD() const {
        int somma = 0;
        for (const Documento* d : docs_)
            if (const DVD* dvd = dynamic_cast<const DVD*>(d))   // controllo a runtime
                somma += dvd->durata();
        return somma;
    }

private:
    std::vector<Documento*> docs_;
};

int main() {
    Biblioteca b;
    b.aggiungi(new Libro("Dune", 1965, "L1", "Herbert", 412));
    b.aggiungi(new Rivista("Le Scienze", 2026, "R1", 7, "luglio"));
    b.aggiungi(new DVD("Matrix", 1999, "D1", 136));
    b.aggiungi(new DVD("Alien", 1979, "D2", 117));

    b.stampaTutti();
    std::cout << "durata DVD: " << b.durataTotaleDVD() << " min\n";   // 253
    if (const Documento* d = b.cercaPerTitolo("Dune"))
        std::cout << "trovato: " << d->anno() << '\n';                  // 1965
}
```

Output:

```
Libro: Dune di Herbert (1965, 412 p.)
Rivista: Le Scienze n. 7 luglio 2026
DVD: Matrix (136 min)
DVD: Alien (117 min)
durata DVD: 253 min
trovato: 1965
```

**Punti d'esame.** Il distruttore di `Biblioteca` libera i documenti perché li possiede. Il distruttore è virtuale nella base, quindi ogni `delete` chiama il distruttore giusto. `dynamic_cast` su puntatori restituisce `nullptr` se il tipo non corrisponde, e il `if` lo gestisce.

</details>

#### ex:esa-2 · Registro voti: puntatori e `const`

*(E2)* Classe `Registro` con `std::vector<Studente>` (come `cls-6`): `aggiungiStudente`, `cercaPerMatricola(int) const` che restituisce un puntatore (o `nullptr`), `mediaDiClasse() const`, `migliorStudente() const` che restituisce `const Studente*`, `operator[]` nelle versioni `const` e non-`const`, salvataggio e caricamento su file di testo. **Domanda:** perché `cercaPerMatricola` è `const` ma restituisce un puntatore `const`? Cosa succederebbe con `Studente*` non-`const`?

<details>
<summary>Soluzione</summary>

La ricerca non modifica il registro, quindi il metodo è `const`. Ma restituire `Studente*` (non-`const`) permetterebbe al chiamante di modificare uno studente **attraverso un metodo `const`**: la promessa di `const` sarebbe rotta.

```cpp nocheck
class Registro {
public:
    const Studente* cercaPerMatricola(int m) const {
        for (const Studente& s : studenti)
            if (s.getMatricola() == m) return &s;     // &s è const Studente*: nessuna modifica possibile
        return nullptr;
    }
    const Studente* migliorStudente() const { /* ... simile, con media() più alta ... */ return nullptr; }

    Studente& operator[](std::size_t i)             { return studenti[i]; }      // oggetto non const
    const Studente& operator[](std::size_t i) const { return studenti[i]; }      // oggetto const
private:
    std::vector<Studente> studenti;
};
```

Il chiamante che vuole modificare lo studente deve farlo tramite `operator[]` non-`const`, cioè dichiarando esplicitamente di voler modificare il registro. Il tipo restituito dice già quale operazione è consentita.

**Per il salvataggio su file di testo:** scrivi una riga per studente con campi separati (es. `matricola;cognome;nome;voti...`) e rileggi con `std::getline` e `std::istringstream`. Testo, non binario: così i dati restano portabili (vedi `ex:prim-6`).

</details>

#### ex:esa-3 · Trova gli errori in `Vettore`

*(E3)* Il listato contiene dodici errori tra compilazione, `const`, memory leak e undefined behavior. Elencali con una riga di spiegazione, poi riscrivi la versione corretta.

```cpp nocheck
class Vettore {
    int* dati;
    int n;
public:
    Vettore(int dim) { n = dim; dati = new int[n]; }
    ~Vettore() { delete dati; }
    int get(int i) { return dati[i]; }
    void set(int i, int v) { dati[i] = v; }
    int size() { return n; }
    Vettore somma(Vettore altro) {
        Vettore ris(n);
        for (int i = 0; i < n; i++)
            ris.set(i, dati[i] + altro.get(i));
        return ris;
    }
};
void stampa(const Vettore& v) {
    for (int i = 0; i < v.size(); i++) std::cout << v.get(i) << " ";
}
int main() {
    Vettore a(3);
    a.set(0, 1); a.set(5, 99);
    Vettore b = a;
    stampa(a);
    const Vettore c(3);
    std::cout << c.get(0);
    return 0;
}
```

<details>
<summary>Soluzione</summary>

Elenco ragionato (contando separatamente ogni problema):

1. **`std::cout` senza `#include <iostream>`**: errore di compilazione.
2. **`delete dati;` su un array**: deve essere `delete[] dati;`. È undefined behavior.
3. **`get` non è `const`**: `stampa(const Vettore&)` non può chiamarlo. Errore di compilazione.
4. **`size` non è `const`**: stessa situazione, `v.size()` nel `for` di `stampa`.
5. **`somma(Vettore altro)` per valore**: crea una copia, e la copia è superficiale (il compilatore copia il puntatore) → double free.
6. **`somma` dovrebbe essere `const`** e prendere `const Vettore&`: non modifica né `this` né `altro`.
7. **Regola dei tre violata**: mancano costruttore di copia e `operator=`. `Vettore b = a;` provoca double free alla distruzione.
8. **`a.set(5, 99)` con `n = 3`**: indice fuori range, scrittura oltre l'array. Undefined behavior.
9. **`new int[n]` non inizializza**: `get` su un elemento non impostato legge valori indeterminati.
10. **`const Vettore c(3); c.get(0)`**: conseguenza di (3), errore di compilazione.
11. **Costruttore `Vettore(int)` non `explicit`**: permette `Vettore v = 5;` in silenzio.
12. **Dimensione negativa non controllata**: `Vettore(-1)` chiama `new int[-1]`.

Versione corretta:

```cpp
#include <iostream>
#include <stdexcept>

class Vettore {
public:
    explicit Vettore(int dim) : n(controlla(dim)), dati(new int[n]()) {}   // () : tutti a zero

    Vettore(const Vettore& altro) : n(altro.n), dati(new int[altro.n]) {
        for (int i = 0; i < n; ++i) dati[i] = altro.dati[i];
    }

    Vettore& operator=(const Vettore& altro) {
        if (this != &altro) {
            int* nuovi = new int[altro.n];
            for (int i = 0; i < altro.n; ++i) nuovi[i] = altro.dati[i];
            delete[] dati;
            dati = nuovi;
            n = altro.n;
        }
        return *this;
    }

    ~Vettore() { delete[] dati; }

    int get(int i) const        { check(i); return dati[i]; }
    void set(int i, int v)      { check(i); dati[i] = v; }
    int size() const            { return n; }

    Vettore somma(const Vettore& altro) const {
        if (n != altro.n) throw std::invalid_argument("dimensioni diverse");
        Vettore ris(n);
        for (int i = 0; i < n; ++i) ris.dati[i] = dati[i] + altro.dati[i];
        return ris;
    }

private:
    static int controlla(int dim) {
        if (dim < 0) throw std::invalid_argument("dimensione negativa");
        return dim;
    }
    void check(int i) const {
        if (i < 0 || i >= n) throw std::out_of_range("indice fuori range");
    }
    int n;        // dichiarato prima di dati: è l'ordine di inizializzazione
    int* dati;
};

void stampa(const Vettore& v) {
    for (int i = 0; i < v.size(); ++i) std::cout << v.get(i) << ' ';
    std::cout << '\n';
}

int main() {
    Vettore a(3);
    a.set(0, 1);
    Vettore b = a;            // copia profonda
    b.set(1, 7);
    Vettore s = a.somma(b);
    stampa(a);                // 1 0 0
    stampa(s);                // 2 7 0
    const Vettore c(3);
    std::cout << c.get(0) << '\n';   // 0
}
```

</details>

#### ex:esa-4 · Valuta: conversioni controllate

*(E4)* Classe `Valuta` per un importo in centesimi (`long long`) con codice valuta (`std::string`). Costruttore `explicit` da `double` con arrotondamento corretto; `explicit operator double() const`; `+` e `-` che lanciano un'eccezione se le valute non coincidono; `*` per uno scalare `double` con arrotondamento; tutti i confronti. **Domanda:** perché i centesimi come intero? Dimostra sommando `0.1` dieci volte.

<details>
<summary>Soluzione</summary>

```cpp
#include <cmath>
#include <iostream>
#include <stdexcept>
#include <string>
#include <utility>

class Valuta {
public:
    explicit Valuta(double euro, std::string codice = "EUR")
        : centesimi(std::llround(euro * 100)), codice_(std::move(codice)) {}

    explicit operator double() const { return centesimi / 100.0; }

    Valuta operator+(const Valuta& o) const { controlla(o); return daCentesimi(centesimi + o.centesimi); }
    Valuta operator-(const Valuta& o) const { controlla(o); return daCentesimi(centesimi - o.centesimi); }
    Valuta operator*(double k) const       { return daCentesimi(std::llround(centesimi * k)); }

    bool operator==(const Valuta& o) const { return codice_ == o.codice_ && centesimi == o.centesimi; }
    bool operator!=(const Valuta& o) const { return !(*this == o); }
    bool operator<(const Valuta& o) const  { controlla(o); return centesimi < o.centesimi; }
    bool operator>(const Valuta& o) const  { return o < *this; }
    bool operator<=(const Valuta& o) const { return !(o < *this); }
    bool operator>=(const Valuta& o) const { return !(*this < o); }

private:
    long long centesimi;
    std::string codice_;

    void controlla(const Valuta& o) const {
        if (codice_ != o.codice_) throw std::invalid_argument("valute diverse");
    }
    Valuta daCentesimi(long long c) const {          // stessa valuta, centesimi già calcolati
        Valuta v(0.0, codice_);
        v.centesimi = c;
        return v;
    }
};

int main() {
    double s = 0;
    for (int i = 0; i < 10; ++i) s += 0.1;
    std::cout << std::boolalpha << (s == 1.0) << '\n';            // false

    Valuta a(0.1), b(0.2);
    std::cout << static_cast<double>(a + b) << '\n';               // 0.3
    std::cout << (Valuta(0.1) * 10 == Valuta(1.0)) << '\n';        // true

    try {
        Valuta x = Valuta(1.0, "USD") + Valuta(1.0);   // lancia: codici diversi
    } catch (const std::invalid_argument& e) {
        std::cout << "errore: " << e.what() << '\n';               // errore: valute diverse
    }
}
```

Output: `false`, `0.3`, `true`, `errore: valute diverse`.

**Perché i centesimi.** `0.1` non è rappresentabile esattamente in binario. Sommarlo dieci volte dà `0.9999999999999999`, non `1.0`: il confronto con `==` fallisce. Con i centesimi come intero (`10` per `0.10`, `100` per `1.00`) la somma è esatta, e l'arrotondamento avviene in un solo punto, quando converti da `double`.

</details>

#### ex:esa-5 · Dal C al C++: archivio studenti

*(E5)* Riscrivi in C++ l'archivio studenti su file binario con menu testuale: `std::vector` invece dell'array, `std::string` invece di `char[20]`, `std::fstream` invece di `FILE*`, una classe `Archivio` con distruttore che salva automaticamente. Nessuna `malloc`, `free` o `char*`. **Domanda finale:** `write(reinterpret_cast<const char*>(&s), sizeof(s))` funziona ancora con `std::string` dentro `Studente`? Perché no, e come si risolve?

<details>
<summary>Soluzione</summary>

Struttura dell'`Archivio`, in forma di scheletro:

```cpp nocheck
class Archivio {
public:
    explicit Archivio(std::string file) : file_(std::move(file)) { carica(); }
    ~Archivio() { salva(); }                       // RAII: il salvataggio avviene all'uscita dallo scope
    void aggiungi(const Studente& s) { studenti_.push_back(s); }
    // ... menu: visualizza, cerca, elimina ...
private:
    void carica();   // apre con std::ifstream, legge la lunghezza e poi i dati
    void salva() const;   // apre con std::ofstream, scrive la lunghezza e poi i dati
    std::string file_;
    std::vector<Studente> studenti_;
};
```

**Perché il salvataggio binario ingenuo non funziona.** Un `Studente` con `std::string` contiene un puntatore interno al testo, allocato altrove. `reinterpret_cast` copia i **byte** dell'oggetto, quindi scrive quel puntatore, non il nome. Rileggendo, il puntatore non è più valido: undefined behavior. Lo stesso vale per `std::vector`.

**Come si risolve.** Serializzazione esplicita: per ogni studente scrivi la lunghezza del nome, poi i caratteri; poi la dimensione del vettore, poi gli elementi. In lettura fai le stesse operazioni nello stesso ordine. Così il file contiene solo dati, non indirizzi.

```cpp nocheck
void scriviStringa(std::ofstream& out, const std::string& s) {
    std::size_t n = s.size();
    out.write(reinterpret_cast<const char*>(&n), sizeof(n));   // il numero: tipo banale, ok
    out.write(s.data(), static_cast<std::streamsize>(n));       // i caratteri
}
```

**Lezione.** Il `reinterpret_cast` su byte è legittimo solo per tipi *trivially copyable* (niente puntatori che possiedono risorse). Il resto richiede un formato esplicito, che è più lavoro ma è l'unico corretto.

</details>
