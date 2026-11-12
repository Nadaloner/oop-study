# 5 · Conversioni e cast tra tipi primitivi

## Teoria

### Conversioni: implicite ed esplicite

Una conversione cambia il tipo di un'espressione. Ci sono due famiglie:

- **Implicite** (*coercions*): le fa il compilatore da solo, quando il contesto lo richiede.
- **Esplicite**: le scrivi tu con un cast.

Il criterio formale del lucido: un'espressione `e` è implicitamente convertibile a `T` se `T t = e;` compila (*copy-initialization*).

### Le conversioni implicite "sicure" (dai lucidi)

| Da | A | Esempio |
|---|---|---|
| `T&` | `T` | un riferimento si usa come il valore che indica |
| `T[]` | `T*` | un array decade a puntatore al primo elemento |
| `T*` | `void*` | `void* q = p;` |
| `T` | `const T` | `const int y = x;` |
| `T*` | `const T*` | `const int* q = p;` |
| `T` | `const T&` | `const int& r = 4;` |
| `bool` | `int` | `int k = true;` |
| `float` → `double` → `long double` | | allargamenti |
| `char` → `short` → `int` → `long` | | allargamenti |

**Una conversione non si fa mai al contrario in modo silenzioso:** `T` → `T&` non è implicito (`int& x = 5;` non compila).

### Narrowing e widening

- **Widening** (allargamento): il tipo di destinazione contiene tutti i valori del sorgente. Sicuro.
- **Narrowing** (restringimento): può perdere informazione o precisione. `double` → `int` tronca; `int` → `char` può cambiare valore. Il compilatore lo accetta spesso in silenzio.

Due regole da imparare a memoria:

- la conversione **float → intero tronca verso zero**: `static_cast<int>(-2.7)` vale `-2`;
- la conversione **intero → intero senza segno** fa aritmetica modulo 2ⁿ: `unsigned int u = 0; u - 1` vale `4294967295`.

### La trappola della divisione

`a / b` con due `int` esegue una divisione **intera**; la conversione a `double` avviene *dopo*. `double d = a / b;` vale `3.0` con `a = 7, b = 2`. Per avere `3.5` converti **prima**: `static_cast<double>(a) / b`.

### Confronti tra signed e unsigned

In un confronto misto, il valore con segno viene convertito in senza segno: `-1 < 1u` è **falso**, perché `-1` diventa `4294967295`. È il bug più insidioso del C++: il warning `-Wsign-compare` esiste per questo.

Il ciclo `for (size_t i = v.size() - 1; i >= 0; i--)` non termina mai: `i >= 0` è sempre vero per un `size_t`.

### I cast C-style e i cast C++

Il cast in stile C `(int)x` fa di tutto (static, const, reinterpret...) senza dirti quale. Il C++ usa quattro cast con significati precisi:

| Cast | Uso tipico |
|---|---|
| `static_cast` | conversioni numeriche, `void*` → `T*`, upcast e downcast "fidati" |
| `const_cast` | aggiungere o togliere `const` |
| `reinterpret_cast` | reinterpretare i bit (rarissimo, pericoloso) |
| `dynamic_cast` | downcast controllato (modulo 6) |

Nel quotidiano, usa `static_cast`. Gli altri tre vanno giustificati esplicitamente.

### Conversioni a `bool`

Un valore è `false` se è zero (o `nullptr`), `true` altrimenti. `if (p)` e `if (p != nullptr)` fanno la stessa cosa; `if (p)` è più idiomatico, `if (p != nullptr)` è più esplicito. Entrambi sono accettabili: scegli uno e sii coerente nel progetto.

## Checklist

- [ ] ex:prim-1 · Divisione intera e cast (C1)
- [ ] ex:prim-2 · Overflow, troncamento e segno (C2)
- [ ] ex:prim-3 · La trappola signed/unsigned (C3)
- [ ] ex:prim-4 · Arrotondamenti (C4)
- [ ] ex:prim-5 · Dal cast C al cast C++ (C5)
- [ ] ex:prim-6 · Endianness e reinterpret_cast (C6)
- [ ] ex:prim-7 · Conversioni a bool (C7)
- [ ] ex:prim-8 · Conversione sicura (C8)

