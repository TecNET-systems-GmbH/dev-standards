# Design-Notiz: Coordination Hub (projektübergreifendes Wissen, minimalinvasiv)

Status: Entwurf (2026-07-29). Noch nichts gebaut. Baut auf dem bestehenden Harness (`@v1`, PR #4) auf:
`templates/scripts/harness-check.mjs` + `.harness/status.json` + SessionStart-Hook (`templates/.claude/settings.json`),
Subagenten (`templates/.claude/agents/{cleanup,structure-review}.md`), `/harness-init`, `/harness-audit`.

## 1. Problem

3 Entwickler, isolierte Projekte, GitHub-Org. Beobachtet:
- Ein gemeinsamer Harness ist sinnvoll — aber die **Integration ist reibungsvoll**, teils hat Claude Code schon einen ad-hoc-Harness angelegt.
- Beim Arbeiten mit Claude **weiß ein Agent nichts von den anderen Projekten** → gute, konsistente Struktur über die Org hinweg ist langfristig schwer.

Das sind **zwei getrennte Bedürfnisse** (unterschiedliche Mechanismen):
1. **Verteilung & Reconciliation** des Harness (Integration ohne Clobbering).
2. **Projektübergreifendes Wissen & Koordination** (gemeinsame Wissensbasis, Überblick, Planung).

## 2. Prinzipien (Fortschreibung des Harness-Northstar)

- **Empfehlung statt Zwang.** Nichts blockiert je einen Build; alles verwerfbar.
- **Asymmetrie = Minimalinvasivität.** Das Projekt tut fast nichts (committet ein winziges Profil, *liest* Empfehlungen). Der Hub trägt die Last (liest die Org read-only, publiziert nur Rat). Der Hub **schreibt nie** automatisch in Projekt-Repos.
- **Deterministischer Boden, Agent nur fürs Urteil.** Die Wissensbasis sind committete, strukturierte Artefakte (Profile, Digest), die auch ein Mensch liest; Agenten *aktualisieren* sie.
- **Claude = Beschleuniger, nicht tragende Wand.** Profile/Digest funktionieren auch ohne Agenten (nur statischer).
- **Token-/Lärm-Budget.** Koordinations-Agenten laufen selten & gebündelt (geplant/on-demand), nicht pro Session. Digest kurz.
- **Privacy.** Nur committete Metadaten, keine Code-Dumps quer durch die Org.

## 3. Architektur

### 3a. Pro Projekt — winziger Fußabdruck (nichts Neues zur Laufzeit)
- **`.harness/profile.json`** (committet): Stack, Konventionen, aktueller Fokus, letzte Entscheidungen (2–3 Zeilen). Vom Entwickler/Claude gepflegt; die einzige Sache, die ein Projekt „nach außen" gibt.
- **SessionStart-Hook** wie gehabt (`harness-check.mjs --hook`) — wird um einen zweiten Kanal erweitert (s. 3c).

### 3b. Hub — in `dev-standards`, neuer Bereich `coordination/`
- **Registry** der Org-Repos (Liste + optional Sichtbarkeit/Owner).
- **Profil-Aggregat + Digest** (committete Markdown/JSON-Artefakte): „wer baut gerade was, gemeinsame Muster, Divergenzen, Kandidaten fürs Teilen".
- **Cross-Cutting-Tickets** (advisory): z.B. „3 Projekte haben eigene Auth-Utils → gemeinsame extrahieren".
- **Hub-Agenten** (analog zu den Subagenten, eine Ebene höher): *analysis* (liest Projekte via GitHub-API) → *summary* (Digest) → *tickets*. Ausgabe = Issues/Markdown im Hub, **kein** Push in Projekte.

### 3c. Austausch (der „Sync")
- **Projekt → Hub (push):** nur das committete `profile.json`. Der Hub liest es per **GitHub-API** (leicht; kein Klonen).
- **Hub → Projekt (pull):** `harness-check.mjs --hook` holt zusätzlich **relevante Empfehlungen** aus dem Hub (Raw-Fetch, offline-tolerant → still bei Fehler) und hängt sie an `additionalContext` an → Claude **bietet an**, sie zu prüfen/anzuwenden. **Verwerfen** wird lokal vermerkt (z.B. in `.harness/status.json` unter `dismissed`), damit es nicht erneut nervt.

### 3d. Reconciliation (Bedürfnis 1 — sofortiger Hebel)
`/harness-init` wird **idempotent + merge-fähig**: einen bereits vorhandenen (ad-hoc) Harness **erkennen und angleichen** statt überschreiben (Hooks/Config/Agenten diffen, fehlende additiv ergänzen, abweichende melden statt still ersetzen). Unabhängig von 3a–c sofort nützlich, weil erst V2 den Harness nutzt.

## 4. Entscheidungen (festgelegt 2026-07-30 — Defaults bestätigt)

1. **Hub liest Projekte via GitHub-API auf committete Metadaten** (`profile.json`), NICHT klonen. Klonen nur, wenn ein späterer Agent echte Tiefe braucht.
2. **Hub-Agenten: on-demand zuerst** (z.B. `/hub-digest`), ein `cron`/Routine später, sobald der Nutzen belegt ist. Nie pro Session.
3. **Empfehlungen als committete Markdown im Hub** (deterministisch, diffbar, tokenfrei per Raw-Fetch) — GitHub-Issues erst in Phase 3 für echte, umsetzbare Tickets.
4. **Zugriff/Token:** Hub-Agenten brauchen Org-Read (Action/Routine mit Token). Der Projekt-Rückkanal bleibt tokenfrei, solange `dev-standards` (Raw) öffentlich lesbar ist — sonst dieselbe Token-Reibung wie beim verworfenen Packages-Pfad (siehe Northstar). **Vor Phase 2 klären.**

## 5. Phasen

- **Phase 0 — Reconciliation** (`/harness-init` detect-&-merge). ✅ ERLEDIGT (dev-standards #6): idempotent + merge-first, `status.json`-Uhr wird erhalten.
- **Phase 1 — Profil + Digest (zusammen, kein Producer ohne Consumer).** `.harness/profile.json`-Template + Wiring in `/harness-init` UND ein Hub-Digest-Agent, der aus den Profilen die Übersicht baut. Nicht das Profil allein shippen (wäre Producer ohne Consumer). Belegt den Cross-Projekt-Nutzen, bevor der Rückkanal (Phase 2) verdrahtet wird.
- **Phase 2 — Empfehlungs-Rückkanal.** `harness-check.mjs --hook` um den Hub-Fetch + `dismissed`-Vermerk erweitern.
- **Phase 3 — Cross-Cutting-Tickets.** Hub-Agent, der Divergenzen/Doppelarbeit in advisory Tickets gießt (knüpft an den offenen „Ticketsystem"-Block des Northstar an).

## 6. Risiken / Leitplanken

- **Nicht zur tragenden Wand werden:** Profile/Digest müssen ohne Agenten lesbar/nützlich bleiben.
- **Lärm:** Digest kurz + relevanzgefiltert; der Session-Rückkanal nur, was zum Projekt passt.
- **Staat vs. Templates:** org-*State* (Registry/Digest, lebt) diszipliniert in `coordination/` getrennt von den versionierten Templates/Configs halten. Wächst es, später in ein eigenes Repo abspaltbar (billige Migration).
- **N=3:** bewusst leichtgewichtig; keine Plattform bauen, die 30 Devs bräuchten.
