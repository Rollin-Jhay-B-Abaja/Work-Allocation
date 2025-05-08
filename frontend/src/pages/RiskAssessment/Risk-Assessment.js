import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Papa from "papaparse"; // For CSV parsing
import RiskAssessmentChart from "./RiskAssessmentChart";
import { FaTrash } from 'react-icons/fa';
import "./Risk-Assessment.css";
import RecommendationList from "./RecommendationList";

const RiskAssessment = () => {
  const [teachers, setTeachers] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [burnoutAnalysis, setBurnoutAnalysis] = useState(null);
  const [teacherEvaluations, setTeacherEvaluations] = useState([]);
  const [viewMode, setViewMode] = useState("strand"); // "strand" or "teacher"
  const [uploadMessage, setUploadMessage] = useState("");
  const navigate = useNavigate();

  const sendRequest = useCallback(async (url, options = {}) => {
    try {
      const response = await fetch(url, options);
      const text = await response.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch (jsonError) {
        console.error("Failed to parse JSON response:", text);
        throw new Error("Invalid JSON response");
      }
      if (!response.ok) throw new Error(result.error || "Unknown error");
      return result;
    } catch (error) {
      throw error;
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      // Fetch combined risk assessment data (includes teacher retention and trend identification)
      const riskData = await sendRequest("http://localhost:8000/api/risk_assessment.php");
      if (riskData.teachers) {
        const mappedTeachers = riskData.teachers.map(item => ({
          "teacher_retention_id": item.teacher_retention_id,
          "year": item.year,
          "strand": item.strand,
          "teachers_count": item.teachers_count,
          "students_count": item.students_count,
          "max_class_size": item.max_class_size,
          "salary_ratio": item.salary_ratio,
          "professional_dev_hours": item.professional_dev_hours,
          "historical_resignations": item.historical_resignations,
          "historical_retentions": item.historical_retentions,
          "workload_per_teacher": item.workload_per_teacher,
          "performance": item.performance,
          "hours_per_week": item.hours_per_week,
          // Removed class_size as it is dropped from backend
          //"class_size": item.class_size,
          "teacher_satisfaction": item.teacher_satisfaction,
          "student_satisfaction": item.student_satisfaction,
          "Risk Level": item["Risk Level"] || null
        }));
        setTeachers(mappedTeachers);
      } else {
        setTeachers([]);
      }

      if (riskData.recommendations) {
        setRecommendations(riskData.recommendations);
      } else {
        setRecommendations([]);
      }
      if (riskData.burnoutAnalysis) {
        setBurnoutAnalysis(riskData.burnoutAnalysis);
      } else {
        setBurnoutAnalysis(null);
      }
      if (riskData.teacherEvaluations) {
        setTeacherEvaluations(riskData.teacherEvaluations);
      } else {
        setTeacherEvaluations([]);
      }
      setUploadMessage("");
    } catch (error) {
      console.error("Error fetching data:", error);
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
          row["Teacher Retention ID"] && row["Year"] && row["Strand"] && row["Performance"] &&
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

  return (
    <div className="risk-assessment-container">
      <header className="header">
        <div className="logo"></div>
        <h1 className="title" onClick={() => navigate("/analysis")}>
          LYCEUM OF ALABANG
        </h1>
      </header>

      <div className="risk-content" style={{ marginTop: "5px", overflowx: "auto", height: "100vh" }}>
        {/* First Section */}
        <div className="first-section">
          <div className="view-mode-buttons centered-buttons">
            <button onClick={() => setViewMode("strand")} className={viewMode === "strand" ? "active" : ""}>
              Strand-wise View
            </button>
            <button onClick={() => setViewMode("teacher")} className={viewMode === "teacher" ? "active" : ""}>
              Teacher-wise View
            </button>
          </div>
          <div className="two-columns">
            <div className="right-column">
              <h2>Risk Heatmap</h2>
              <RiskAssessmentChart teachers={teachers} teacherEvaluations={teacherEvaluations} viewMode={viewMode} burnoutAnalysis={burnoutAnalysis} />
            </div>
          </div>
        </div>

        {/* Second Section */}
        <div className="second-section">
          <div className="teachers-table table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Teacher Retention ID</th>
                  <th>Year</th>
                  <th>Strand</th>
                  <th>Performance</th>
                  <th>Hours per week</th>
                  <th>Class size</th>
                  <th>Teacher satisfaction</th>
                  <th>Student satisfaction</th>
                  <th>Teachers Count</th>
                  <th>Students Count</th>
                  <th>Max Class Size</th>
                  <th>Salary Ratio</th>
                  <th>Professional Dev Hours</th>
                  <th>Historical Resignations</th>
                  <th>Historical Retentions</th>
                  <th>Workload per Teacher</th>
                  <th>Risk Level</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {teachers.length === 0 ? (
                  <tr>
                    <td colSpan="17" style={{ textAlign: "center" }}>
                      No data available
                    </td>
                  </tr>
                ) : (
                  teachers.map((teacher, index) => (
                    <tr key={`${teacher["Teacher Retention ID"]}-${index}`}>
                      <td>{teacher["teacher_retention_id"]}</td>
                      <td>{teacher["year"]}</td>
                      <td>{teacher["strand"]}</td>
                      <td>{teacher["performance"]}</td>
                      <td>{teacher["hours_per_week"]}</td>
                      {/* Removed class_size column display as it is dropped */}
                      {/* <td>{teacher["class_size"]}</td> */}
                      <td>{typeof teacher["teacher_satisfaction"] === "number" ? teacher["teacher_satisfaction"].toFixed(1) + "%" : teacher["teacher_satisfaction"]}</td>
                      <td>{typeof teacher["student_satisfaction"] === "number" ? teacher["student_satisfaction"].toFixed(1) + "%" : teacher["student_satisfaction"]}</td>
                      <td>{teacher["teachers_count"]}</td>
                      <td>{teacher["students_count"]}</td>
                      <td>{teacher["max_class_size"]}</td>
                      <td>{teacher["salary_ratio"]}</td>
                      <td>{teacher["professional_dev_hours"]}</td>
                      <td>{teacher["historical_resignations"]}</td>
                      <td>{teacher["historical_retentions"]}</td>
                      <td>{teacher["workload_per_teacher"]}</td>
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
      </div>
    </div>
  );
};

export default RiskAssessment;
