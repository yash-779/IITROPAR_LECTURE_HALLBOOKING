# Multi-Date Time Slot Proposals for Faculty Approvals

This plan outlines the changes required to upgrade the "Request Changes" workflow for Faculty Members, allowing them to propose up to three specific dates, automatically computing free time slots, and permitting the student to select from these generated options.

## User Review Required
> [!IMPORTANT]
> The backend schema for `proposedChanges` will need to be updated to support an array of dates with arrays of timeslots. This will be an automatic change. 
> The backend `updateBookingStatus` controller method will be extended to allow students to physically resubmit their request with the newly selected date and time, updating their `booking.priorities` array and resetting the faculty approval stage to `pending`.

## Proposed Changes

### Backend

#### [MODIFY] backend/models/Booking.js
- Update the `proposedChanges` schema field from a single object `{ date, startTime, endTime }` to a `Mixed` type or structured array to accommodate: `[ { date: String, timeSlots: [ { startTime: String, endTime: String } ] } ]`

#### [MODIFY] backend/controllers/bookingController.js
- In `updateBookingStatus()`, add logic to handle a new student resubmission scenario. 
- If a request contains `resubmittedPriorities`, the booking's `priorities` array will be updated to reflect the new time. The tracker's `faculty` stage will be reset to `pending`, status set to `Pending`, and `proposedChanges` optionally cleared.

### Frontend

#### [MODIFY] frontend/src/services/api.js
- Update `submitFacultyDecision` to accept `proposedChanges` array.
- Create or update the API method for student resubmission `resubmitBooking(bookingId, selectedPriority)`.

#### [MODIFY] frontend/src/pages/faculty/Approvals.jsx
- **State Changes**: Replace `proposedDate`, `proposedStartTime` and `proposedEndTime` with a `proposedOptions` array that stores up to 3 date objects.
- **Auto-computation Engine (`getFreeTimeSlots`)**: Create a function to look at the day's existing `incoming` bookings and the faculty's `courseData` schedule, establishing standard 1-hour/2-hour "free slots" (e.g. 2pm-3pm, 6pm-10pm).
- **Default Dates**: Pre-fill the 3 slots with:
  1. The event's original date minus 1 day.
  2. The event's original date.
  3. The event's original date plus 2 days. 
- **UI Enhancements**:
  - Show a list of 3 dates in the "Your Decision: Request Changes" modal.
  - When clicking on an input date row, explicitly make it the "active" date, dynamically triggering the visual **My Schedule Timeline** on the left to render *that* date's engagements.
  - Provide pill-shaped buttons for the auto-generated free time slots on each date row, alongside a little "x" allowing the faculty to manually delete any slot.
  - Send the finalized `proposedOptions` down on "Submit".

#### [MODIFY] frontend/src/pages/student/bookings/StudentBookings.jsx
- **Tracker Updates**: When `tracker.faculty === 'changes_requested'`, process the `booking.proposedChanges` array instead of showing pure text inputs.
- Present the faculty's list of dates and `timeSlots` as radio options (or selectable cards) so the student can easily pick one.
- **Action Connection**: Hook up the `<button> Resubmit Request </button>` to actual state logic. It will send the chosen `timeSlot` to the backend, clearing the "Action Required" hold and jumping the booking back into the faculty queue as a refreshed Pending request.

## Open Questions
- What time intervals should auto-generated "free time" default to? (Assuming blocks from 08:00 to 20:00).
- If the faculty doesn't find any auto-generated times, should they have an "Add Manual Slot" button? (Plan assumes yes for usability).
- Should original location priorities simply be rewritten with the new unified Date & Time via the student's resubmit action? (Plan assumes changing priority #1 with their selection).

## Verification Plan
1. **Scenario 1**: Faculty opens modal, clicks "Request Changes", defaults show D-1, D, D+2 dates with generated time pills.
2. **Scenario 2**: Faculty deletes one pill on D+2, then submits. Backend persists it.
3. **Scenario 3**: Student views "Action Required", sees radio-options for these pills, selects one, submits.
4. **Scenario 4**: The booking is now `pending` again and displays the new Date and Time in the UI.
