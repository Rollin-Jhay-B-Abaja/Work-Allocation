import React, { useEffect, useState } from 'react';

const PlaceholderIcon = () => (
  <svg
    width="40"
    height="40"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#888"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ borderRadius: '50%', backgroundColor: '#ddd', marginRight: '10px' }}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z" />
    <path d="M6.5 18a5.5 5.5 0 0 1 11 0" />
  </svg>
);

const EmployeeViewProfile = ({ onBack }) => {
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    // Mock data for demonstration since backend API may not be available
    const mockEmployees = [
      { id: 1, name: 'John Doe', strand: 'Mathematics', contact: '+1234567890', hire_date: '2020-01-15', url: '' },
      { id: 2, name: 'Jane Smith', strand: 'Science', contact: '+1987654321', hire_date: '2019-08-23', url: '' },
    ];
    setEmployees(mockEmployees);
  }, []);

  return (
    <div style={{ width: '800px', height: '600px', overflow: 'auto' }}>
      <h1>View Employee Profile</h1>
      <button className="button" onClick={onBack} style={{ marginBottom: '10px' }}>
        Back
      </button>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>ID</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Name</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Strand</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Contact</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Hire Date</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {employees.length === 0 ? (
            <tr>
              <td colSpan="6" style={{ textAlign: 'center', padding: '8px' }}>
                No employees found.
              </td>
            </tr>
          ) : (
            employees.map((emp) => (
              <tr key={emp.id}>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{emp.id}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px', display: 'flex', alignItems: 'center' }}>
                  {emp.url ? (
                    <img
                      src={emp.url}
                      alt={`${emp.name} profile`}
                      style={{ width: '40px', height: '40px', borderRadius: '50%', marginRight: '10px' }}
                    />
                  ) : (
                    <PlaceholderIcon />
                  )}
                  {emp.name}
                </td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{emp.strand}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{emp.contact}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{emp.hire_date}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                  <button className="button" onClick={() => alert(`View details for ${emp.name}`)}>
                    View
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default EmployeeViewProfile;
