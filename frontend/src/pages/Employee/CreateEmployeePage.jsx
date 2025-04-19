import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';

const initialFormState = {
  employee_id: '',
  name: '',
  email: '',
  contact_number: '',
  position: '',
  department: '',
  photo: null,
  subjects_expertise: [],
  teaching_certifications: [],
  proficiency_level: {},
  teaching_experience_years: '',
  additional_skills: '',
  preferred_grade_levels: [],
  availability_schedule: '',
  preferred_time_slots: '',
  preferred_days_off: '',
  shift_preferences: '',
  overtime_willingness: false,
  leave_requests: '',
  assigned_classes: '',
  teaching_hours_per_week: '',
  administrative_duties: '',
  extracurricular_duties: '',
  feedback_scores: '',
  absences: '',
  max_teaching_hours: '',
  min_rest_period: '',
  contractual_constraints: '',
  substitute_eligible_subjects: [],
  substitute_availability: '',
};

const tabButtonStyle = {
  padding: '10px 20px',
  border: '1px solid #ccc',
  backgroundColor: '#f9f9f9',
  cursor: 'pointer',
  borderRadius: '5px 5px 0 0',
  fontWeight: 'bold',
};

const activeTabButtonStyle = {
  ...tabButtonStyle,
  backgroundColor: '#fff',
  borderBottom: '2px solid #007bff',
  color: '#007bff',
  cursor: 'default',
};

const sectionStyle = {
  border: '1px solid #ddd',
  borderRadius: '5px',
  padding: '20px',
  marginBottom: '20px',
  backgroundColor: '#fff',
  boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
};

const labelStyle = {
  display: 'block',
  marginBottom: '8px',
  fontWeight: '600',
};

const inputStyle = {
  width: '100%',
  padding: '8px',
  marginBottom: '15px',
  borderRadius: '4px',
  border: '1px solid #ccc',
  fontSize: '14px',
};

const selectStyle = {
  ...inputStyle,
};

const buttonStyle = {
  padding: '12px 25px',
  backgroundColor: '#007bff',
  color: '#fff',
  border: 'none',
  borderRadius: '5px',
  fontSize: '16px',
  cursor: 'pointer',
};

const previewImageStyle = {
  maxWidth: '150px',
  maxHeight: '150px',
  marginTop: '10px',
  borderRadius: '5px',
  border: '1px solid #ccc',
};

