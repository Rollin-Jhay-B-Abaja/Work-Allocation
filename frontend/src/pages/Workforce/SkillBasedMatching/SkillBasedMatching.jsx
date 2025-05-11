import React, { useState, useEffect } from 'react';

const STRANDS = [
  { id: 'STEM', name: 'STEM' },
  { id: 'ABM', name: 'ABM' },
  { id: 'GAS', name: 'GAS' },
  { id: 'HUMMS', name: 'HUMMS' },
  { id: 'ICT', name: 'ICT' },
];

// Updated skill and certification requirements per strand to match database values
const STRAND_REQUIREMENTS = {
  STEM: ['Physics', 'Chemistry', 'Biology'],
  ABM: ['Accounting', 'Business Management', 'Economics', 'Marketing'],
  GAS: ['English', 'Philippine History', 'Philosophy', 'Social Studies'],
  HUMMS: ['Psychology', 'Sociology', 'Communication Arts'],
  ICT: ['Information and Communications Technology', 'Computer Science'],
};

function SkillBasedMatching() {
  const [teachers, setTeachers] = useState([]);
  const [matchedData, setMatchedData] = useState({ assignments: {}, detailed_scores: {} });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch teachers on mount
  useEffect(() => {
    fetch('http://localhost:8000/api/skill_based_matching.php?resource=teachers')
      .then(res => res.json())
      .then(data => {
        console.log('Fetched teachers:', data);
        setTeachers(data);
      })
      .catch(() => setError('Failed to load teachers'));
  }, []);

  // Automatically run matching when teachers data is loaded
  useEffect(() => {
    if (teachers.length === 0) return;

    const runMatching = async () => {
      setError(null);
      setLoading(true);
      setMatchedData({ assignments: {}, detailed_scores: {} });

      try {
        const classes = STRANDS.map(strand => ({
          id: strand.id,
          name: strand.name,
          skill_certification_requirements: STRAND_REQUIREMENTS[strand.id] || [],
          hours_per_week: 10, // Example fixed hours, can be dynamic
          subject: strand.id, // Using strand id as subject for filtering
          grade: 'Senior High' // Example grade
        }));

        const response = await fetch('http://localhost:8000/api/skill_based_matching.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            teachers,
            classes,
            constraints: { max_hours_per_week: 40, min_rest_hours: 8 },
            preferences: {}
          }),
        });
        if (!response.ok) {
          throw new Error('API request failed');
        }
        const data = await response.json();

        // Parse the 'result' string as JSON
        let parsedResult = { assignments: {}, detailed_scores: {} };
        try {
          parsedResult = JSON.parse(data.result);
        } catch (e) {
          setError('Failed to parse matching results');
          console.error('Parsing error:', e);
        }

        setMatchedData({
          assignments: parsedResult.assignments || {},
          detailed_scores: parsedResult.detailed_scores || {}
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    runMatching();
  }, [teachers]);

  const tableStyle = {
    borderCollapse: 'collapse',
    width: '100%',
    backgroundColor: '#1e1e1e',
    color: '#ffffff',
    marginBottom: '2rem'
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

  return (
    <div style={{ maxHeight: '400px', marginBottom: '50px', overflowY: 'auto' }}>
      <h2>Skill Based Matching</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {loading && <p>Matching...</p>}

      {/* Removed debug display of fetched teachers data */}

      {matchedData && (
        <>
          <h3>Best Teacher Assignments per Strand</h3>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Strand</th>
                <th style={thStyle}>Assigned Teacher</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(matchedData.assignments).map(([strand, teacher]) => (
                <tr key={strand}>
                  <td style={tdStyle}>{strand}</td>
                  <td style={tdStyle}>{teacher}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3>Detailed Matching Scores</h3>
          {Object.entries(matchedData.detailed_scores).map(([strand, scores]) => (
            <div key={strand} style={{ marginBottom: '2rem' }}>
              <h4>{strand}</h4>
              {scores.length === 0 ? (
                <p>No suitable teachers found.</p>
              ) : (
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Teacher</th>
                      <th style={thStyle}>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scores.map(({ teacher, score }) => (
                      <tr key={teacher}>
                        <td style={tdStyle}>{teacher}</td>
                        <td style={tdStyle}>{score.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}

        </>
      )}
      {!loading && (!matchedData || Object.keys(matchedData.assignments).length === 0) && <p>No matching results to display.</p>}
    </div>
  );
}

export default SkillBasedMatching;