## Esercizi e soluzioni

#### ex:prim-1 · Divisione intera e cast

*(C1)* Prevedi l'output su carta, poi verifica.

```cpp nocheck
int a = 7, b = 2;
double d1 = a / b;
double d2 = (double)a / b;
double d3 = static_cast<double>(a) / b;
double d4 = a / static_cast<double>(b);
double d5 = static_cast<double>(a / b);
int n = 3.99;
int m = static_cast<int>(-3.99);
```

<details>
<summary>Soluzione</summary>

```cpp
#include <iostream>

int main() {
    int a = 7, b = 2;
    double d1 = a / b;                          // 3: divisione intera, poi conversione
    double d2 = (double)a / b;                  // 3.5
    double d3 = static_cast<double>(a) / b;     // 3.5
    double d4 = a / static_cast<double>(b);     // 3.5
    double d5 = static_cast<double>(a / b);     // 3: la trappola, la divisione è già avvenuta
    int n = 3.99;                               // 3: troncamento
    int m = static_cast<int>(-3.99);            // -3: troncamento verso zero
    std::cout << d1 << ' ' << d2 << ' ' << d3 << ' ' << d4 << ' '
              << d5 << ' ' << n << ' ' << m << '\n';
}
```

Output: `3 3.5 3.5 3.5 3 3 -3`

**Lezione.** La conversione avviene nel punto in cui la scrivi, non alla fine dell'espressione. `d5` mostra che `static_cast` applicato al risultato di una divisione intera non recupera la parte perduta.

</details>

#### ex:prim-2 · Overflow, troncamento e segno

*(C2)* Scrivi un programma che stampa l'output di queste operazioni e spiega ciascun risultato.

```cpp nocheck
unsigned int u = 0;
std::cout << u - 1 << "\n";
char c = 200;
std::cout << static_cast<int>(c) << "\n";
int big = 300;
char piccolo = static_cast<char>(big);
std::cout << static_cast<int>(piccolo) << "\n";
std::cout << static_cast<int>(3.9 + 0.1) << "\n";
```

<details>
<summary>Soluzione</summary>

```cpp
#include <iostream>

int main() {
    unsigned int u = 0;
    std::cout << u - 1 << '\n';                 // 4294967295: modulo 2^32

    char c = static_cast<char>(200);            // 200 non sta in char con segno
    std::cout << static_cast<int>(c) << '\n';   // -56 su macOS/x86 (char con segno); 200 dove char è senza segno

    int big = 300;
    char piccolo = static_cast<char>(big);      // 300 mod 256 = 44, che sta in char
    std::cout << static_cast<int>(piccolo) << '\n';   // 44

    std::cout << static_cast<int>(3.9 + 0.1) << '\n';   // 4: 3.9 + 0.1 vale 4.0 esatto in double
}
```

**Attenzione alla piattaforma.** `char` può avere o non avere segno a seconda del compilatore e dell'architettura: per questo nel primo caso il risultato dipende dalla macchina. Il suggerimento del foglio (`setprecision(20)`) mostra che `3.9` e `0.1` non sono esatti in binario: la somma può differire da `4.0` di un'inezia, e in quel caso il troncamento darebbe `3`. Verifica sulla tua macchina.

</details>

#### ex:prim-3 · La trappola signed/unsigned

*(C3)* Spiega perché questo ciclo non termina mai, e correggilo in due modi diversi. Poi spiega il confronto con warning.

```cpp nocheck
std::vector<int> v = {1, 2, 3};
for (size_t i = v.size() - 1; i >= 0; i--)
    std::cout << v[i];

int i = -1;
unsigned int u = 1;
if (i < u) std::cout << "minore"; else std::cout << "maggiore";
```

<details>
<summary>Soluzione</summary>

Il ciclo non termina perché `size_t` è senza segno: `i >= 0` è sempre vero. Quando `i` vale `0` e viene decrementato, diventa `SIZE_MAX` invece di `-1`, e la condizione resta vera. Il programma poi accede fuori dal vettore: **undefined behavior**.

