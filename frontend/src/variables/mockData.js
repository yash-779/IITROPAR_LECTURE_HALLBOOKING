// src/variables/mockData.js

export const ROOM_CAPACITIES = {
  'm1': 50,   'M1': 50,
  'm2': 50,   'M2': 50,
  'm3': 100,  'M3': 100,
  'm4': 100,  'M4': 100,
  'm5': 195,  'M5': 195,
  'm6': 180,  'M6': 180,
  'audi': 500, 'Audi': 500,
  'cs1': 60,  'CS1': 60,
  'cs2': 40,  'CS2': 40,
  'cssh': 90, 'CSSH': 90,
  'ee1': 65,  'EE1': 65,
  'ee2': 35,  'EE2': 35,
  'ee3': 60,  'EE3': 60,
  'eesh': 80, 'EESH': 80,
  'me1': 70,  'ME1': 70,
  'me2': 35,  'ME2': 35,
  'mesh': 90, 'MESH': 90,
  'cy1': 35,  'CY1': 35,
  'cy2': 30,  'CY2': 30,
  'cysh': 90, 'CYSH': 90,
  's001': 72, 'S001': 72,
  's002': 72, 'S002': 72,
  's003': 72, 'S003': 72,
  's102': 72, 'S102': 72,
  's103': 72, 'S103': 72,
  's104': 72, 'S104': 72,
  's105': 72, 'S105': 72,
  's106': 72, 'S106': 72,
  's107': 72, 'S107': 72
};

export const VENUES = [
  { id: 'm1', name: 'Lecture Hall M1', capacity: 50 },
  { id: 'm2', name: 'Lecture Hall M2', capacity: 50 },
  { id: 'm3', name: 'Lecture Hall M3', capacity: 100 },
  { id: 'm4', name: 'Lecture Hall M4', capacity: 100 },
  { id: 'm5', name: 'Lecture Hall M5', capacity: 195 },
  { id: 'm6', name: 'Lecture Hall M6', capacity: 180 },
  { id: 'audi', name: 'Main Auditorium', capacity: 500 },
  { id: 'cs1', name: 'CS1', capacity: 60 },
  { id: 'cs2', name: 'CS2', capacity: 40 },
  { id: 'cssh', name: 'CS(SH)', capacity: 90 },
  { id: 'ee1', name: 'EE1', capacity: 65 },
  { id: 'ee2', name: 'EE2', capacity: 35 },
  { id: 'ee3', name: 'EE3', capacity: 60 },
  { id: 'eesh', name: 'EE(SH)', capacity: 80 },
  { id: 'me1', name: 'ME1', capacity: 70 },
  { id: 'me2', name: 'ME2', capacity: 35 },
  { id: 'mesh', name: 'ME(SH)', capacity: 90 },
  { id: 'cy1', name: 'CY1', capacity: 35 },
  { id: 'cy2', name: 'CY2', capacity: 30 },
  { id: 'cysh', name: 'CY(SH)', capacity: 90 },
  { id: 's001', name: 'S-001', capacity: 72 },
  { id: 's002', name: 'S-002', capacity: 72 },
  { id: 's003', name: 'S-003', capacity: 72 },
  { id: 's102', name: 'S-102', capacity: 72 },
  { id: 's103', name: 'S-103', capacity: 72 },
  { id: 's104', name: 'S-104', capacity: 72 },
  { id: 's105', name: 'S-105', capacity: 72 },
  { id: 's106', name: 'S-106', capacity: 72 },
  { id: 's107', name: 'S-107', capacity: 72 }
];

// Reusing the same arrays for different components to satisfy the compiler
export const mockBookings = [
  { 
    id: 1, 
    _id: "mock_id_123", // Adding _id just in case you used Mongo-style IDs in your keys
    clubName: "Coding Club", 
    status: "Pending", 
    venue: "M1", 
    date: "2026-04-15",
    activityType: "Hackathon",
    tracker: {
      faculty: "pending",
      jrAssistant: "pending",
      superintendent: "pending",
      ar: "pending"
    },
    priorities: [
      { venueId: "m1", venueName: "Lecture Hall M1", date: "2026-04-15", startTime: "10:00", endTime: "18:00" }
    ],
    allocatedSlot: null
  },
  { 
    id: 2, 
    _id: "mock_id_124",
    clubName: "Robotics Club", 
    status: "Approved", 
    venue: "Audi", 
    date: "2026-04-20",
    activityType: "Workshop",
    tracker: {
      faculty: "approved",
      jrAssistant: "approved",
      superintendent: "approved",
      ar: "approved"
    },
    priorities: [
      { venueId: "audi", venueName: "Main Auditorium", date: "2026-04-20", startTime: "14:00", endTime: "16:00" }
    ],
    allocatedSlot: { venueId: "audi", venueName: "Main Auditorium", date: "2026-04-20", startTime: "14:00", endTime: "16:00" }
  }
];

// Ensure these still point to the newly updated array (Duplicates removed here)
export const mockRequests = mockBookings;
export const executiveRequests = mockBookings;
export const EXISTING_BOOKINGS = mockBookings;
export const mockData = mockBookings;

export const kpis = {
  pendingApprovals: 12,
  roomsBookedToday: 5,
  totalClubs: 24
};

export const campusData = [];
export const tightnessData = [ { name: "Mon", value: 80 }, { name: "Tue", value: 60 } ];
export const mockEvents = [];
export const venues = VENUES;