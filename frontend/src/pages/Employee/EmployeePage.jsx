import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import EmployeeHome from './EmployeeHome';
import EmployeeCreateForm from './EmployeeCreateForm';
import EmployeeViewProfile from './EmployeeViewProfile';
import './EmployeePage.css';
import { saveTeacher } from '../../services/teacherService';

const EmployeePage = () => {
  const [view, setView] = useState('home'); // 'home', 'create', 'view'
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
    if (view === 'create') {
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
  }, [view]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Send all formData fields to backend
    saveTeacher(formData)
      .then((response) => {
        console.log('Teacher saved:', response);
        setView('home'); // Return to home after save
      })
      .catch((error) => {
        console.error('Failed to save teacher:', error);
      });
  };

  if (view === 'home') {
    return (
      <div className="employee-page-container app-container" style={{ display: 'flex' }}>
        <Sidebar />
        <div className="main-content">
          <EmployeeHome onSelect={setView} />
        </div>
      </div>
    );
  }

  if (view === 'view') {
    return (
      <div className="employee-page-container app-container" style={{ display: 'flex' }}>
        <Sidebar />
        <div className="main-content">
          <EmployeeViewProfile onBack={() => setView('home')} />
        </div>
      </div>
    );
  }

  // view === 'create'
  return (
    <div className="employee-page-container app-container" style={{ display: 'flex' }}>
      <Sidebar />
      <EmployeeCreateForm
        formData={formData}
        setFormData={setFormData}
        photoPreview={photoPreview}
        setPhotoPreview={setPhotoPreview}
        onBack={() => setView('home')}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default EmployeePage;
