import React, { useState, useEffect } from 'react';

function WorkloadDistribution() {
  const [teacherWorkload, setTeacherWorkload] = useState([]);
  const [analysisReport, setAnalysisReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWorkload = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch from new Python API endpoint for skill based matching
        const response = await fetch('http://localhost:5000/api/skill_based_matching');
        if (!response.ok) {
          throw new Error('Failed to fetch workload distribution data');
        }
        const data = await response.json();
        console.log('Raw data received from API:', data);
        if (!data.teacher_workload_summary || !Array.isArray(data.teacher_workload_summary)) {
          setError('Invalid data format received from server');
          setTeacherWorkload([]);
          setLoading(false);
          return;
        }
        // Transform backend data to frontend expected format
        const transformedData = data.teacher_workload_summary.map(item => {
          const totalHoursPerWeek = item.subjects.reduce((sum, subj) => sum + (subj.hours_per_week || 0), 0);
          const totalHoursPerDay = (totalHoursPerWeek / 5).toFixed(2); // Assuming 5 working days per week
          return {
            name: item.teacher,
            strands: item.assigned_strands,
            subjects: item.subjects.map(s => s.subject),
            total_hours: totalHoursPerDay
          };
        });
        setTeacherWorkload(transformedData);
        setAnalysisReport(data.analysis_report || null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkload();
  }, []);

  const containerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '3rem',
    height: '400px',
    border: '1px solid #444',
    overflow: 'hidden',
  };

  const tableContainerStyle = {
    width: '500px',
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

  const analysisStyle = {
    width: '35%',
    height: '100%',
    backgroundColor: '#2c2c2c',
    color: '#ffffff',
    padding: '1rem',
    overflowY: 'auto',
  };

  return (
    <div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {loading && <p>Loading workload distribution...</p>}

      {!loading && teacherWorkload.length > 0 && (
        <div style={containerStyle}>
          <div style={tableContainerStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Teacher</th>
                  <th style={thStyle}>Assigned Strands</th>
                  <th style={thStyle}>Subjects</th>
                  <th style={thStyle}>Total Hours per Day</th>
                </tr>
              </thead>
              <tbody>
                {teacherWorkload.map(({ name, strands, subjects, total_hours }, index) => (
                  <tr key={index}>
                    <td style={tdStyle}>{name}</td>
                    <td style={tdStyle}>{strands && strands.length > 0 ? strands.join(' and ') : 'No strands assigned'}</td>
                    <td style={tdStyle}>{subjects && subjects.length > 0 ? subjects.join(' and ') : 'No subjects assigned'}</td>
                    <td style={tdStyle}>{total_hours} hrs</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {analysisReport && (
            <div style={analysisStyle}>
              <h3>Analysis Report</h3>
              <p>Total Teachers: {analysisReport.total_teachers}</p>
              <p>Assigned Teachers: {analysisReport.assigned_teachers}</p>
              <p>Fully loaded Teachers: {analysisReport.unassigned_teachers}</p>
              <h4>Strand Distribution:</h4>
              <ul>
                {Object.entries(analysisReport.strand_distribution).map(([strand, count]) => (
                  <li key={strand}>{strand}: {count}</li>
                ))}
              </ul>
              <p style={{marginTop: '1rem', fontStyle: 'italic'}}>
                Note: If a teacher is not assigned to a strand or subject, it means they are either fully loaded or not qualified.
              </p>
            </div>
          )}
        </div>
      )}

      {!loading && teacherWorkload.length === 0 && <p>No workload distribution data available.</p>}
    </div>
  );
}

export default WorkloadDistribution;
