# 7 · Template e puzzle da esame

*Questo modulo lavora sugli esercizi della cartella «Soluzioni esercizi svolti a lezione» (file `Raz.cpp`, `Tree.cpp`, `albero.cpp`, `dList.cpp`, `Esercizio-28-10-2026.cpp`, più il PDF `EsercizioCosaStampa-21-10-2026.pdf`).*

## Teoria

### Template di classe

`template <class T> class lista { ... };` genera una classe per ogni tipo `T` che usi. Tre regole pratiche:

- la definizione (non solo la dichiarazione) va nell'header, altrimenti il linker non trova il codice;
- le funzioni membro di un template vengono **istanziate solo se usate**: è il motivo per cui un errore dentro una funzione mai chiamata può passare inosservato;
- per gli `operator<<` e `operator==` che sono template fuori dalla classe, la dichiarazione `friend` deve ripetere la firma con `<T>`: `friend bool operator==<T>(...)`.

### Nodi privati e `friend`

Una classe può avere un tipo nidificato privato (`nodo`) che solo lei manipola. Il `friend` concede accesso a una classe o funzione precisa, non a tutti.

### Ordinamento lessicografico

Confronta elemento per elemento: il primo elemento diverso decide. Se una sequenza è prefisso dell'altra, la più corta è minore. Così `"campana" < "cavolo"` e `"buono" < "ottimo"`.

### Liste doppiamente collegate

Ogni nodo ha `prev` e `next`. Inserimento in testa e in coda in tempo O(1) se hai i puntatori a `first` e `last`. L'invariante: lista vuota ⇔ `first == nullptr` e `last == nullptr`.

### Iteratori

Un iteratore è un oggetto che "punta" a un elemento e sa avanzare. La sentinella *past-the-end* rappresenta "dopo l'ultimo". Attenzione: **aritmetica di puntatori fuori dalla memoria dell'oggetto è undefined behavior**, e vale anche per `last + 1` quando `last` punta a un singolo nodo (vedi `tmp-4`).

## Checklist

- [ ] ex:tmp-1 · Raz: il razionale con conversioni (`Raz.cpp`)
- [ ] ex:tmp-2 · Tree: copia e distruzione profonde (`Tree.cpp`)
- [ ] ex:tmp-3 · albero&lt;T&gt;: alberi 3-ari (`albero.cpp`)
- [ ] ex:tmp-4 · dList&lt;T&gt;: lista doppiamente collegata (`dList.cpp`)
- [ ] ex:tmp-5 · Esercizio-28: cosa serve dichiarare (`Esercizio-28-10-2026.cpp`)
- [ ] ex:tmp-6 · Puzzle dell'output: N, C, S (PDF `EsercizioCosaStampa`)

## Esercizi e soluzioni

#### ex:tmp-1 · Raz: il razionale con conversioni

*(da `Raz.cpp`)* Classe `Raz` (numero razionale `num/den`, con `den != 0`): costruttori, `inverso()`, conversione a `double`, somma, moltiplicazione, incremento pre e postfisso (aumenta di 1), uguaglianza, output, `unTerzo()`. Il testo dice che la conversione a `double` è **esplicita**: verifica se lo è nel file, e prevedi l'output del `main`.

<details>
<summary>Soluzione</summary>

Nel file la conversione è `operator double() const`, **non** `explicit`, anche se la consegna la chiede esplicita: è una differenza da notare. Ecco una versione con `explicit`, verificata:

```cpp
#include <iostream>

class Raz {
public:
    Raz(int n = 0, int d = 1) : num(n), den(d != 0 ? d : 1) {}   // den != 0 (invariante)

    Raz inverso() const { return num == 0 ? Raz() : Raz(den, num); }

    explicit operator double() const { return static_cast<double>(num) / den; }

    Raz operator+(const Raz& r) const { return Raz(num * r.den + den * r.num, den * r.den); }
    Raz operator*(const Raz& r) const { return Raz(num * r.num, den * r.den); }

    Raz& operator++() { *this = *this + Raz(1); return *this; }             // prefisso
    Raz operator++(int) { Raz aux(*this); *this = *this + Raz(1); return aux; }   // postfisso

    bool operator==(const Raz& r) const { return num * r.den == den * r.num; }

    static Raz unTerzo() { return Raz(1, 3); }

    friend std::ostream& operator<<(std::ostream& os, const Raz& r) {
        return os << r.num << '/' << r.den;
    }

private:
    int num, den;
};

int main() {
    Raz x(2, 3), y(2), u(1, 8), v(3, 2), w(8, 4);
    std::cout << x + y + v * u << '\n';                              // 137/48
    std::cout << static_cast<double>(x + y + v * u) << '\n';         // 2.85417
    std::cout << u.inverso() << '\n';                                // 8/1
    std::cout << std::boolalpha << (y == w) << '\n';                 // true
    std::cout << y++ << ' ' << ++w << '\n';                          // 2/1 12/4
    std::cout << (++y + Raz::unTerzo()) << '\n';                     // 13/3
    std::cout << static_cast<double>(Raz(2) + Raz(1, 2)) << '\n';    // 2.5
    // std::cout << 2 + Raz(1, 2);   // ERRORE con explicit: nessuna conversione implicita a double
}
```

