import React, { useState, useEffect } from 'react';

function SkillBasedMatching() {
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [matchedData, setMatchedData] = useState({ assignments: {}, detailed_scores: {} });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch teachers on mount
  useEffect(() => {
    fetch('http://localhost:8000/api/skill_based_matching.php?resource=teachers')
      .then(res => res.json())
      .then(data => {
        setTeachers(data);
      })
      .catch(() => setError('Failed to load teachers'));
  }, []);

  // Fetch classes on mount
  useEffect(() => {
    fetch('http://localhost:8000/api/skill_based_matching.php?resource=classes')
      .then(res => res.json())
      .then(data => {
        setClasses(data);
      })
      .catch(() => setError('Failed to load classes'));
  }, []);

  // Automatically run matching when teachers and classes data are loaded
  useEffect(() => {
    if (teachers.length === 0 || classes.length === 0) return;

    const runMatching = async () => {
      setError(null);
      setLoading(true);
      setMatchedData({ assignments: {}, detailed_scores: {} });

      try {
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
  }, [teachers, classes]);

  // Utility function to convert score to layman's terms
  const scoreToLaymanTerm = (score) => {
    if (score >= 15) return 'Expert';
    if (score >= 10) return 'Advanced';
    if (score >= 5) return 'Intermediate';
    if (score > 0) return 'Beginner';
    return 'No skill';
  };

  // Utility function to render pointing system for STEM strand
  const renderPointingSystem = (score) => {
    const maxPoints = 4;
    // Normalize score to maxPoints scale (assuming max score ~ 20)
    const points = Math.min(Math.round((score / 20) * maxPoints), maxPoints);
    const stars = [];
    for (let i = 0; i < maxPoints; i++) {
      if (i < points) {
        stars.push(<span key={i} style={{color: '#FFD700'}}>★</span>);
      } else {
        stars.push(<span key={i} style={{color: '#ccc'}}>☆</span>);
      }
    }
    return <span>{stars}</span>;
  };

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
                  <td style={tdStyle}>{Array.isArray(teacher) ? teacher.join(', ') : teacher}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3>How the Pointing System Works</h3>
          <p>
            The points are based on the teacher's skills matching the required subjects, proficiency levels, and experience:
          </p>
          <ul>
            <li>Each matching skill adds 1 point.</li>
            <li>Proficiency level in each skill adds 2 points per level (1 = Beginner, 5 = Expert).</li>
            <li>Experience adds 0.3 points per year.</li>
          </ul>

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
                      <th style={thStyle}>Skill Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scores.map(({ teacher, score }) => (
                      <tr key={teacher}>
                        <td style={tdStyle}>{teacher}</td>
                        <td style={tdStyle}>
                          {renderPointingSystem(score)}
                        </td>
                        <td style={tdStyle}>
                          {scoreToLaymanTerm(score)}
                        </td>
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
