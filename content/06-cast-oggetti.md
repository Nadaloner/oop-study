# 6 · Conversioni utente e cast tra oggetti

## Teoria

### Conversioni definite dall'utente

Il compilatore può convertire un tipo in un altro anche quando lo scrivi tu:

- **Costruttore a un argomento** (non `explicit`): `Frazione f = 5;` costruisce `Frazione(5)`.
- **Operatore di conversione**: `operator double() const { ... }` permette di usare un oggetto dove serve un `double`.

Entrambi sono **comodi e pericolosi**: attivano conversioni che il lettore non vede. La regola è: rendili `explicit` a meno che la conversione non sia davvero naturale.

### `explicit` in pratica

Senza `explicit`, il codice compila in silenzio. Nel modulo 1 il costruttore era `Punto2D(double)`; qui è il caso degli operatori di conversione:

```cpp nocheck
class F {
public:
    F(int n = 0) : n_(n) {}
    operator double() const { return static_cast<double>(n_) / 2; }
private:
    int n_;
};
F f(3);
f == 0.5;   // compila: F -> double implicito; risultato 0 (1.5 != 0.5)
f + 1;      // compila: 2.5
```

Con `explicit operator double() const` gli stessi usi **non compilano**: `invalid operands to binary expression ('F' and 'double')`. Per usarli devi scrivere `static_cast<double>(f)`: la conversione diventa visibile.

### Factory invece di costruttori multipli

Quando un costruttore con un `double` non dice *in quale unità* è il valore (gradi Celsius? Kelvin?), la conversione implicita è sbagliata. Soluzione: costruttore privato e **metodi statici di fabbrica** con nomi espliciti (`daCelsius`, `daKelvin`...). Vedi `obj-3`.

### Polimorfismo: il puntatore alla base si comporta come il tipo reale

Una funzione `virtual` viene chiamata secondo il **tipo dinamico** dell'oggetto (quello reale), non il tipo del puntatore. Per questo:

- la classe base deve avere `virtual` sui metodi che le derivate ridefiniscono;
- il distruttore della base deve essere **virtual**: altrimenti `delete` su un puntatore alla base chiama solo il distruttore della base (leak e UB);
- il polimorfismo funziona solo con puntatori e riferimenti. Per **valore** c'è lo *slicing*: si copia solo la parte base.

Il compilatore realizza `virtual` con una tabella di funzioni per classe (*vtable*): ogni oggetto polimorfico porta un puntatore alla propria tabella.

### Upcast e downcast

- **Upcast** (derivata → base): sempre sicuro, implicito, nessun cast.
- **Downcast** (base → derivata): sicuro solo se l'oggetto è davvero del tipo derivato.
  - `static_cast`: nessun controllo a runtime. Se sbagli, è undefined behavior.
  - `dynamic_cast`: controlla. Su un puntatore fallito restituisce `nullptr`; su un riferimento lancia `std::bad_cast`. Richiede una classe polimorfica (almeno una funzione `virtual`).

### Gli altri due cast

- `const_cast`: aggiunge o toglie `const`. Togliere `const` da un oggetto *realmente* `const` e scrivere su di esso è undefined behavior.
- `reinterpret_cast`: reinterpreta i bit. Nessuna conversione, nessun controllo. Lecito per leggere i byte di un oggetto tramite `char`/`unsigned char`; per il resto è pericoloso.

### Slicing

Copiare un oggetto derivato in una variabile del tipo base (`Figura f = cerchio;`) perde la parte derivata, e con essa gli override virtuali. Per evitarlo, passa per puntatore o riferimento.

### `typeid` e `dynamic_cast`

`typeid(*p) == typeid(Cerchio)` chiede: il tipo **esatto** è `Cerchio`? `dynamic_cast<Cerchio*>(p)` chiede: l'oggetto è **compatibile** con `Cerchio`? Un `Quadrato` è un `Rettangolo2`: `dynamic_cast` risponde sì, `typeid` no.