**Tre lezioni.**

1. Con `operator double()` **non** `explicit`, `2 + Raz(1, 2)` compila perché il `Raz` viene convertito in `double` e si usa il `+` già presente: il risultato è un `double` (2.5), non un `Raz`. È il problema di `obj-2`.
2. `y++` restituisce una copia del valore *precedente*; `++w` restituisce il valore *nuovo*.
3. I commenti nel file (`// 2 3`, `// 4.33333`) descrivono valori: senza `operator<<` che stampi il razionale in quel modo, l'output reale è diverso. Verifica sempre con il compilatore.

</details>

#### ex:tmp-2 · Tree: copia e distruzione profonde

*(da `Tree.cpp`)* Alberi binari di `char` con assegnazione, costruttore di copia e distruttore profondi. Scrivi esplicitamente le `friend` necessarie.

<details>
<summary>Soluzione</summary>

Il lavoro è già descritto in `ex:res-6` (modulo 2). Due domande aggiuntive d'esame:

- **`Tree t3 = t2;` è assegnazione?** No: è **costruzione di copia** (inizializzazione di un oggetto nuovo). `t1 = t2;` invece è assegnazione: `t1` esiste già.
- **Perché `Nodo` ha `friend class Tree`?** Il costruttore di `Nodo` è privato e `Tree` deve poter creare e distruggere nodi. Il `friend` rende esplicito questo permesso, senza aprire i membri a tutto il mondo.

Il `main` dello stesso file non stampa nulla: l'esercizio si verifica con `-fsanitize=address` (nessun leak, nessun double free).

</details>

#### ex:tmp-3 · albero&lt;T&gt;: alberi 3-ari

*(da `albero.cpp`)* Template `albero<T>`: albero 3-ario in cui ogni nodo ha valore `T` e tre figli. Costruttore di default (albero vuoto), gestione della memoria senza condivisione, `insert(const T& t)` che mette una nuova radice con valore `t` e **tre copie** di `*this` come figli, `search(const T&)`, `operator==`, `operator<<`. Prevedi cosa stampa il `main`.

<details>
<summary>Soluzione</summary>

Il punto chiave è l'`insert`. Nel file:

```cpp nocheck
void insert(const T& t) {
    root = new nodo(t, copia(root), copia(root), root);
}
```

Tre figli: `sx` e `cx` sono **copie** dell'albero precedente, `dx` è l'albero precedente stesso (che viene "ceduto" al nuovo nodo, senza copia). Questo mantiene la proprietà *senza condivisione*: ogni nodo ha un solo proprietario.

**Conseguenza sulla dimensione.** Se un albero ha `s` nodi, dopo `insert` ne ha `1 + 3s`. Partendo da vuoto: 1, 4, 13, 40... cresce in modo esponenziale, e la stampa è lunga.

Output del `main` del file (verificato):

```
false
true
true
t1 = e a b b b a b b b a b b b
t2 = c e a b b b a b b b a b b b e a b b b a b b b a b b b e a b b b a b b b a b b b
t3 = c e a b b b a b b b a b b b e a b b b a b b b a b b b e a b b b a b b b a b b b
t4 = e a b b b a b b b a b b b
```

Lettura: `rec_output` stampa il valore del nodo e poi i tre sottoalberi (ordine prefisso). `t1` ha 13 nodi, `t2` e `t3` hanno 40, `t4` è copia di `t1`. `t2 = t3` rende uguali `t2` e `t3`, e `t1 == t2` è falso per via delle dimensioni diverse.

Domanda di riflessione: perché `insert` chiama `copia(root)` **due** volte invece di riusare lo stesso sottoalbero? Perché senza condivisione ogni nodo deve avere un solo padre: due figli che puntano allo stesso sottoalbero rompono la distruzione (double free).

</details>

#### ex:tmp-4 · dList&lt;T&gt;: lista doppiamente collegata

*(da `dList.cpp`)* Template `dList<T>`: memoria senza condivisione; costruttore `dList(unsigned k, const T& t)` con `k` copie di `t`; `insertFront` e `insertBack` in O(1); `operator<` lessicografico; iteratore costante `const_iterator`.

<details>
<summary>Soluzione</summary>

**Come funziona.** `insertFront` crea un nodo con `next = first` e aggiorna `first`; se la lista era vuota, aggiorna anche `last`. `insertBack` è simmetrico. Entrambe sono O(1) perché non attraversano la lista.

**Output del `main` del file (verificato):**

```
x= 2 2 2 2
y=
z= 8 8 8 8 8 8
y < z
x= -2 2 2 2 2
y= 0 2 2 2 2 -2
z= 3 8 8 8 8 8 8
x < y
y < z
```

