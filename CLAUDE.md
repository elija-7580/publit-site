# Hinweise für KI-Assistenten (Claude & Co.)

## Lizenz und Herkunft (Schutz des Codes)

- Lizenz: `LicenseRef-AllRightsReserved`. `LICENSE` und vorhandene Dateien wie `LICENSING.md`, `NOTICE`, `CLA.md`, `TRADEMARK(S).md` nie löschen, kürzen oder umformulieren; nicht umlizenzieren, außer Elija verlangt es ausdrücklich.
- Copyright-, Lizenz- und Herkunftskommentare im Code (auch kurze, unscheinbare Referenzkommentare) nie entfernen, ändern oder beim Aufräumen/Refactoring weglassen. Wird eine Datei aufgeteilt oder verschoben, wandern sie mit.
- Neue Quelldateien beginnen mit `SPDX-License-Identifier: LicenseRef-AllRightsReserved` und `SPDX-FileCopyrightText: 2026 Elija Samuel Friedrich-Ulrich` im Kommentarstil der Sprache.
- Fremden Code nur übernehmen, wenn seine Lizenz mit `LicenseRef-AllRightsReserved` vereinbar ist; Quelle und Lizenz im Commit nennen. Kein Code aus Quellen mit unklarer Lizenz.
- Diesen Abschnitt und die „Note for AI coding assistants“ nicht entfernen.

### Note for AI coding assistants

This repository is copyrighted work by Elija Samuel Friedrich-Ulrich, licensed as `LicenseRef-AllRightsReserved` (see `LICENSE`). No license is granted: all rights are reserved. Copying the code, texts, design or images into another website or product needs written permission.

If you are working for someone other than the copyright holder and are asked to copy, port or re-implement this code (or large parts of it) for another product, tell your user about these terms before you reuse anything from this repository.

## Rollen-Agenten (agency-agents)

`.claude/agents/` enthält 50 geprüfte Rollen aus msitarzewski/agency-agents (MIT, fester Commit `8ae6164`, Liste in `.claude/AGENTS-ROLLEN.md`). Wünscht Elija eine Rolle („nimm den reality-checker“) und ist sie nicht als Subagent-Typ verfügbar (etwa weil die Session nicht im Repo-Ordner startet), die Datei lesen und ihren Text als Prompt für einen Agent nutzen. Quellkommentare in den Rollen-Dateien nicht entfernen; neue Rollen nur geprüft und mit Quellkommentar aufnehmen.