## Checklist

- [ ] ex:obj-1 · Conversioni implicite e `explicit` (D1)
- [ ] ex:obj-2 · Operatore di conversione verso `double` (D2)
- [ ] ex:obj-3 · Temperatura con factory (D3)
- [ ] ex:obj-4 · Gerarchia Figura: polimorfismo (D4)
- [ ] ex:obj-5 · Cast tra puntatori della gerarchia (D5)
- [ ] ex:obj-6 · Contare le figure con `dynamic_cast` (D6)
- [ ] ex:obj-7 · `dynamic_cast` sui riferimenti (D7)
- [ ] ex:obj-8 · Distruttore virtuale (D8)
- [ ] ex:obj-9 · Slicing (D9)
- [ ] ex:obj-10 · `const_cast`: lecito e illecito (D10)
- [ ] ex:obj-11 · `reinterpret_cast` e file binari (D11)
- [ ] ex:obj-12 · Scegli il cast giusto (D12)
- [ ] ex:obj-13 · `typeid` contro `dynamic_cast` (D13)

## Esercizi e soluzioni

#### ex:obj-1 · Conversioni implicite e `explicit`

*(D1)* Aggiungi a `Frazione` un costruttore `Frazione(int n)` che costruisce `n/1`. Verifica che `Frazione f = 5;` e `stampaFrazione(7);` compilino. Poi rendi il costruttore `explicit` e osserva cosa smette di compilare. Riscrivi con `static_cast<Frazione>(5)`.

<details>
<summary>Soluzione</summary>

```cpp
#include <iostream>

class Frazione {
public:
    explicit Frazione(int n) : num(n), den(1) {}   // n/1, solo se richiesto esplicitamente
    Frazione(int n, int d) : num(n), den(d) {}
    void stampa() const { std::cout << num << '/' << den << '\n'; }
private:
    int num, den;
};

void stampaFrazione(const Frazione& f) { f.stampa(); }

int main() {
    Frazione f = static_cast<Frazione>(5);   // esplicito: ok
    f.stampa();                              // 5/1
    stampaFrazione(static_cast<Frazione>(7));   // 7/1

    // Frazione g = 5;          // ERRORE con explicit: copy-initialization da int
    // stampaFrazione(7);       // ERRORE con explicit: nessuna conversione implicita a Frazione
}
```

Senza `explicit` le due righe commentate compilerebbero: `stampaFrazione(7)` sembrerebbe passare un intero, ma il compilatore costruirebbe un `Frazione` temporaneo senza che tu lo chieda. Con `explicit` la conversione diventa una scelta visibile nel codice.

</details>

#### ex:obj-2 · Operatore di conversione verso `double`

*(D2)* Aggiungi a `Frazione` `operator double() const`. Verifica che `double d = f;` compili. Poi, con il costruttore da `int` e l'operatore `double` entrambi attivi, prova `f == 0.5` e `f + 1` e osserva. Risolvi marcando l'operatore `explicit` e usando `static_cast<double>(f)`.

<details>
<summary>Soluzione</summary>

Versione **non** `explicit` (compila, ma con sorprese):

```cpp nocheck
F f(3);
std::cout << (f == 0.5) << '\n';   // 0: F diventa double implicitamente, 1.5 != 0.5
std::cout << (f + 1) << '\n';      // 2.5
```

Il codice compila senza un avviso e produce risultati che non avevi scritto. Versione corretta:

```cpp
#include <iostream>

class F {
public:
    F(int n = 0) : n_(n) {}
    explicit operator double() const { return static_cast<double>(n_) / 2; }
private:
    int n_;
};

int main() {
    F f(3);
    // f == 0.5;   // ERRORE: nessuna conversione implicita a double
    std::cout << (static_cast<double>(f) == 1.5) << '\n';   // 1
    std::cout << (static_cast<double>(f) + 1) << '\n';      // 2.5
}
```