Due osservazioni sul confronto `<`: una lista vuota è minore di una non vuota (`y < z`, ma non `z < y`); il primo elemento diverso decide (`x < y` perché `-2 < 0`).

**Nota critica (da segnalare all'esame).** `end()` restituisce `const_iterator(last + 1, true)`. Calcolare `last + 1` su un puntatore a un *singolo* nodo è undefined behavior: il puntatore esce dall'oggetto. Anche `++ptr` nel caso `ptr->next == nullptr` ha lo stesso problema. Il modo corretto è non fare aritmetica: usa una sentinella (un flag `pte` già presente nel codice, senza `++ptr`) o un nodo fittizio.

</details>

#### ex:tmp-5 · Esercizio-28: cosa serve dichiarare

*(da `Esercizio-28-10-2026.cpp`)* Dai una dichiarazione (non la definizione) dei membri della classe `Z`, nel minor numero possibile, affinché la compilazione del `main` non produca errori. Il file contiene già corpi vuoti: che succede quando il programma viene eseguito?

<details>
<summary>Soluzione</summary>

Le funzioni usate dai template per `C<Z, Z>` e `C<int, Z>` sono:

- `int& operator++();`: prefisso, usato da `++(q->x)` quando `T1 = Z`. Il tipo di ritorno conta: lo stream riceve un `int&`.
- `Z operator++(int);`: postfisso, usato da `(q->x)++`.
- `bool operator==(const Z&) const;`: usato da `*(q->p) == q->x`.
- `Z(int = 0);`: costruttore da `int` (conversione), usato da `T2 t2 = q->x;` e da `*(q->p) = q->x;` quando `T1 = int`.

Per la sola **compilazione** bastano queste dichiarazioni. Il file originale ha invece corpi vuoti (`int& operator++() {}`): compila con warning, ma **quando viene eseguito** il programma raggiunge la fine di una funzione che deve restituire un valore. Lo segnala `-fsanitize=undefined`:

```
runtime error: execution reached the end of a value-returning function without returning a value
```

Per eseguire davvero bisogna definire le funzioni con un corpo che restituisce qualcosa. Il senso dell'esercizio è questo: **capire quale parte dell'interfaccia un template richiede** e che il compilatore controlla le firme, non i corpi finché non vengono usati.

</details>

#### ex:tmp-6 · Puzzle dell'output: N, C, S

*(dal PDF `EsercizioCosaStampa-21-10-2026.pdf`)* Prevedi l'output del programma: `C` possiede una lista di nodi `N`, ognuno con una stringa `S`. Il distruttore di `N` cancella il `next` **prima** di stampare la propria stringa.

Nota: nel PDF il `main` è scritto `main(){` senza tipo: in C++ va scritto `int main()`.

<details>
<summary>Soluzione</summary>

Il programma (con `int main`) e il suo output reale, verificato:

```cpp
#include <iostream>
#include <string>
using namespace std;

class S {
public:
    string s;
    S(string t) : s(t) {}
};

class N {
private:
    S x;
public:
    N* next;
    N(S t, N* p) : x(t), next(p) { cout << "N2 "; }
    ~N() { if (next) delete next; cout << x.s + "~N "; }
};

class C {
    N* pointer;
public:
    C() : pointer(0) {}
    ~C() { delete pointer; cout << "~C "; }
    void F(string t1, string t2 = "pippo") {
        pointer = new N(S(t1), pointer);
        pointer = new N(t2, pointer);
    }
};

int main() {
    C* p = new C;
    cout << "UNO\n";
    p->F("pluto", "paperino");
    p->F("topolino");
    cout << "DUE\n";
    delete p;
    cout << "TRE\n";
}
```

Output:

```
UNO
N2 N2 N2 N2 DUE
pluto~N paperino~N topolino~N pippo~N ~C TRE
```

**Come si legge.**

1. `new C` non stampa nulla; `UNO` viene stampato dal `main`.
2. Ogni chiamata di costruzione di `N` stampa `N2`: sono quattro (due per ogni `F`), quindi `N2 N2 N2 N2` seguito da `DUE`.
3. Catena finale, dalla testa: `pippo → topolino → paperino → pluto`.
4. `delete p` chiama `~C`, che chiama `delete pointer` sulla testa (`pippo`). Il distruttore di `pippo` cancella prima il suo `next` (`topolino`), e così via fino a `pluto`. Il primo a stampare è quindi l'ultimo della catena: `pluto~N`, poi `paperino~N`, `topolino~N`, `pippo~N`.
5. Solo alla fine `~C` stampa `~C ` e il `main` stampa `TRE`.

**Lezione.** Il distruttore ricorsivo produce l'ordine inverso di costruzione. Le annotazioni "NESSUNA STAMPA" nel PDF indicano righe che non producono output *proprio* in quel punto: la stampa `UNO` viene comunque eseguita dal `cout` del `main`.

</details>
