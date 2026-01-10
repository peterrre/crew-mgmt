# Plan zur Verbesserung der Schedule Editor Ansicht

## Aktuelle Probleme
- Die Kalenderansicht zeigt alle Events (Shifts und Availability Slots) zusammen, was unübersichtlich ist.
- Freie Zeiten von Freiwilligen (Availability Slots) sind schwer zu identifizieren.
- Nicht zugewiesene Aufgaben (Shifts ohne Helper) sind nicht prominent hervorgehoben.

## Vorgeschlagene Verbesserungen

### 1. Filter-Funktionalität hinzufügen
- **Alle anzeigen**: Aktuelle Ansicht
- **Nur zugewiesene Shifts**: Zeigt nur Shifts mit Helper
- **Nur nicht zugewiesene Shifts**: Zeigt nur Shifts ohne Helper (rot markiert)
- **Nur Availability Slots**: Zeigt nur freie Zeiten von Freiwilligen (grün gestrichelt)
- **Matching-Ansicht**: Zeigt Availability Slots und überlappende nicht zugewiesene Shifts

### 2. Verbesserte Visualisierung
- Bessere Farbkodierung und Opazität für verschiedene Event-Typen
- Hervorhebung von freien Slots, die nicht zugewiesen sind
- Zusätzliche Legende mit Zählern (z.B. "5 nicht zugewiesene Shifts")

### 3. Agenda-Ansicht optimieren
- Gruppierung nach Typ (Shifts vs. Availability)
- Schnellfilter in der Agenda-Ansicht

## Implementierungsplan
1. State für Filter in ScheduleEditor hinzufügen
2. Filter-Buttons/Tabs in der UI hinzufügen
3. Event-Filterung in BigCalendar implementieren
4. Verbesserte Legende mit Zählern
5. Testing und Anpassungen

## Mermaid Workflow Diagramm
```mermaid
graph TD
    A[Benutzer öffnet Schedule Editor] --> B[Events laden: Shifts + Availability]
    B --> C[Filter anwenden?]
    C -->|Nein| D[Alle Events anzeigen]
    C -->|Ja| E{Filter-Typ}
    E -->|Zugewiesene| F[Filter: helperId != null]
    E -->|Nicht zugewiesene| G[Filter: helperId == null]
    E -->|Availability| H[Filter: isAvailability == true]
    E -->|Matching| I[Filter: Availability + überlappende unassigned Shifts]
    F --> J[Events in BigCalendar rendern]
    G --> J
    H --> J
    I --> J
    D --> J
    J --> K[Benutzer interagiert: Select, Edit, etc.]