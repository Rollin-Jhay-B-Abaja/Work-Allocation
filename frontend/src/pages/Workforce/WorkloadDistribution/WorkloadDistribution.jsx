import React, { useEffect, useState } from 'react';

const WorkloadDistribution = () => {
  const [workloadData, setWorkloadData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/workload_distribution')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to fetch workload distribution data');
        }
        return response.json();
      })
      .then((data) => {
        setWorkloadData(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div>Loading workload distribution data...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>Error: {error}</div>;
  }

  if (!workloadData || !workloadData.teacher_workload_summary) {
    return <div>No workload distribution data available.</div>;
  }

  const containerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '3rem',
    height: '400px',
    border: '1px solid #444',
    overflow: 'hidden',
  };

  const tableContainerStyle = {
    width: '1100px',
    height: '100%',
    overflowY: 'auto',
  };

  const tableStyle = {
    borderCollapse: 'collapse',
    width: '100%',
    backgroundColor: '#1e1e1e',
    color: '#ffffff',
    margin: 0,
  };

  const thStyle = {
    border: '1px solid #444',
    padding: '8px',
    backgroundColor: '#2c2c2c',
  };

  const tdStyle = {
    border: '1px solid #444',
    padding: '8px',
  };

  const rowStyle = {
    paddingBottom: '1.5rem',
  };

  return (
    <div style={containerStyle}>
      <div style={tableContainerStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Teacher Name</th>
              <th style={thStyle}>Assigned Strands</th>
              <th style={thStyle}>Assigned Subjects</th>
              <th style={thStyle}>Total Hours</th>
            </tr>
          </thead>
          <tbody>
            {workloadData.teacher_workload_summary.map((teacher, index) => (
              <tr key={index} style={rowStyle}>
                <td style={tdStyle}>{teacher.teacher}</td>
                <td style={tdStyle}>{teacher.assigned_strands.join(' and ')}</td>
                <td style={tdStyle}>
                  {teacher.subjects && teacher.subjects.length > 0 ? (
                    teacher.subjects.map((subject, idx) => (
                      <div key={idx} style={{ marginBottom: '0.25rem' }}>
                        {subject.subject} ({subject.hours_per_week} hrs/week)
                      </div>
                    ))
                  ) : (
                    'No subjects assigned'
                  )}
                </td>
                <td style={tdStyle}>{(teacher.total_hours_per_day * 5).toFixed(2)} hrs</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WorkloadDistribution;
