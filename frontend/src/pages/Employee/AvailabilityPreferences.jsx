import React from 'react';

const AvailabilityPreferences = ({ formData, handleInputChange }) => {
  return (
    <section className="section">
      <h2>Availability & Preferences</h2>
      <div className="input-group">
        <label className="label" htmlFor="availability_schedule">Availability Schedule:</label>
        <input
          type="text"
          id="availability_schedule"
          name="availability_schedule"
          value={formData.availability_schedule}
          onChange={handleInputChange}
          placeholder="e.g., M-F 8am–4pm"
          className="input"
        />
      </div>
      <div className="input-group">
        <label className="label" htmlFor="preferred_time_slots">Preferred Time Slots:</label>
        <input
          type="text"
          id="preferred_time_slots"
          name="preferred_time_slots"
          value={formData.preferred_time_slots}
          onChange={handleInputChange}
          placeholder="Morning / Afternoon / Specific times"
          className="input"
        />
      </div>
      <div className="input-group">
        <label className="label" htmlFor="preferred_days_off">Preferred Days Off:</label>
        <input
          type="text"
          id="preferred_days_off"
          name="preferred_days_off"
          value={formData.preferred_days_off}
          onChange={handleInputChange}
          placeholder="e.g., Friday"
          className="input"
        />
      </div>
      <div className="input-group">
        <label className="label" htmlFor="shift_preferences">Shift Preferences:</label>
        <input
          type="text"
          id="shift_preferences"
          name="shift_preferences"
          value={formData.shift_preferences}
          onChange={handleInputChange}
          placeholder="Early or late shift preference"
          className="input"
        />
      </div>
      <div className="input-group">
        <label className="label" htmlFor="overtime_willingness">Overtime Willingness:</label>
        <input
          type="checkbox"
          id="overtime_willingness"
          name="overtime_willingness"
          checked={formData.overtime_willingness}
          onChange={handleInputChange}
          className="checkbox"
        />
      </div>
      <div className="input-group">
        <label className="label" htmlFor="leave_requests">Leave Requests:</label>
        <input
          type="text"
          id="leave_requests"
          name="leave_requests"
          value={formData.leave_requests}
          onChange={handleInputChange}
          placeholder="Planned vacations or approved absences"
          className="input"
        />
      </div>
    </section>
  );
};

export default AvailabilityPreferences;
