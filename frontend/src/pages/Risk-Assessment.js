import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Papa from "papaparse"; // For CSV parsing
import { RiskHeatmapChart, RiskAnalysis } from "./RiskAssessmentChart";
import "./Risk-Assessment.css";
import RecommendationList from "./RecommendationList";
import LoadingSpinner from "../../components/LoadingSpinner";

const RiskAssessment = () => {
  const [teachers, setTeachers] = useState([]);
  const [latestYear, setLatestYear] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [burnoutAnalysis, setBurnoutAnalysis] = useState(null);
  const [teacherEvaluations, setTeacherEvaluations] = useState([]);
  const [viewMode, setViewMode] = useState("strand"); // "strand" or "teacher"
  const [uploadMessage, setUploadMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [riskHeatmap, setRiskHeatmap] = useState([]);
  const [riskHeatmapImageUrl, setRiskHeatmapImageUrl] = useState("");
  const [likelihoodExplanations, setLikelihoodExplanations] = useState({});
  const [impactExplanations, setImpactExplanations] = useState({});
  const [strandSpecificRisks, setStrandSpecificRisks] = useState({});
  const [recommendationsByZone, setRecommendationsByZone] = useState({});

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
    setLoading(true);
    setUploadMessage("");
    try {
      // Fetch combined risk assessment data (includes teacher retention and trend identification)
      const riskData = await sendRequest("http://localhost:8000/api/risk_assessment.php");
      console.log("Fetched riskData:", riskData);
      console.log("Risk Heatmap data:", riskData.riskHeatmap);
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
            "teacher_satisfaction": item.teacher_satisfaction,
            "student_satisfaction": item.student_satisfaction,
            "riskLevel": item["Risk Level"] || null,
            "impact_level": item.impact_level || null,
            "risk_distribution": item.risk_distribution || null
          }));
          setTeachers(mappedTeachers);
          // Determine latest year
          const years = mappedTeachers.map(t => t.year);
          const maxYear = Math.max(...years);
          setLatestYear(maxYear);
        } else {
          setTeachers([]);
          setLatestYear(null);
        }
      if (riskData.riskHeatmap) {
        setRiskHeatmap(riskData.riskHeatmap);
      } else {
        setRiskHeatmap([]);
      }
      if (riskData.riskHeatmapImageUrl) {
        setRiskHeatmapImageUrl(riskData.riskHeatmapImageUrl);
      } else {
        setRiskHeatmapImageUrl("");
      }

      if (riskData.recommendations) {
        if (Array.isArray(riskData.recommendations)) {
          setRecommendations(riskData.recommendations);
        } else if (typeof riskData.recommendations === 'object') {
          setRecommendations(Object.values(riskData.recommendations));
        } else {
          setRecommendations([]);
        }
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
      if (riskData.likelihoodExplanations) {
        setLikelihoodExplanations(riskData.likelihoodExplanations);
      } else {
        setLikelihoodExplanations({});
      }
      if (riskData.impactExplanations) {
        setImpactExplanations(riskData.impactExplanations);
      } else {
        setImpactExplanations({});
      }
      if (riskData.strandSpecificRisks) {
        setStrandSpecificRisks(riskData.strandSpecificRisks);
      } else {
        setStrandSpecificRisks({});
      }
      if (riskData.recommendationsByZone) {
        setRecommendationsByZone(riskData.recommendationsByZone);
      } else {
        setRecommendationsByZone({});
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setUploadMessage("Failed to load data: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [sendRequest]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchData();
      }
    };

    const handleWindowFocus = () => {
      fetchData();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
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

  // Helper component to render explanations list
  const ExplanationsList = ({ title, explanations }) => (
    <div style={{ marginBottom: "1rem" }}>
      <h3>{title}</h3>
      <ul>
        {explanations.map((explanation, idx) => (
          <li key={idx}>{explanation}</li>
        ))}
      </ul>
    </div>
  );

  // Helper component to render strand-specific risks
  const StrandRisk = ({ strand, data }) => (
    <div style={{ marginBottom: "1rem" }}>
      <h4>{strand} Strand</h4>
      <p><strong>Likelihood:</strong> {data.Likelihood}</p>
      <p><strong>Impact:</strong> {data.Impact}</p>
      <p><strong>Mitigation:</strong></p>
      <ul>
        {data.Mitigation.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>
    </div>
  );

  // Helper component to render recommendations by zone
  const RecommendationsByZone = ({ recommendations }) => (
    <div>
      {Object.entries(recommendations).map(([zone, recs]) => (
        <div key={zone} style={{ marginBottom: "1rem" }}>
          <h3>{zone}</h3>
          <ul>
            {recs.map((rec, idx) => (
              <li key={idx}>{rec}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );

  // Filter teachers by latestYear for display and passing to RiskAssessmentChart
  const filteredTeachers = latestYear !== null ? teachers.filter(t => t.year === latestYear) : [];

  return (
    <div className="risk-assessment-container">
      <header className="header">
        <div className="logo"></div>
        <h1 className="title" onClick={() => navigate("/analysis")}>
          LYCEUM OF ALABANG
        </h1>
      </header>

      <div className="risk-content" style={{ marginTop: "5px", overflowX: "auto", height: "100vh" }}>
        {/* First Section */}
        <div className="first-section">
          <div className="view-mode-buttons centered-buttons">
            <button onClick={() => setViewMode("strand")} className={viewMode === "strand" ? "active" : ""}>
              Strand-wise View
            </button>
            <button onClick={() => setViewMode("teacher")} className={viewMode === "teacher" ? "active" : ""}>
              Teacher-wise View
            </button>
            <button onClick={fetchData} style={{ marginLeft: "10px", padding: "0.5rem 1rem", cursor: "pointer" }}>
              Refresh Data
            </button>
          </div>
          <div className="two-columns" style={{ display: "flex", gap: "20px", height: "600px" }}>
            <div className="left-column" style={{ flex: 1, overflowY: "auto" }}>
              <h2>Risk Heatmap {latestYear ? `- Year: ${latestYear}` : ""}</h2>
              <RiskHeatmapChart
                teachers={filteredTeachers}
                teacherEvaluations={teacherEvaluations}
                viewMode={viewMode}
                strandSpecificRisks={strandSpecificRisks}
              />
            </div>
            <div className="right-column" style={{ flex: 1, overflowY: "auto" }}>
              <h2>Analysis of the Risk Assessment</h2>
              <RiskAnalysis
                burnoutAnalysis={burnoutAnalysis}
                recommendations={recommendations}
              />
            </div>
          </div>
        </div>

        {/* Second Section: Detailed Risk Insights */}
        <div className="detailed-risk-insights" style={{ marginTop: "20px", padding: "20px", backgroundColor: "#1e1e1e", borderRadius: "8px", color: "#ccc" }}>
          <h2>Detailed Risk Insights</h2>

          <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 300px" }}>
              <ExplanationsList title="Likelihood (Probability of Occurrence)" explanations={Object.entries(likelihoodExplanations).map(([key, vals]) => (
                <React.Fragment key={key}>
                  <strong>{key}</strong>
                  <ul>
                    {vals.map((v, i) => <li key={i}>{v}</li>)}
                  </ul>
                </React.Fragment>
              ))} />
            </div>

            <div style={{ flex: "1 1 300px" }}>
              <ExplanationsList title="Impact (Severity of Consequences)" explanations={Object.entries(impactExplanations).map(([key, vals]) => (
                <React.Fragment key={key}>
                  <strong>{key}</strong>
                  <ul>
                    {vals.map((v, i) => <li key={i}>{v}</li>)}
                  </ul>
                </React.Fragment>
              ))} />
            </div>
          </div>

          <div style={{ marginTop: "2rem" }}>
            <h3>Strand-Specific Risks</h3>
            {Object.entries(strandSpecificRisks).map(([strand, data]) => (
              <StrandRisk key={strand} strand={strand} data={data} />
            ))}
          </div>

          <div style={{ marginTop: "2rem" }}>
            <h3>Recommendations from Your Data</h3>
            <RecommendationsByZone recommendations={recommendationsByZone} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskAssessment;
