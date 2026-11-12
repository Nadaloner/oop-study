# 3 · Riferimenti (references)

*Materiale di riferimento: lucidi «const saga», slide 2–8, 16, 18–21.*

## Teoria

### Un riferimento è un alias

```cpp
int x = 2;
int& a = x;   // a è un ALTRO NOME di x, non una copia
a = 5;        // modifica x
```

Un riferimento è un secondo "cartellino" attaccato alla stessa locazione di memoria. Puoi usare il nome originale o il riferimento: è lo stesso oggetto.

### Quattro regole da ricordare

1. **Va inizializzato** alla dichiarazione. Non esiste un riferimento "vuoto".
2. **Non è nullo.** Il dato a cui si riferisce deve esistere sempre (per questo non esiste `nullptr` per i riferimenti).
3. **Non si riassegna.** `r = y;` *non* cambia a cosa punta `r`: assegna il valore di `y` all'oggetto referenziato da `r`.
4. **Un `int&` non-const si lega solo a un lvalue**, cioè a qualcosa che ha un nome e una locazione. Un letterale (`2`) o un temporaneo non si può legare a un `int&`. Un `const int&` invece sì.

| | Puntatore `T*` | Riferimento `T&` |
|---|---|---|
| Può essere `nullptr` | sì | no |
| Può cambiare destinazione | sì | no |
| Va inizializzato | non necessariamente | sempre |
| Sintassi d'uso | `*p`, `p->x` | come il nome dell'oggetto |

Il C++ standard non dice come siano implementati i riferimenti: nella pratica quasi sempre sono un puntatore nascosto. Ma **non vanno usati come puntatori**: sono alias.

### Passaggio per riferimento

```cpp
void scambia(int& x, int& y) {   // x e y sono alias degli argomenti
    int t = x; x = y; y = t;
}
```

Il chiamante vede le modifiche. Senza `&` si passa una copia.

### Restituzione per riferimento

Una funzione che restituisce `int&` restituisce un **alias** del valore restituito: può quindi stare a sinistra di un `=`.

**Regola fondamentale:** non restituire mai un riferimento a una variabile locale o a un temporaneo: l'oggetto viene distrutto alla fine della funzione e il riferimento "penzola" (*dangling reference*). È **undefined behavior**: il programma può sembrare funzionare e poi fallire altrove.

## Checklist

- [ ] ex:ref-1 · Tracciare gli alias
- [ ] ex:ref-2 · Scambio per riferimento
- [ ] ex:ref-3 · Restituire un riferimento
- [ ] ex:ref-4 · Quali righe compilano?
- [ ] ex:ref-5 · Il riferimento che penzola
- [ ] ex:ref-6 · La stessa cosa con i puntatori
- [ ] ex:ref-7 · Contare le copie

## Esercizi e soluzioni

#### ex:ref-1 · Tracciare gli alias

Prevedi l'output, poi verifica:

```cpp nocheck
int i;
double d;
int& r = i;
double& s = d;
i = 5;
d = 6.7;
// stampa i, r, d, s
```

<details>
<summary>Soluzione</summary>

```cpp
#include <iostream>

int main() {
    int i;
    double d;
    int& r = i;        // r è un alias di i
    double& s = d;     // s è un alias di d
    i = 5;
    std::cout << "Value of i : " << i << '\n';            // 5
    std::cout << "Value of i reference : " << r << '\n';  // 5
    d = 6.7;
    std::cout << "Value of d : " << d << '\n';            // 6.7
    std::cout << "Value of d reference : " << s << '\n';  // 6.7
}
```

Un alias non è mai un contenitore separato: `r` e `i` sono la stessa cosa. Una scrittura su `r` è una scrittura su `i`.

</details>

#### ex:ref-2 · Scambio per riferimento

Scrivi `scambia(int& x, int& y)` e usala in `main` su `a = 1`, `b = 2`. Nei lucidi c'è un `;` mancante nell'ultima riga della funzione: trovalo.

<details>
<summary>Soluzione</summary>

```cpp
#include <iostream>

void scambia(int& x, int& y) {
    int temp = x;
    x = y;
    y = temp;      // nei lucidi manca questo ';'
}

int main() {
    int a = 1, b = 2;
    std::cout << "Before swap, value of a : " << a << '\n';   // 1
    std::cout << "Before swap, value of b : " << b << '\n';   // 2
    scambia(a, b);
    std::cout << "After swap, value of a : " << a << '\n';    // 2
    std::cout << "After swap, value of b : " << b << '\n';    // 1
}
```

</details>

#### ex:ref-3 · Restituire un riferimento

Una funzione `int& setValue(int i)` restituisce un riferimento all'elemento `i`-esimo di un array globale `v = {3, 2, 6, 8, 5}`. Usala come `setValue(1) = 9; setValue(3) = 7;`. Prevedi il contenuto dell'array dopo le due assegnazioni.

<details>
<summary>Soluzione</summary>

```cpp
#include <iostream>

int v[] = {3, 2, 6, 8, 5};

int& setValue(int i) {
    return v[i];        // alias dell'elemento i: l'array esiste per tutta la durata del programma
}

int main() {
    for (int i = 0; i < 5; i++) std::cout << v[i] << ' ';   // 3 2 6 8 5
    std::cout << '\n';
    setValue(1) = 9;    // l'assegnazione agisce su v[1]
    setValue(3) = 7;    // e su v[3]
    for (int i = 0; i < 5; i++) std::cout << v[i] << ' ';   // 3 9 6 7 5
    std::cout << '\n';
}
```

Nei lucidi la seconda riga stampa `3 9 6 9 5`: è un errore di trascrizione. Con `setValue(3) = 7;` l'elemento `v[3]` diventa `7`, quindi l'output corretto è `3 9 6 7 5`. Verificalo con il programma.

