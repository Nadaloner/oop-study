# 1 · Classi e incapsulamento

## Teoria

### Classe, oggetto, incapsulamento

Una **classe** definisce un tipo: dati (membri) e operazioni (metodi). Un **oggetto** è un'istanza di quel tipo.
In C++ `class` e `struct` differiscono solo per l'accesso predefinito: `private` per `class`, `public` per `struct`.

L'**incapsulamento** protegge l'**invariante** della classe: una proprietà che deve valere per ogni oggetto osservabile dall'esterno (per esempio, `ore` è sempre tra 0 e 23). Per proteggerla:

- rendi privati i membri;
- esponi solo operazioni che **mantengono** l'invariante (i setter validano, i metodi lavorano sui campi in modo coerente);
- il **costruttore stabilisce** l'invariante: deve riuscirci o lanciare un'eccezione.

Questo è l'*information hiding*: nascondi la rappresentazione, così puoi cambiarla senza rompere chi usa la classe. Gli esercizi del PDF `Esercizi_information_hiding_CPP.pdf` (cartella OOP) sono il naturale completamento di questo modulo.

> **Perché conta:** il compilatore ti blocca davvero. Se `x` è `private`, `p.x = 5;` non compila. È la base di tutto il resto.

### Costruttori

- **Default**: senza argomenti. Se dichiari *qualunque* costruttore, quello di default non viene generato automaticamente.
- **Parametrizzato**: inizializza i membri.
- **Lista di inizializzazione** `: x(a), y(b)`: i membri vengono inizializzati *prima* del corpo del costruttore.

> **Trappola d'esame:** i membri vengono inizializzati nell'**ordine di dichiarazione nella classe**, non nell'ordine in cui li scrivi nella lista. Lo vedi in `cls-8`.

### `explicit`

Un costruttore con un solo argomento (senza `explicit`) è un **convertitore implicito**. Con `Punto2D p = 3.0;` il `double` viene convertito in un `Punto2D` senza che tu lo chieda. `explicit` vieta questa conversione automatica; resta possibile con `Punto2D p(3.0)` o `static_cast<Punto2D>(3.0)`.

Regola pratica: quasi sempre `explicit` sui costruttori a un argomento. Il tema torna nel modulo 6.

### Membri `static`

Appartengono alla **classe**, non all'oggetto: esiste una sola copia condivisa. Si definiscono fuori dalla classe (`int ContoBancario::numeroConti = 0;`), oppure in C++17 con `static inline int n = 0;` dentro la classe.

### Composizione e ordine di costruzione

Se una classe contiene altri oggetti come membri:

1. i membri vengono costruiti **prima** del corpo del costruttore, nell'ordine di dichiarazione;
2. vengono distrutti nell'**ordine inverso**.

### Distruttore

`~Classe()` viene chiamato automaticamente quando l'oggetto esce dallo scope. È l'idea di **RAII**, che sviluppiamo nel modulo 2.

> **Attenzione:** se la classe possiede risorse (memoria con `new`), la copia automatica non basta. Vedi il modulo 2.

## Checklist

- [ ] ex:cls-1 · Punto2D
- [ ] ex:cls-2 · Secondo costruttore ed `explicit`
- [ ] ex:cls-3 · Frazione
- [ ] ex:cls-4 · ContoBancario e membri `static`
- [ ] ex:cls-5 · Orario
- [ ] ex:cls-6 · Studente
- [ ] ex:cls-7 · Rettangolo (composizione)
- [ ] ex:cls-8 · Segmento e ordine di costruzione

## Esercizi e soluzioni

Le numerazioni (A1, A2, …) sono quelle del foglio *Esercizi C++ — classi, const, casting*.

#### ex:cls-1 · Punto2D

*(A1)* Scrivi `Punto2D` con membri privati `double x, y`. Costruttore con parametri di default a zero, `getX()`, `getY()`, setter, `distanzaDa(const Punto2D&)` e `stampa()` che scrive `(x, y)`. Verifica che `p.x = 5;` dal `main` sia impossibile.

