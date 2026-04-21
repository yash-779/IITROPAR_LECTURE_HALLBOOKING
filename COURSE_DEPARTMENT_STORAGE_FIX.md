# Course & Department Selection Storage and Display - Complete Fix

## Problem Identified
The booking form was not enforcing that students **MUST** select either a course or department, which could result in bookings being saved without this critical information.

## Solution Implemented

### 1. Frontend Validation (BookRoom.jsx)

#### Enhanced Submit Handler
Added strict validation to ensure:
- **If activity requires a course** (Lecture, Examination, Quiz):
  - ✅ User MUST select a `targetCourse`
  - ✅ Alert if not selected: "Please select a target course for this activity type."
  
- **If activity does NOT require a course** (Club Activity, Workshop, Other):
  - ✅ User MUST select at least one department
  - ✅ Alert if none selected: "Please select at least one target department for this activity."

```javascript
// Validation in handleSubmit
if (requiresCourse && !formData.targetCourse) {
  return alert("Please select a target course for this activity type.");
}

if (!requiresCourse && selectedDepartments.length === 0) {
  return alert("Please select at least one target department for this activity.");
}
```

#### Improved UI for Step 2 (Event Details)
When activity type requires a course selection:
- ✨ Highlighted in blue with clear instructions
- 📚 Visual indicator "📚 Target Course (Required)"
- Shows confirmation: "✓ Course selected: CSE101"
- Target courses come from student's enrolled courses

#### Improved UI for Step 3 (Endorsement)
When activity type requires department selection:
- ✨ Highlighted in purple with clear instructions
- 🏢 Visual indicator "🏢 Target Departments (Required)"
- Shows confirmation: "✓ 2 department(s) selected"
- Shows what bookings are for: "This booking will be visible to all students in the selected departments"

#### Visibility Indicators
Clear messaging on Step 3 showing:
- **For course-based bookings**: 📚 "This booking will be visible to all students enrolled in the selected course"
- **For department-based bookings**: 🏢 "This booking will be visible to all students in the selected departments"

### 2. Data Storage (Backend)
The backend was already correctly storing these fields in the Booking model:
```javascript
targetCourse: { type: String, default: null },
targetDepartments: { type: [String], default: [] }
```

The payload sent to backend includes:
```javascript
{
  targetCourse: requiresCourse ? formData.targetCourse : null,
  targetDepartments: !requiresCourse ? selectedDepartments : []
}
```

### 3. Data Display (StudentSchedule.jsx)

#### Enhanced buildBookingEvents Function
Now captures and displays booking source:
```javascript
// Determine if booking is for a course or department
let bookingSource = "Department";
let sourceInfo = booking.targetDepartments?.join(", ") || "N/A";

if (booking.targetCourse) {
  bookingSource = "Course";
  sourceInfo = booking.targetCourse;
}
```

#### Visual Display in Schedule
For each booking event, shows:
- **Header**: Club name, Status (Pending/Approved)
- **Source Info**: 
  - 📚 "For course: CSE101" (if course-based)
  - 🏢 "For department: CSB, EEB" (if department-based)
- **Details**: Venue, Time
- **Color Coding**:
  - Orange/Amber: Pending approval
  - Emerald/Green: Approved

## How It Works Now

### Student Creates Booking

**Step 1: Logistics** (Where & When)
- Select venues, date, time

**Step 2: Event Details** (What)
- Select activity type
- **If Lecture/Exam/Quiz** → MUST select target course
  - Only shows courses student is enrolled in
  - Shows confirmation when selected

**Step 3: Endorsement** (Who Sees It)
- **If Club Activity/Workshop/Other** → MUST select departments
  - Shows all available departments
  - Can select multiple departments
  - Shows confirmation count
- Add faculty email for approval

**Submit**
- Form validates all required fields
- Sends payload with `targetCourse` OR `targetDepartments`
- Backend saves to database

### Student Sees Bookings in Schedule

When viewing **My Schedule**:
- 🎉 Shows all bookings from:
  - Courses they're enrolled in
  - Departments they belong to (extracted from email)
- Each booking shows:
  - **Title**: Club name
  - **Source**: 📚 Course code OR 🏢 Department(s)
  - **Status**: Pending (orange) or Approved (green)
  - **Time & Venue**: Date, time, location

## Database Behavior

### Booking Creation
- `targetCourse` is set if activity requires a course
- `targetDepartments` array is populated if activity doesn't require a course
- Never both empty at the same time (validation prevents this)

### Data Retrieval
Backend endpoint `/api/bookings/for-student/:studentId`:
- Fetches bookings matching student's enrolled courses
- Fetches bookings matching student's department
- Returns both pending and approved bookings

## Field Mapping

| Activity Type | Requires | Field Used | Visibility |
|---|---|---|---|
| Lecture | Course | targetCourse | All enrolled students |
| Examination | Course | targetCourse | All enrolled students |
| Quiz | Course | targetCourse | All enrolled students |
| Guest Lecture | Course | targetCourse | All enrolled students |
| Club Activity | Department | targetDepartments | Department students |
| Workshop | Department | targetDepartments | Department students |
| Other | Department | targetDepartments | Department students |

## Visual Summary

### BookRoom Form Flow
```
Step 1: Logistics
↓
Step 2: Event Details
  - Activity Type: [User selects]
  - If requires course: Show course dropdown ✓ (required)
  - If requires department: [Empty for now]
↓
Step 3: Endorsement
  - If requires course: [Already selected in Step 2]
  - If requires department: Show department buttons ✓ (required)
  - Faculty email input
↓
Submit: Validates BOTH conditions met
```

### StudentSchedule Display
```
📅 Tuesday, April 22, 2026

🎉 CSB Annual Fest
  📚 For course: CSE101
  🏢 Auditorium · 2:00 PM - 4:00 PM
  Status: Approved ✓

📚 CSE101 Class
  @Main Block · 10:00 AM - 11:30 AM
  Status: Official Class

🎉 Department Workshop
  🏢 For department: CSB, EEB
  CS1 · 4:00 PM - 6:00 PM
  Status: Pending ⏳
```

## Testing Checklist

- [ ] Try creating booking with "Lecture" - must select course
- [ ] Try submitting without course - should show alert
- [ ] Try creating booking with "Club Activity" - must select department
- [ ] Try submitting without department - should show alert
- [ ] Verify course bookings show in schedule for enrolled students
- [ ] Verify department bookings show in schedule for department students
- [ ] Verify pending bookings display in orange
- [ ] Verify approved bookings display in green
- [ ] Check database: `targetCourse` and `targetDepartments` fields populated correctly

## Files Modified

1. **frontend/src/pages/student/bookings/BookRoom.jsx**
   - Enhanced validation in `handleSubmit`
   - Improved UI for course selection (Step 2)
   - Improved UI for department selection (Step 3)
   - Added visual indicators and confirmations

2. **frontend/src/pages/student/bookings/StudentSchedule.jsx**
   - Updated `buildBookingEvents()` to capture source info
   - Added display of booking source (course vs department)
   - Visual indicators for source type

## Key Takeaways

✅ **Form Validation**: Forces students to select course OR department based on activity type
✅ **Data Storage**: Properly stores in `targetCourse` or `targetDepartments` fields
✅ **Data Display**: Shows which course or department each booking is for
✅ **User Experience**: Clear UI indicators showing what's required at each step
✅ **Backward Compatible**: Works with existing booking system and approvals workflow