**Perché è sicuro.** `v` è globale: vive per tutto il programma, quindi il riferimento restituito resta valido. Se `v` fosse una variabile locale di `setValue`, saremmo nel caso di `ex:ref-5`.

</details>

#### ex:ref-4 · Quali righe compilano?

Per ciascuna riga dì se compila e perché:

```cpp nocheck
int x = 2;
int& a = x;          // (a)
int& a1 = 2;         // (b)
const int& r = 4;    // (c)
const int& r2 = x;   // (d)
r2 = 5;              // (e)
int& const r3 = x;   // (f)
void fun(const int& q);
fun(x);              // (g)
fun(4);              // (h)
```

<details>
<summary>Soluzione</summary>

- **(a)** Compila: `x` è un lvalue, `a` è un alias.
- **(b)** **Errore.** Un `int&` non-const deve legarsi a un lvalue; `2` è un valore temporaneo.
- **(c)** Compila. Un `const int&` può legarsi a un temporaneo, che vive quanto il riferimento.
- **(d)** Compila: riferimento costante a un oggetto non costante.
- **(e)** **Errore.** Il riferimento è `const`: non si modifica il dato attraverso di lui (anche se `x` non è `const`).
- **(f)** **Errore.** Un riferimento non si può rendere `const` "da fuori": non ha senso, non si riassegna già. Lo slide lo indica come *tipo illegale*.
- **(g)** Compila: `x` è un lvalue, passato per riferimento costante.
- **(h)** Compila: `4` è un temporaneo, legale per `const int&`.

Confronta (h) con un puntatore: `fun(&4)` non compila, perché un letterale non ha indirizzo. Questo è uno dei motivi per cui il passaggio `const T&` è più flessibile.

</details>

#### ex:ref-5 · Il riferimento che penzola

Il seguente codice compila (con un warning) ma è sbagliato. Spiega perché, poi correggilo.

```cpp nocheck
int& f(int& a) {
    int q = a * 2;
    return q;      // ERRORE: restituisce un riferimento a una variabile locale
}
```

<details>
<summary>Soluzione</summary>

`q` vive sullo stack di `f` e viene distrutta alla fine della funzione. Il riferimento restituito punta a memoria che non esiste più: è **dangling reference**. Il comportamento è indefinito: spesso "funziona" per caso, poi la stessa memoria viene riusata e il valore diventa spazzatura.

Il compilatore avverte (`-Wreturn-local-addr` in g++, `-Wreturn-stack-address` in clang). Nei lucidi c'è lo stesso problema con `const int& f() { return 4; }`: il temporaneo viene distrutto al `return`.

Correzioni possibili:

```cpp nocheck
int f(int a) { return a * 2; }             // restituisci per valore

int& f(int& a) { a = a * 2; return a; }    // oppure restituisci un riferimento a qualcosa che sopravvive (un parametro)
```

Regola: un riferimento restituito deve riferirsi a qualcosa che esiste dopo la chiamata (un parametro, un membro di un oggetto vivo, una variabile globale o statica).

</details>

#### ex:ref-6 · La stessa cosa con i puntatori

Scrivi `scambia` con puntatori (`int*`) e confrontala con quella per riferimento. Quali differenze di sintassi noti? Quale delle due non può ricevere `nullptr`?

<details>
<summary>Soluzione</summary>

```cpp
#include <iostream>

void scambia(int* x, int* y) {   // riceve indirizzi
    int t = *x;
    *x = *y;
    *y = t;
}

int main() {
    int a = 1, b = 2;
    scambia(&a, &b);             // il chiamante scrive &
    std::cout << a << ' ' << b << '\n';   // 2 1
}
```

Differenze: il puntatore richiede `&` al chiamante e `*` dentro la funzione; il riferimento no. Il puntatore può essere `nullptr`, e quindi la funzione dovrebbe controllarlo: il riferimento, per costruzione, non può essere nullo. Scegli il riferimento quando l'oggetto è obbligatorio, il puntatore quando "non c'è" è un caso valido.

</details>

#### ex:ref-7 · Contare le copie

Classe `Big` con un costruttore di copia che stampa `copia`. Confronta tre funzioni:

```cpp nocheck
void f1(Big b);            // per valore
void f2(Big& b);           // per riferimento
void f3(const Big& b);     // per riferimento costante
```

Chiamale su un oggetto `Big b;` e conta le stampe. Poi spiega perché `f2(Big())` non compila, mentre `f3(Big())` sì.

<details>
<summary>Soluzione</summary>

```cpp
#include <iostream>

class Big {
public:
    Big() {}
    Big(const Big&) { std::cout << "copia\n"; }   // ogni copia viene segnalata
    // (il corpo è vuoto: ci interessa solo contare le copie)
};

void f1(Big) {}              // per valore
void f2(Big&) {}             // per riferimento
void f3(const Big&) {}       // per riferimento costante

int main() {
    Big b;
    f1(b);     // stampa "copia": il parametro per valore è una copia
    f3(b);     // nessuna copia
    f2(b);     // nessuna copia
}
```

Output: una sola riga `copia`.

Perché `f2(Big())` non compila: `Big()` è un temporaneo (un rvalue) e `Big&` non può legarsi a un rvalue. `f3(Big())` compila perché `const Big&` può legarsi a un temporaneo, e nessuna copia viene fatta.

**Perché si scrive `const T&`.** Per oggetti grandi, il passaggio per valore copia tutto. Nei lucidi (slide 22) la misura è 108 volte più lenta. `const T&` evita la copia e garantisce che la funzione non modifichi l'oggetto.

</details>
