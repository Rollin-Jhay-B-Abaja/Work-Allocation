import React, { useState } from 'react';
import SkillBasedMatching from './SkillBasedMatching/SkillBasedMatching';
import WorkloadDistribution from './WorkloadDistribution/WorkloadDistribution';
import FlexibleScheduling from './FlexibleScheduling/FlexibleScheduling';
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
          return <FlexibleScheduling />;
      default:
        return null;
    }
  };

  return (
    <div style={{ padding: '5rem', maxWidth: '1200px', marginLeft: '15rem' }}>
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
