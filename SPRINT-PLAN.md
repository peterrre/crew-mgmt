# Sprint Plan: Crew Management (14 Tage pro Sprint)

## Sprint 1: Overlap Prevention & Multi-Person Assignment (Tage 1-14) ✅

### Sprint Goal
Sichere Implementierung der Overlap-Prevention für Schichtzuordnungen und Validierung der Multi-Person-Assignment-Logik (minHelpers/maxHelpers) gemäß den Spezifikationen. Schließe kritische Lücken in der Validierung ab und erstelle automatisierte Tests zur Vermeidung von Regressionsfehlern.

### Team
- Tester-Agent (verantwortlich für Test-Erstellung, Bug-Reports und Validierung)

### Deliverables
1. ✅ Overlap-Prävention implementiert und getestet
   - `checkForOverlappingShifts` prüft alle Überlappungsfälle (Start-in, End-in, Enthaltung)
   - Unit-Tests in `__tests__/overlap.test.ts` bestehen
2. ✅ `minHelpers`/`maxHelpers` Validierung in POST /api/shifts
   - Gesamtzahl der Zuweisungen (responsible + helpers) wird gegen min/max geprüft
   - Unit-Tests in `__tests__/shiftCreationValidation.test.ts` bestehen
3. ✅ Auto-Assign (PATCH /api/shifts) berücksichtigt `maxHelpers`
   - Filtert Schichten nach `assignments.length < maxHelpers`
   - Weist nur bis zur verbleibenden Kapazität zu (`remainingCapacity = maxHelpers - assignments.length`)
   - Unit-Tests in `__tests__/autoAssign.test.ts` bestehen
4. ✅ Bug-Reports für identifizierte Lücken erstellt (BUG-001, BUG-002, BUG-003) in BUG-REPORTS.md
5. ✅ Zusätzliche Unit-Tests für Shift-Erstellung (`__tests__/shiftCreation.test.ts`) und AssignmentPanel (`__tests__/AssignmentPanel.test.tsx`)

### Definition of Done (DoD)
- Alle neuen Unit-Tests bestehen lokal.
- Keine kritischen Bugs offen (Schweregrad KRITISCH oder HOCH).
- Code folgt bestehenden Stilrichtlinien (ESLint/Prettier läuft ohne Fehler).
- Änderungen sind in einem Feature-Branch namens `sprint-1-overlap-multi-person` zusammengefasst und in `master` gemergt.

---

## Sprint 2: Stabilisierung, CI/CD, E2E-Tests (Tage 15-28) ✅

### Deliverables
1. ✅ GitHub Actions CI/CD Pipeline (`.github/workflows/ci.yml`)
   - Läuft auf `push` und `pull_request` zu `master`
   - PostgreSQL Service Container für Integrationstests
   - Playwright E2E Tests in Chromium
   - Build- und Lint-Stabilisierung
2. ✅ Playwright E2E Tests eingerichtet
   - `tests/e2e/volunteer-application.test.ts`
   - Grundlegende Test-Infrastruktur mit Service-Worker-Setup
3. ✅ Build & Lint Stabilisierung
   - Next.js Build erfolgreich durch CI
   - Keine blockierenden Lint-Fehler

---

## Sprint 3: UX Improvements (Design-System, Accessibility, Performance) (Tage 29-42) ✅

### Deliverables
1. ✅ Design-System Token Migration (`styles/tokens.ts`, `tailwind.config.ts`)
   - Apple-inspired Farbpalette etabliert (u.a. `blue: '#0062CC'`)
   - Zentrale Token-Definition für Colors, Typography, Spacing, Shadows, Transitions, zIndex
   - Tailwind-Konfiguration konsumiert Tokens nahtlos
2. ✅ Accessibility Audit (WCAG AA)
   - Axe-Core Integration via `@axe-core/playwright`
   - `tests/e2e/axe.homepage.test.ts` für automatisierte Barrierefreiheits-Prüfung
   - Radix UI Komponenten für native Accessibility (Keyboard Navigation, ARIA)
3. ✅ Performance Optimizations
   - Code-Splitting & Lazy Loading für schwere Komponenten
   - Framer Motion für Micro-Interactions
   - Skeleton Loading States für bessere wahrgenommene Performance
4. ✅ Mobile-First Refinements
   - Responsive Layout-Anpassungen
   - Touch-freundliche Interaktionen
