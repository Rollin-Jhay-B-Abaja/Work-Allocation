import React, { useState, useEffect } from 'react';

function FlexibleScheduling() {
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [preferences, setPreferences] = useState({});
  const [constraints, setConstraints] = useState({
    max_hours_per_week: 40,
    min_rest_hours: 8,
  });
  const [schedules, setSchedules] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch teachers and classes on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const teachersRes = await fetch('http://localhost:8000/api/skill_based_matching.php?resource=teachers');
        if (!teachersRes.ok) throw new Error('Failed to fetch teachers');
        const teachersData = await teachersRes.json();
        console.log('Fetched teachers:', teachersData);
        if (!Array.isArray(teachersData)) {
          setError('Invalid teachers data format received from server');
          setTeachers([]);
        } else {
          setTeachers(teachersData);
        }

        const classesRes = await fetch('http://localhost:8000/api/flexible_scheduling.php?resource=classes');
        if (!classesRes.ok) throw new Error('Failed to fetch classes');
        const classesData = await classesRes.json();
        console.log('Fetched classes:', classesData);
        if (!Array.isArray(classesData)) {
          setError('Invalid classes data format received from server');
          setClasses([]);
        } else {
          setClasses(classesData);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
      }
    };
    fetchData();
  }, []);

  // Handle input changes for preferences and constraints
  const handlePreferenceChange = (teacherId, field, value) => {
    setPreferences(prev => ({
      ...prev,
      [teacherId]: {
        ...prev[teacherId],
        [field]: value,
      },
    }));
  };

  const handleConstraintChange = (field, value) => {
    if (value < 0) return; // Basic validation
    setConstraints(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle class field changes
  const handleClassChange = (classId, field, value) => {
    setClasses(prevClasses =>
      prevClasses.map(cls =>
        cls.id === classId ? { ...cls, [field]: value } : cls
      )
    );
  };

  // Validate all required inputs before generating schedule
  const validateInputs = () => {
    if (teachers.length === 0) {
      alert('No teachers loaded. Cannot generate schedule.');
      return false;
    }
    if (classes.length === 0) {
      alert('No classes loaded. Cannot generate schedule.');
      return false;
    }
    if (!constraints.max_hours_per_week || constraints.max_hours_per_week <= 0) {
      alert('Please enter a valid Max Hours per Week.');
      return false;
    }
    if (constraints.min_rest_hours === undefined || constraints.min_rest_hours < 0) {
      alert('Please enter a valid Min Rest Hours Between Shifts.');
      return false;
    }
    // Validate each class has required fields filled
    for (const cls of classes) {
      if (!cls.name || !cls.class_time || !cls.class_end_time || !cls.class_day || !cls.hours_per_week) {
        alert(`Please fill all fields for class: ${cls.name || 'Unnamed class'}`);
        return false;
      }
    }
    return true;
  };

  // Generate schedule by POSTing data to backend
  const generateSchedule = async () => {
    if (!validateInputs()) {
      return;
    }
    setLoading(true);
    setError(null);
    setSchedules({});
    try {
      // Build teachers array with preferences for backend
      const teachersWithPrefs = teachers.map(t => ({
        ...t,
        preferences: preferences[t.id] || {},
      }));

      const postData = {
        teachers: teachersWithPrefs,
        classes,
        constraints,
      };

      const response = await fetch('http://localhost:8000/api/flexible_scheduling.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        let errMsg = 'Failed to generate schedule';
        try {
          const errData = await response.json();
          errMsg = errData.error || errMsg;
        } catch {
          // ignore JSON parse error
        }
        throw new Error(errMsg);
      }

      const text = await response.text();
      if (!text) {
        throw new Error('Empty response from server');
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error('Invalid JSON response from server');
      }

      if (data.error) {
        setError(data.error);
        setSchedules({});
        alert('Error generating schedule: ' + data.error);
      } else {
        setSchedules(data);
        alert('Schedule generated successfully!');
      }
    } catch (err) {
      setError(err.message);
      alert('Error generating schedule: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ height: "400px" }}>
      <h2>Flexible Scheduling</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <h3>Constraints</h3>
      <label style={{ display: 'block', marginBottom: '1rem' }}>
        Max Hours per Week:
        <input
          type="number"
          value={constraints.max_hours_per_week}
          onChange={e => handleConstraintChange('max_hours_per_week', Number(e.target.value))}
          min={1}
          style={{ marginLeft: '5rem' }}
        />
      </label>
      <label style={{ display: 'block', marginBottom: '1rem' }}>
        Min Rest Hours Between Shifts:
        <input
          type="number"
          value={constraints.min_rest_hours}
          onChange={e => handleConstraintChange('min_rest_hours', Number(e.target.value))}
          min={0}
          style={{ marginLeft: '0.5rem' }}
        />
      </label>

      <h3>Teacher Preferences</h3>
      {teachers.length === 0 && !error && <p>Loading teachers...</p>}
      {Array.isArray(teachers) ? teachers.map(teacher => (
        <div key={teacher.id} style={{ border: '1px solid #ccc', margin: '0.5rem 0', padding: '0.5rem' }}>
          <h4>{teacher.name}</h4>
          <label>
            Preferred Teaching Hours:
            <select
              value={preferences[teacher.id]?.preferred_hours || ''}
              onChange={e => handlePreferenceChange(teacher.id, 'preferred_hours', e.target.value)}
            >
              <option value="">No preference</option>
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
            </select>
          </label>
          <br />
          <label>
            Preferred Days Off (comma separated, e.g. Friday):
            <input
              type="text"
              value={preferences[teacher.id]?.preferred_days_off?.join(', ') || ''}
              onChange={e =>
                handlePreferenceChange(
                  teacher.id,
                  'preferred_days_off',
                  e.target.value.split(',').map(d => d.trim()).filter(d => d)
                )
              }
              placeholder="e.g. Friday"
            />
          </label>
        </div>
      )) : <p>Invalid teachers data format.</p>}

      <h3>Classes</h3>
      {classes.length === 0 && !error && <p>Loading classes...</p>}
      {Array.isArray(classes) ? (
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #ccc', padding: '0.25rem 0.5rem' }}>Class Name</th>
              <th style={{ border: '1px solid #ccc', padding: '0.25rem 0.5rem' }}>Class Time</th>
              <th style={{ border: '1px solid #ccc', padding: '0.25rem 0.5rem' }}>Class End Time</th>
              <th style={{ border: '1px solid #ccc', padding: '0.25rem 0.5rem' }}>Class Day</th>
              <th style={{ border: '1px solid #ccc', padding: '0.25rem 0.5rem' }}>Hours per Week</th>
            </tr>
          </thead>
          <tbody>
            {classes.map(cls => (
              <tr key={cls.id}>
                <td style={{ border: '1px solid #ccc', padding: '0.25rem 0.5rem' }}>
                  <input
                    type="text"
                    value={cls.name || ''}
                    onChange={e => handleClassChange(cls.id, 'name', e.target.value)}
                  />
                </td>
                <td style={{ border: '1px solid #ccc', padding: '0.25rem 0.5rem' }}>
                  <input
                    type="time"
                    value={cls.class_time || ''}
                    onChange={e => handleClassChange(cls.id, 'class_time', e.target.value)}
                  />
                </td>
                <td style={{ border: '1px solid #ccc', padding: '0.25rem 0.5rem' }}>
                  <input
                    type="time"
                    value={cls.class_end_time || ''}
                    onChange={e => handleClassChange(cls.id, 'class_end_time', e.target.value)}
                  />
                </td>
                <td style={{ border: '1px solid #ccc', padding: '0.25rem 0.5rem' }}>
                  <input
                    type="text"
                    value={cls.class_day || ''}
                    onChange={e => handleClassChange(cls.id, 'class_day', e.target.value)}
                    placeholder="e.g. Monday"
                  />
                </td>
                <td style={{ border: '1px solid #ccc', padding: '0.25rem 0.5rem' }}>
                  <input
                    type="number"
                    value={cls.hours_per_week || 1}
                    onChange={e => handleClassChange(cls.id, 'hours_per_week', Number(e.target.value))}
                    min={1}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>Invalid classes data format.</p>
      )}

      <button onClick={generateSchedule} disabled={loading} style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}>
        {loading ? 'Generating Schedule...' : 'Generate Schedule'}
      </button>

      {Object.keys(schedules).length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h3>Generated Schedules</h3>
          {Object.entries(schedules).map(([teacherId, schedule]) => {
            const teacher = teachers.find(t => t.id.toString() === teacherId.toString());
            return (
              <div key={teacherId} style={{ marginBottom: '1rem' }}>
                <h4>{teacher ? teacher.name : `Teacher ${teacherId}`}</h4>
                {!Array.isArray(schedule) ? (
                  <p>Invalid schedule data.</p>
                ) : schedule.length === 0 ? (
                  <p>No assigned classes.</p>
                ) : (
                  <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                    <thead>
                      <tr>
                        <th style={{ border: '1px solid #ccc', padding: '0.25rem 0.5rem' }}>Class Name</th>
                        <th style={{ border: '1px solid #ccc', padding: '0.25rem 0.5rem' }}>Start Time</th>
                        <th style={{ border: '1px solid #ccc', padding: '0.25rem 0.5rem' }}>End Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schedule.map((entry, idx) => (
                        <tr key={idx}>
                          <td style={{ border: '1px solid #ccc', padding: '0.25rem 0.5rem' }}>{entry.class_name}</td>
                          <td style={{ border: '1px solid #ccc', padding: '0.25rem 0.5rem' }}>{entry.start_time}</td>
                          <td style={{ border: '1px solid #ccc', padding: '0.25rem 0.5rem' }}>{entry.end_time}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default FlexibleScheduling;