const CreateEmployeePage = () => {
  const [formData, setFormData] = useState(initialFormState);
  const [activeTab, setActiveTab] = useState('basic');
  const [photoPreview, setPhotoPreview] = useState(null);

  useEffect(() => {
    if (formData.photo) {
      const objectUrl = URL.createObjectURL(formData.photo);
      setPhotoPreview(objectUrl);

      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setPhotoPreview(null);
    }
  }, [formData.photo]);

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked });
    } else if (type === 'file') {
      setFormData({ ...formData, [name]: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleCommaSeparatedChange = (e) => {
    const { name, value } = e.target;
    const arrayValue = value.split(',').map((item) => item.trim()).filter(Boolean);
    setFormData({ ...formData, [name]: arrayValue });
  };

  const handleProficiencyChange = (subject, level) => {
    setFormData({
      ...formData,
      proficiency_level: { ...formData.proficiency_level, [subject]: level },
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form Data Submitted:', formData);
    alert('Employee data submitted! Check console for details.');
  };

  return (
    <div className="app-container" style={{ backgroundColor: '#f5f7fa', minHeight: '100vh' }}>
      <div className="content-wrapper" style={{ display: 'flex' }}>
        <Sidebar />
        <main className="main-content" style={{ flexGrow: 1, padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
          <h1 style={{ marginBottom: '30px', color: '#333' }}>Create Employee</h1>
          <div className="tabs" style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('basic')}
              disabled={activeTab === 'basic'}
              style={activeTab === 'basic' ? activeTabButtonStyle : tabButtonStyle}
            >
              Profile Info
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('skills')}
              disabled={activeTab === 'skills'}
              style={activeTab === 'skills' ? activeTabButtonStyle : tabButtonStyle}
            >
              Skills & Certifications
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('availability')}
              disabled={activeTab === 'availability'}
              style={activeTab === 'availability' ? activeTabButtonStyle : tabButtonStyle}
            >
              Availability & Preferences
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('workload')}
              disabled={activeTab === 'workload'}
              style={activeTab === 'workload' ? activeTabButtonStyle : tabButtonStyle}
            >
              Current Workload
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('compliance')}
              disabled={activeTab === 'compliance'}
              style={activeTab === 'compliance' ? activeTabButtonStyle : tabButtonStyle}
            >
              Compliance Settings
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {activeTab === 'basic' && (
              <section style={sectionStyle}>
                <h2>Basic Information</h2>
                <label style={labelStyle}>
                  Employee ID*:
                  <input
                    type="text"
                    name="employee_id"
                    value={formData.employee_id}
                    onChange={handleInputChange}
                    required
                    style={inputStyle}
                  />
                </label>
                <label style={labelStyle}>
                  Full Name*:
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    style={inputStyle}
                  />
                </label>
                <label style={labelStyle}>
                  Email:
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    style={inputStyle}
                  />
                </label>
                <label style={labelStyle}>
                  Contact Number:
                  <input
                    type="tel"
                    name="contact_number"
                    value={formData.contact_number}
                    onChange={handleInputChange}
                    style={inputStyle}
                  />
                </label>
                <label style={labelStyle}>
                  Position*:
                  <input
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleInputChange}
                    required
                    style={inputStyle}
                  />
                </label>
                <label style={labelStyle}>
                  Department*:
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    required
                    style={inputStyle}
                  />
                </label>
                <label style={labelStyle}>
                  Profile Picture:
                  <input
                    type="file"
                    name="photo"
                    accept="image/*"
                    onChange={handleInputChange}
                    style={{ marginTop: '5px' }}
                  />
                </label>
                {photoPreview && <img src={photoPreview} alt="Profile Preview" style={previewImageStyle} />}
              </section>
            )}

            {activeTab === 'skills' && (
              <section style={sectionStyle}>
                <h2>Skills & Qualifications</h2>
                <label style={labelStyle}>
                  Subjects Expertise (comma separated):
                  <input
                    type="text"
                    name="subjects_expertise"
                    value={formData.subjects_expertise.join(', ')}
                    onChange={handleCommaSeparatedChange}
                    style={inputStyle}
                  />
                </label>
                <label style={labelStyle}>
                  Teaching Certifications (comma separated):
                  <input
                    type="text"
                    name="teaching_certifications"
                    value={formData.teaching_certifications.join(', ')}
                    onChange={handleCommaSeparatedChange}
                    style={inputStyle}
                  />
                </label>
                <label style={labelStyle}>
                  Teaching Experience (years):
                  <input
                    type="number"
                    name="teaching_experience_years"
                    value={formData.teaching_experience_years}
                    onChange={handleInputChange}
                    min="0"
                    style={inputStyle}
                  />
                </label>
                <label style={labelStyle}>
                  Additional Skills:
                  <input
                    type="text"
                    name="additional_skills"
                    value={formData.additional_skills}
                    onChange={handleInputChange}
                    style={inputStyle}
                  />
                </label>
                <label style={labelStyle}>
                  Preferred Grade Levels (comma separated):
                  <input
                    type="text"
                    name="preferred_grade_levels"
                    value={formData.preferred_grade_levels.join(', ')}
                    onChange={handleCommaSeparatedChange}
                    style={inputStyle}
                  />
                </label>
                <div>
                  <h3>Proficiency Level per Subject</h3>
                  {formData.subjects_expertise.length === 0 && <p>No subjects added yet.</p>}
                  {formData.subjects_expertise.map((subject) => (
                    <div key={subject} style={{ marginBottom: '10px' }}>
                      <label style={{ marginRight: '10px' }}>{subject}:</label>
                      <select
                        value={formData.proficiency_level[subject] || ''}
                        onChange={(e) => handleProficiencyChange(subject, e.target.value)}
                        style={selectStyle}
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
            )}

            {activeTab === 'availability' && (
              <section style={sectionStyle}>
                <h2>Availability & Preferences</h2>
                <label style={labelStyle}>
                  Availability Schedule:
                  <input
                    type="text"
                    name="availability_schedule"
                    value={formData.availability_schedule}
                    onChange={handleInputChange}
                    placeholder="e.g., M-F 8am–4pm"
                    style={inputStyle}
                  />
                </label>
                <label style={labelStyle}>
                  Preferred Time Slots:
                  <input
                    type="text"
                    name="preferred_time_slots"
                    value={formData.preferred_time_slots}
                    onChange={handleInputChange}
                    placeholder="Morning / Afternoon / Specific times"
                    style={inputStyle}
                  />
                </label>
                <label style={labelStyle}>
                  Preferred Days Off:
                  <input
                    type="text"
                    name="preferred_days_off"
                    value={formData.preferred_days_off}
                    onChange={handleInputChange}
                    placeholder="e.g., Friday"
                    style={inputStyle}
                  />
                </label>
                <label style={labelStyle}>
                  Shift Preferences:
                  <input
                    type="text"
                    name="shift_preferences"
                    value={formData.shift_preferences}
                    onChange={handleInputChange}
                    placeholder="Early or late shift preference"
                    style={inputStyle}
                  />
                </label>
                <label style={labelStyle}>
                  Overtime Willingness:
                  <input
                    type="checkbox"
                    name="overtime_willingness"
                    checked={formData.overtime_willingness}
                    onChange={handleInputChange}
                    style={{ marginLeft: '10px' }}
                  />
                </label>
                <label style={labelStyle}>
                  Leave Requests:
                  <input
                    type="text"
                    name="leave_requests"
                    value={formData.leave_requests}
                    onChange={handleInputChange}
                    placeholder="Planned vacations or approved absences"
                    style={inputStyle}
                  />
                </label>
              </section>
            )}

            {activeTab === 'workload' && (
              <section style={sectionStyle}>
                <h2>Current Workload</h2>
                <label style={labelStyle}>
                  Assigned Classes:
                  <input
                    type="text"
                    name="assigned_classes"
                    value={formData.assigned_classes}
                    onChange={handleInputChange}
                    style={inputStyle}
                  />
                </label>
                <label style={labelStyle}>
                  Teaching Hours per Week:
                  <input
                    type="number"
                    name="teaching_hours_per_week"
                    value={formData.teaching_hours_per_week}
                    onChange={handleInputChange}
                    min="0"
                    style={inputStyle}
                  />
                </label>
                <label style={labelStyle}>
                  Administrative Duties:
                  <input
                    type="text"
                    name="administrative_duties"
                    value={formData.administrative_duties}
                    onChange={handleInputChange}
                    style={inputStyle}
                  />
                </label>
                <label style={labelStyle}>
                  Extracurricular Duties:
                  <input
                    type="text"
                    name="extracurricular_duties"
                    value={formData.extracurricular_duties}
                    onChange={handleInputChange}
                    style={inputStyle}
                  />
                </label>
                <label style={labelStyle}>
                  Feedback Scores:
                  <input
                    type="text"
                    name="feedback_scores"
                    value={formData.feedback_scores}
                    onChange={handleInputChange}
                    style={inputStyle}
                  />
                </label>
                <label style={labelStyle}>
                  Absences:
                  <input
                    type="text"
                    name="absences"
                    value={formData.absences}
                    onChange={handleInputChange}
                    style={inputStyle}
                  />
                </label>
              </section>
            )}

            {activeTab === 'compliance' && (
              <section style={sectionStyle}>
                <h2>Compliance & Constraints</h2>
                <label style={labelStyle}>
                  Max Teaching Hours:
                  <input
                    type="number"
                    name="max_teaching_hours"
                    value={formData.max_teaching_hours}
                    onChange={handleInputChange}
                    min="0"
                    style={inputStyle}
                  />
                </label>
                <label style={labelStyle}>
                  Min Rest Period:
                  <input
                    type="text"
                    name="min_rest_period"
                    value={formData.min_rest_period}
                    onChange={handleInputChange}
                    placeholder="e.g., 12 hours"
                    style={inputStyle}
                  />
                </label>
                <label style={labelStyle}>
                  Contractual Constraints:
                  <input
                    type="text"
                    name="contractual_constraints"
                    value={formData.contractual_constraints}
                    onChange={handleInputChange}
                    placeholder="e.g., no weekend work"
                    style={inputStyle}
                  />
                </label>
                <label style={labelStyle}>
                  Substitute Eligible Subjects (comma separated):
                  <input
                    type="text"
                    name="substitute_eligible_subjects"
                    value={formData.substitute_eligible_subjects.join(', ')}
                    onChange={handleCommaSeparatedChange}
                    style={inputStyle}
                  />
                </label>
                <label style={labelStyle}>
                  Substitute Availability:
                  <input
                    type="text"
                    name="substitute_availability"
                    value={formData.substitute_availability}
                    onChange={handleInputChange}
                    placeholder="Days/hours available as a sub"
                    style={inputStyle}
                  />
                </label>
              </section>
            )}

            <div style={{ marginTop: '20px' }}>
              <button type="submit" style={buttonStyle}>Save Employee</button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
};

export default CreateEmployeePage;
