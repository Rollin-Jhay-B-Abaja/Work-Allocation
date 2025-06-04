import React, { useState, useEffect } from 'react';
import EmployeeCreateForm from './EmployeeCreateForm';
import EmployeeViewProfile from './EmployeeViewProfile';
import LoadingSpinner from '../../components/LoadingSpinner';

const EmployeeHome = () => {
  const [activeTab, setActiveTab] = useState('view'); // 'view' or 'create'
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
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

  useEffect(() => {
    // Reset form when switching to create view
    if (activeTab === 'create') {
      setFormData({
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
      setPhotoPreview(null);
    }
  }, [activeTab]);

  const handleTabClick = (tab) => {
    setLoading(true);
    setActiveTab(tab);
    // Simulate loading delay for demonstration; replace with real data fetching if needed
    setTimeout(() => {
      setLoading(false);
    }, 500);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Implement form submission logic or lift it up to parent component
    // For now, just log formData and switch to view tab
    console.log('Form submitted:', formData);
    setActiveTab('view');
  };

  return (
    <div className="employee-home-container" style={{ padding: '30px', marginTop:'-60px', marginLeft:'1rem'}}>
      <h1>Employee Management</h1>
      <div className="tab-buttons" style={{ marginBottom: '10px', marginTop:'-10px', }}>
        <button
          className={`button ${activeTab === 'view' ? 'active' : ''}`}
          style={{ marginRight: '20px', padding: '10px 20px', fontSize: '16px' }}
          onClick={() => handleTabClick('view')}
        >
          View Employee Profile
        </button>
        <button
          className={`button ${activeTab === 'create' ? 'active' : ''}`}
          style={{ padding: '10px 20px', fontSize: '16px' }}
          onClick={() => handleTabClick('create')}
        >
          Create New Employee
        </button>
      </div>
      <div className="tab-content">
        {loading ? (
          <LoadingSpinner />
        ) : activeTab === 'view' ? (
          <EmployeeViewProfile
            formData={formData}
            setFormData={setFormData}
            photoPreview={photoPreview}
            setPhotoPreview={setPhotoPreview}
            onBack={() => setActiveTab('home')}
          />
        ) : (
          <EmployeeCreateForm
            formData={formData}
            setFormData={setFormData}
            photoPreview={photoPreview}
            setPhotoPreview={setPhotoPreview}
            onBack={() => setActiveTab('view')}
            onSubmit={handleSubmit}
          />
        )}
      </div>
    </div>
  );
};

export default EmployeeHome;