**Lezione.** Gli operatori di conversione implicita sono una fonte classica di ambiguità e di confronti sbagliati. `explicit` rende ogni conversione una decisione tua. Il `Raz` del modulo 7 è un esempio reale di questo problema.

</details>

#### ex:obj-3 · Temperatura con factory

*(D3)* Scrivi `Temperatura` che memorizza i kelvin e offre le factory `daCelsius`, `daFahrenheit`, `daKelvin`, i getter `inCelsius`, `inFahrenheit`, `inKelvin`, e un costruttore privato. Spiega perché è meglio di tre costruttori `Temperatura(double)` sovraccaricati.

<details>
<summary>Soluzione</summary>

```cpp
#include <iomanip>
#include <iostream>

class Temperatura {
public:
    static Temperatura daKelvin(double k)      { return Temperatura(k); }
    static Temperatura daCelsius(double c)     { return Temperatura(c + 273.15); }
    static Temperatura daFahrenheit(double f)  { return Temperatura((f - 32) * 5.0 / 9.0 + 273.15); }

    double inKelvin() const     { return kelvin; }
    double inCelsius() const    { return kelvin - 273.15; }
    double inFahrenheit() const { return (kelvin - 273.15) * 9.0 / 5.0 + 32; }

private:
    explicit Temperatura(double k) : kelvin(k) {}   // solo le factory possono costruire
    double kelvin;
};

int main() {
    std::cout << std::fixed << std::setprecision(2);
    Temperatura t = Temperatura::daCelsius(100);
    std::cout << t.inKelvin() << ' ' << t.inFahrenheit() << '\n';   // 373.15 212.00
}
```

**Perché.** Tre costruttori `Temperatura(double)` avrebbero tre firme identiche: il compilatore non può distinguerle, e il chiamante non sa in che scala è il numero. Con factory con nomi diversi il codice si legge da solo, e nessuna conversione implicita da `double` può ingannarti.

</details>

#### ex:obj-4 · Gerarchia `Figura`: polimorfismo

*(D4)* Costruisci la gerarchia `Figura` (base astratta con `virtual ~Figura()`, `virtual double area() const = 0`, `virtual void stampa() const`), `Cerchio`, `Rettangolo2`, `Quadrato` (derivato da `Rettangolo2`). Riempi un `std::vector<Figura*>` con oggetti misti e stampa l'area di ciascuno.

<details>
<summary>Soluzione</summary>

```cpp
#include <cmath>
#include <iostream>
#include <string>
#include <vector>

class Figura {
protected:
    std::string nome;
public:
    Figura(const std::string& n) : nome(n) {}
    virtual ~Figura() = default;                  // il distruttore della base è virtual
    virtual double area() const = 0;              // classe astratta: niente oggetti Figura diretti
    virtual void stampa() const { std::cout << nome << " area=" << area() << '\n'; }
    const std::string& getNome() const { return nome; }
};

class Cerchio : public Figura {
    double r;
public:
    Cerchio(double raggio) : Figura("cerchio"), r(raggio) {}
    double area() const override { return 3.14159 * r * r; }
    double getRaggio() const { return r; }
};

class Rettangolo2 : public Figura {
protected:
    double b, h;
public:
    Rettangolo2(double base, double altezza) : Figura("rettangolo"), b(base), h(altezza) {}
    double area() const override { return b * h; }
};

class Quadrato : public Rettangolo2 {
public:
    Quadrato(double lato) : Rettangolo2(lato, lato) { nome = "quadrato"; }
};

int main() {
    std::vector<Figura*> v;
    v.push_back(new Cerchio(1.0));
    v.push_back(new Rettangolo2(3, 4));
    v.push_back(new Quadrato(2));

    for (const Figura* f : v) f->stampa();   // ciascuna usa la propria area()

    // upcast: nessun cast
    Cerchio c(5.0);
    Figura* pf = &c;
    // downcast: corretto perché l'oggetto è davvero un Cerchio
    Cerchio* ok = static_cast<Cerchio*>(pf);
    std::cout << ok->getRaggio() << '\n';   // 5

    for (Figura* f : v) delete f;           // grazie al distruttore virtuale
}
```

