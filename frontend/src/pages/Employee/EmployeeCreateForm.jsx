import React, { useState, useEffect } from 'react';
import ProfileInfo from './ProfileInfo';
import SkillsCertifications from './SkillsCertifications';
import AvailabilityPreferences from './AvailabilityPreferences';
import CurrentWorkload from './CurrentWorkload';
import ComplianceSettings from './ComplianceSettings';

const EmployeeCreateForm = ({ formData, setFormData, photoPreview, setPhotoPreview, onBack, onSubmit }) => {
  const [step, setStep] = useState(0);
  const [csvError, setCsvError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(null);

  useEffect(() => {
    // Reset form when component mounts
    setStep(0);
    setPhotoPreview(null);
    setCsvError(null);
    setUploadSuccess(null);
  }, [setPhotoPreview]);

  const requiredFields = [
    'name',
    'email',
    'contact_number',
    'position',
    'department',
    'photo',
    'subjects_expertise',
    'teaching_certifications',
    'teaching_experience_years',
    'additional_skills',
    'preferred_grade_levels',
    'proficiency_level',
    'availability_schedule',
    'preferred_time_slots',
    'preferred_days_off',
    'shift_preferences',
    'overtime_willingness',
    'leave_requests',
    'assigned_classes',
    'teaching_hours_per_week',
    'administrative_duties',
    'extracurricular_duties',
    'feedback_scores',
    'absences',
    'max_teaching_hours',
    'min_rest_period',
    'contractual_constraints',
    'substitute_eligible_subjects',
    'substitute_availability',
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'checkbox') {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (type === 'file') {
      const file = files[0];
      if (file && file.name.endsWith('.csv')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const text = event.target.result;
          // Validate CSV header
          const lines = text.split(/\r\n|\n/);
          if (lines.length === 0) {
            setCsvError('CSV file is empty.');
            setFormData((prev) => ({ ...prev, [name]: null }));
            setPhotoPreview(null);
            return;
          }
          const headerLine = lines[0];
          const headers = headerLine.split(',').map(h => h.trim().toLowerCase());
          const missingFields = requiredFields.filter(field => !headers.includes(field.toLowerCase()));
          if (missingFields.length > 0) {
            setCsvError('CSV file is missing required fields: ' + missingFields.join(', '));
            setFormData((prev) => ({ ...prev, [name]: null }));
            setPhotoPreview(null);
            return;
          }
          // If validation passes
          setCsvError(null);
          setFormData((prev) => ({ ...prev, [name]: file }));
          setUploadSuccess(null);
          // Upload CSV file to backend
          uploadCsvFile(file);
        };
        reader.readAsText(file);
      } else {
        setCsvError('Please upload a valid CSV file.');
        setFormData((prev) => ({ ...prev, [name]: null }));
        setPhotoPreview(null);
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const uploadCsvFile = async (file) => {
    setUploading(true);
    setUploadSuccess(null);
    setCsvError(null);
    const formData = new FormData();
    formData.append('csv_upload', file);
    try {
      const response = await fetch('http://localhost:8000/api/employee_handler.php', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      if (response.ok) {
        setUploadSuccess(result.message || 'CSV uploaded and processed successfully.');
      } else {
        setCsvError(result.error || 'Failed to upload CSV.');
      }
    } catch (error) {
      setCsvError('Error uploading CSV: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleCommaSeparatedChange = (e) => {
    const { name, value } = e.target;
    const array = value.split(',').map((item) => item.trim()).filter((item) => item.length > 0);
    setFormData((prev) => ({ ...prev, [name]: array }));
  };

  const handleProficiencyChange = (subject, level) => {
    setFormData((prev) => ({
      ...prev,
      proficiency_level: {
        ...prev.proficiency_level,
        [subject]: level,
      },
    }));
  };

  const nextStep = () => {
    setStep((prev) => Math.min(prev + 1, 5));
  };

  const prevStep = () => {
    setStep((prev) => Math.max(prev - 1, 0));
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div>
            <div className="input-group">
              <label className="label" htmlFor="csv_upload">Upload Employee Data (CSV):</label>
              <input
                type="file"
                id="csv_upload"
                name="csv_upload"
                accept=".csv"
                onChange={handleInputChange}
                className="input"
                disabled={uploading}
              />
            {csvError && <p className="error-message">{csvError}</p>}
            {uploadSuccess && <p className="success-message">{uploadSuccess}</p>}
            {uploading && <p className="uploading-message">Uploading CSV...</p>}
          </div>
          <div className="csv-required-fields-container">
              <h3>Required CSV Data Fields</h3>
              <table className="csv-required-fields-table">
                <thead>
                  <tr>
                    <th>Field</th>
                    <th>Example Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>name</td><td>John Doe</td></tr>
                  <tr><td>email</td><td>john.doe@example.com</td></tr>
                  <tr><td>contact_number</td><td>+1234567890</td></tr>
                  <tr><td>position</td><td>Teacher</td></tr>
                  <tr><td>department</td><td>Mathematics</td></tr>
                  <tr><td>photo</td><td>URL or file path</td></tr>
                  <tr><td>subjects_expertise</td><td>Math;Science;English</td></tr>
                  <tr><td>teaching_certifications</td><td>Certified Math Teacher</td></tr>
                  <tr><td>teaching_experience_years</td><td>5</td></tr>
                  <tr><td>additional_skills</td><td>Public Speaking</td></tr>
                  <tr><td>preferred_grade_levels</td><td>Grade 9;Grade 10</td></tr>
                  <tr><td>proficiency_level</td><td>Math:Advanced;Science:Intermediate</td></tr>
                  <tr><td>availability_schedule</td><td>M-F 8am-4pm</td></tr>
                  <tr><td>preferred_time_slots</td><td>8am-12pm</td></tr>
                  <tr><td>preferred_days_off</td><td>Saturday</td></tr>
                  <tr><td>shift_preferences</td><td>Day Shift</td></tr>
                  <tr><td>overtime_willingness</td><td>true</td></tr>
                  <tr><td>leave_requests</td><td>None</td></tr>
                  <tr><td>assigned_classes</td><td>Class 9A</td></tr>
                  <tr><td>teaching_hours_per_week</td><td>20</td></tr>
                  <tr><td>administrative_duties</td><td>Committee Member</td></tr>
                  <tr><td>extracurricular_duties</td><td>Coach</td></tr>
                  <tr><td>feedback_scores</td><td>4.5</td></tr>
                  <tr><td>absences</td><td>2</td></tr>
                  <tr><td>max_teaching_hours</td><td>25</td></tr>
                  <tr><td>min_rest_period</td><td>12 hours</td></tr>
                  <tr><td>contractual_constraints</td><td>None</td></tr>
                  <tr><td>substitute_eligible_subjects</td><td>Math;Science</td></tr>
                  <tr><td>substitute_availability</td><td>M-F</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      case 1:
        return <ProfileInfo formData={formData} handleInputChange={handleInputChange} photoPreview={photoPreview} />;
      case 2:
        return (
          <SkillsCertifications
            formData={formData}
            handleInputChange={handleInputChange}
            handleCommaSeparatedChange={handleCommaSeparatedChange}
            handleProficiencyChange={handleProficiencyChange}
          />
        );
      case 3:
        return <AvailabilityPreferences formData={formData} handleInputChange={handleInputChange} />;
      case 4:
        return <CurrentWorkload formData={formData} handleInputChange={handleInputChange} />;
      case 5:
        return (
          <ComplianceSettings
            formData={formData}
            handleInputChange={handleInputChange}
            handleCommaSeparatedChange={handleCommaSeparatedChange}
          />
        );
      default:
        return null;
    }
  };

  return (
    <form className="main-content" onSubmit={onSubmit}>
      <h1>Employee Information</h1>
      <div className="step-indicator">
        {[0, 1, 2, 3, 4, 5].map((num) => (
          <div
            key={num}
            className={`step-circle ${step === num ? 'active' : ''}`}
          >
            {num}
          </div>
        ))}
      </div>
      {renderStep()}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
        <button type="button" className="button" onClick={onBack}>
          Back
        </button>
        {step > 0 && (
          <button type="button" className="button" onClick={prevStep}>
            Previous
          </button>
        )}
        {step < 5 && (
          <button type="button" className="button" onClick={nextStep}>
            Next
          </button>
        )}
        {step === 5 && (
          <button type="submit" className="button">
            Submit
          </button>
        )}
      </div>
    </form>
  );
};

export default EmployeeCreateForm;