```cpp
#include <cstddef>
#include <iostream>
#include <vector>

int main() {
    std::vector<int> v = {1, 2, 3};

    // Correzione 1: decrementa e controlla prima di usare l'indice senza segno
    for (std::size_t i = v.size(); i-- > 0; )
        std::cout << v[i];                       // 321
    std::cout << '\n';

    // Correzione 2: usa un indice con segno, ma convertilo esplicitamente
    for (int i = static_cast<int>(v.size()) - 1; i >= 0; --i)
        std::cout << v[i];                       // 321
    std::cout << '\n';

    // Confronto misto: -1 diventa 4294967295
    int i2 = -1;
    unsigned int u = 1;
    if (i2 < u) std::cout << "minore\n";
    else        std::cout << "maggiore\n";       // maggiore (+ warning -Wsign-compare)
}
```

**Regola.** In un confronto misto signed/unsigned, il valore con segno viene convertito in senza segno. Se il confronto ti sembra strano, quasi sempre è questo.

</details>

#### ex:prim-4 · Arrotondamenti

*(C4)* Scrivi tre funzioni: `troncaVerso0` (con `static_cast`), `arrotonda` (con `std::round`), `arrotondaPerDifetto` (con `std::floor`). Confronta su `2.5`, `-2.5`, `2.4`, `-2.4`. Perché `static_cast<int>(-2.7)` dà `-2`?

<details>
<summary>Soluzione</summary>

```cpp
#include <cmath>
#include <iostream>

int troncaVerso0(double x)        { return static_cast<int>(x); }
int arrotonda(double x)           { return static_cast<int>(std::round(x)); }
int arrotondaPerDifetto(double x) { return static_cast<int>(std::floor(x)); }

int main() {
    for (double x : {2.5, -2.5, 2.4, -2.4})
        std::cout << x << ": " << troncaVerso0(x) << ' '
                  << arrotonda(x) << ' ' << arrotondaPerDifetto(x) << '\n';
}
```

Output:

```
2.5: 2 3 2
-2.5: -2 -3 -3
2.4: 2 2 2
-2.4: -2 -2 -3
```

**Perché `-2`.** La conversione da floating a intero **tronca verso zero**: scarta la parte frazionaria. `floor` invece va verso il basso (`-3`). `std::round` arrotonda alla metà lontano dallo zero (`2.5 → 3`, `-2.5 → -3`).

</details>

#### ex:prim-5 · Dal cast C al cast C++

*(C5)* Riscrivi il codice sostituendo ogni cast in stile C con quello appropriato, e giustifica ogni scelta.

```cpp nocheck
double d = 3.7;
int i = (int)d;
const int ci = 10;
int* p = (int*)&ci;
char buffer[4];
int* ip = (int*)buffer;
void* generico = &d;
double* dp = (double*)generico;
```

<details>
<summary>Soluzione</summary>

```cpp
#include <iostream>

int main() {
    double d = 3.7;
    int i = static_cast<int>(d);                  // conversione numerica: static_cast

    const int ci = 10;
    int* p = const_cast<int*>(&ci);               // tolgo const: lecito solo se NON scrivo su ci

    void* generico = &d;
    double* dp = static_cast<double*>(generico);  // void* -> T*: static_cast

    std::cout << i << ' ' << *p << ' ' << *dp << '\n';   // 3 10 3.7
}
```

Due casi che **non** vanno fatti così:

- `char buffer[4]; int* ip = reinterpret_cast<int*>(buffer);` è undefined behavior: il buffer può non essere allineato per `int`, e il compilatore può supporre che un `char` array non venga letto come `int`. Per leggere i byte di un oggetto usa `std::memcpy` o un puntatore a `unsigned char` (vedi `prim-6`).
- Scrivere su `ci` tramite `p` è undefined behavior: `ci` è davvero `const`. `const_cast` serve solo quando l'oggetto originale non è `const`.

**Lezione.** Il cast C-style non dice *quale* conversione stai facendo, quindi non puoi cercarlo nel codice e il compilatore non ti controlla. I cast C++ sono più verbosi apposta.

</details>

#### ex:prim-6 · Endianness e `reinterpret_cast`

