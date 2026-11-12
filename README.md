# OOP in C++ · percorso di studio

Sito statico di studio per **Programmazione Orientata agli Oggetti in C++**: teoria essenziale, esercizi con soluzioni verificate, progresso giornaliero.

🌐 **Online:** https://nadaloner.github.io/oop-study/

## Cosa c'è

- **9 moduli**: metodo, classi, risorse e strutture dinamiche, riferimenti, const, cast tra primitivi, cast tra oggetti, template e puzzle d'esame, esame integrato.
- **63 esercizi** con checklist e soluzioni in riquadri (si aprono solo quando servono).
- **Dashboard**: esercizi completati, giorni di fila, minuti di studio, grafico degli ultimi 14 giorni, calendario delle ultime 12 settimane, registro giornaliero con note.
- **Tutti gli esempi di codice sono compilati ed eseguiti** con `-fsanitize=address,undefined` (vedi sotto).

## Struttura

```
index.html          shell della pagina
assets/app.js       logica: routing, render, progresso
assets/style.css    tema chiaro/scuro
content/plan.json   elenco dei moduli (ordine, titolo, ore stimate)
content/*.md        teoria, checklist ed esercizi di ogni modulo
tools/check_examples.py   compila ed esegue gli esempi C++ dei moduli
```

## Come si scrive un esercizio

Nei file `content/*.md`:

```markdown
- [ ] ex:classe-1 · Titolo breve           <!-- checklist: collega la spunta al progresso -->

#### ex:classe-1 · Titolo breve             <!-- intestazione dell'esercizio -->
Testo dell'esercizio.

<details>
<summary>Soluzione</summary>

```cpp
int main() { /* ... */ }
```

</details>
```

Regole:

- l'`id` (es. `classe-1`) deve essere unico e comparire sia nella checklist sia nell'intestazione;
- un blocco ```` ```cpp ```` con `int main` viene **compilato ed eseguito** dal controllo;
- per un frammento che non deve compilare (es. un errore dimostrativo), usa ```` ```cpp nocheck ````.

## Controllo degli esempi

```bash
python3 tools/check_examples.py
```

Compila ogni esempio con `g++ -std=c++17 -Wall -Wextra -fsanitize=address,undefined` ed esegue il programma. Fallisce se il codice non compila, se esce con errore o se i sanitizer segnalano un problema.

## Progresso

Il progresso è salvato nel **browser** (localStorage): le spunte, i minuti e le note restano dove li hai fatti. Per portarlo su un altro dispositivo: **Esporta** nella barra in alto, poi **Importa** sull'altro.

## Anteprima in locale

```bash
python3 -m http.server 8000
# poi apri http://localhost:8000
```

Il sito non ha bisogno di build: è HTML, CSS e JavaScript statici. Le librerie (`marked`, `highlight.js`) vengono caricate da CDN.

## Pubblicazione

GitHub Pages serve direttamente la radice del branch `main`. Il file `.nojekyll` evita che Jekyll elabori il sito.
