import React from "react";
import "./Risk-Assessment.css";

const RiskAssessmentChart = ({ teachers, teacherEvaluations, viewMode, burnoutAnalysis }) => {
  if ((!teachers || teachers.length === 0) && (!teacherEvaluations || teacherEvaluations.length === 0)) {
    return <p>No data available for heatmap.</p>;
  }

  // Helper to get color for risk level
  const riskColor = (level) => {
    switch (level) {
      case "Extreme":
        return "rgba(255, 45, 0, 0.85)"; // Dark Red
      case "High":
        return "rgba(255, 78, 66, 0.8)"; // Red
      case "Medium":
        return "rgba(255, 235, 59, 0.8)"; // Yellow
      case "Low":
      default:
        return "rgba(129, 199, 132, 0.8)"; // Green
    }
  };

  // Remove hover effect by disabling pointer events and user select on heatmap cells
  const cellStyle = (level) => ({
    backgroundColor: riskColor(level),
    pointerEvents: "none",
    userSelect: "none",
    borderRadius: "6px",
    boxShadow: `0 0 8px ${riskColor(level)}`,
    fontWeight: "700",
    fontSize: "1.2rem",
    color: "#222",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  });

  // Generate detailed burnout analysis based on teacher data or burnoutAnalysis prop
  const generateBurnoutAnalysis = () => {
    if (burnoutAnalysis) {
      if (burnoutAnalysis.count === 0) {
        return (
          <div
            className="burnout-analysis"
            style={{ marginTop: "1rem", color: "#ccc", fontStyle: "italic" }}
          >
            <p>No teachers currently identified as high risk for burnout.</p>
          </div>
        );
      }
      return (
        <div
          className="burnout-analysis"
          style={{
            marginTop: "1rem",
            color: "#ccc",
            fontStyle: "italic",
            backgroundColor: "#121212",
            padding: "12px",
            borderRadius: "8px",
          }}
        >
          <h4>Burnout Analysis</h4>
          <p>Teachers identified as high risk tend to have the following characteristics:</p>
          <ul>
            <li>Average working hours per week: <strong>{burnoutAnalysis.average_hours_per_week.toFixed(1)}</strong></li>
            <li>Average performance score: <strong>{burnoutAnalysis.average_performance.toFixed(1)}</strong></li>
            <li>Average teacher satisfaction: <strong>{(burnoutAnalysis.average_teacher_satisfaction * 100).toFixed(1)}%</strong></li>
            <li>Average student satisfaction: <strong>{(burnoutAnalysis.average_student_satisfaction * 100).toFixed(1)}%</strong></li>
          </ul>
          <p>This suggests that high workload combined with lower satisfaction and performance may contribute to burnout risk.</p>
        </div>
      );
    }
    return null;
  };

  if (viewMode === "strand") {
    // Updated strand-wise heatmap to display all strands with their risk level individually
    const strandMap = {};
    teachers.forEach((t) => {
      const strand = t["Strand"] || "Unknown";
      if (!strandMap[strand]) {
        strandMap[strand] = { count: 0, riskSum: 0 };
      }
      let riskValue = 0;
      switch (t["Risk Level"]) {
        case "High":
          riskValue = 3;
          break;
        case "Medium":
          riskValue = 2;
          break;
        case "Low":
        default:
          riskValue = 1;
          break;
      }
      strandMap[strand].count += 1;
      strandMap[strand].riskSum += riskValue;
    });

    const strands = Object.keys(strandMap);
    const avgRiskLevels = strands.map((strand) => {
      const avg = strandMap[strand].riskSum / strandMap[strand].count;
      if (avg >= 2.5) return "High";
      if (avg >= 1.5) return "Medium";
      return "Low";
    });

    return (
      <div>
        <div
          className="risk-legend"
          style={{
            display: "flex",
            gap: "1.5rem",
            marginBottom: "1.5rem",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "700",
            fontSize: "1.1rem",
          }}
        >
          <div
            className="legend-item"
            style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
          >
            <span
              className="color-box high"
              style={{
                backgroundColor: "rgba(255, 78, 66, 0.8)",
                width: "24px",
                height: "24px",
                display: "inline-block",
                borderRadius: "6px",
                boxShadow: "0 0 8px rgba(255, 78, 66, 0.8)",
              }}
            ></span>
            <span>High Risk</span>
          </div>
          <div
            className="legend-item"
            style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
          >
            <span
              className="color-box medium"
              style={{
                backgroundColor: "rgba(255, 235, 59, 0.8)",
                width: "24px",
                height: "24px",
                display: "inline-block",
                borderRadius: "6px",
                boxShadow: "0 0 8px rgba(255, 235, 59, 0.8)",
              }}
            ></span>
            <span>Medium Risk</span>
          </div>
          <div
            className="legend-item"
            style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
          >
            <span
              className="color-box low"
              style={{
                backgroundColor: "rgba(129, 199, 132, 0.8)",
                width: "24px",
                height: "24px",
                display: "inline-block",
                borderRadius: "6px",
                boxShadow: "0 0 8px rgba(129, 199, 132, 0.8)",
              }}
            ></span>
            <span>Low Risk</span>
          </div>
        </div>
        <div className="heatmap-container">
          <h3>Strand-wise Risk Heatmap</h3>
          <div className="heatmap-grid">
            {strands.map((strand, index) => (
              <div
                key={`${strand}-${index}`}
                className="heatmap-cell gradient-cell"
                style={cellStyle(avgRiskLevels[index])}
                title={`Strand: ${strand}\nRisk Level: ${avgRiskLevels[index]}`}
              >
                {strand}
              </div>
            ))}
          </div>
        </div>
        {generateBurnoutAnalysis()}
      </div>
    );
  } else if (viewMode === "teacher") {
    // Use teacherEvaluations data for teacher-wise heatmap
    return (
      <div>
        <div
          className="risk-legend"
          style={{
            display: "flex",
            gap: "1.5rem",
            marginBottom: "1.5rem",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "700",
            fontSize: "1.1rem",
          }}
        >
          <div
            className="legend-item"
            style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
          >
            <span
              className="color-box high"
              style={{
                backgroundColor: "rgba(255, 78, 66, 0.8)",
                width: "24px",
                height: "24px",
                display: "inline-block",
                borderRadius: "6px",
                boxShadow: "0 0 8px rgba(255, 78, 66, 0.8)",
              }}
            ></span>
            <span>High Risk</span>
          </div>
          <div
            className="legend-item"
            style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
          >
            <span
              className="color-box medium"
              style={{
                backgroundColor: "rgba(255, 235, 59, 0.8)",
                width: "24px",
                height: "24px",
                display: "inline-block",
                borderRadius: "6px",
                boxShadow: "0 0 8px rgba(255, 235, 59, 0.8)",
              }}
            ></span>
            <span>Medium Risk</span>
          </div>
          <div
            className="legend-item"
            style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
          >
            <span
              className="color-box low"
              style={{
                backgroundColor: "rgba(129, 199, 132, 0.8)",
                width: "24px",
                height: "24px",
                display: "inline-block",
                borderRadius: "6px",
                boxShadow: "0 0 8px rgba(129, 199, 132, 0.8)",
              }}
            ></span>
            <span>Low Risk</span>
          </div>
        </div>
        <div className="heatmap-container" style={{ position: "relative", zIndex: 1 }}>
          <h3>Teacher-wise Risk Heatmap</h3>
          <div className="heatmap-grid teacher-grid">
            {teacherEvaluations.map((evalItem, index) => (
              <div
                key={`${evalItem.evaluation_id}-${index}`}
                className="heatmap-cell gradient-cell"
                style={cellStyle("Medium")} // Default color, can be enhanced with risk level if available
                title={`Teacher: ${evalItem.teacher_name}\nOverall Score: ${evalItem.overall_score}`}
              >
                {evalItem.teacher_name}
              </div>
            ))}
          </div>
        </div>
        {generateBurnoutAnalysis()}
      </div>
    );
  } else {
    return <p>Invalid view mode.</p>;
  }
};

export default RiskAssessmentChart;
