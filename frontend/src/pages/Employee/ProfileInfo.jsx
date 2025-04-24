import React from 'react';

const ProfileInfo = ({ formData, handleInputChange, photoPreview }) => {
  return (
    <section className="section">
      <h2>Basic Information</h2>
      <div className="input-group">
        <label className="label" htmlFor="employee_id">Employee ID*:</label>
        <input
          type="text"
          id="employee_id"
          name="employee_id"
          value={formData.employee_id}
          onChange={handleInputChange}
          required
          className="input"
        />
      </div>
      <div className="input-group">
        <label className="label" htmlFor="name">Full Name*:</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          required
          className="input"
        />
      </div>
      <div className="input-group">
        <label className="label" htmlFor="email">Email:</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          className="input"
        />
      </div>
      <div className="input-group">
        <label className="label" htmlFor="contact_number">Contact Number:</label>
        <input
          type="tel"
          id="contact_number"
          name="contact_number"
          value={formData.contact_number}
          onChange={handleInputChange}
          className="input"
        />
      </div>
      <div className="input-group">
        <label className="label" htmlFor="position">Position*:</label>
        <input
          type="text"
          id="position"
          name="position"
          value={formData.position}
          onChange={handleInputChange}
          required
          className="input"
        />
      </div>
      <div className="input-group">
        <label className="label" htmlFor="department">Department*:</label>
        <input
          type="text"
          id="department"
          name="department"
          value={formData.department}
          onChange={handleInputChange}
          required
          className="input"
        />
      </div>
      <div className="input-group">
        <label className="label" htmlFor="photo">Profile Picture:</label>
        <input
          type="file"
          id="photo"
          name="photo"
          accept="image/*"
          onChange={handleInputChange}
          className="input"
        />
      </div>
      {photoPreview && <img src={photoPreview} alt="Profile Preview" className="preview-image" />}
    </section>
  );
};

export default ProfileInfo;
