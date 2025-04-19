"use client"

import './SkillBasedMatching.css'
import { useState, useEffect } from 'react'
import { ArrowLeft, Search, Plus, Filter } from "lucide-react"

export default function SkillBasedMatching({ onBack }) {
  const [teachers, setTeachers] = useState([])
  const [classes, setClasses] = useState([])
  const [matches, setMatches] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Fetch teacher profiles
    fetch('http://localhost/backend/api/skill_based_matching.php?resource=teachers')
      .then(res => res.json())
      .then(data => setTeachers(data))
      .catch(err => setError('Failed to load teachers'))

    // Fetch class/activity requirements
    fetch('http://localhost/backend/api/skill_based_matching.php?resource=classes')
      .then(res => res.json())
      .then(data => setClasses(data))
      .catch(err => setError('Failed to load classes'))
  }, [])

  const handleMatch = () => {
    setLoading(true)
    setError(null)
    fetch('http://localhost/backend/api/skill_based_matching.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teachers, classes })
    })
      .then(res => res.json())
      .then(data => {
        setMatches(data)
        setLoading(false)
      })
      .catch(err => {
        setError('Matching failed')
        setLoading(false)
      })
  }

  return (
    <div className="module-container">
      <div className="module-header">
        <button className="back-button" onClick={onBack}>
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>
        <h2>Skill-based Matching</h2>
        <p>
          Match teachers to classes, extracurricular activities, or administrative roles based on their skills and
          qualifications.
        </p>
      </div>

      <div className="module-actions">
        <div className="search-container">
          <Search size={18} />
          <input type="text" placeholder="Search teachers or classes..." className="search-input" />
        </div>
        <button className="action-button">
          <Filter size={18} />
          <span>Filters</span>
        </button>
        <button className="action-button primary" onClick={handleMatch} disabled={loading}>
          <Plus size={18} />
          <span>{loading ? 'Matching...' : 'New Match'}</span>
        </button>
      </div>

      {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}

      <div className="module-content">
        <div className="content-section">
          <h3>Teacher Profiles</h3>
          <div className="data-table">
            <table>
              <thead>
                <tr>
                  <th>Name & ID</th>
                  <th>Subjects Expertise</th>
                  <th>Certifications</th>
                  <th>Experience</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((teacher) => (
                  <tr key={teacher.id}>
                    <td>{teacher.name} ({teacher.id})</td>
                    <td>{teacher.subjects_expertise.join(', ')}</td>
                    <td>{teacher.certifications.join(', ')}</td>
                    <td>{teacher.experience_years} years</td>
                    <td>
                      <button className="table-action">View</button>
                      <button className="table-action">Match</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="content-section">
          <h3>Class/Activity Requirements</h3>
          <div className="data-table">
            <table>
              <thead>
                <tr>
                  <th>Class/Activity</th>
                  <th>Required Skills</th>
                  <th>Hours/Week</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {classes.map((cls) => (
                  <tr key={cls.id}>
                    <td>{cls.name}</td>
                    <td>{cls.required_skills.join(', ')}</td>
                    <td>{cls.hours_per_week}</td>
                    <td>
                      <span className={`status ${cls.status}`}>{cls.status.charAt(0).toUpperCase() + cls.status.slice(1)}</span>
                    </td>
                    <td>
                      <button className="table-action">View</button>
                      <button className="table-action">{cls.status === 'assigned' ? 'Reassign' : 'Assign'}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {Object.keys(matches).length > 0 && (
          <div className="content-section" style={{ flexBasis: '100%' }}>
            <h3>Matching Results</h3>
            <div className="data-table">
              <table>
                <thead>
                  <tr>
                    <th>Class/Activity</th>
                    <th>Matched Teacher</th>
                    <th>Match Score</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(matches).map(([className, match]) => (
                    <tr key={className}>
                      <td>{className}</td>
                      <td>{match.teacher}</td>
                      <td>{match.score.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
