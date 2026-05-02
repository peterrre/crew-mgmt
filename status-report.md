# Crew Management - Status Report

## Repository Overview
- **Repo:** https://github.com/peterrre/crew-mgmt.git
- **Primary Tech Stack:** Next.js (React), Prisma ORM, PostgreSQL, NextAuth, Radix UI, Framer Motion, `@axe-core/playwright`
- **Key Domains:** Shift management, volunteer assignments, event planning, availability tracking

## Codebase Analysis Highlights

### Prisma Schema (`prisma/schema.prisma`)
- Models: User, Role, Shift, Event, EventCrew, ShiftAssignment, AvailabilitySlot, ShiftRequest, VolunteerApplication, etc.
- Proper use of enums (`Role`, `ShiftAssignmentRole`, `RequestType`, `RequestStatus`, `ApplicationStatus`).
- Unique constraints prevent duplicate assignments (`@@unique([shiftId, userId])`) and duplicate volunteer applications (`@@unique([eventId, userId])`).
- Deprecated `helperId` field on Shift retained for backward compatibility.

### Shift API (`app/api/shifts/route.ts`)
- **GET**: Returns shifts with optional availability slots for volunteers; role-based visibility (ADMIN sees all, others see own).
- **POST**: Creates a shift with validation:
  - Auth: ADMIN only.
  - Required fields: title, start, end, eventId.
  - Event existence check.
  - Responsible user selection (prefers `responsibleUserId`, falls back to `helperId`).
  - Validates all assigned users belong to the event crew.
  - **Overlap Prevention:** Calls `checkForOverlappingShifts` for each assigned user (responsible + helpers).
  - **Validation:** Total assignments (responsible + helpers) respects `minHelpers`/`maxHelpers`.
  - Uses a Prisma transaction to create the shift and all ShiftAssignments (RESPONSIBLE + HELPERS).
- **PATCH**: Auto-assigns volunteers to shifts that need more helpers based on availability slots.
  - Considers both `minHelpers` and `maxHelpers` (filters shifts by `assignments.length < maxHelpers` and assigns only up to `remainingCapacity`).
  - Assigns first volunteer as RESPONSIBLE if shift has no assignments, else HELPER.
  - Updates legacy `helperId` for backward compatibility when assigning a RESPONSIBLE.

### Overlap Prevention Logic (`checkForOverlappingShifts`)
- Queries existing shifts for the same event where the user has an assignment and the time ranges overlap.
- Overlap detection uses three OR conditions covering all overlap cases (including containment).
- Accepts an optional `excludeShiftId` for updates.

### Volunteer Applications (`app/api/volunteer-applications/route.ts`)
- Standard CRUD with role-based access (VOLUNTEER can create, ADMIN can review).
- Unique constraint prevents duplicate applications per user/event.

### Tests
- **Unit Tests (Jest):** `__tests__/` directory with 5 test files:
  - `overlap.test.ts` – Overlap prevention logic
  - `shiftCreation.test.ts` – Shift creation flow
  - `shiftCreationValidation.test.ts` – minHelpers/maxHelpers validation
  - `autoAssign.test.ts` – Auto-assign logic including maxHelpers respect
  - `AssignmentPanel.test.tsx` – Frontend component tests
- **E2E Tests (Playwright):** `tests/e2e/` directory with 3 test files:
  - `volunteer-application.test.ts` – Volunteer application flow
  - `axe.homepage.test.ts` – Accessibility audit via Axe-Core
  - `visual-regression.test.ts` – Visual regression with snapshots
- **CI/CD:** GitHub Actions (`.github/workflows/ci.yml`) runs on `push`/`pull_request` to `master` with PostgreSQL service container, build, and Playwright tests.

### Design System
- Tokens defined in `styles/tokens.ts` (Apple-inspired palette, e.g. `blue: '#0062CC'`).
- Consumed via `tailwind.config.ts` (no `src/` prefix).
- Radix UI components provide accessible primitives (dialogs, tooltips, dropdowns, etc.).
- Framer Motion used for micro-interactions and animations.

---

## Identified Issues & Risks

| ID | Area | Description | Severity | Status |
|----|------|-------------|----------|--------|
| BUG-001 | Shift Creation Validation | Missing validation that total assignments respects `minHelpers`/`maxHelpers`. | HIGH | ✅ Behoben – Validierung in POST /api/shifts existiert; Tests in `shiftCreationValidation.test.ts` |
| BUG-002 | Auto-Assign MaxHelpers | Auto-assign ignored `maxHelpers` and could over-assign. | MEDIUM | ✅ Behoben – PATCH filtert nach `maxHelpers` und respektiert `remainingCapacity`; Tests in `autoAssign.test.ts` |
| BUG-003 | Overlap Error Code | Overlap error returns 400 instead of semantically correct 409 Conflict. | LOW | 🔴 Offen – Code gibt weiterhin 400 zurück; Änderung zu 409 empfohlen |
| ISSUE-04 | Backward Compatibility | `helperId` is updated only when assigning a RESPONSIBLE volunteer via auto-assign; manual shift creation respects it but may drift if assignments are modified directly. | LOW | Offen |
| ISSUE-05 | Availability Slot Usage | Auto-assign checks if shift fits entirely within a volunteer's availability slot. This is correct but could be made more flexible (e.g., allow partial overlap if volunteer can cover part). | LOW | Offen |

---

## Test Suite Status
- **Jest** konfiguriert in `package.json` (`"test": "jest"`), verwendet `ts-jest`.
- **5 Unit-Test-Dateien** in `__tests__/` vorhanden und laufen lokal.
- **Playwright E2E Tests** vorhanden in `tests/e2e/` (3 Testdateien).
- **CI läuft** auf GitHub Actions bei jedem `push` und `pull_request` zu `master`.
- Build, Lint und E2E-Tests sind in der CI Pipeline integriert.

---

## Recommendations
1. **Fix BUG-003** – Standardisiere Overlap-Fehler auf HTTP 409 Conflict für bessere API-Semantik.
2. **Erweitere E2E-Abdeckung** – Füge E2E-Tests für Admin-Shift-Erstellung und Auto-Assign-Flow hinzu.
3. **Deprecate `helperId`** – Plane schrittweise Migration weg vom Legacy-Feld nach vollständiger `ShiftAssignment`-Nutzung.
4. **Performance Monitoring** – Integriere Lighthouse CI oder ähnliches für automatisierte Performance-Regression-Detection.
5. **API-Dokumentation** – Erwäge OpenAPI/Swagger-Doku für die wachsende API-Oberfläche.
6. **Dark Mode** – Vervollständige Dark-Mode-Implementierung und füge entsprechende visuelle Regressionstests hinzu.

---

## Next Steps
- **Sprint 4: Benachrichtigungen & Kommunikation**
  - E-Mail-Benachrichtigungen bei Schicht-Zuweisungen, -Änderungen und Bewerbungsstatus
  - In-App-Notification-Bell mit Badge
  - Datenmodelle für Notification und ChatMessage
  - API-Endpunkte und optional WebSocket für Echtzeit-Updates
  - Frontend-Komponenten (Benachrichtigungsliste, Kommentarfeld)
  - Unit-, Integrations- und E2E-Tests für neue Features
