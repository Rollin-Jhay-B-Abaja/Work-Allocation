import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Papa from "papaparse"; // For CSV parsing
import RiskAssessmentChart from "./RiskAssessmentChart";
import { FaTrash } from 'react-icons/fa';
import "./Risk-Assessment.css";

const RiskAssessment = () => {
  const [teachers, setTeachers] = useState([]);
  const [viewMode, setViewMode] = useState("strand"); // "strand" or "teacher"
  const [uploadMessage, setUploadMessage] = useState("");
  const navigate = useNavigate();

  const sendRequest = useCallback(async (url, options = {}) => {
    try {
      const response = await fetch(url, options);
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unknown error");
      return result;
    } catch (error) {
      throw error;
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const data = await sendRequest("http://localhost:8000/api/risk_assessment.php");
      console.log("Fetched risk assessment data:", data);
      data.forEach(t => console.log(`Teacher: ${t["Name"]}, Risk Level: ${t["Risk Level"]}`));
      setTeachers(data);
      setUploadMessage("");
    } catch (error) {
      console.error("Error fetching risk assessment data:", error);
      setUploadMessage("Failed to load data: " + error.message);
    }
  }, [sendRequest]);
  
  useEffect(() => {
    console.log("Current viewMode:", viewMode);
  }, [viewMode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const riskColor = (level) => {
    switch (level) {
      case "High":
        return "rgba(244, 67, 54, 0.7)"; // Red
      case "Medium":
        return "rgba(255, 193, 7, 0.7)"; // Yellow
      case "Low":
      default:
        return "rgba(76, 175, 80, 0.7)"; // Green
    }
  };

  const handleDelete = async (index) => {
    const teacherToDelete = teachers[index];
    if (!teacherToDelete || !teacherToDelete["Teacher ID"]) {
      alert("Invalid teacher selected for deletion.");
      return;
    }
    if (!window.confirm(`Are you sure you want to delete teacher ID ${teacherToDelete["Teacher ID"]}?`)) return;

    try {
      const result = await sendRequest(`http://localhost:8000/api/risk_assessment.php?teacher_id=${encodeURIComponent(teacherToDelete["Teacher ID"])}`, { method: "DELETE" });
      setTeachers(prev => prev.filter((_, i) => i !== index));
      setUploadMessage("Deletion successful: " + (result.message || ""));
    } catch (error) {
      setUploadMessage("Deletion failed: " + error.message);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: (results) => {
        const filteredData = results.data.filter(row =>
          row["Teacher ID"] && row["Name"] && row["Strand"] && row["Performance"] &&
          row["Hours per week"] && row["Class size"] &&
          row["Teacher satisfaction"] && row["Teacher satisfaction"].trim() !== "" &&
          row["Student satisfaction"] && row["Student satisfaction"].trim() !== ""
        );

        if (filteredData.length === 0) {
          alert("No valid data found in the CSV file.");
          setTeachers([]);
          return;
        }
        uploadFile(file);
      },
    });
  };

  const uploadFile = async (file) => {
    if (!file) {
      alert("No file selected for upload.");
      return;
    }
    setUploadMessage("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const result = await sendRequest("http://localhost:8000/api/risk_assessment.php", { method: "POST", body: formData });
      setUploadMessage("Upload successful: " + (result.message || ""));
      fetchData();
    } catch (error) {
      setUploadMessage("Upload failed: " + error.message);
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm("Are you sure you want to delete ALL data?")) return;
    try {
      const result = await sendRequest("http://localhost:8000/api/risk_assessment.php", { method: "DELETE" });
      setTeachers([]);
      setUploadMessage("All data deleted successfully.");
    } catch (error) {
      setUploadMessage("Failed to delete all data: " + error.message);
    }
  };

  return (
    <div className="risk-assessment-container">
      <header className="header">
        <div className="logo"></div>
        <h1 className="title" onClick={() => navigate("/analysis")}>
          LYCEUM OF ALABANG
        </h1>
      </header>

      <main className="risk-content">
        <div className="risk-main-section">
          <div className="risk-input-section">
            <h2>INPUT HISTORICAL DATA</h2>

            <input
              id="csvFileInput"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="upload-button"
            />
            <button className="delete-all-button" onClick={handleDeleteAll} style={{ marginTop: "1rem" }}>
              Delete All
            </button>
            {uploadMessage && <p className="upload-message">{uploadMessage}</p>}

            <div className="view-mode-buttons">
              <button onClick={() => setViewMode("strand")} className={viewMode === "strand" ? "active" : ""}>
                Strand-wise View
              </button>
              <button onClick={() => setViewMode("teacher")} className={viewMode === "teacher" ? "active" : ""}>
                Teacher-wise View
              </button>
            </div>

            <div className="teachers-table table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Teacher ID</th>
                    <th>Name</th>
                    <th>Strand</th>
                    <th>Performance</th>
                    <th>Hours per week</th>
                    <th>Class size</th>
                    <th>Teacher satisfaction</th>
                    <th>Student satisfaction</th>
                    <th>Risk Level</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.length === 0 ? (
                    <tr>
                      <td colSpan="10" style={{ textAlign: "center" }}>
                        No data available
                      </td>
                    </tr>
                  ) : (
                    teachers.map((teacher, index) => (
                      <tr key={`${teacher["Teacher ID"]}-${index}`}>
                        <td>{teacher["Teacher ID"]}</td>
                        <td>{teacher["Name"]}</td>
                        <td>{teacher["Strand"]}</td>
                        <td>{teacher["Performance"]}</td>
                        <td>{teacher["Hours per week"]}</td>
                        <td>{teacher["Class size"]}</td>
                        <td>{typeof teacher["Teacher satisfaction"] === "number" ? teacher["Teacher satisfaction"].toFixed(1) + "%" : teacher["Teacher satisfaction"]}</td>
                        <td>{typeof teacher["Student satisfaction"] === "number" ? teacher["Student satisfaction"].toFixed(1) + "%" : teacher["Student satisfaction"]}</td>
                        <td style={{ color: riskColor(teacher["Risk Level"]) }}>{teacher["Risk Level"]}</td>
                        <td>
                          <button onClick={() => handleDelete(index)} aria-label="Delete teacher">
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="chart-section">
            <h2>Risk Heatmap</h2>
            <RiskAssessmentChart teachers={teachers} viewMode={viewMode} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default RiskAssessment;
