import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import PredictionChart from './PredictionChart';
import TeacherRetentionDataTable from './TeacherRetentionDataTable';
import TeacherRetentionForm from './TeacherRetentionForm';
import '../../styles/employeeFormStyles.css';
import './TeacherRetentionPredictionPage.css';

interface PredictionDataItem {
  year: string;
  resignations_count: Record<string, number>;
  retentions_count: Record<string, number>;
  hires_needed: Record<string, number>;
}

interface SavedDataRow {
  year: string;
  teachers_STEM: number;
  teachers_ABM: number;
  teachers_GAS: number;
  teachers_HUMSS: number;
  teachers_ICT: number;
  students_STEM: number;
  students_ABM: number;
  students_GAS: number;
  students_HUMSS: number;
  students_ICT: number;
  historical_resignations: number;
  historical_retentions: number;
  workload_per_teacher: number;
  salary_ratio: number;
  professional_dev_hours: number;
  [key: string]: any;
}

interface FormData {
  year: string;
  teachers: {
    STEM: number;
    ABM: number;
    GAS: number;
    HUMSS: number;
    ICT: number;
  };
  students: {
    STEM: number;
    ABM: number;
    GAS: number;
    HUMSS: number;
    ICT: number;
  };
  workloadCompensation: {
    historical_resignations: number;
    historical_retentions: number;
    workload_per_teacher: number;
    salary_ratio: number;
    professional_dev_hours: number;
  };
}

