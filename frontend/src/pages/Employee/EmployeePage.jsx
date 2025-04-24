import React, { useState } from 'react';
import Sidebar from '../../components/Sidebar';
import ProfileInfo from './ProfileInfo';
import SkillsCertifications from './SkillsCertifications';
import AvailabilityPreferences from './AvailabilityPreferences';
import CurrentWorkload from './CurrentWorkload';
import ComplianceSettings from './ComplianceSettings';
import './EmployeePage.css';

const EmployeePage = () => {
  const [formData, setFormData] = useState({
    employee_id: '',
    name: '',
    email: '',
    contact_number: '',
    position: '',
    department: '',
    photo: null,
    subjects_expertise: [],
    teaching_certifications: [],
    teaching_experience_years: '',
    additional_skills: '',
    preferred_grade_levels: [],
    proficiency_level: {},
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
  });

  const [photoPreview, setPhotoPreview] = useState(null);
  const [step, setStep] = useState(1);

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'checkbox') {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (type === 'file') {
      const file = files[0];
      setFormData((prev) => ({ ...prev, [name]: file }));
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotoPreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setPhotoPreview(null);
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
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

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission logic here, e.g., API call
    console.log('Form submitted:', formData);
  };

  const nextStep = () => {
    setStep((prev) => Math.min(prev + 1, 5));
  };

  const prevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const renderStep = () => {
    switch (step) {
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
    <div className="employee-page-container app-container" style={{ display: 'flex' }}>
      <Sidebar />
      <form className="main-content" onSubmit={handleSubmit}>
        <h1>Employee Information</h1>
        <div className="step-indicator">
          {[1, 2, 3, 4, 5].map((num) => (
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
          {step > 1 && (
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
    </div>
  );
};

export default EmployeePage;
