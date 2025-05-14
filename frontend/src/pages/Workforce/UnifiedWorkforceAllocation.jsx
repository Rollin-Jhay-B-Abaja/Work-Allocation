import React, { useState } from 'react';
import SkillBasedMatching from './SkillBasedMatching/SkillBasedMatching';
import WorkloadDistribution from './WorkloadDistribution/WorkloadDistribution';
import Sidebar from '../../components/Sidebar';
import '../../styles/sidebar.css';

function UnifiedWorkforceAllocation() {
  const [activeTab, setActiveTab] = useState('skill');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'skill':
        return <SkillBasedMatching />;
      case 'workload':
        return <WorkloadDistribution />;
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