const TeacherRetentionPredictionPage: React.FC = () => {
  const navigate = useNavigate();
  const [predictionData, setPredictionData] = useState<PredictionDataItem[] | null>(null);
  const [notification, setNotification] = useState<string>('');
  const [savedData, setSavedData] = useState<SavedDataRow[]>([]);
  const [showForm, setShowForm] = useState<boolean>(false);

  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    // Fetch saved prediction data on component mount
    fetch('http://localhost:8000/api/get_prediction_data.php')
      .then(async (res) => {
        if (!res.ok) {
          throw new Error('Network response was not ok');
        }
        const text = await res.text();
        return JSON.parse(text);
      })
      .then((data) => {
        if (data.data) {
          setSavedData(data.data);
        }
      })
      .catch((err) => {
        console.error('Error fetching saved data on mount:', err);
      });
  }, []);

  useEffect(() => {
    if (savedData.length > 0) {
      callPredictionAPI(savedData);
    }
  }, [savedData]);

  const callPredictionAPI = async (data: SavedDataRow[]) => {
    try {
      if (!Array.isArray(data)) {
        setNotification('Invalid data format for prediction.');
        setPredictionData(null);
        return;
      }

      const enhancedData = data.map(row => {
        const teachers_total = ['teachers_STEM', 'teachers_ICT', 'teachers_GAS', 'teachers_ABM', 'teachers_HUMSS']
          .reduce((sum, key) => sum + (Number(row[key]) || 0), 0);
        const students_total = ['students_STEM', 'students_ICT', 'students_GAS', 'students_ABM', 'students_HUMSS']
          .reduce((sum, key) => sum + (Number(row[key]) || 0), 0);
        return {
          ...row,
          teachers_total,
          students_total
        };
      });

      const response = await fetch('http://localhost:8000/api/data_forecasting.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enhancedData),
      });
      if (!response.ok) {
        const errorText = await response.text();
        setNotification('Prediction API error: ' + errorText);
        setPredictionData(null);
        return;
      }
      const result = await response.json();
      if (result.warnings && result.warnings.length > 0) {
        setNotification(result.warnings.join(' '));
      } else {
        setNotification('');
      }
      if (result['resignations_count'] && result['retentions_count'] && result['hires_needed']) {
        const resignationsCount = result['resignations_count'] as Record<string, number[]>;
        const yearsCount = Object.values(resignationsCount)[0].length;
        const baseYear = result.last_year ? Number(result.last_year) + 1 : (savedData.length > 0 ? Number(savedData[savedData.length - 1].year) + 1 : new Date().getFullYear());
        const transformedData: PredictionDataItem[] = [];
        for (let i = 0; i < yearsCount; i++) {
          const yearData: PredictionDataItem = {
            year: (baseYear + i).toString(),
            resignations_count: {},
            retentions_count: {},
            hires_needed: {},
          };
          for (const strand of Object.keys(result['resignations_count'])) {
            yearData.resignations_count[strand] = result['resignations_count'][strand][i] || 0;
            yearData.retentions_count[strand] = result['retentions_count'][strand][i] || 0;
            yearData.hires_needed[strand] = result['hires_needed'][strand][i] || 0;
          }
          transformedData.push(yearData);
        }
        setPredictionData(transformedData);
      } else {
        setPredictionData(null);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setNotification('Error calling prediction API: ' + error.message);
      } else {
        setNotification('Error calling prediction API.');
      }
      setPredictionData(null);
    }
  };

  const handlePredictClick = () => {
    if (savedData.length === 0) {
      setNotification('No saved data available for prediction.');
      return;
    }
    callPredictionAPI(savedData);
  };

  const handleFormSubmit = async (formData: FormData) => {
    // Prepare data for submission
    const payload = {
      year: formData.year,
      teachers_STEM: Number(formData.teachers.STEM),
      teachers_ABM: Number(formData.teachers.ABM),
      teachers_GAS: Number(formData.teachers.GAS),
      teachers_HUMSS: Number(formData.teachers.HUMSS),
      teachers_ICT: Number(formData.teachers.ICT),
      students_STEM: Number(formData.students.STEM),
      students_ABM: Number(formData.students.ABM),
      students_GAS: Number(formData.students.GAS),
      students_HUMSS: Number(formData.students.HUMSS),
      students_ICT: Number(formData.students.ICT),
      historical_resignations: Number(formData.workloadCompensation.historical_resignations),
      historical_retentions: Number(formData.workloadCompensation.historical_retentions),
      workload_per_teacher: Number(formData.workloadCompensation.workload_per_teacher),
      salary_ratio: Number(formData.workloadCompensation.salary_ratio),
      professional_dev_hours: Number(formData.workloadCompensation.professional_dev_hours),
    };

    try {
      const response = await fetch('http://localhost:8000/api/save_teacher_retention_data.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorText = await response.text();
        setNotification('Error saving data: ' + errorText);
        setErrorMessage('Error saving data: ' + errorText);
        setSuccessMessage('');
        return;
      }
      const result = await response.json();
      if (result.success) {
        setNotification('Data saved successfully.');
        setSuccessMessage('Data saved successfully.');
        setErrorMessage('');
        // Refresh saved data
        const res = await fetch('http://localhost:8000/api/get_prediction_data.php');
        const text = await res.text();
        const data = JSON.parse(text);
        if (data.data) {
          setSavedData(data.data);
        }
        setShowForm(false);
      } else {
        setNotification('Failed to save data.');
        setErrorMessage('Failed to save data.');
        setSuccessMessage('');
      }
    } catch (error) {
      setNotification('Error saving data.');
      setErrorMessage('Error saving data.');
      setSuccessMessage('');
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
  };

  return (
    <div>
      <header className="header">
        <div className="logo"></div>
        <h1 className="title" onClick={() => navigate("/analysis")}>
          LYCEUM OF ALABANG
        </h1>
      </header>

      {!showForm && (
        <>
          <button onClick={() => setShowForm(true)} className="open-form-button">
            Update Prediction Data
          </button>
          <div className="visualization-section">
            <h2>Prediction Visualization</h2>
            {notification && <div className="notification">{notification}</div>}
            {predictionData ? (
              (() => {
                console.log('Prediction data passed to PredictionChart:', predictionData);
                return (
                  <>
                    <PredictionChart data={predictionData} />
                    <div className="prediction-summary" style={{ marginTop: '1rem', color: 'white' }}>
                      <h3>Prediction Summary (Per Strand)</h3>
                      {predictionData.map((item, index) => (
                        <div key={index} style={{ marginBottom: '1rem' }}>
                          <strong>Year {item.year}:</strong>
                          <div style={{ marginLeft: '1rem' }}>
                            {Object.keys(item.resignations_count || {}).map(strand => {
                              const resigning = item.resignations_count?.[strand] ?? 0;
                              const retaining = item.retentions_count?.[strand] ?? 0;
                              const hiresNeeded = item.hires_needed?.[strand] ?? 0;
                              return (
                                <React.Fragment key={strand}>
                                  {resigning !== undefined && retaining !== undefined && hiresNeeded !== undefined && (
                                    <div style={{ marginBottom: '0.25rem' }}>
                                      <em>{strand}</em> - Resigning: {resigning.toFixed(2)}, Retaining: {retaining.toFixed(2)}, To be Hired: {hiresNeeded.toFixed(2)}
                                    </div>
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()
            ) : (
              <PredictionChart data={[]} />
            )}
          </div>
          <div className="saved-data-container">
            <div className="saved-data-section">
              <h2>Historical Data</h2>
              <TeacherRetentionDataTable data={savedData} />
            </div>
          </div>
        </>
      )}

      {showForm && (
        <TeacherRetentionForm
          priorYearData={savedData.length > 0 ? savedData[savedData.length - 1] : null}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          successMessage={successMessage}
          errorMessage={errorMessage}
        />
      )}
    </div>
  );
};

export default TeacherRetentionPredictionPage;
