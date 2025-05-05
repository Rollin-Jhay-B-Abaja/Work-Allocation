import React, { useState, useEffect } from 'react';
import TeacherRetentionResults from './TeacherRetentionResults.jsx';

const strands = ['STEM', 'ABM', 'GAS', 'HUMSS', 'ICT'];

const initialFormData = {
  year: '',
  teachers: {
    STEM: '',
    ABM: '',
    GAS: '',
    HUMSS: '',
    ICT: '',
  },
  students: {
    STEM: '',
    ABM: '',
    GAS: '',
    HUMSS: '',
    ICT: '',
  },
  workloadCompensation: {
    historical_resignations: '',
    historical_retentions: '',
    workload_per_teacher: '',
    salary_ratio: '',
    professional_dev_hours: '',
  },
  policyConstraints: {
    target_ratio: 25,
    max_class_size: '',
  },
};

const TeacherRetentionForm = ({ onSubmit, onCancel, priorYearData, successMessage, errorMessage }) => {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [csvError, setCsvError] = useState('');
  const [isStepValid, setIsStepValid] = useState(false);

  const [predictionResult, setPredictionResult] = useState(null);

  const resetForm = () => {
    setFormData(initialFormData);
    setStep(0);
    setErrors({});
    setTouched({});
    setCsvError('');
    setIsStepValid(false);
  };

  const expectedHeaders = [
    'year',
    'teachers_STEM', 'teachers_ABM', 'teachers_GAS', 'teachers_HUMSS', 'teachers_ICT',
    'students_STEM', 'students_ABM', 'students_GAS', 'students_HUMSS', 'students_ICT',
    'historical_resignations', 'historical_retentions', 'workload_per_teacher', 'salary_ratio', 'professional_dev_hours'
  ];

  const parseCSV = (text) => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) {
      return { error: 'CSV must have at least header and one data row' };
    }
    const headers = lines[0].split(',').map(h => h.trim());
    for (const h of expectedHeaders) {
      if (!headers.includes(h)) {
        return { error: `Missing expected header: ${h}` };
      }
    }
    const data = {};
    const values = lines[1].split(',').map(v => v.trim());
    headers.forEach((header, idx) => {
      data[header] = values[idx] || '';
    });
    return { data };
  };

  const handleCSVUpload = (e) => {
    setCsvError('');
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setCsvError('Please upload a valid CSV file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const { data, error } = parseCSV(text);
      if (error) {
        setCsvError(error);
        return;
      }
      const newFormData = {
        year: data.year || '',
        teachers: {
          STEM: data.teachers_STEM || '',
          ABM: data.teachers_ABM || '',
          GAS: data.teachers_GAS || '',
          HUMSS: data.teachers_HUMSS || '',
          ICT: data.teachers_ICT || '',
        },
        students: {
          STEM: data.students_STEM || '',
          ABM: data.students_ABM || '',
          GAS: data.students_GAS || '',
          HUMSS: data.students_HUMSS || '',
          ICT: data.students_ICT || '',
        },
        workloadCompensation: {
          historical_resignations: data.historical_resignations || '',
          historical_retentions: data.historical_retentions || '',
          workload_per_teacher: data.workload_per_teacher || '',
          salary_ratio: data.salary_ratio || '',
          professional_dev_hours: data.professional_dev_hours || '',
        },
        policyConstraints: {
          target_ratio: 25,
          max_class_size: 40,
        },
      };
      setFormData(newFormData);
      setStep(1);
    };
    reader.readAsText(file);
  };

  const validateStep = () => {
    const newErrors = {};
    if (step === 0) {
      return true;
    }
    if (step === 1) {
      const year = formData.year;
      if (!year) {
        newErrors.year = 'Year is required';
      } else if (!/^\d{4}$/.test(year)) {
        newErrors.year = 'Year must be a 4-digit number';
      } else {
        const yearNum = Number(year);
        const currentYear = new Date().getFullYear();
        if (yearNum < 1900 || yearNum > currentYear + 1) {
          newErrors.year = `Year must be between 1900 and ${currentYear + 1}`;
        }
      }
    } else if (step === 2) {
      strands.forEach(strand => {
        const val = formData.teachers[strand];
        if (val === '') {
          newErrors[`teachers_${strand}`] = 'Required';
        } else if (isNaN(val) || Number(val) < 0) {
          newErrors[`teachers_${strand}`] = 'Must be a number >= 0';
        }
      });
    } else if (step === 3) {
      strands.forEach(strand => {
        const val = formData.students[strand];
        if (val === '') {
          newErrors[`students_${strand}`] = 'Required';
        } else if (isNaN(val) || Number(val) < 0) {
          newErrors[`students_${strand}`] = 'Must be a number >= 0';
        }
      });
    } else if (step === 4) {
      const w = formData.workloadCompensation;
      if (w.historical_resignations === '') {
        newErrors.historical_resignations = 'Required';
      } else if (isNaN(w.historical_resignations) || Number(w.historical_resignations) < 0) {
        newErrors.historical_resignations = 'Must be a number >= 0';
      }
      if (w.historical_retentions === '') {
        newErrors.historical_retentions = 'Required';
      } else if (isNaN(w.historical_retentions) || Number(w.historical_retentions) < 0) {
        newErrors.historical_retentions = 'Must be a number >= 0';
      }
      if (w.workload_per_teacher === '') {
        newErrors.workload_per_teacher = 'Required';
      } else if (isNaN(w.workload_per_teacher) || Number(w.workload_per_teacher) < 0) {
        newErrors.workload_per_teacher = 'Must be a number >= 0';
      }
      if (w.salary_ratio === '') {
        newErrors.salary_ratio = 'Required';
      } else if (isNaN(w.salary_ratio) || Number(w.salary_ratio) < 0.5) {
        newErrors.salary_ratio = 'Must be a number >= 0.5';
      }
      if (w.professional_dev_hours === '') {
        newErrors.professional_dev_hours = 'Required';
      } else if (isNaN(w.professional_dev_hours) || Number(w.professional_dev_hours) < 0) {
        newErrors.professional_dev_hours = 'Must be a number >= 0';
      }
    } else if (step === 5) {
      const p = formData.policyConstraints;
      if (p.target_ratio === '') {
        newErrors.target_ratio = 'Required';
      } else if (isNaN(p.target_ratio) || Number(p.target_ratio) <= 0) {
        newErrors.target_ratio = 'Must be a positive number';
      }
      if (p.max_class_size !== '' && (isNaN(p.max_class_size) || Number(p.max_class_size) <= 0)) {
        newErrors.max_class_size = 'Must be a positive number if provided';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    if (priorYearData) {
      setFormData(prev => ({
        ...prev,
        year: priorYearData.year || '',
        teachers: {
          STEM: priorYearData.teachers_STEM || '',
          ABM: priorYearData.teachers_ABM || '',
          GAS: priorYearData.teachers_GAS || '',
          HUMSS: priorYearData.teachers_HUMSS || '',
          ICT: priorYearData.teachers_ICT || '',
        },
        students: {
          STEM: priorYearData.students_STEM || '',
          ABM: priorYearData.students_ABM || '',
          GAS: priorYearData.students_GAS || '',
          HUMSS: priorYearData.students_HUMSS || '',
          ICT: priorYearData.students_ICT || '',
        },
        workloadCompensation: {
          historical_resignations: priorYearData.historical_resignations || '',
          historical_retentions: priorYearData.historical_retentions || '',
          workload_per_teacher: priorYearData.workload_per_teacher || '',
          salary_ratio: priorYearData.salary_ratio || '',
          professional_dev_hours: priorYearData.professional_dev_hours || '',
        },
      }));
    }
  }, [priorYearData]);

  useEffect(() => {
    const valid = validateStep();
    setIsStepValid(valid);
  }, [formData, step]);

  const handleNext = () => {
    if (isStepValid) {
      setStep(prev => Math.min(prev + 1, 6));
    }
  };

  const handleBack = () => {
    setStep(prev => Math.max(prev - 1, 0));
  };

  const handleFormSubmit = (data) => {
    if (onSubmit) {
      const submissionData = {
        ...data,
        target_ratio: Number(data.policyConstraints.target_ratio),
        max_class_size: data.policyConstraints.max_class_size ? Number(data.policyConstraints.max_class_size) : null,
      };
      onSubmit(submissionData).then(result => {
        setPredictionResult(result);
        setStep(7);
      });
    }
  };

  const handleChange = (field, value, category, strand) => {
    setFormData(prev => {
      const updated = { ...prev };
      if (category === 'teachers' || category === 'students') {
        updated[category][strand] = value;
      } else if (category === 'workloadCompensation') {
        updated.workloadCompensation[field] = value;
      } else if (category === 'policyConstraints') {
        updated.policyConstraints[field] = value;
      } else if (field === 'year') {
        updated.year = value;
      }
      return updated;
    });
    setTouched(prev => ({ ...prev, [field + (strand ? '_' + strand : '')]: true }));
  };

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <div className="form-step">
            <h2>Step 0: Upload CSV File (Optional)</h2>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleCSVUpload}
            />
            {csvError && <div className="error">{csvError}</div>}
            <p>You can upload a CSV file with the following headers:</p>
            <ul>
              {expectedHeaders.map(header => (
                <li key={header}>{header}</li>
              ))}
            </ul>
            <button type="button" onClick={() => setStep(1)}>Skip Upload</button>
          </div>
        );
      case 1:
        return (
          <div className="form-step">
            <h2>Step 1: Basic Information</h2>
            <label htmlFor="year">Academic Year:</label>
            <input
              type="number"
              id="year"
              value={formData.year}
              onChange={e => handleChange('year', e.target.value)}
              onBlur={() => validateStep()}
              min="1900"
              max={new Date().getFullYear() + 1}
            />
            {touched.year && errors.year && <div className="error">{errors.year}</div>}
          </div>
        );
      case 2:
        return (
          <div className="form-step">
            <h2>Step 2: Teacher (Per Strand)</h2>
            {strands.map(strand => (
              <div key={strand} className="input-group">
                <label htmlFor={`teachers_${strand}`}>Number of Teachers ({strand}):</label>
                <input
                  type="number"
                  id={`teachers_${strand}`}
                  value={formData.teachers[strand]}
                  onChange={e => handleChange('teachers', e.target.value, 'teachers', strand)}
                  onBlur={() => validateStep()}
                  min="0"
                />
                {touched[`teachers_${strand}`] && errors[`teachers_${strand}`] && (
                  <div className="error">{errors[`teachers_${strand}`]}</div>
                )}
              </div>
            ))}
          </div>
        );
      case 3:
        return (
          <div className="form-step">
            <h2>Step 3: Student Enrolled (Per Strand)</h2>
            {strands.map(strand => (
              <div key={strand} className="input-group">
                <label htmlFor={`students_${strand}`}>Number of Students ({strand}):</label>
                <input
                  type="number"
                  id={`students_${strand}`}
                  value={formData.students[strand]}
                  onChange={e => handleChange('students', e.target.value, 'students', strand)}
                  onBlur={() => validateStep()}
                  min="0"
                />
                {touched[`students_${strand}`] && errors[`students_${strand}`] && (
                  <div className="error">{errors[`students_${strand}`]}</div>
                )}
              </div>
            ))}
          </div>
        );
      case 4:
        return (
          <div className="form-step">
            <h2>Step 4: Workload & Compensation</h2>
            <div className="input-group">
              <label htmlFor="historical_resignations">Historical Resignations (total count):</label>
              <input
                type="number"
                id="historical_resignations"
                value={formData.workloadCompensation.historical_resignations}
                onChange={e => handleChange('historical_resignations', e.target.value, 'workloadCompensation')}
                onBlur={() => validateStep()}
                min="0"
              />
              {touched.historical_resignations && errors.historical_resignations && (
                <div className="error">{errors.historical_resignations}</div>
              )}
            </div>
            <div className="input-group">
              <label htmlFor="historical_retentions">Historical Retentions (total count):</label>
              <input
                type="number"
                id="historical_retentions"
                value={formData.workloadCompensation.historical_retentions}
                onChange={e => handleChange('historical_retentions', e.target.value, 'workloadCompensation')}
                onBlur={() => validateStep()}
                min="0"
              />
              {touched.historical_retentions && errors.historical_retentions && (
                <div className="error">{errors.historical_retentions}</div>
              )}
            </div>
            <div className="input-group">
              <label htmlFor="workload_per_teacher">Workload per Teacher (hours/week):</label>
              <input
                type="number"
                id="workload_per_teacher"
                value={formData.workloadCompensation.workload_per_teacher}
                onChange={e => handleChange('workload_per_teacher', e.target.value, 'workloadCompensation')}
                onBlur={() => validateStep()}
                min="0"
                step="0.1"
              />
              {touched.workload_per_teacher && errors.workload_per_teacher && (
                <div className="error">{errors.workload_per_teacher}</div>
              )}
            </div>
            <div className="input-group">
              <label htmlFor="salary_ratio">Salary Ratio (vs. industry standard):</label>
              <input
                type="number"
                id="salary_ratio"
                value={formData.workloadCompensation.salary_ratio}
                onChange={e => handleChange('salary_ratio', e.target.value, 'workloadCompensation')}
                onBlur={() => validateStep()}
                min="0.5"
                step="0.01"
              />
              {touched.salary_ratio && errors.salary_ratio && (
                <div className="error">{errors.salary_ratio}</div>
              )}
            </div>
            <div className="input-group">
              <label htmlFor="professional_dev_hours">Professional Development Hours (annual):</label>
              <input
                type="number"
                id="professional_dev_hours"
                value={formData.workloadCompensation.professional_dev_hours}
                onChange={e => handleChange('professional_dev_hours', e.target.value, 'workloadCompensation')}
                onBlur={() => validateStep()}
                min="0"
              />
              {touched.professional_dev_hours && errors.professional_dev_hours && (
                <div className="error">{errors.professional_dev_hours}</div>
              )}
            </div>
          </div>
        );
      case 5:
        return (
          <div className="form-step" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <h2>Step 5: Review & Submit</h2>
            <div className="review-section">
              <h3>Basic Information</h3>
              <p>Academic Year: {formData.year} <button type="button" onClick={() => setStep(1)} style={{ marginLeft: '10px' }}>Edit</button></p>
              <h3 style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                Teacher (Per Strand)
                <button type="button" onClick={() => setStep(2)}>Edit</button>
              </h3>
              <ul>
                {strands.map(strand => (
                  <li key={strand}>{strand}: {formData.teachers[strand]}</li>
                ))}
              </ul>
              <h3 style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                Student Enrolled (Per Strand)
                <button type="button" onClick={() => setStep(3)}>Edit</button>
              </h3>
              <ul>
                {strands.map(strand => (
                  <li key={strand}>{strand}: {formData.students[strand]}</li>
                ))}
              </ul>
              <h3 style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                Workload & Compensation
                <button type="button" onClick={() => setStep(4)}>Edit</button>
              </h3>
              <p>Historical Resignations: {formData.workloadCompensation.historical_resignations}</p>
              <p>Historical Retentions: {formData.workloadCompensation.historical_retentions}</p>
              <p>Workload per Teacher: {formData.workloadCompensation.workload_per_teacher}</p>
              <p>Salary Ratio: {formData.workloadCompensation.salary_ratio}</p>
              <p>Professional Development Hours: {formData.workloadCompensation.professional_dev_hours}</p>
              <h3>Policy Constraints</h3>
              <div className="input-group">
                <label htmlFor="target_ratio">Target Student-Teacher Ratio:</label>
                <input
                  type="number"
                  id="target_ratio"
                  value={formData.policyConstraints.target_ratio}
                  onChange={e => handleChange('target_ratio', e.target.value, 'policyConstraints')}
                  onBlur={() => validateStep()}
                  min="1"
                  step="1"
                />
                {touched.target_ratio && errors.target_ratio && (
                  <div className="error">{errors.target_ratio}</div>
                )}
              </div>
              <div className="input-group">
                <label htmlFor="max_class_size">Max Class Size (optional):</label>
                <input
                  type="number"
                  id="max_class_size"
                  value={formData.policyConstraints.max_class_size}
                  onChange={e => handleChange('max_class_size', e.target.value, 'policyConstraints')}
                  onBlur={() => validateStep()}
                  min="1"
                  step="1"
                />
                {touched.max_class_size && errors.max_class_size && (
                  <div className="error">{errors.max_class_size}</div>
                )}
              </div>
            </div>
            <div className="form-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button type="button" onClick={() => { resetForm(); onCancel && onCancel(); }} style={{ marginRight: '10px' }}>Cancel</button>
              <button
                type="button"
                onClick={() => {
                  if (validateStep()) {
                    onSubmit(formData);
                  }
                }}
              >
                Submit
              </button>
            </div>
            {successMessage && (
              <div style={{ marginTop: '8px', color: 'lightgreen', fontWeight: 'bold' }}>
                {successMessage}
              </div>
            )}
            {errorMessage && (
              <div style={{ marginTop: '8px', color: 'red', fontWeight: 'bold' }}>
                {errorMessage}
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="multi-step-form" style={{
      height: '100vh',
      width: '90%',
      margin: '40px auto',
      padding: '20px',
      boxShadow: '0 0 10px rgba(0,0,0,0.1)',
      borderRadius: '8px',
      backgroundColor: '#1e1e1e',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      <div className="stepper" style={{ marginBottom: '20px', fontWeight: 'bold' }}>
        Step {step + 1} of {predictionResult ? 7 : 6}
      </div>
      {step > 0 && step < 6 && (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <button type="button" onClick={handleBack} className="back-button">
            Back
          </button>
          {step < 5 && (
            <button
              type="button"
              onClick={handleNext}
              disabled={!isStepValid}
              className="next-button"
            >
              Next
            </button>
          )}
        </div>
      )}
      {step < 6 && renderStepContent()}
      {step === 6 && (
        <TeacherRetentionResults predictionData={predictionResult} />
      )}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
        {step === 6 && (
          <button
            type="button"
            onClick={() => {
              setStep(0);
              setPredictionResult(null);
            }}
            className="cancel-button"
            style={{ alignSelf: 'flex-start' }}
          >
            New Prediction
          </button>
        )}
      </div>
    </div>
  );
};

export default TeacherRetentionForm;

