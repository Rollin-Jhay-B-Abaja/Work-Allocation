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
    className="placeholder-icon"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z" />
    <path d="M6.5 18a5.5 5.5 0 0 1 11 0" />
  </svg>
);

const EmployeeViewProfile = ({ onBack }) => {
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    // Fetch employees from backend API
    fetch('http://localhost:8000/api/employee_handler.php')
      .then((response) => response.json())
      .then((data) => {
        if (data.employees) {
          setEmployees(data.employees);
        } else {
          setEmployees([]);
        }
      })
      .catch((error) => {
        console.error('Error fetching employees:', error);
        setEmployees([]);
      });
  }, []);

  return (
    <div className="employee-view-profile-container" style={{width:'1000px', height:'450px'}}>
      <button className="button back-button" onClick={onBack}>
        Back
      </button>
      <div className="table-container" style={{ height: '340px', overflowY: 'auto' }}>
        <table className="employee-table">
          <thead>
            <tr>
              <th>Photo</th>
              <th>Name</th>
              <th>Subject</th>
              <th>Contact</th>
              <th>Hire Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 ? (
              <tr>
                <td colSpan="6" className="no-data">
                  No employees found.
                </td>
              </tr>
            ) : (
              employees.map((emp) => (
                <tr key={emp.id}>
                  <td>
                    {emp.photo ? (
                      <img
                        src={emp.photo}
                        alt={`${emp.teacher_name} profile`}
                        className="profile-photo"
                      />
                    ) : (
                      <PlaceholderIcon />
                    )}
                  </td>
                  <td>{emp.teacher_name}</td>
                  <td>{emp.strand_name}</td>
                  <td>
                    {emp.email && <div>Email: {emp.email}</div>}
                    {emp.phone && <div>Phone: {emp.phone}</div>}
                  </td>
                  <td>{emp.hire_date}</td>
                  <td>
                    <button
                      className="button view-button"
                      onClick={() => alert(`View details for ${emp.teacher_name}`)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmployeeViewProfile;
