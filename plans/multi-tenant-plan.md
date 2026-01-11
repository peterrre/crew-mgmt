# Multi-Tenant Event Crew Manager Plan

## Übersicht
Implementierung eines Multi-Tenant-Systems, bei dem Admins dedizierte Event Crew Manager für spezifische Events (z.B. Festivals, Konzerte) erstellen können. Jeder Tenant (Event) hat isolierte User, Shifts und Daten.

## Aktuelle Analyse
- Events existieren bereits, aber Shifts haben eventId ohne Relation
- User sind global, keine Tenant-Assoziation
- APIs filtern nicht nach Events

## Architektur-Entscheidungen
- **Tenant-Modell**: Event als Tenant
- **Isolation-Level**: Shared Database mit tenant_id Feldern in allen Tabellen
- **User-Sharing**: User können in mehreren Tenants sein (z.B. Volunteer für mehrere Events)
- **Admin-Rolle**: Globale Admins erstellen Tenants, Tenant-Admins verwalten ihr Event

## Datenmodell-Änderungen
```prisma
model Event {
  id        String   @id @default(cuid())
  name      String
  startDate DateTime
  endDate   DateTime
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  shifts    Shift[]
  users     UserEvent[]
}

model UserEvent {
  id      String @id @default(cuid())
  userId  String
  eventId String
  role    Role  @default(VOLUNTEER) // Tenant-spezifische Rolle
  user    User  @relation(fields: [userId], references: [id])
  event   Event @relation(fields: [eventId], references: [id])
  @@unique([userId, eventId])
}

model Shift {
  id        String   @id @default(cuid())
  title     String
  start     DateTime
  end       DateTime
  eventId   String
  helperId  String?
  helper    User?    @relation(fields: [helperId], references: [id], onDelete: SetNull)
  event     Event    @relation(fields: [eventId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## Implementierungsplan
1. Schema aktualisieren mit Tenant-Relationen
2. Migration erstellen und anwenden
3. Auth-Middleware für Tenant-Kontext
4. APIs mit Tenant-Filterung aktualisieren
5. UI für Tenant-Auswahl und -Management
6. Seed-Daten für Test-Tenants

## Sicherheitsüberlegungen
- Tenant-Isolation: Queries immer mit eventId filtern
- Cross-Tenant-Zugriff verhindern
- Audit-Logs für Tenant-Aktionen

## UI/UX-Änderungen
- Tenant-Auswahl bei Login oder Dashboard
- Tenant-spezifische Dashboards
- Admin-UI für Tenant-Erstellung