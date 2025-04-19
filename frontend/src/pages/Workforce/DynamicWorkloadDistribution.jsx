"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Plus, BarChart } from "lucide-react"

export default function DynamicWorkloadDistribution({ onBack }) {
  const [teachers, setTeachers] = useState([])
  const [classes, setClasses] = useState([])
  const [assignments, setAssignments] = useState({})
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
        constraints: {
          max_hours_per_week: 30,
          // Add more constraints as needed
        },
        preferences: {
          // Add preferences as needed
        }
      }
      const res = await fetch("backend/api/skill_based_matching.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
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
        <h2>Dynamic Workload Distribution</h2>
        <p>
          Ensure fair and efficient allocation of teaching hours, administrative duties, and extracurricular activities.
        </p>
      </div>

      <div className="module-actions">
        <button className="action-button primary" onClick={handleMatch} disabled={loading}>
          <Plus size={18} />
          <span>{loading ? "Matching..." : "Run Matching"}</span>
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="module-content">
        <div className="content-section">
          <h3>Teacher Workload Distribution</h3>
          <div className="data-table">
            <table>
              <thead>
                <tr>
                  <th>Class</th>
                  <th>Assigned Teacher</th>
                </tr>
              </thead>
              <tbody>
                {classes.map((c) => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>{assignments[c.name] || "Unassigned"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="content-section">
          <h3>Teacher Details</h3>
          <ul>
            {teachers.map((t) => (
              <li key={t.id}>
                {t.name} - Max Hours/Week: {t.max_hours_per_week}
              </li>
            ))}
          </ul>
        </div>

        <div className="content-section">
          <h3>Workload Visualization</h3>
          <div className="chart-placeholder">
            <BarChart size={48} />
            <p>Workload distribution chart would appear here</p>
          </div>
        </div>
      </div>
    </div>
  )
}
