import React from "react";
import "./Risk-Assessment.css";
import RecommendationList from "./RecommendationList";


const RiskAssessmentChart = (props) => {
  const {
    teachers = [],
    teacherEvaluations = [],
    viewMode,
    burnoutAnalysis,
    recommendations,
    riskProbabilities = {} // New prop: map of teacher retention ID to risk probabilities
  } = props;

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
          className="burnout-recommendations-container"
          style={{
            display: "flex",
            gap: "20px",
            marginTop: "1rem",
            color: "#ccc",
            fontStyle: "italic",
            backgroundColor: "#121212",
            padding: "12px",
            borderRadius: "8px",
          }}
        >
          <div
            className="burnout-analysis"
            style={{
              flex: 1,
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
          <div
            className="recommendations-section"
            style={{
              flex: 1,
              maxHeight: "300px",
              overflowY: "auto",
              backgroundColor: "#222",
              padding: "10px",
              borderRadius: "8px",
              color: "white",
            }}
          >
            <h4>Recommendations</h4>
            <RecommendationList recommendations={recommendations} />
          </div>
        </div>
      );
    }
    return null;
  };

  if (viewMode === "strand") {
    // Display the risk heatmap image from Python if available
    if (props.riskHeatmapImageUrl) {
      return (
        <div style={{ backgroundColor: '#1e1e1e', height: '100%', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
          <h3>Strand-wise Risk Heatmap</h3>
          <img
            src={props.riskHeatmapImageUrl}
            alt="Risk Heatmap"
            style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px', boxShadow: '0 0 10px rgba(0,0,0,0.5)' }}
          />
          <div style={{ marginTop: '1rem' }}>
            {generateBurnoutAnalysis()}
          </div>
        </div>
      );
    }

    // Fallback to previous circle heatmap if image URL not available
    // Fixed strands in order with their IDs
    const fixedStrands = [
      { id: 1, name: "stem" },
      { id: 2, name: "abm" },
      { id: 3, name: "gas" },
      { id: 4, name: "ict" },
      { id: 5, name: "humms" },
    ];

    // Use riskProbabilities prop to determine max risk level per strand
    const strandRiskLevelMapping = {};
    fixedStrands.forEach((strand) => {
      strandRiskLevelMapping[strand.name] = "Low"; // default with capital L
    });

    if (props.riskHeatmap && props.riskHeatmap.length > 0) {
      // Use the first element of riskHeatmap array which contains the risk probabilities per strand ID
      const riskData = props.riskHeatmap[0];
      // Map strand IDs to strand names for matching keys in riskData
      const strandIdToName = {
        1: "stem",
        2: "abm",
        3: "gas",
        4: "ict",
        5: "humms",
      };

      Object.entries(riskData).forEach(([id, riskLevels]) => {
        const strandName = strandIdToName[parseInt(id)];
        if (strandName && strandRiskLevelMapping.hasOwnProperty(strandName)) {
          // Determine max risk level by highest probability
          let maxLevel = "Low";
          let maxProb = -1;
          Object.entries(riskLevels).forEach(([level, prob]) => {
            if (prob > maxProb) {
              maxProb = prob;
              maxLevel = level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
            }
          });
          strandRiskLevelMapping[strandName] = maxLevel;
        }
      });
    }

    const maxRiskLevels = fixedStrands.map((strand) => {
      return strandRiskLevelMapping[strand.name] || "Low";
    });

    // Helper functions for circle color and animation
    const circleColor = (level) => {
      switch (level) {
        case "Extreme":
          return "rgba(255, 45, 0, 0.85)"; // Dark Red
        case "High":
          return "rgba(255, 78, 66, 0.8)";
        case "Medium":
          return "rgba(255, 235, 59, 0.8)";
        case "Low":
        default:
          return "rgba(129, 199, 132, 0.8)";
      }
    };

    const circleAnimation = (level) => {
      switch (level) {
        case "High":
          return { animation: "pulseHigh 2s infinite" };
        case "Medium":
          return { animation: "pulseMedium 3s infinite" };
        case "Low":
        default:
          return { animation: "pulseLow 4s infinite" };
      }
    };

    return (
      <div style={{ backgroundColor: '#1e1e1e', height: '100%', padding: '20px', borderRadius: '8px' }}>
        <div
          className="risk-legend"
          style={{
            display: "flex",
            gap: "1.5rem",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "700",
            fontSize: "1.1rem",
            height: "50px",
          }}
        >
          <div
            className="legend-item"
            style={{ display: "flex", alignItems: "center", gap: "0" }}
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
          <div className="circle-container">
            {fixedStrands.map((strand, index) => (
              <div
                key={strand.id}
                className="risk-circle"
                style={{
                  backgroundColor: circleColor(maxRiskLevels[index]),
                  ...circleAnimation(maxRiskLevels[index]),
                }}
                title={`Strand: ${strand.name}\nRisk Level: ${maxRiskLevels[index]}`}
              >
                <div>{strand.name}</div>
                <div style={{ fontSize: '0.8rem', marginTop: '4px', color: '#222' }}>{maxRiskLevels[index]}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '20px', marginTop: '1rem', backgroundColor: '#1e1e1e', padding: '12px', borderRadius: '8px' }}>
          <div style={{ flex: 1 }}>
            {generateBurnoutAnalysis()}
          </div>
        </div>
      </div>
    );
  } else if (viewMode === "teacher") {
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