Output:

```
cerchio area=3.14159
rettangolo area=12
quadrato area=4
5
```

**Polimorfismo.** `stampa()` è virtuale e chiama `area()`, anch'essa virtuale: la stessa riga di codice produce risultati diversi secondo il tipo reale. È il cuore della programmazione orientata agli oggetti.

</details>

#### ex:obj-5 · Cast tra puntatori della gerarchia

*(D5)* Prova e spiega ciascuna di queste conversioni. Stampa il valore dei due puntatori `sbagliato1` e `sbagliato2`, e prova a chiamare un metodo su ciascuno con `-fsanitize=undefined`.

```cpp nocheck
Cerchio c(5.0);
Figura* f = &c;                                   // ?
Cerchio* c2 = static_cast<Cerchio*>(f);           // ?
Cerchio* c3 = dynamic_cast<Cerchio*>(f);          // ?
Rettangolo2 r(3, 4);
Figura* f2 = &r;
Cerchio* sbagliato1 = static_cast<Cerchio*>(f2);  // ?
Cerchio* sbagliato2 = dynamic_cast<Cerchio*>(f2); // ?
```

<details>
<summary>Soluzione</summary>

- `f = &c`: **upcast implicito**. Nessun cast: è sempre sicuro.
- `c2`: `static_cast` di un puntatore che davvero punta a un `Cerchio`. Corretto, senza controllo a runtime.
- `c3`: `dynamic_cast`. Corretto, con un controllo che qui passa.
- `sbagliato1`: `static_cast` su un oggetto `Rettangolo2`. **Undefined behavior**: il puntatore non è nullo ma punta a un oggetto di tipo sbagliato. Chiamare `getRaggio()` su di esso legge memoria che non appartiene a un `Cerchio`. Con `-fsanitize=undefined` (che include il controllo `vptr`) l'errore viene segnalato.
- `sbagliato2`: `dynamic_cast` **fallisce e restituisce `nullptr`**. Controllare il puntatore prima di usarlo evita il problema.

**La differenza fondamentale.** `static_cast` si fida di te; `dynamic_cast` controlla. Nei downcast incerti usa il secondo, e controlla sempre il `nullptr`.

</details>

#### ex:obj-6 · Contare le figure con `dynamic_cast`

*(D6)* Dato un `const std::vector<Figura*>&`, usa `dynamic_cast` per contare quanti sono `Cerchio`, `Rettangolo2` e `Quadrato`. Attenzione: un `Quadrato` è anche un `Rettangolo2`, quindi l'ordine dei test conta.

<details>
<summary>Soluzione</summary>

Il programma completo è quello di `ex:obj-4` più la funzione seguente (il `main` la chiama su un vettore misto):

```cpp
#include <cmath>
#include <iostream>
#include <string>
#include <vector>

class Figura {
public:
    virtual ~Figura() = default;
    virtual double area() const = 0;
};
class Cerchio : public Figura {
public:
    double area() const override { return 3.14159; }
};
class Rettangolo2 : public Figura {
public:
    double area() const override { return 12; }
};
class Quadrato : public Rettangolo2 {};

// conta per tipo: prima i tipi più derivati
void conta(const std::vector<Figura*>& v) {
    int cerchi = 0, rettangoli = 0, quadrati = 0;
    for (const Figura* f : v) {
        if (dynamic_cast<const Quadrato*>(f))            ++quadrati;
        else if (dynamic_cast<const Rettangolo2*>(f))    ++rettangoli;
        else if (dynamic_cast<const Cerchio*>(f))        ++cerchi;
    }
    std::cout << "cerchi " << cerchi << ", rettangoli " << rettangoli
              << ", quadrati " << quadrati << '\n';
}

int main() {
    std::vector<Figura*> v = {new Cerchio, new Rettangolo2, new Quadrato, new Quadrato};
    conta(v);     // cerchi 1, rettangoli 1, quadrati 2
    for (Figura* f : v) delete f;
}
```

