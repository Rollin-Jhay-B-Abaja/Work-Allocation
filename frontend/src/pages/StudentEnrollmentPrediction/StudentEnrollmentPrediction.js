import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { FaTrash } from 'react-icons/fa';
import Papa from 'papaparse';
import './StudentEnrollmentPrediction.css';
import EnrollmentChart from './EnrollmentChart';
import PredictionChart from './PredictionChart'; // Import PredictionChart component

const EnrollmentForm = ({ setHistoricalData, historicalData, searchTerm, setSearchTerm, filteredData = [], predictionResults, setPredictionResults }) => {
  const navigate = useNavigate();

  const [year, setYear] = useState("");
  const [enrollees, setEnrollees] = useState({
    STEM: "",
    ABM: "",
    GAS: "",
    HUMSS: "",
    ICT: "",
  });

  const handleChange = (e) => {
    setEnrollees({ ...enrollees, [e.target.name]: e.target.value });
  };

  const handleTitleClick = () => {
    navigate("/analysis");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!year || Object.values(enrollees).some(value => value === "" || isNaN(value) || value < 0)) {
      alert("Please fill in all fields before submitting.");
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/ml_interface.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: year ? new Date(year).toISOString().split('T')[0] : null,
          year: year ? new Date(year).getFullYear().toString() : null,
          enrollees_per_strand: enrollees,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setHistoricalData([...historicalData, { id: result.id, year: new Date(year).getFullYear().toString(), ...enrollees }]);
        setYear("");
        setEnrollees({ STEM: "", ABM: "", GAS: "", HUMSS: "", ICT: "" });
      } else {
        alert("Failed to save data. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting data:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch('http://localhost:8000/api/ml_interface.php', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        setHistoricalData(historicalData.filter(data => data.id !== id));
      } else {
        alert("Failed to delete data. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting data:", error);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        complete: async (results) => {
          const newHistoricalData = results.data.map((item) => ({
            year: item.Year,
            STEM: item.STEM,
            ABM: item.ABM,
            GAS: item.GAS,
            HUMSS: item.HUMSS,
            ICT: item.ICT,
          }));
          setHistoricalData((prevData) => [...prevData, ...newHistoricalData]);

          try {
            for (const entry of newHistoricalData) {
              const response = await fetch('http://localhost:8000/api/ml_interface.php', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  date: entry.year ? new Date(entry.year).toISOString().split('T')[0] : null,
                  year: entry.year ? entry.year.toString() : null,
                  enrollees_per_strand: {
                    STEM: entry.STEM,
                    ABM: entry.ABM,
                    GAS: entry.GAS,
                    HUMSS: entry.HUMSS,
                    ICT: entry.ICT,
                  },
                }),
              });
              if (!response.ok) {
                console.error("Failed to save entry:", entry);
              }
            }
            alert("CSV data uploaded and saved successfully!");
          } catch (error) {
            console.error("Error saving CSV data:", error);
            alert("Error saving CSV data. Please try again.");
          }
        },
        error: (error) => {
          console.error("Error parsing CSV file:", error);
        },
      });
    }
  };

  const handlePredict = async () => {
    if (!historicalData || historicalData.length < 5) {
        alert("At least 10 years of enrollment history is required to make a prediction.");
        return;
    }

    try {
        const strands = ["STEM", "ABM", "GAS", "HUMSS", "ICT"];
        const enrollmentData = {};

        for (const strand of strands) {
            let numbers = historicalData.map(data => {
                const num = Number(data[strand]);
                return isNaN(num) ? null : num;
            });
            numbers = numbers.filter(num => num !== null);
            if (numbers.length < 5) {
                alert(`At least 10 years of valid enrollment history is required to make a prediction for strand ${strand}.`);
                return;
            }
            enrollmentData[strand] = numbers;
        }

        const response = await fetch('http://localhost:5000/api/data_forecasting', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ data: enrollmentData }),
        });

        if (response.ok) {
            const predictionResults = await response.json();
            console.log("Prediction Results:", predictionResults); // Log the prediction results
            alert("Predictions fetched successfully!");
            setPredictionResults(predictionResults); // Ensure this matches the expected structure
        } else {
            const errorResponse = await response.json();
            alert(`Failed to fetch predictions: ${errorResponse.error}`);
            console.error("Error fetching predictions:", errorResponse);
        }
    } catch (error) {
        console.error("Error fetching predictions:", error);
    }
};

  return (
    <div className="enrollment-container">
      <header className="header">
        <div className="logo"></div>
        <h1 className="title" onClick={handleTitleClick} style={{cursor: "pointer"}}>
          LYCEUM OF ALABANG
        </h1>
      </header>
      <section className="Enrollment-chart">
        <EnrollmentChart predictionResults={predictionResults} />
      </section>
      <section className="form-prediction-section">
        <div className="form-column">
          <div className="form-card">
            <h2>HISTORY OF ENROLLMENT</h2>
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label>Date</label>
                <input
                  type="date"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label>Enrollees</label>
                <div className="enrollees-grid">
                  {["STEM", "ABM", "GAS", "HUMSS", "ICT"].map((strand) => (
                    <input
                      key={strand}
                      type="number"
                      name={strand}
                      value={enrollees[strand]}
                      onChange={handleChange}
                      placeholder={strand}
                    />
                  ))}
                </div>
              </div>
              <button className="btn btn-add" type="submit">
                + Add
              </button>
            </form>
            <button
              className="btn btn-upload"
              onClick={() => document.getElementById('csv-upload').click()}
            >
              Upload CSV
            </button>
            <input
              id="csv-upload"
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            <div className="search-box">
              <input
                type="text"
                placeholder="Search..."
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="table-scroll">
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr className="table">
                      <th>Year</th>
                      <th>STEM</th>
                      <th>ABM</th>
                      <th>GAS</th>
                      <th>HUMSS</th>
                      <th>ICT</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((data, index) => (
                      <tr key={index} className="table">
                        <td>{data.year}</td>
                        <td>{data.STEM}</td>
                        <td>{data.ABM}</td>
                        <td>{data.GAS}</td>
                        <td>{data.HUMSS}</td>
                        <td>{data.ICT}</td>
                        <td>
                          <button onClick={() => handleDelete(data.id)}>
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <div className="prediction-chart">
          <PredictionChart data={predictionResults.predictions} />
          <div className="btn-group">
            <button
              className="btn btn-predict"
              onClick={handlePredict}
            >
              Predict
            </button>
            <button
              className="btn btn-reset"
              onClick={async () => {
                try {
                  const response = await fetch('http://localhost:5000/api/delete_all_enrollment_data', {
                    method: 'DELETE',
                  });
                  if (response.ok) {
                    alert('All enrollment data deleted successfully.');
                    setHistoricalData([]);
                  } else {
                    alert('Failed to delete enrollment data.');
                  }
                } catch (error) {
                  console.error('Error deleting enrollment data:', error);
                  alert('Error deleting enrollment data.');
                }
              }}
            >
              Reset
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

const StudentEnrollmentPrediction = () => {
  const [historicalData, setHistoricalData] = React.useState([]);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [filteredData, setFilteredData] = React.useState([]);
  const [predictionResults, setPredictionResults] = React.useState({});

  React.useEffect(() => {
    if (searchTerm === "") {
      setFilteredData(historicalData);
    } else {
      const lowerSearchTerm = searchTerm.toLowerCase();
      const filtered = historicalData.filter((data) =>
        Object.values(data).some(
          (value) =>
            value &&
            value.toString().toLowerCase().includes(lowerSearchTerm)
        )
      );
      setFilteredData(filtered);
    }
  }, [searchTerm, historicalData]);

  React.useEffect(() => {
    const fetchEnrollmentData = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/enrollment_data');
        if (response.ok) {
          const data = await response.json();
          setHistoricalData(data);
        } else {
          console.error('Failed to fetch enrollment data:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching enrollment data:', error);
      }
    };

    fetchEnrollmentData();
  }, []);

  return (
    <EnrollmentForm
      historicalData={historicalData}
      setHistoricalData={setHistoricalData}
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      filteredData={filteredData}
      predictionResults={predictionResults}
      setPredictionResults={setPredictionResults}
    />
  );
};

export default StudentEnrollmentPrediction;