<details>
<summary>Soluzione</summary>

```cpp
#include <cmath>
#include <iostream>

class Punto2D {
public:
    Punto2D(double x = 0.0, double y = 0.0) : x(x), y(y) {}   // parametri di default a zero

    double getX() const { return x; }
    double getY() const { return y; }
    void setX(double nuovaX) { x = nuovaX; }
    void setY(double nuovaY) { y = nuovaY; }

    double distanzaDa(const Punto2D& altro) const {
        return std::hypot(x - altro.x, y - altro.y);   // altro.x: si può fare dentro la classe
    }
    void stampa() const { std::cout << '(' << x << ", " << y << ")\n"; }

private:
    double x, y;
};

int main() {
    Punto2D p(3, 4);
    Punto2D origine;
    std::cout << p.distanzaDa(origine) << "\n";   // 5
    p.stampa();                                   // (3, 4)
    // p.x = 5;   // errore: 'double Punto2D::x' is private
}
```

**Punti chiave.** Il parametro `altro` è un `const&` perché il metodo non lo modifica. `altro.x` è legale: all'interno della classe puoi accedere ai membri privati di *qualunque* oggetto della stessa classe.

</details>

#### ex:cls-2 · Secondo costruttore ed `explicit`

*(A2)* Aggiungi a `Punto2D` un costruttore che accetta un solo `double` e costruisce il punto sulla bisettrice (`x = y`). Prova `Punto2D p = 3.0;`, spiega perché compila, poi rendi il costruttore `explicit` e osserva cosa cambia.

<details>
<summary>Soluzione</summary>

Attenzione all'**ambiguità**: se avessi lasciato `Punto2D(double x = 0, double y = 0)` *e* `Punto2D(double t)`, la chiamata `Punto2D(3.0)` sarebbe ambigua. Per questo separiamo il default:

```cpp
#include <iostream>

class Punto2D {
public:
    Punto2D() : x(0), y(0) {}
    Punto2D(double x, double y) : x(x), y(y) {}
    explicit Punto2D(double t) : x(t), y(t) {}   // bisettrice: x = y

    void stampa() const { std::cout << '(' << x << ", " << y << ")\n"; }
private:
    double x, y;
};

int main() {
    Punto2D a(3.0);                    // ok: chiamata esplicita
    Punto2D b = static_cast<Punto2D>(2.5);   // ok: conversione esplicita
    a.stampa();                        // (3, 3)
    b.stampa();                        // (2.5, 2.5)

    // Punto2D c = 3.0;   // ERRORE con explicit: copy-initialization da double
}
```

Senza `explicit`, `Punto2D c = 3.0;` compilerebbe e nel resto del programma un `double` potrebbe trasformarsi in punto **senza che tu lo veda**. È il motivo della regola pratica: `explicit` di default.

</details>

#### ex:cls-3 · Frazione