Se invertissi l'ordine e testassi prima `Rettangolo2`, ogni `Quadrato` verrebbe contato come rettangolo: il primo `if` vero vince.

</details>

#### ex:obj-7 · `dynamic_cast` sui riferimenti

*(D7)* Scrivi `elabora(Figura& f)` che usa `dynamic_cast<Cerchio&>` dentro un `try`. Chiamala con un `Cerchio` e con un `Rettangolo2`. Perché sui riferimenti lancia un'eccezione invece di restituire `nullptr`?

<details>
<summary>Soluzione</summary>

```cpp
#include <iostream>
#include <typeinfo>

class Figura { public: virtual ~Figura() = default; };
class Cerchio : public Figura {
public:
    double r = 5;
    double getRaggio() const { return r; }
};
class Rettangolo2 : public Figura {};

void elabora(Figura& f) {
    try {
        Cerchio& c = dynamic_cast<Cerchio&>(f);
        std::cout << "raggio: " << c.getRaggio() << '\n';
    } catch (const std::bad_cast& e) {
        std::cout << "non e un cerchio: " << e.what() << '\n';
    }
}

int main() {
    Cerchio c;
    Rettangolo2 r;
    elabora(c);   // raggio: 5
    elabora(r);   // non e un cerchio: ... (il testo di what() dipende dal compilatore)
}
```

**Perché un'eccezione.** Un riferimento non può essere `nullptr`: non esiste un "riferimento vuoto" da restituire. Il fallimento va quindi segnalato in un altro modo, e il C++ usa l'eccezione `std::bad_cast`. Su macOS il messaggio di `what()` è `std::bad_cast`.

</details>

#### ex:obj-8 · Distruttore virtuale

*(D8)* Togli `virtual` dal distruttore di `Figura`, aggiungi a `Cerchio` un membro allocato con `new`, poi esegui `Figura* f = new Cerchio(5.0); delete f;`. Quale distruttore viene chiamato? Poi rimetti `virtual` e confronta.

<details>
<summary>Soluzione</summary>

Versione corretta (con `virtual`), eseguibile:

```cpp
#include <iostream>

class Base {
public:
    virtual ~Base() { std::cout << "~Base\n"; }
};

class Derivata : public Base {
    int* dati;
public:
    Derivata() : dati(new int[100]) {}
    ~Derivata() override {
        delete[] dati;
        std::cout << "~Derivata\n";
    }
};

int main() {
    Base* b = new Derivata;
    delete b;     // prima ~Derivata, poi ~Base: niente leak
}
```

Output: `~Derivata`, poi `~Base`.

Versione **senza** `virtual`:

```cpp nocheck
class Base {
public:
    ~Base() { std::cout << "~Base\n"; }   // non virtual
};
// ... Derivata come sopra ...
Base* b = new Derivata;
delete b;   // chiama SOLO ~Base: ~Derivata non viene eseguito, dati non viene liberato
```

L'output diventa solo `~Base`, e i 100 `int` restano allocati: **memory leak** (e comportamento indefinito, per via della distruzione di un oggetto con il tipo sbagliato). Con `-fsanitize=address` su Linux viene segnalato. Su macOS LeakSanitizer non è disponibile, ma il comportamento è lo stesso.

**Regola.** Una classe pensata per essere derivata deve avere il distruttore `virtual`.

</details>

#### ex:obj-9 · Slicing

*(D9)* Spiega cosa va perso in ciascuna riga: copia per valore, riferimento, puntatore. Dimostra chiamando `nome()` (un metodo virtuale) su ciascuno, e spiega perché `void perValore(Figura f)` è un problema.

<details>
<summary>Soluzione</summary>

