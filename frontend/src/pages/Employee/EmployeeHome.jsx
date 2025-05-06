import React from 'react';

const EmployeeHome = ({ onSelect }) => {
  return (
    <div className="employee-home-container" style={{ padding: '20px' }}>
      <h1>Employee Management</h1>
      <div>
        <button
          className="button"
          style={{ marginRight: '20px', padding: '10px 20px', fontSize: '16px' }}
          onClick={() => onSelect('create')}
        >
          Create New Employee
        </button>
        <button
          className="button"
          style={{ padding: '10px 20px', fontSize: '16px' }}
          onClick={() => onSelect('view')}
        >
          View Employee Profile
        </button>
      </div>
    </div>
  );
};

export default EmployeeHome;
