import React from 'react';

const SkillsCertifications = ({ formData, handleInputChange, handleCommaSeparatedChange, handleProficiencyChange }) => {
  return (
    <section className="section">
      <h2>Skills & Qualifications</h2>
      <div className="input-group">
        <label className="label" htmlFor="subjects_expertise">Subjects Expertise (comma separated):</label>
        <input
          type="text"
          id="subjects_expertise"
          name="subjects_expertise"
          value={formData.subjects_expertise.join(', ')}
          onChange={handleCommaSeparatedChange}
          className="input"
        />
      </div>
      <div className="input-group">
        <label className="label" htmlFor="teaching_certifications">Teaching Certifications (comma separated):</label>
        <input
          type="text"
          id="teaching_certifications"
          name="teaching_certifications"
          value={formData.teaching_certifications.join(', ')}
          onChange={handleCommaSeparatedChange}
          className="input"
        />
      </div>
      <div className="input-group">
        <label className="label" htmlFor="teaching_experience_years">Teaching Experience (years):</label>
        <input
          type="number"
          id="teaching_experience_years"
          name="teaching_experience_years"
          value={formData.teaching_experience_years}
          onChange={handleInputChange}
          min="0"
          className="input"
        />
      </div>
      <div className="input-group">
        <label className="label" htmlFor="additional_skills">Additional Skills:</label>
        <input
          type="text"
          id="additional_skills"
          name="additional_skills"
          value={formData.additional_skills}
          onChange={handleInputChange}
          className="input"
        />
      </div>
      <div className="input-group">
        <label className="label" htmlFor="preferred_grade_levels">Preferred Grade Levels (comma separated):</label>
        <input
          type="text"
          id="preferred_grade_levels"
          name="preferred_grade_levels"
          value={formData.preferred_grade_levels.join(', ')}
          onChange={handleCommaSeparatedChange}
          className="input"
        />
      </div>
      <div>
        <h3>Proficiency Level per Subject</h3>
        {formData.subjects_expertise.length === 0 && <p>No subjects added yet.</p>}
        {formData.subjects_expertise.map((subject) => (
          <div key={subject} style={{ marginBottom: '10px' }}>
            <label style={{ marginRight: '10px' }}>{subject}:</label>
            <select
              value={formData.proficiency_level[subject] || ''}
              onChange={(e) => handleProficiencyChange(subject, e.target.value)}
              className="select"
            >
              <option value="">Select level</option>
              <option value="Basic">Basic</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
        ))}
      </div>
    </section>
  );
};

export default SkillsCertifications;
