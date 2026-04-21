# Booking Relational System - Implementation Guide

## Overview
A relational booking system has been implemented to connect approved and pending room bookings with students based on:
1. **Course Enrollment**: Bookings show to all students enrolled in the target course
2. **Department Affiliation**: Bookings show to all students in the target department

## How It Works

### Student Visibility Logic
When a student books a venue, they select one of two options during the endorsement step:

#### Option 1: Select an Enrolled Course
- The booking is tagged with `targetCourse`
- The booking will appear in the **"My Schedule"** of ALL students enrolled in that course
- Students see it on the same date if they have the booking in their department

#### Option 2: Select Department(s)
- The booking is tagged with `targetDepartments` (array)
- The booking will appear to all students whose department matches
- Department is extracted from email: `2023csb1157@iitrpr.ac.in` → `CSB`

### Color Coding System
Bookings appear with status-based colors across all calendar views:

- **Blue (brand-500)**: Official academic classes (courses)
- **Orange (#f97316)**: Pending bookings (awaiting AR approval)
- **Green/Emerald (#10b981)**: Approved bookings (fully authorized)

## Implementation Details

### Backend Changes

#### 1. New API Endpoint
**Route**: `GET /api/bookings/for-student/:studentId`

**Purpose**: Returns all bookings visible to a specific student

**Response**: Array of bookings matching either:
- Student's enrolled courses (`targetCourse` field)
- Student's department extracted from email

**Example Query Logic**:
```javascript
{
  status: { $in: ['Approved', 'Pending', 'Action Required'] },
  $or: [
    { targetCourse: { $in: enrolledCourses } },
    { targetDepartments: studentDept }
  ]
}
```

#### 2. File Changes
- **Backend Controller**: `backend/controllers/bookingController.js`
  - Added `getBookingsForStudent()` method
  - Extracts department from email using regex: `/\d{4}([a-z]{3})/i`
  - Properly handles MongoDB query with OR conditions
  - Exports new function in module.exports

- **Backend Routes**: `backend/routes/bookingRoutes.js`
  - Added route: `router.get('/for-student/:studentId', getBookingsForStudent)`
  - Route placement before generic `:id` routes for proper matching

### Frontend Changes

#### 1. API Service
**File**: `frontend/src/services/api.js`
- Added `fetchBookingsForStudent(studentId)` function
- Makes GET request to new endpoint
- Returns array of bookings or empty array on error

#### 2. Student Schedule Component
**File**: `frontend/src/pages/student/bookings/StudentSchedule.jsx`

**Changes**:
- Imports new API function
- Fetches bookings for current student on date change
- Merges bookings with class events
- Displays with color-based status indicators
- Handles loading states gracefully

**Color Differentiation**:
- Classes: Blue with brand-500 accent
- Approved Bookings: Emerald green with emerald-500 styling
- Pending Bookings: Orange with amber-500 styling and pulse animation

#### 3. Room Calendar Component
**File**: `frontend/src/pages/student/bookings/RoomCalendar.jsx`

**Changes**:
- Updated `generateTimeline()` to include booking status
- Added `isPending` flag to timeline events
- Displays pending bookings with amber color and pulse animation
- Shows status badge: "Pending", "Approved", or "Class"

#### 4. Faculty Room Calendar Component
**File**: `frontend/src/pages/faculty/FacultyRoomCalendar.jsx`
- Already has status-based color coding
- Uses `statusCfg()` function for color mapping
- No changes needed

### Database Fields

**Booking Model** (already exists):
```javascript
{
  targetCourse: { type: String, default: null },
  targetDepartments: { type: [String], default: [] },
  // ... other fields
}
```

**User Model** (already exists):
```javascript
{
  email: { type: String, required: true, unique: true },
  enrolledCourses: { type: [String] },
  // ... other fields
}
```

## Usage Flow

### For Students Creating Bookings
1. Navigate to Book a Venue
2. Fill Logistics step (dates, venues, times)
3. Fill Event Details step (activity type, audience count, purpose)
4. At Endorsement step, choose:
   - **Select Course** if event is for students in a specific course → `targetCourse`
   - **Select Department(s)** if event is for students in specific departments → `targetDepartments`
5. Submit booking

### For Students Viewing Schedules
1. Open **My Schedule** page
2. View bookings that match:
   - Courses you're enrolled in
   - Your department (extracted from entry number)
3. Pending bookings show in orange with pulse animation
4. Approved bookings show in green

## Testing

### Verify Endpoint Works
```bash
curl http://localhost:5000/api/bookings/for-student/{studentId}
```

### Test Cases
1. Student with courses enrolled
   - Create booking with `targetCourse` set
   - Verify all students in that course see it

2. Student with department
   - Create booking with `targetDepartments` set to `["CSB"]`
   - Verify all CSB students see it
   - Entry numbers like `2023csb1157` extract `CSB` correctly

3. Pending Status
   - Create booking with `status: 'Pending'`
   - Verify orange color in schedule
   - Verify pulse animation appears

4. Approved Status
   - Approve booking through all stages
   - Verify green color in schedule
   - Verify no animation

## Key Features

✅ **Course-Based Visibility**: Bookings linked to courses show to enrolled students
✅ **Department-Based Visibility**: Bookings linked to departments show to department students
✅ **Pending Status Indication**: Orange color and pulse animation for pending approvals
✅ **Approved Status Indication**: Green color for fully approved bookings
✅ **Email-Based Department Extraction**: Automatic department identification from email
✅ **Multi-Calendar Support**: Consistent styling across StudentSchedule, RoomCalendar, and Faculty views
✅ **Real-Time Sync**: Bookings fetch on component load and date changes

## Future Enhancements

- Add notification system when booking status changes
- Calendar export functionality
- Booking conflict alerts
- Calendar sync with external services
- Department-wide calendar views
