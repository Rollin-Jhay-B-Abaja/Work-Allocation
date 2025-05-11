import React, { useState } from 'react';
import SkillBasedMatching from './SkillBasedMatching/SkillBasedMatching';
import Sidebar from '../../components/Sidebar';
import '../../styles/sidebar.css';

function UnifiedWorkforceAllocation() {
  const [activeTab, setActiveTab] = useState('skill');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'skill':
        return <SkillBasedMatching />;
      case 'workload':
        return (
          <div>
            <h2>Dynamic Workload Distribution</h2>
            <p>
              This tool ensures a fair and efficient allocation of teaching hours, administrative duties, and extracurricular activities among teachers.
            </p>
            <h3>Parameters and Data Needed:</h3>
            <ul>
              <li><strong>Teacher Workload:</strong> Current Teaching Hours (weekly schedule), Administrative Duties (e.g., managing events, parent meetings), Extracurricular Activities (e.g., sports coaching, club mentoring), Performance Metrics (e.g., feedback scores, past workload handling)</li>
              <li><strong>Classes/Activities:</strong> Subject and Grade Distribution (e.g., 3 sections of Grade 11 Physics), Number of Classes/Hours per teacher for each subject, Extracurricular Time Requirements (e.g., 2 hours/week for debate club)</li>
              <li><strong>Constraints:</strong> Legal or policy requirements (e.g., no more than 30 teaching hours per week), Teacher preferences (e.g., morning-only classes), Real-time adjustments for absences (e.g., substitute teachers)</li>
              <li><strong>Constraints:</strong> Distribute teaching hours fairly across the staff, Prioritize critical tasks (e.g., board exam classes) for experienced teachers, Avoid overloading teachers with too many extracurricular responsibilities</li>
            </ul>
            <p><strong>Optimization Algorithms:</strong> Minimize or balance workloads across staff members while adhering to constraints.</p>
          </div>
        );
      case 'scheduling':
        return (
          <div>
            <h2>Flexible Scheduling</h2>
            <p>
              This tool generates customizable schedules for teachers based on their preferences and the school’s requirements.
            </p>
            <h3>Parameters and Data Needed:</h3>
            <ul>
              <li><strong>Teacher Preferences:</strong> Preferred Teaching Hours (e.g., morning, afternoon), Preferred Days Off (e.g., preference for Fridays off), Shift Preferences (if applicable, e.g., early or late shifts)</li>
              <li><strong>School Timetable:</strong> Class Schedules (fixed class timings for each subject and grade), Teacher-to-Student Ratios (e.g., maximum number of students per class), Peak Time Requirements (e.g., more teachers needed during lab sessions)</li>
              <li><strong>Workforce Availability:</strong> Leave requests and holidays, Substitute teacher availability, Overtime willingness (e.g., for exam preparation periods)</li>
              <li><strong>Compliance Requirements:</strong> Adherence to labor laws and teacher contracts, Maximum teaching hours per week, Minimum rest periods between shifts</li>
              <li><strong>Dynamic Adjustment Rules:</strong> Reallocate schedules in case of emergencies (e.g., sudden absence), Flexible start and end times for activities like parent-teacher meetings</li>
            </ul>
            <p><strong>Greedy Algorithms:</strong> Quickly assign tasks or schedules in scenarios with minimal constraints.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ padding: '5rem', maxWidth: '900px', margin: '0 auto' }}>
      <Sidebar />
      <h1>Workforce Allocation Modules</h1>
      <p>
        These modules manage the dynamic assignment of staff based on their skills, availability, and workload. By matching the right employees to the right tasks and balancing workloads, they ensure the best use of human resources across the organization.
      </p>
      <div style={{ display: 'flex', marginBottom: '2rem', gap: '1rem' }}>
        <button
          onClick={() => setActiveTab('skill')}
          style={{
            flex: 1,
            padding: '0.5rem',
            backgroundColor: activeTab === 'skill' ? '#007bff' : '#ccc',
            color: activeTab === 'skill' ? '#fff' : '#000',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Skill-Based Matching
        </button>
        <button
          onClick={() => setActiveTab('workload')}
          style={{
            flex: 1,
            padding: '0.5rem',
            backgroundColor: activeTab === 'workload' ? '#007bff' : '#ccc',
            color: activeTab === 'workload' ? '#fff' : '#000',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Dynamic Workload Distribution
        </button>
        <button
          onClick={() => setActiveTab('scheduling')}
          style={{
            flex: 1,
            padding: '0.5rem',
            backgroundColor: activeTab === 'scheduling' ? '#007bff' : '#ccc',
            color: activeTab === 'scheduling' ? '#fff' : '#000',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Flexible Scheduling
        </button>
      </div>
      <div style={{ maxHeight: '600px', overflowY: 'auto' }}>{renderTabContent()}</div>
    </div>
  );
}

export default UnifiedWorkforceAllocation;
