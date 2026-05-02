# Crew Management – Team Coordination

## Projekt
Festival-Schichtplaner mit starkem Fokus auf Overlap-Prevention, Multi-Person-Assignment und Rollen-Permissions.

## Bot-Namen
- @CrewMgmtSupervisorBot (Zentrale Koordination)
- @CrewMgmtArchitectBot (Architektur & technische Entscheidungen)
- @CrewMgmtBackendBot (Backend-Implementierung)
- @CrewMgmtFrontendBot (Frontend-Implementierung)
- @CrewMgmtTesterBot (Tests & Qualitätssicherung)

## Pipeline
Supervisor → Architect → Backend + Frontend (parallel) → Tester → Supervisor (Review & Release)

## Kommunikationsregeln (Telegram)
- Immer mit dem vollen @BotName ansprechen
- Supervisor ist der zentrale Koordinator
- Fertige Arbeit immer an den nächsten Bot + @CrewMgmtSupervisorBot melden
- Bei Fragen, Blockern oder Unsicherheiten direkt @CrewMgmtSupervisorBot
- Keine großen eigenständigen Änderungen ohne explizite Freigabe vom Supervisor
- Andere Bots antworten nur, wenn sie direkt erwähnt werden

## Wichtige Prinzipien
- Qualität > Geschwindigkeit
- Klare Handovers zwischen den Bots
- Transparenz im gesamten Team
- Overlap-Prevention immer berücksichtigen (zentrales Feature)
- Dokumentation ist Teil der Arbeit

## Eskalation
Alle kritischen Bugs, Blockaden oder wichtigen Entscheidungen → sofort an @CrewMgmtSupervisorBot

Diese Datei wird von allen Agents automatisch gelesen.
Halte sie aktuell!