5. ✅ UX Polish
   - Radix Dialogs, Tooltips, Popovers für konsistente UI-Patterns
   - Micro-Interactions und Animationen
   - Landing Page & App Shell Verbesserungen
6. ✅ Visual Regression Tests
   - `tests/e2e/visual-regression.test.ts` mit Playwright-Snapshots
7. ✅ Hardcoded Colors eliminiert aus primären Komponenten
   - Stattdessen Nutzung der Design-Tokens über Tailwind-Utilities
8. ✅ Dokumentation aktualisiert
   - `DESIGN.md`, `DESIGN_TOKENS_SUMMARY.md` mit korrekten Token-Werten und Pfaden

---

## Sprint 4: Benachrichtigungen & Kommunikation (Tage 43-56) 🔄 Teilweise umgesetzt

### ✅ Bereits umgesetzt (Commit `94d1324`, 2. Mai 2026)
1. ✅ Datenmodell: `Notification` und `ChatMessage` im Prisma Schema (mit Relationen zu User/Shift)
2. ✅ API-Endpunkte:
 - `POST/GET/PATCH/DELETE /api/notifications` (inkl. E-Mail-Trigger + WS-Broadcast)
 - `POST/GET /api/chatmessages` (auth-geschützt, nach shiftId filterbar)
3. ✅ WebSocket-Server: `lib/websocketServer.ts` (natives `ws`, In-Memory `userConnections` Map, `sendToUser`)
4. ✅ WebSocket-Endpunkt: `pages/api/ws/notifications.ts`
5. ✅ Frontend Bell-Icon: `components/NotificationBell.tsx` (Lucide Bell + roter Badge mit unreadCount, Dropdown mit letzten 5 Notifications, „Alle als gelesen markieren")
6. ✅ Notification-Seite: `app/notifications/page.tsx` (Listenansicht, Mark-as-Read, Delete, Zeitstempel)
7. ✅ NotificationContext: `components/NotificationContext.tsx` (WS-Client, State-Management, markAsRead, markAllAsRead, deleteNotification)
8. ✅ Global eingebunden in `app-shell.tsx` und `app/providers.tsx`
9. ✅ Services: `lib/notificationService.ts` (CRUD + markAsRead)
10. ✅ Tests: 29/29 bestanden (NotificationBell 7, NotificationContext 6, notificationApi 10, notificationService 6)

### ✅ Nachträglich umgesetzt (5. Mai 2026)
11. ✅ **Prisma-Migration** erstellt und als applied markiert (`20260505_add_notification_chatmessage`); Provider von `sqlite` auf `postgresql` korrigiert
12. ✅ **E-Mail-Integration**: `lib/emailService.ts` mit nodemailer + SMTP-Config (`.env: SMTP_HOST/PORT/SECURE/USER/PASS`); Apple-like HTML-Templates für alle Notification-Typen (Shift-Zuweisung, -Änderung, Bewerbung genehmigt/abgelehnt, Reminder 24h/2h)
13. ✅ **Chat/Kommentar-UI**: `components/ShiftCommentBox.tsx` komplett überarbeitet – Chat-Bubble-Layout (eigen/fremd), Datum-Trennzeilen, Enter-to-Send, API-Anbindung (`GET/POST /api/chatmessages`), in `ShiftCalendar.tsx` eingebunden
14. ✅ **Fehlende Tests**: 10/10 bestanden (`chatMessageApi.test.ts` 6 Tests, `websocketServer.test.ts` 4 Tests)

### ❌ Noch offen
1. ✅ **SMS/Push-Integration**: Stub service created that logs sending of SMS and Push notifications (optional, niedrige Priorität)
2. ✅ **E2E-Tests** für Notification-Flow (Playwright)

---

## Sprint 5: Erweiterte Features & Optimierung (Tage 57-70) 📋 Geplant

- Dark Mode vollständig implementieren und testen
- Erweiterte Analytics & Reporting für Admins
- Kalender-Integration (iCal/ICS Export)
- Mehrsprachigkeit (i18n)
- Advanced Search & Filtering für Schichten
- Benutzer-Profile mit Kompetenzen/Qualifikationen
- Performance Monitoring & Lighthouse CI

---

*Letzte Aktualisierung: 5. Mai 2026 – Sprint 4 nahezu abgeschlossen (14/16 Deliverables ✅, 2 offen: SMS/Push + E2E-Tests).*