*(A3)* Classe `Frazione` con `int num, den`. Il costruttore deve: rifiutare il denominatore zero (eccezione), normalizzare il segno (il denominatore è sempre positivo) e ridurre ai minimi termini con il MCD (scrivi tu l'algoritmo di Euclide). Aggiungi `stampa()` e `valore()`.

<details>
<summary>Soluzione</summary>

```cpp
#include <cstdlib>
#include <iostream>
#include <stdexcept>

class Frazione {
public:
    // Il costruttore stabilisce l'invariante: den > 0 e num/den ridotta
    Frazione(int n = 0, int d = 1) : num(n), den(d) {
        if (den == 0) throw std::invalid_argument("denominatore zero");
        if (den < 0) { num = -num; den = -den; }        // normalizza il segno
        int g = mcd(std::abs(num), den);                // den > 0, quindi g >= 1
        num /= g;
        den /= g;
    }

    double valore() const { return static_cast<double>(num) / den; }
    void stampa() const { std::cout << num << '/' << den << '\n'; }

private:
    int num, den;
    static int mcd(int a, int b) { return b == 0 ? a : mcd(b, a % b); }   // Euclide
};

int main() {
    Frazione f(6, -8);                       // diventa -3/4
    f.stampa();                              // -3/4
    std::cout << f.valore() << '\n';         // -0.75
    Frazione zero(0, 5);
    zero.stampa();                           // 0/1
    try {
        Frazione errata(1, 0);
    } catch (const std::invalid_argument& e) {
        std::cout << "errore: " << e.what() << '\n';   // errore: denominatore zero
    }
}
```

**Punti chiave.** Il costruttore non si limita a copiare: *stabilisce* l'invariante. Dopo di lui, nessun metodo può produrre una frazione con denominatore zero o non ridotta. Nota che il costruttore con argomenti di default è anche un convertitore implicito: `Frazione f = 5;` compila. Ne parliamo nel modulo 6.

</details>

#### ex:cls-4 · ContoBancario e membri `static`

*(A4)* `ContoBancario` con `saldo` privato. Metodi: `deposita(double)` (rifiuta importi negativi), `preleva(double)` che restituisce `bool` e rifiuta se il saldo non basta, `getSaldo()`. Un membro `static int numeroConti` si incrementa a ogni costruzione e si decrementa nel distruttore; metodo `static int quantiConti()`.

<details>
<summary>Soluzione</summary>

```cpp
#include <iostream>

class ContoBancario {
public:
    ContoBancario() : saldo(0) { ++numeroConti; }
    ~ContoBancario() { --numeroConti; }

    void deposita(double importo) { if (importo > 0) saldo += importo; }
    bool preleva(double importo) {
        if (importo <= 0 || importo > saldo) return false;
        saldo -= importo;
        return true;
    }
    double getSaldo() const { return saldo; }

    static int quantiConti() { return numeroConti; }   // non usa 'this': può essere static

private:
    double saldo;
    static int numeroConti;   // dichiarazione: una sola copia per tutta la classe
};

int ContoBancario::numeroConti = 0;   // definizione fuori dalla classe

int main() {
    ContoBancario a, b;
    a.deposita(100);
    std::cout << a.preleva(30) << ' ' << a.getSaldo() << '\n';   // 1 70
    std::cout << b.preleva(5) << '\n';                           // 0
    {
        ContoBancario c;
        std::cout << ContoBancario::quantiConti() << '\n';       // 3
    }
    std::cout << ContoBancario::quantiConti() << '\n';           // 2
}
```

**Trappola.** Il costruttore di copia *generato* dal compilatore copia `saldo` ma **non incrementa** `numeroConti`: quando la copia viene distrutta, il contatore scende e resta sbagliato. Questo è un bug classico di conteggio con `static`. Lo risolviamo con le regole del modulo 2.

</details>

#### ex:cls-5 · Orario

*(A5)* Classe `Orario` (ore, minuti, secondi): costruttore con validazione, tre getter, tre setter che rifiutano valori fuori range, `inSecondi()`, `isValido()`, `stampa()` nel formato `hh:mm:ss` con zeri iniziali, `avanza(int)` che gestisce la mezzanotte e i valori negativi.

<details>
<summary>Soluzione</summary>

```cpp
#include <iomanip>
#include <iostream>
#include <stdexcept>

class Orario {
public:
    Orario(int h = 0, int m = 0, int s = 0) {
        if (!(setOre(h) && setMinuti(m) && setSecondi(s)))
            throw std::invalid_argument("orario non valido");
    }

    int getOre() const { return ore; }
    int getMinuti() const { return minuti; }
    int getSecondi() const { return secondi; }

    bool setOre(int h)     { if (h < 0 || h > 23) return false; ore = h;     return true; }
    bool setMinuti(int m)  { if (m < 0 || m > 59) return false; minuti = m;  return true; }
    bool setSecondi(int s) { if (s < 0 || s > 59) return false; secondi = s; return true; }

    int inSecondi() const { return ore * 3600 + minuti * 60 + secondi; }

    bool isValido() const {
        return ore >= 0 && ore <= 23 && minuti >= 0 && minuti <= 59 && secondi >= 0 && secondi <= 59;
    }

    void stampa() const {
        std::cout << std::setfill('0') << std::setw(2) << ore << ':'
                  << std::setw(2) << minuti << ':' << std::setw(2) << secondi
                  << std::setfill(' ');
    }

    // avanza di s secondi (anche negativi); la mezzanotte è gestita con il modulo
    void avanza(int s) {
        const int GIORNO = 24 * 3600;
        int tot = ((inSecondi() + s) % GIORNO + GIORNO) % GIORNO;
        ore = tot / 3600;
        minuti = (tot % 3600) / 60;
        secondi = tot % 60;
    }

private:
    int ore = 0, minuti = 0, secondi = 0;
};

int main() {
    Orario o(23, 30, 0);
    o.avanza(3600);  o.stampa(); std::cout << '\n';         // 00:30:00
    o.avanza(-1);    o.stampa(); std::cout << '\n';         // 00:29:59
    std::cout << o.inSecondi() << '\n';                    // 1799
    std::cout << std::boolalpha << o.setOre(25) << '\n';   // false
    try {
        Orario errato(24, 0, 0);
    } catch (const std::invalid_argument& e) {
        std::cout << "errore: " << e.what() << '\n';        // errore: orario non valido
    }
}
```

**Punti chiave.** `((x % N) + N) % N` è il modo corretto di avere un resto sempre non negativo, anche con `x` negativo. I setter restituiscono `bool`: il chiamante può accorgersi del rifiuto. Il costruttore invece *lancia*, perché non può restare in uno stato invalido.

</details>

#### ex:cls-6 · Studente

*(A6)* `Studente` con `std::string nome, cognome`, `int matricola` e `std::vector<int> voti`. `aggiungiVoto(int)` valida il range 18–30; `media()` non divide per zero; `miglioreVoto()`, `numeroEsami()`. Niente array C né `malloc`.

<details>
<summary>Soluzione</summary>

```cpp
#include <iostream>
#include <stdexcept>
#include <string>
#include <utility>
#include <vector>

class Studente {
public:
    Studente(std::string nome, std::string cognome, int matricola)
        : nome_(std::move(nome)), cognome_(std::move(cognome)), matricola_(matricola) {}

    void aggiungiVoto(int voto) {
        if (voto < 18 || voto > 30) throw std::out_of_range("voto fuori range 18-30");
        voti_.push_back(voto);
    }

    double media() const {
        if (voti_.empty()) return 0.0;               // nessuna divisione per zero
        double somma = 0;
        for (int v : voti_) somma += v;
        return somma / voti_.size();
    }

    int miglioreVoto() const {
        if (voti_.empty()) throw std::logic_error("nessun voto");
        int migliore = voti_.front();
        for (int v : voti_) if (v > migliore) migliore = v;
        return migliore;
    }

    std::size_t numeroEsami() const { return voti_.size(); }
    int getMatricola() const { return matricola_; }

private:
    std::string nome_, cognome_;   // convenzione: _ finale per i membri
    int matricola_;
    std::vector<int> voti_;
};

int main() {
    Studente s("Ada", "Lovelace", 1001);
    std::cout << s.media() << '\n';                  // 0
    s.aggiungiVoto(30);
    s.aggiungiVoto(24);
    std::cout << s.media() << ' ' << s.miglioreVoto() << ' ' << s.numeroEsami() << '\n';   // 27 30 2
    std::cout << s.getMatricola() << '\n';   // 1001
}
```

**Punti chiave.** `std::vector` gestisce memoria, dimensione e distruzione da solo: per questo non serve la regola dei tre qui. Il tema torna non appena il membro è un puntatore (modulo 2).

</details>

#### ex:cls-7 · Rettangolo (composizione)

*(A7)* Usando `Punto2D`, scrivi `Rettangolo` con due membri `Punto2D altoSx, bassoDx`. Metodi: `area()`, `perimetro()`, `contiene(const Punto2D&)`, `centro()`. Il costruttore normalizza gli angoli se passati nell'ordine sbagliato.

<details>
<summary>Soluzione</summary>

```cpp
#include <algorithm>
#include <iostream>

class Punto2D {
public:
    Punto2D(double x = 0, double y = 0) : x_(x), y_(y) {}
    double getX() const { return x_; }
    double getY() const { return y_; }
private:
    double x_, y_;
};

class Rettangolo {
public:
    // accetta due angoli opposti in qualunque ordine e li normalizza
    Rettangolo(const Punto2D& a, const Punto2D& b)
        : altoSx(std::min(a.getX(), b.getX()), std::max(a.getY(), b.getY())),
          bassoDx(std::max(a.getX(), b.getX()), std::min(a.getY(), b.getY())) {}

    double base() const { return bassoDx.getX() - altoSx.getX(); }
    double altezza() const { return altoSx.getY() - bassoDx.getY(); }
    double area() const { return base() * altezza(); }
    double perimetro() const { return 2 * (base() + altezza()); }

    bool contiene(const Punto2D& p) const {
        return p.getX() >= altoSx.getX() && p.getX() <= bassoDx.getX()
            && p.getY() >= bassoDx.getY() && p.getY() <= altoSx.getY();
    }

    Punto2D centro() const {
        return Punto2D((altoSx.getX() + bassoDx.getX()) / 2,
                       (altoSx.getY() + bassoDx.getY()) / 2);
    }

private:
    Punto2D altoSx;   // composizione: costruiti prima del corpo, nell'ordine di dichiarazione
    Punto2D bassoDx;
};

int main() {
    Rettangolo r(Punto2D(4, 0), Punto2D(0, 3));          // angoli "nel posto sbagliato"
    std::cout << "area " << r.area() << '\n';            // area 12
    std::cout << "perimetro " << r.perimetro() << '\n';  // perimetro 14
    std::cout << "centro " << r.centro().getX() << ' ' << r.centro().getY() << '\n';   // centro 2 1.5
    std::cout << std::boolalpha << r.contiene(Punto2D(1, 1)) << '\n';                  // true
}
```

</details>

#### ex:cls-8 · Segmento e ordine di costruzione

*(A8)* `Segmento` con due `Punto2D`. Aggiungi `lunghezza()`, `puntoMedio()`, `intersecaAsseX()`. Scrivi la lista di inizializzazione in modo esplicito e verifica con un `cout` nei costruttori di `Punto2D` l'**ordine effettivo** delle chiamate.

<details>
<summary>Soluzione</summary>

```cpp
#include <cmath>
#include <iostream>

class Punto2D {
public:
    Punto2D(double x = 0, double y = 0) : x_(x), y_(y) {
        std::cout << "Punto2D(" << x_ << ", " << y_ << ")\n";
    }
    double getX() const { return x_; }
    double getY() const { return y_; }
private:
    double x_, y_;
};

class Segmento {
public:
    // nella lista scriviamo prima 'inizio' e poi 'fine'...
    Segmento(double x1, double y1, double x2, double y2)
        : inizio(x1, y1), fine(x2, y2) {
        std::cout << "Segmento costruito\n";
    }

    double lunghezza() const {
        double dx = fine.getX() - inizio.getX(), dy = fine.getY() - inizio.getY();
        return std::sqrt(dx * dx + dy * dy);
    }

private:
    // ...ma i membri si costruiscono nell'ORDINE DI DICHIARAZIONE: prima fine, poi inizio
    Punto2D fine;
    Punto2D inizio;
};

int main() {
    Segmento s(1, 2, 3, 4);
    std::cout << s.lunghezza() << '\n';   // 2.82843
}
```

Output:

```
Punto2D(3, 4)
Punto2D(1, 2)
Segmento costruito
2.82843
```

**Punti chiave.** Il compilatore costruisce `fine` prima di `inizio` perché così è dichiarata la classe, non perché così la scrivi nella lista. Infatti `g++ -Wall` ti avvisa con *`-Wreorder-ctor`*: il warning non è un capriccio, è esattamente questo errore. Se la lista dipende da un membro già inizializzato, questa differenza può causare bug: è la domanda d'esame classica.

</details>