```cpp
#include <iostream>
#include <string>

class Figura {
public:
    virtual ~Figura() = default;
    virtual std::string nome() const { return "figura"; }
};

class Cerchio : public Figura {
public:
    std::string nome() const override { return "cerchio"; }
};

void perValore(Figura f)               { std::cout << f.nome() << '\n'; }
void perRiferimento(const Figura& f)   { std::cout << f.nome() << '\n'; }

int main() {
    Cerchio c;

    Figura f = c;             // SLICING: si copia solo la parte Figura
    std::cout << f.nome() << '\n';    // figura

    Figura& rf = c;           // nessuno slicing: è un alias di c
    std::cout << rf.nome() << '\n';   // cerchio

    Figura* pf = &c;          // nessuno slicing: il puntatore ha l'oggetto completo
    std::cout << pf->nome() << '\n';  // cerchio

    perValore(c);             // figura: lo slicing avviene nel passaggio del parametro
    perRiferimento(c);        // cerchio
}
```

Output: `figura`, `cerchio`, `cerchio`, `figura`, `cerchio`.

**Perché `perValore` è un bug.** Il parametro è una copia di tipo `Figura`: la parte `Cerchio` viene persa e la funzione si comporta come se ricevesse una figura generica. Il polimorfismo funziona solo con puntatori e riferimenti.

</details>

#### ex:obj-10 · `const_cast`: lecito e illecito

*(D10)* Scrivi due casi e spiega la differenza: un oggetto non `const` visto tramite un riferimento `const` (lecito), e un oggetto realmente `const` (undefined behavior). Poi prova `const int n = 5; int& r = const_cast<int&>(n); r = 99;` e spiega l'output.

<details>
<summary>Soluzione</summary>

Caso lecito: l'oggetto non è `const`; `const` è solo una vista.

```cpp
#include <iostream>

class Orario {
public:
    Orario(int h) : ore(h) {}
    void setOre(int h) { ore = h; }
    int getOre() const { return ore; }
private:
    int ore;
};

int main() {
    Orario x(9);
    const Orario& r = x;                  // vista const
    Orario& w = const_cast<Orario&>(r);   // lecito: x non è const
    w.setOre(10);
    std::cout << x.getOre() << '\n';      // 10
}
```

Caso illecito, descritto ma **non eseguito**:

```cpp nocheck
const Orario y(9);
Orario& w2 = const_cast<Orario&>(y);
w2.setOre(10);   // UNDEFINED BEHAVIOR: y è davvero const; il compilatore può presumere che non cambi
```

Ora l'esempio con `int`:

```cpp nocheck
const int n = 5;
int& r = const_cast<int&>(n);
r = 99;
std::cout << n << " " << r << "\n";
```

Nel nostro test con g++ e clang l'output è `5 99`, sia con `-O0` sia con `-O2`: il compilatore ha sostituito `n` con il valore costante `5`, mentre `r` vede il valore `99`. Il risultato non è affidabile: un altro compilatore o un'altra ottimizzazione possono stampare `99 99`. Questo è il senso dell'*undefined behavior*: non "funziona ma è brutto", ma un risultato che dipende dal compilatore.

**Regola.** `const_cast` per togliere `const` è sicuro solo se l'oggetto originale non è `const`. Serve tipicamente per adattare API vecchie che non sono `const`-corrette ma non scrivono davvero.

</details>

#### ex:obj-11 · `reinterpret_cast` e file binari

*(D11)* Scrivi una funzione che salva un `Orario` in un file binario e lo rilegge con `reinterpret_cast<const char*>` e `write`/`read`. Funzionerebbe se `Orario` contenesse una `std::string`? Prova.

<details>
<summary>Soluzione</summary>

Versione corretta, con un tipo *trivially copyable* (solo interi):

```cpp
#include <fstream>
#include <iostream>

struct Orario {       // nessun puntatore, nessun membro con gestione di risorse
    int ore;
    int minuti;
};

int main() {
    Orario o{9, 30};
    {
        std::ofstream out("orario.dat", std::ios::binary);
        out.write(reinterpret_cast<const char*>(&o), sizeof(o));
    }
    Orario letto{0, 0};
    std::ifstream in("orario.dat", std::ios::binary);
    in.read(reinterpret_cast<char*>(&letto), sizeof(letto));
    std::cout << letto.ore << ':' << letto.minuti << '\n';   // 9:30
}
```

