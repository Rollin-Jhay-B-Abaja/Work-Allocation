import React from 'react';

const CurrentWorkload = ({ formData, handleInputChange }) => {
  return (
    <section className="section">
      <h2>Current Workload</h2>
      <div className="input-group">
        <label className="label" htmlFor="assigned_classes">Assigned Classes:</label>
        <input
          type="text"
          id="assigned_classes"
          name="assigned_classes"
          value={formData.assigned_classes}
          onChange={handleInputChange}
          className="input"
        />
      </div>
      <div className="input-group">
        <label className="label" htmlFor="teaching_hours_per_week">Teaching Hours per Week:</label>
        <input
          type="number"
          id="teaching_hours_per_week"
          name="teaching_hours_per_week"
          value={formData.teaching_hours_per_week}
          onChange={handleInputChange}
          min="0"
          className="input"
        />
      </div>
      <div className="input-group">
        <label className="label" htmlFor="administrative_duties">Administrative Duties:</label>
        <input
          type="text"
          id="administrative_duties"
          name="administrative_duties"
          value={formData.administrative_duties}
          onChange={handleInputChange}
          className="input"
        />
      </div>
      <div className="input-group">
        <label className="label" htmlFor="extracurricular_duties">Extracurricular Duties:</label>
        <input
          type="text"
          id="extracurricular_duties"
          name="extracurricular_duties"
          value={formData.extracurricular_duties}
          onChange={handleInputChange}
          className="input"
        />
      </div>
      <div className="input-group">
        <label className="label" htmlFor="feedback_scores">Feedback Scores:</label>
        <input
          type="text"
          id="feedback_scores"
          name="feedback_scores"
          value={formData.feedback_scores}
          onChange={handleInputChange}
          className="input"
        />
      </div>
      <div className="input-group">
        <label className="label" htmlFor="absences">Absences:</label>
        <input
          type="text"
          id="absences"
          name="absences"
          value={formData.absences}
          onChange={handleInputChange}
          className="input"
        />
      </div>
    </section>
  );
};

export default CurrentWorkload;
