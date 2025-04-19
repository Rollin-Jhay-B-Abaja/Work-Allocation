"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Search, Plus, Filter } from "lucide-react"

export default function FlexibleScheduling({ onBack }) {
  const [teachers, setTeachers] = useState([])
  const [classes, setClasses] = useState([])
  const [assignments, setAssignments] = useState({})
  const [constraints, setConstraints] = useState({
    max_hours_per_week: 30,
    min_rest_hours: 8,
  })
  const [preferences, setPreferences] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchTeachers()
    fetchClasses()
  }, [])

  const fetchTeachers = async () => {
    try {
      const res = await fetch("backend/api/skill_based_matching.php?resource=teachers")
      const data = await res.json()
      setTeachers(data)
    } catch (err) {
      setError("Failed to fetch teachers")
    }
  }

  const fetchClasses = async () => {
    try {
      const res = await fetch("backend/api/skill_based_matching.php?resource=classes")
      const data = await res.json()
      setClasses(data)
    } catch (err) {
      setError("Failed to fetch classes")
    }
  }

  const handleMatch = async () => {
    setLoading(true)
    setError(null)
    try {
      const payload = {
        teachers,
        classes,
        constraints,
        preferences,
      }
      const res = await fetch("backend/api/skill_based_matching.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      setAssignments(data)
    } catch (err) {
      setError("Failed to perform matching")
    }
    setLoading(false)
  }

  return (
    <div className="module-container">
      <div className="module-header">
        <button className="back-button" onClick={onBack}>
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>
        <h2>Flexible Scheduling</h2>
        <p>Generate customizable schedules for teachers based on their preferences and the school's requirements.</p>
      </div>

      <div className="module-actions">
        <div className="search-container">
          <Search size={18} />
          <input type="text" placeholder="Search schedules..." className="search-input" />
        </div>
        <button className="action-button">
          <Filter size={18} />
          <span>Filters</span>
        </button>
        <button className="action-button primary" onClick={handleMatch} disabled={loading}>
          <Plus size={18} />
          <span>{loading ? "Matching..." : "Run Scheduling"}</span>
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="module-content">
        <div className="content-section">
          <h3>Schedule Overview</h3>
          <div className="schedule-grid">
            {classes.length === 0 ? (
              <p>No classes available</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Class</th>
                    <th>Assigned Teacher</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.map((cls) => (
                    <tr key={cls.id}>
                      <td>{cls.name}</td>
                      <td>{assignments[cls.name] || "Unassigned"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="content-section">
          <h3>Teacher Preferences</h3>
          <table>
            <thead>
              <tr>
                <th>Teacher</th>
                <th>Preferred Hours</th>
                <th>Preferred Days Off</th>
                <th>Shift Preference</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((teacher) => (
                <tr key={teacher.id}>
                  <td>{teacher.name}</td>
                  <td>{teacher.preferences.preferred_hours || "Any"}</td>
                  <td>{(teacher.preferences.preferred_days_off || []).join(", ")}</td>
                  <td>{teacher.preferences.shift_preference || "None"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="content-section">
          <h3>Constraints</h3>
          <div>
            <label>
              Max Hours Per Week:
              <input
                type="number"
                value={constraints.max_hours_per_week}
                onChange={(e) => setConstraints({ ...constraints, max_hours_per_week: parseInt(e.target.value) })}
              />
            </label>
          </div>
          <div>
            <label>
              Min Rest Hours Between Shifts:
              <input
                type="number"
                value={constraints.min_rest_hours}
                onChange={(e) => setConstraints({ ...constraints, min_rest_hours: parseInt(e.target.value) })}
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}