*(C6)* Determina se la tua macchina è *little-endian* o *big-endian*: con `reinterpret_cast<unsigned char*>` sul `int` stampando i byte, e poi con una `union`. Scrivi `uint32_t scambiaByte(uint32_t)` che inverte l'ordine dei quattro byte.

<details>
<summary>Soluzione</summary>

```cpp
#include <cstdint>
#include <iostream>

std::uint32_t scambiaByte(std::uint32_t v) {
    return (v >> 24) | ((v >> 8) & 0x0000FF00u) | ((v << 8) & 0x00FF0000u) | (v << 24);
}

int main() {
    std::uint32_t x = 0x01020304;

    // Leggere i byte di un oggetto tramite unsigned char è lecito in C++
    const unsigned char* b = reinterpret_cast<const unsigned char*>(&x);
    std::cout << std::hex;
    for (int k = 0; k < 4; ++k) std::cout << static_cast<int>(b[k]) << ' ';
    std::cout << std::dec << '\n';      // 4 3 2 1 su little-endian
    std::cout << (b[0] == 0x04 ? "little-endian\n" : "big-endian\n");

    std::cout << std::hex << scambiaByte(0x01020304) << std::dec << '\n';   // 4030201
}
```

**Nota sulla `union`.** Usare una `union` per "rileggere" un `int` come byte è accettato da gcc e clang, ma in C++ standard è undefined behavior. Il metodo sopra, che legge i byte con `unsigned char`, è quello legittimo.

**Collegamento.** Un file binario scritto su una macchina little-endian e letto su una big-endian sbaglia valori: è il problema della portabilità dei file binari.

</details>

#### ex:prim-7 · Conversioni a `bool`

*(C7)* Prevedi l'output, poi verifica.

```cpp nocheck
std::cout << static_cast<bool>(0) << static_cast<bool>(-1)
          << static_cast<bool>(0.0) << static_cast<bool>(0.1) << "\n";
int* p = nullptr;
std::cout << static_cast<bool>(p) << "\n";
std::cout << std::boolalpha << static_cast<bool>(42) << "\n";
```

<details>
<summary>Soluzione</summary>

```cpp
#include <iostream>

int main() {
    std::cout << static_cast<bool>(0) << static_cast<bool>(-1)
              << static_cast<bool>(0.0) << static_cast<bool>(0.1) << '\n';   // 0101
    int* p = nullptr;
    std::cout << static_cast<bool>(p) << '\n';                               // 0
    std::cout << std::boolalpha << static_cast<bool>(42) << '\n';            // true
}
```

Senza `boolalpha`, `bool` si stampa come `0`/`1`. `if (p)` e `if (p != nullptr)` sono equivalenti: il primo è più idiomatico, il secondo più esplicito. Scegline uno e usalo ovunque.

</details>

#### ex:prim-8 · Conversione sicura

*(C8)* Scrivi `bool conversioneSicura(double d, int& out)` che converte `d` in `int` solo se il valore sta davvero nell'intervallo di `int` (usa `std::numeric_limits`), altrimenti restituisce `false`. Testala con `1e20`, `-1e20`, `3.5`.

<details>
<summary>Soluzione</summary>

```cpp
#include <cmath>
#include <iostream>
#include <limits>

bool conversioneSicura(double d, int& out) {
    if (std::isnan(d)) return false;
    if (d < static_cast<double>(std::numeric_limits<int>::min()) ||
        d > static_cast<double>(std::numeric_limits<int>::max()))
        return false;                  // fuori range: la conversione sarebbe UB
    out = static_cast<int>(d);         // ora il troncamento è sicuro
    return true;
}

int main() {
    int r = 0;
    for (double d : {1e20, -1e20, 3.5}) {
        if (conversioneSicura(d, r)) std::cout << d << " -> " << r << '\n';
        else                         std::cout << d << " -> fuori range\n";
    }
}
```

Output: `1e+20 -> fuori range`, `-1e+20 -> fuori range`, `3.5 -> 3`.

**Scelta di progetto.** `3.5` viene accettato e troncato a `3`. Se vuoi che siano accettati solo valori interi esatti, aggiungi `if (std::trunc(d) != d) return false;`. Decidi in base a cosa ti serve, e scrivilo nel commento.

</details>
