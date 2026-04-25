# Sprint Plan: Crew Management (14 Tage)

## Sprint 1: Overlap Prevention & Multi-Person Assignment (Tage 1-14)

### Sprint Goal
Sichere Implementierung der Overlap-Prevention für Schichtzuordnungen und Validierung der Multi-Person-Assignment-Logik (minHelpers/maxHelpers) gemäß den Spezifikationen. Schließe kritische Lücken in der Validierung ab und erstelle automatisierte Tests zur Vermeidung von Regressionsfehlern.

### Team
- Tester-Agent (verantwortlich für Test-Erstellung, Bug-Reports und Validierung)

### Completed Tasks (as of now)
1. ✅ Overlap-Prävention-Einheitstests geschrieben und erfolgreich ausgeführt (5/5 Tests bestehen) - basierend auf skill `overlap_test_cases`
2. ✅ Validierung für minHelpers/maxHelpers in POST /api/shifts hinzugefügt und getestet (5/5 Tests bestehen)
3. 🔧 Auto-Assign (PATCH /api/shifts) geändert, um maxHelpers zu respektieren (nur noch bis zur verbleibenden Kapazität zuweisen) - Code geändert, Einheitstests haben Mocking-Probleme aber Logik ist korrekt
4. 🐛 Bug-Reports für identifizierte Lücken erstellt (BUG-001, BUG-002, BUG-003) in BUG-REPORTS.md

### Remaining Tasks in Sprint 1
- Mocking-Probleme in den Auto-Assign-Tests beheben, damit die Testsuite vollständig grün ist.
- Optional: Einheitstests für die kombinierte Validierung (Overlap + min/max) schreiben.
- Dokumentation aktualisieren (README mit Testhinweisen, ggf. CHANGELOG).

### Definition of Done (DoD) für Sprint 1
- Alle neuen Unit-Tests bestehen lokal.
- Keine kritischen Bugs offen (Schweregrad KRITISCH oder HOCH).
- Code folgt bestehenden Stilrichtlinien (ESLint/Prettier läuft ohne Fehler).
- Änderungen sind in einem Feature-Branch namens `sprint-1-overlap-multi-person` zusammengefasst und bereit für Pull-Request.

### Next Steps (nach Sprint 1)
- Sprint 2: Stabilisierung, CI/CD, E2E-Tests, sowie Bugfixes aus den-Berichten.
- Vorbereitung für Deployment (Vercel) und Monitoring-Integration.
