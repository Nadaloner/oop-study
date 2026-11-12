# 0 · Metodo e strumenti

> Questo modulo non introduce teoria nuova: serve a impostare il lavoro. Dedica un'ora a leggerlo e a fare i due esercizi.

## Come usare questo sito

- Ogni modulo ha una **teoria**, una **checklist** e gli **esercizi**. Le soluzioni stanno dentro i riquadri *Soluzione*: aprili **solo dopo** aver provato.
- Spunta un esercizio quando lo hai **risolto e fatto girare**, non quando lo hai solo letto.
- La **dashboard** mostra gli esercizi completati per giorno, il calendario delle attività e i minuti di studio. Il *Registro di oggi* lo compili tu (minuti + nota).
- Il progresso resta nel browser. **Esporta** scarica un file JSON; **Importa** lo ricarica su un altro computer.

## Metodo in cinque passi (per ogni esercizio)

1. Leggi il testo e **prevedi l'output su carta** (oppure: compila o non compila, e perché).
2. Scrivi il codice senza guardare la soluzione.
3. Compila con i warning attivi e correggi **tutti** i warning.
4. Esegui con i sanitizer: segnalano accessi fuori range, double free, leak e undefined behavior.
5. Confronta con la soluzione. Se hai sbagliato, **riscrivi l'esercizio da zero** dopo qualche ore o il giorno dopo.

Regola d'oro: un esercizio che non gira non è fatto.

## Comandi di compilazione

```bash
# compilazione con warning
g++ -std=c++17 -Wall -Wextra -g file.cpp -o prog && ./prog

# con sanitizer: memoria e undefined behavior
g++ -std=c++17 -Wall -Wextra -g -fsanitize=address,undefined file.cpp -o prog && ./prog
```

Su macOS `g++` è in realtà Apple clang: i flag sono gli stessi. Il LeakSanitizer non è disponibile su macOS, ma AddressSanitizer rileva comunque double free e accessi fuori range.

> **Attenzione:** nelle dispense della prof compare `main(){ ... }` senza tipo di ritorno. In C++ `main` deve restituire `int`: scrivi sempre `int main()`.

## Checklist

- [ ] ex:met-1 · Primo programma con sanitizer
- [ ] ex:met-2 · Test di ingresso (5 domande)

## Esercizi e soluzioni

#### ex:met-1 · Primo programma con sanitizer

Scrivi un programma che alloca un `int` con `new`, lo stampa e lo libera. Compilalo con i sanitizer: non deve segnalare nulla.

<details>
<summary>Soluzione</summary>

```cpp
#include <iostream>

int main() {
    int* p = new int(42);
    std::cout << *p << "\n";   // 42
    delete p;                  // ogni new ha il suo delete
}
```

</details>

#### ex:met-2 · Test di ingresso

Rispondi alle domande:

1. Qual è la differenza tra `int* p` e `int& r`?
2. Cosa stampa `int x = 5; int& r = x; r = 7; std::cout << x;`?
3. Dopo `int* p = new int[10];`, quale `delete` serve?
4. In `const int* p` e in `int* const p`, quale puntatore non si può riassegnare?
5. Quanto vale `unsigned int u = 0; u - 1`?

Se alla domanda 1 o 4 non sei sicuro, il modulo 3 e il modulo 4 lo chiariscono.

<details>
<summary>Soluzione</summary>

1. `p` è un puntatore: contiene un indirizzo, può essere `nullptr`, può essere riassegnato e si usa con `*p`. `r` è un *alias*: è un altro nome dello stesso oggetto, deve essere inizializzato e non può essere nullo né riassegnato.
2. Stampa `7`: `r` è un altro nome di `x`, quindi `r = 7` cambia `x`.
3. `delete[] p;`: per gli array serve la forma con le parentesi quadre.
4. `int* const p`: il *puntatore* è costante e non si riassegna; il dato puntato invece si può modificare. In `const int* p` è il contrario: il dato è costante, il puntatore no.
5. `4294967295`: gli interi senza segno fanno aritmetica modulo 2³² (qui `0 - 1` diventa il valore massimo).

</details>
