# Crew Management - Status Report

## Repository Overview
- **Repo:** https://github.com/peterrre/crew-mgmt.git
- **Primary Tech Stack:** Next.js (React), Prisma ORM, PostgreSQL, NextAuth
- **Key Domains:** Shift management, volunteer assignments, event planning, availability tracking

## Codebase Analysis Highlights

### Prisma Schema (`prisma/schema.prisma`)
- Models: User, Role, Shift, Event, EventCrew, ShiftAssignment, AvailabilitySlot, ShiftRequest, VolunteerApplication, etc.
- Proper use of enums (`Role`, `ShiftAssignmentRole`, `RequestType`, `RequestStatus`, `ApplicationStatus`).
- Unique constraints prevent duplicate assignments (`@@unique([shiftId, userId])`) and duplicate volunteer applications (`@@unique([eventId, userId])`).
- Deprecated `helperId` field on Shift retained for backward compatibility.

### Shift API (`app/api/shifts/route.ts`)
- **GET**: Returns shifts with optional availability slots for volunteers; role‑based visibility (ADMIN sees all, others see own).
- **POST**: Creates a shift with validation:
  - Auth: ADMIN only.
  - Required fields: title, start, end, eventId.
  - Event existence check.
  - Responsible user selection (prefers `responsibleUserId`, falls back to `helperId`).
  - Validates all assigned users belong to the event crew.
  - **Overlap Prevention:** Calls `checkForOverlappingShifts` for each assigned user (responsible + helpers).
  - Uses a Prisma transaction to create the shift and all ShiftAssignments (RESPONSIBLE + HELPERS).
  - **Missing:** Validation that total assignments (1 responsible + helpers) respects `minHelpers`/`maxHelpers`.
- **PATCH**: Auto‑assigns volunteers to shifts that need more helpers based on availability slots.
  - Considers `minHelpers` but not `maxHelpers` (could over‑assign).
  - Assigns first volunteer as RESPONSIBLE if shift has no assignments, else HELPER.
  - Updates legacy `helperId` for backward compatibility when assigning a RESPONSIBLE.

### Overlap Prevention Logic (`checkForOverlappingShifts`)
- Queries existing shifts for the same event where the user has an assignment and the time ranges overlap.
- Overlap detection uses three OR conditions:
  1. New shift starts during existing shift (`start ≤ newStart < end`).
  2. New shift ends during existing shift (`start < newEnd ≤ end`).
  3. New shift completely contains existing shift (`newStart ≤ start && newEnd ≥ end`).
- Together these cover all overlap cases (including existing containing new, which is symmetric to condition 3).
- Accepts an optional `excludeShiftId` for updates (not used in creation but present).

### Volunteer Applications (`app/api/volunteer-applications/route.ts` – reviewed briefly)
- Standard CRUD with role‑based access (VOLUNTEER can create, ADMIN can review).
- Unique constraint prevents duplicate applications per user/event.

## Identified Issues & Risks

| ID | Area | Description | Severity |
|----|------|-------------|----------|
| ISSUE-01 | Shift Creation Validation | No validation that total assignments (responsible + helpers) is between `minHelpers` and `maxHelpers`. Could create shifts with too few or too many helpers. | HIGH |
| ISSUE-02 | Auto‑Assign MaxHelpers | PATCH `/api/shifts` auto‑assigns based only on `minHelpers`; may exceed `maxHelpers`. | MEDIUM |
| ISSUE-03 | Overlap Test Coverage | Overlap logic appears correct but lacks automated tests for edge cases (exact match, partial overlap, containment, adjacent shifts, race condition). | HIGH |
| ISSUE-04 | Backward Compatibility | `helperId` is updated only when assigning a RESPONSIBLE volunteer via auto‑assign; manual shift creation respects it but may drift if assignments are modified directly. | LOW |
| ISSUE-05 | Availability Slot Usage | Auto‑assign checks if shift fits entirely within a volunteer’s availability slot (slot.start ≤ shift.start && shift.end ≤ slot.end). This is correct but could be made more flexible (e.g., allow partial overlap if volunteer can cover part). | LOW |
| ISSUE-06 | Error Handling | Overlap error returns 400 with a message; could use 409 Conflict for better semantic clarity. | LOW |

## Test Suite Status
- No visible test files in the repository (no `__tests__`, `*.test.ts`, or `jest.config`).
- The `overlap_test_cases` skill provides a ready‑to‑use Jest test template for overlap prevention.
- Need to add unit tests for shift creation, assignment validation, and auto‑assign logic.
- Recommend adding integration/E2E tests using Playwright for critical flows (volunteer application, shift creation by admin, overlap prevention).

## Recommendations
1. **Add Validation** for `minHelpers`/`maxHelpers` in shift creation and auto‑assign.
2. **Write Tests** using the `overlap_test_cases` skill as a starting point; expand to cover assignment counts and auto‑assign.
3. **Standardize Error Codes** – use 409 for overlap conflicts.
4. **Consider Deprecating `helperId`** after ensuring all code paths use `ShiftAssignment`.
5. **Add CI/CD** (GitHub Actions) to run lint, type checks, and tests on each PR.
6. **Implement Monitoring** – integrate the provided `monitor_resources.sh` concept into deployment (e.g., sidecar or health‑check) to enforce resource limits.

## Next Steps
- Proceed to Sprint 1 (2 weeks) focused on:
  - Implementing missing validation (ISSUE‑01, ISSUE‑02).
  - Writing comprehensive overlap prevention tests (ISSUE‑03).
  - Adding basic unit tests for shift creation and auto‑assign.
  - Preparing test infrastructure (Jest, ts‑jest setup).
- After Sprint 1, review and move to Sprint 2 (stabilization, CI/CD, E2E).
