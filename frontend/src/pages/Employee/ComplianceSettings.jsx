import React from 'react';

const ComplianceSettings = ({ formData, handleInputChange, handleCommaSeparatedChange }) => {
  return (
    <section className="section">
      <h2>Compliance & Constraints</h2>
      <div className="input-group">
        <label className="label" htmlFor="max_teaching_hours">Max Teaching Hours:</label>
        <input
          type="number"
          id="max_teaching_hours"
          name="max_teaching_hours"
          value={formData.max_teaching_hours}
          onChange={handleInputChange}
          min="0"
          className="input"
        />
      </div>
      <div className="input-group">
        <label className="label" htmlFor="min_rest_period">Min Rest Period:</label>
        <input
          type="text"
          id="min_rest_period"
          name="min_rest_period"
          value={formData.min_rest_period}
          onChange={handleInputChange}
          placeholder="e.g., 12 hours"
          className="input"
        />
      </div>
      <div className="input-group">
        <label className="label" htmlFor="contractual_constraints">Contractual Constraints:</label>
        <input
          type="text"
          id="contractual_constraints"
          name="contractual_constraints"
          value={formData.contractual_constraints}
          onChange={handleInputChange}
          placeholder="e.g., no weekend work"
          className="input"
        />
      </div>
      <div className="input-group">
        <label className="label" htmlFor="substitute_eligible_subjects">Substitute Eligible Subjects (comma separated):</label>
        <input
          type="text"
          id="substitute_eligible_subjects"
          name="substitute_eligible_subjects"
          value={formData.substitute_eligible_subjects.join(', ')}
          onChange={handleCommaSeparatedChange}
          className="input"
        />
      </div>
      <div className="input-group">
        <label className="label" htmlFor="substitute_availability">Substitute Availability:</label>
        <input
          type="text"
          id="substitute_availability"
          name="substitute_availability"
          value={formData.substitute_availability}
          onChange={handleInputChange}
          placeholder="Days/hours available as a sub"
          className="input"
        />
      </div>
    </section>
  );
};

export default ComplianceSettings;
