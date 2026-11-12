#!/usr/bin/env python3
"""Controlla gli esempi C++ del sito.

Ogni blocco ```cpp che contiene `int main` viene compilato con
-Wall -Wextra -fsanitize=address,undefined, poi eseguito.
Errore se: il compilatore fallisce, il programma esce con codice != 0,
oppure i sanitizer segnalano un problema.

I frammenti didattici (senza main, oppure marcati con ```cpp nocheck)
vengono saltati: spesso servono proprio a mostrare un errore del compilatore.

Uso:  python3 tools/check_examples.py
"""
import pathlib
import re
import subprocess
import sys
import tempfile

ROOT = pathlib.Path(__file__).resolve().parent.parent / "content"
FENCE = re.compile(r"^```[ \t]*(\S*)[ \t]*(\S*)[ \t]*\n(.*?)^```[ \t]*$", re.S | re.M)
FLAGS = ["-std=c++17", "-Wall", "-Wextra", "-g", "-fsanitize=address,undefined"]


def check_file(md: pathlib.Path) -> tuple[int, int]:
    checked = failed = 0
    text = md.read_text(encoding="utf-8")
    for n, m in enumerate(FENCE.finditer(text), 1):
        lang, flag, code = m.group(1), m.group(2), m.group(3)
        if lang != "cpp" or flag == "nocheck" or "int main" not in code:
            continue
        checked += 1
        with tempfile.TemporaryDirectory() as tmp:
            src = pathlib.Path(tmp) / "ex.cpp"
            exe = pathlib.Path(tmp) / "ex"
            src.write_text(code, encoding="utf-8")
            build = subprocess.run(["g++", *FLAGS, str(src), "-o", str(exe)],
                                   capture_output=True, text=True)
            if build.returncode != 0:
                failed += 1
                print(f"[ERRORE compilazione] {md.name}, blocco #{n}\n{build.stderr[:1500]}")
                continue
            warns = build.stderr.count("warning:")
            if warns:
                print(f"[warning] {md.name}, blocco #{n}: {warns} warning del compilatore")
            run = subprocess.run([str(exe)], cwd=tmp, capture_output=True, text=True, timeout=30)
            bad = run.returncode != 0 or "runtime error" in run.stderr or "AddressSanitizer" in run.stderr
            if bad:
                failed += 1
                print(f"[ERRORE esecuzione] {md.name}, blocco #{n} (exit {run.returncode})\n{run.stderr[:1500]}")
    return checked, failed


def main() -> int:
    total = failed = 0
    for md in sorted(ROOT.glob("*.md")):
        c, f = check_file(md)
        total += c
        failed += f
    print(f"{total} esempi controllati, {failed} con problemi.")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
