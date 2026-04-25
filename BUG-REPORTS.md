# Bug Reports for Crew Management

## ISSUE-01: Missing validation for minHelpers/maxHelpers in shift creation
**ID:** BUG-001
**Ist:** Beim Erstellen einer Schicht über POST /api/shifts wird nicht geprüft, ob die Anzahl der zugewiesenen Personen (responsible + helperIds) zwischen minHelpers und maxHelpers liegt.
**Soll:** Die API soll 400 Bad Request zurückgeben, wenn die Gesamtzahl der Zuweisungen kleiner als minHelpers oder größer als maxHelpers ist.
**Reproduktion:**
1. Als Admin eine Schicht erstellen mit minHelpers=2, maxHelpers=3
2. Nur eine Person zuweisen (z.B. responsibleUserId gesetzt, helperIds leer)
3. Erwartet: 400 Fehler, tatsächlich: Schicht wird erstellt (nur 1 Zuweisung)
**Schwere:** HOCH

## ISSUE-02: Auto-Assign ignores maxHelpers
**ID:** BUG-002
**Ist:** Der PATCH /api/shifts Endpunkt (auto-assign) weist Freiwillige ausschließlich anhand von minHelpers zu, ohne maxHelpers zu berücksichtigen. Dadurch können mehr Zuweisungen als erlaubt erfolgen.
**Soll:** Der Auto-Assign-Prozess soll sicherstellen, dass die Gesamtzahl der Zuweisungen (bestehend + neu) nicht maxHelpers überschreitet.
**Reproduktion:**
1. Eine Schicht mit minHelpers=1, maxHelpers=2 existiert bereits mit 1 Zuweisung.
2. Es stehen 2 verfügbare Freiwillige zur Verfügung.
3. PATCH /api/shifts mit eventId auslösen.
4. Erwartet: höchstens 1 weitere Zuweisung (insgesamt 2), tatsächlich: beide Freiwilligen werden zugewiesen (insgesamt 3).
**Schwere:** MITTEL

## ISSUE-03: Overlap error uses 400 instead of 409
**ID:** BUG-003
**Ist:** Bei Überlappung wird ein HTTP 400 Fehler zurückgegeben.
**Soll:** Für Ressourcenkonflikte sollte HTTP 409 Conflict verwendet werden, um die Semantik besser zu treffen.
**Reproduktion:**
1. Eine Schicht für einen Benutzer von 10:00-12:00 erstellen.
2. Versuchen, eine zweite überlappende Schicht für denselben Benutzer zu erstellen.
3. Erwartet: 409 Conflict, tatsächlich: 400 Bad Request.
**Schwere:** NIEDRIG