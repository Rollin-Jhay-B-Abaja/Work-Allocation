import React, { useState } from 'react';

const EmployeeCreateForm = ({ formData, setFormData, onBack }) => {
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(null);

  const importantFields = [
    { name: 'name', label: 'Name', required: true },
    { name: 'email', label: 'Email', required: true, type: 'email' },
    { name: 'contact_number', label: 'Contact Number', required: false, type: 'tel' },
    { name: 'position', label: 'Position', required: true },
    { name: 'department', label: 'Department', required: true },
    { name: 'teaching_certifications', label: 'Teaching Certifications', required: false },
    { name: 'subjects_expertise', label: 'Subjects Expertise', required: false },
    { name: 'teaching_hours_per_week', label: 'Teaching Hours Per Week', required: false, type: 'number' },
    { name: 'administrative_duties', label: 'Administrative Duties', required: false },
    { name: 'extracurricular_duties', label: 'Extracurricular Duties', required: false },
    { name: 'max_teaching_hours', label: 'Max Teaching Hours', required: false, type: 'number' },
    { name: 'hire_date', label: 'Hire Date', required: false, type: 'date' },
    { name: 'employment_status', label: 'Employment Status', required: false },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);
    try {
      const dataToSend = {};
      importantFields.forEach(({ name }) => {
        if (formData[name] !== undefined) {
          dataToSend[name] = formData[name];
        }
      });

      const response = await fetch('http://localhost:8000/api/employee_handler.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });
      const result = await response.json();
      if (response.ok) {
        setSubmitSuccess(result.message || 'Employee data saved successfully.');
      } else {
        setSubmitError(result.error || 'Failed to save employee data.');
      }
    } catch (error) {
      setSubmitError('Error saving employee data: ' + error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '600px', margin: '2rem auto', padding: '2rem', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#1e1e1e' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Create New Employee</h2>
      {importantFields.map(({ name, label, required, type }) => (
        <div key={name} style={{ marginBottom: '1rem' }}>
          <label htmlFor={name} style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
            {label}{required && <span style={{ color: 'red' }}> *</span>}
          </label>
          <input
            type={type || 'text'}
            id={name}
            name={name}
            value={formData[name] || ''}
            onChange={handleInputChange}
            required={required}
            style={{
              width: '100%',
              padding: '0.5rem',
              borderRadius: '4px',
              border: '1px solid #ccc',
              fontSize: '1rem',
              boxSizing: 'border-box',
              backgroundColor: (name === 'email' || name === 'contact_number') ? '#fff' : '#fff', color:"black",
            }}
          />
        </div>
      ))}
      {submitError && <p style={{ color: 'red', marginBottom: '1rem' }}>{submitError}</p>}
      {submitSuccess && <p style={{ color: 'green', marginBottom: '1rem' }}>{submitSuccess}</p>}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button type="button" onClick={onBack} style={{ padding: '0.5rem 1rem', fontSize: '1rem', cursor: 'pointer' }}>
          Back
        </button>
        <button type="submit" style={{ padding: '0.5rem 1.5rem', fontSize: '1rem', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Submit
        </button>
      </div>
    </form>
  );
};

export default EmployeeCreateForm;
