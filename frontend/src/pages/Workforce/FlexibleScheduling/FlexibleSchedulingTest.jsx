import React, { useEffect } from 'react';
import FlexibleScheduling from './FlexibleScheduling';

// Dummy data for testing with at least 10 teachers and 8 subjects
const dummyTeachers = [
  { id: 1, name: 'Teacher A' },
  { id: 2, name: 'Teacher B' },
  { id: 3, name: 'Teacher C' },
  { id: 4, name: 'Teacher D' },
  { id: 5, name: 'Teacher E' },
  { id: 6, name: 'Teacher F' },
  { id: 7, name: 'Teacher G' },
  { id: 8, name: 'Teacher H' },
  { id: 9, name: 'Teacher I' },
  { id: 10, name: 'Teacher J' },
];

const dummyClasses = [
  { id: 101, name: 'Math', class_time: '08:00', class_end_time: '09:00', class_day: 'Monday', hours_per_week: 1 },
  { id: 102, name: 'Science', class_time: '09:00', class_end_time: '10:00', class_day: 'Tuesday', hours_per_week: 1 },
  { id: 103, name: 'English', class_time: '10:00', class_end_time: '11:00', class_day: 'Wednesday', hours_per_week: 1 },
  { id: 104, name: 'History', class_time: '11:00', class_end_time: '12:00', class_day: 'Thursday', hours_per_week: 1 },
  { id: 105, name: 'Geography', class_time: '12:00', class_end_time: '13:00', class_day: 'Friday', hours_per_week: 1 },
  { id: 106, name: 'Physics', class_time: '13:00', class_end_time: '14:00', class_day: 'Monday', hours_per_week: 1 },
  { id: 107, name: 'Chemistry', class_time: '14:00', class_end_time: '15:00', class_day: 'Tuesday', hours_per_week: 1 },
  { id: 108, name: 'Biology', class_time: '15:00', class_end_time: '16:00', class_day: 'Wednesday', hours_per_week: 1 },
];

// Mock fetch to return dummy data
const mockFetch = (url) => {
  if (url.includes('resource=teachers')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(dummyTeachers),
    });
  }
  if (url.includes('resource=classes')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(dummyClasses),
    });
  }
  if (url.includes('flexible_scheduling.php')) {
    // Simulate a successful schedule generation response
    const dummySchedule = {
      1: [
        { class_name: 'Math', start_time: '08:00', end_time: '09:00' },
      ],
      2: [
        { class_name: 'Science', start_time: '09:00', end_time: '10:00' },
      ],
      3: [
        { class_name: 'English', start_time: '10:00', end_time: '11:00' },
      ],
      4: [
        { class_name: 'History', start_time: '11:00', end_time: '12:00' },
      ],
      5: [
        { class_name: 'Geography', start_time: '12:00', end_time: '13:00' },
      ],
      6: [
        { class_name: 'Physics', start_time: '13:00', end_time: '14:00' },
      ],
      7: [
        { class_name: 'Chemistry', start_time: '14:00', end_time: '15:00' },
      ],
      8: [
        { class_name: 'Biology', start_time: '15:00', end_time: '16:00' },
      ],
      9: [],
      10: [],
    };
    return Promise.resolve({
      ok: true,
      text: () => Promise.resolve(JSON.stringify(dummySchedule)),
    });
  }
  return Promise.reject(new Error('Unknown URL'));
};

function FlexibleSchedulingTest() {
  useEffect(() => {
    // Override global fetch with mockFetch
    global.fetch = mockFetch;
  }, []);

  return (
    <div>
      <h1>Flexible Scheduling Test</h1>
      <FlexibleScheduling />
    </div>
  );
}

export default FlexibleSchedulingTest;