Con `std::string` **non** funziona:

```cpp nocheck
struct Persona {
    std::string nome;   // contiene un puntatore interno al testo, allocato altrove
};
Persona p{"Mario"};
out.write(reinterpret_cast<const char*>(&p), sizeof(p));
// scrive l'indirizzo interno della stringa, non il testo "Mario":
// rileggendo, il puntatore punta a memoria del processo precedente → disastro
```

Serve un formato di serializzazione esplicito: scrivi la lunghezza, poi i caratteri, e rileggi nello stesso ordine. Il concetto da ricordare: `reinterpret_cast` su un oggetto copia i suoi **byte**, e un oggetto con puntatori interni non può essere ricostruito dai byte soli.

</details>

#### ex:obj-12 · Scegli il cast giusto

*(D12)* Per ogni situazione scrivi quale cast useresti e perché.

<details>
<summary>Soluzione</summary>

| Situazione | Cast | Motivo |
|---|---|---|
| `double` → `int` | `static_cast<int>` | conversione numerica esplicita, con troncamento |
| `Derivata*` → `Base*` | *nessuno* | upcast implicito, sempre sicuro |
| `Base*` → `Derivata*`, sono sicuro del tipo | `static_cast<Derivata*>` | nessun costo a runtime; errore = undefined behavior |
| `Base*` → `Derivata*`, non sono sicuro | `dynamic_cast<Derivata*>` | controlla e restituisce `nullptr` se sbagliato |
| `void*` → `double*` | `static_cast<double*>` | ripristino del tipo dopo un `void*` |
| `Orario*` → `char*` per scrivere su file | `reinterpret_cast<const char*>` | leggere i byte di un oggetto trivially copyable |
| togliere `const` per una vecchia API C | `const_cast` | solo se la funzione non scrive davvero sull'oggetto |
| `int` → `enum` e viceversa | `static_cast` | conversione esplicita tra tipi enumerativi e interi |

Regola: se puoi, usa `static_cast`. Ogni altro cast è un'affermazione che stai facendo al compilatore: scrivila per esteso.

</details>

#### ex:obj-13 · `typeid` contro `dynamic_cast`

*(D13)* Confronta `typeid(*f) == typeid(Cerchio)` con `dynamic_cast<Cerchio*>(f)` su un `Quadrato` visto come `Rettangolo2*`. Quale dei due risponde "sì"?

<details>
<summary>Soluzione</summary>

```cpp
#include <iostream>
#include <typeinfo>

class Figura { public: virtual ~Figura() = default; };
class Cerchio : public Figura {};
class Rettangolo2 : public Figura {};
class Quadrato : public Rettangolo2 {};

int main() {
    Quadrato q;
    Rettangolo2* f = &q;

    std::cout << (typeid(*f) == typeid(Cerchio)) << ' '           // 0: il tipo esatto è Quadrato
              << (typeid(*f) == typeid(Rettangolo2)) << ' '       // 0: non è esattamente Rettangolo2
              << (dynamic_cast<Cerchio*>(f) != nullptr) << ' '    // 0: non è un Cerchio
              << (dynamic_cast<Rettangolo2*>(f) != nullptr) << '\n';  // 1: è compatibile con Rettangolo2
}
```

Output: `0 0 0 1`.

**La differenza.** `typeid` chiede il tipo **esatto**. `dynamic_cast` chiede se l'oggetto è **compatibile** con il tipo richiesto, cioè se può essere usato come tale. Un `Quadrato` *è un* `Rettangolo2`: la risposta del `dynamic_cast` è sì, quella del `typeid` è no. Sono domande diverse: scegli in base a quella che ti serve.

</details>
