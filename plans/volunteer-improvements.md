# Volunteer Handling Improvements

## Aktuelle Situation
- Verfügbarkeit: Einfacher String-Array (z.B. ["Weekends", "Evenings"])
- Zuweisung: Manuell durch Admins
- Keine Möglichkeit für Volunteers, Änderungen anzufordern

## Geplante Verbesserungen

### 1. Strukturierte Verfügbarkeitsverwaltung
- **Datenmodell**: Verfügbarkeit als Zeitbereiche (start, end, recurrence)
- **UI**: Kalender-basierte Auswahl mit wiederkehrenden Mustern
- **Beispiel**: Volunteer kann "Jeden Freitag 18:00-22:00" oder "10.07.2024 10:00-16:00" angeben

### 2. Automatische Shift-Zuweisung
- **Algorithmus**: Matching von Shift-Zeiten mit Volunteer-Verfügbarkeit
- **Priorisierung**: Basierend auf Erfahrung, Präferenzen, vorherige Zuweisungen
- **Benachrichtigungen**: Email/SMS bei Zuweisung

### 3. Shift-Change-Request-System
- **Funktionen**:
  - Volunteer kann Änderung anfordern (Tausch, Absage)
  - Admin genehmigt/ablehnt
  - Automatische Neu-Zuweisung bei Absagen
- **Workflow**: Request → Review → Approval → Update

### 4. Enhanced Volunteer Dashboard
- **Features**:
  - Verfügbarkeit einfach setzen
  - Zugewiesene Shifts anzeigen
  - Change-Requests verwalten
  - Verfügbarkeit vs. Zuweisung vergleichen

## Technische Implementierung
- **Schema-Änderungen**: Neue Tabelle für AvailabilitySlots, ShiftRequests
- **APIs**: Neue Endpoints für automatische Zuweisung, Requests
- **UI-Komponenten**: Kalender für Verfügbarkeit, Request-Formulare

## Vorteile
- Bessere Volunteer-Erfahrung
- Reduzierte Admin-Arbeit
- Weniger No-Shows durch bessere Kommunikation
- Automatisierte Prozesse für Skalierbarkeit