import React, { useState, useEffect, useMemo } from "react";
import "./Risk-Assessment.css";
import RecommendationList from "./RecommendationList";

// Utility function for clustering strands based on risk metrics
function clusterStrands(strandMetrics) {
  const clusters = {
    highRisk: [],
    mediumRisk: [],
    lowRisk: [],
  };

  Object.entries(strandMetrics).forEach(([strand, metrics]) => {
    const average_performance = metrics.performance || 0;
    const high_burnout_proportion = metrics.high_burnout_proportion || 0;
    if (high_burnout_proportion > 0.3 || average_performance < 65) {
      clusters.highRisk.push(strand);
    } else if (high_burnout_proportion > 0.1 || average_performance < 75) {
      clusters.mediumRisk.push(strand);
    } else {
      clusters.lowRisk.push(strand);
    }
  });

  return clusters;
}

const RiskHeatmapChart = (props) => {
  const {
    teachers = [],
    teacherEvaluations = [],
    viewMode,
    detailedMetrics = {},
    strandSpecificRisks = {},
    weightedRiskResults = {},
  } = props;

  const [hoveredCell, setHoveredCell] = useState(null);

  if (!weightedRiskResults || Object.keys(weightedRiskResults).length === 0) {
    return <p>No data available for heatmap.</p>;
  }

  const riskColor = (level) => {
    switch (level) {
      case "High":
        return "rgba(255, 78, 66, 0.8)";
      case "Medium":
        return "rgba(255, 235, 59, 0.8)";
      case "Low":
      default:
        return "rgba(129, 199, 132, 0.8)";
    }
  };

  const impactLevels = ["High", "Medium", "Low"];
  const likelihoodLevels = ["Low", "Medium", "High"];

  // Use weightedRiskResults to build riskAggregation for heatmap matrix
  const riskAggregation = {};

  impactLevels.forEach(impact => {
    likelihoodLevels.forEach(likelihood => {
      const key = `${impact}-${likelihood}`;
      riskAggregation[key] = [];
    });
  });

  // Map weightedRiskResults to riskAggregation keys
  Object.entries(weightedRiskResults).forEach(([strand, data]) => {
    const riskLevel = data.risk_level || "Low";
    // Map risk_level to impact and likelihood for matrix placement
    // For simplicity, assume risk_level corresponds to both impact and likelihood
    const impact = riskLevel === "High" ? "High" : riskLevel === "Medium" ? "Medium" : "Low";
    const likelihood = impact; // same as impact for now
    const key = `${impact}-${likelihood}`;
    if (!riskAggregation[key].includes(strand)) {
      riskAggregation[key].push(strand);
    }
  });

  // Prepare detailed info for tooltip display on hover
  const tooltipContent = hoveredCell ? (() => {
    const strands = riskAggregation[hoveredCell] || [];
    if (strands.length === 0) return "No strands in this cluster.";

    // Show list of strands in the cluster
    return (
      <div style={{ color: "#ccc", fontSize: "0.85rem", maxHeight: "300px", overflowY: "auto" }}>
        <strong>Strands in this cluster:</strong>
        <ul>
          {strands.map((strand) => (
            <li key={strand}>{strand}</li>
          ))}
        </ul>
      </div>
    );
  })() : null;

  return (
    <div style={{ color: "#ccc", fontSize: "0.9rem", position: "relative" }}>
      <div style={{ display: "grid", gridTemplateColumns: "80px repeat(3, 1fr)", gridTemplateRows: "40px repeat(3, 80px)", gap: "5px", alignItems: "center", backgroundColor: "#1e1e1e", padding: "20px", borderRadius: "8px" }}>
        <div></div>
        {likelihoodLevels.map(level => (
          <div key={level} style={{ textAlign: "center", fontWeight: "bold" }}>{level}</div>
        ))}

        {impactLevels.map((impact) => (
          <React.Fragment key={impact}>
            <div style={{ writingMode: "vertical-rl", textOrientation: "mixed", fontWeight: "bold", paddingRight: "10px" }}>
              {impact} Impact ➔
            </div>
            {likelihoodLevels.map((likelihood) => {
              const key = `${impact}-${likelihood}`;
              const count = riskAggregation[key] ? riskAggregation[key].length : 0;
              const bgColor = riskColor(impact);
              return (
                <div
                  key={key}
                  style={{
                    backgroundColor: bgColor,
                    color: "#222",
                    borderRadius: "8px",
                    padding: "10px",
                    fontWeight: "600",
                    fontSize: "0.85rem",
                    whiteSpace: "pre-line",
                    boxShadow: `0 0 10px ${bgColor}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    minHeight: "70px",
                    position: "relative",
                    cursor: count > 0 ? "pointer" : "default",
                  }}
                  onMouseEnter={() => setHoveredCell(key)}
                  onMouseLeave={() => setHoveredCell(null)}
                >
                  {count > 0 ? count : ""}
                  {count > 0 && (
                    <div title={Array.isArray(riskAggregation[key]) ? riskAggregation[key].join(", ") : ""} style={{
                      position: "absolute",
                      bottom: "5px",
                      right: "5px",
                      backgroundColor: "rgba(0,0,0,0.5)",
                      borderRadius: "50%",
                      width: "24px",
                      height: "24px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontSize: "0.75rem",
                      fontWeight: "bold",
                    }}>
                      {count}
                    </div>
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
      {hoveredCell && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 10px)",
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "#333",
          padding: "10px",
          borderRadius: "8px",
          boxShadow: "0 0 10px rgba(0,0,0,0.7)",
          maxWidth: "400px",
          zIndex: 1000,
          color: "#ccc",
        }}>
          {tooltipContent}
        </div>
      )}
    </div>
  );
};

const StrandRiskAnalysis = ({ weightedRiskResults, strandSpecificRisks }) => {
  if (!weightedRiskResults || Object.keys(weightedRiskResults).length === 0) {
    return <p>No risk assessment data available for analysis.</p>;
  }

  // Default detailed risk descriptions per strand and risk level
  const defaultRiskDescriptions = {
    STEM: {
      Low: "STEM strand shows low risk with stable performance and satisfaction levels.",
      Medium: "STEM strand has moderate risk due to some workload and performance concerns.",
      High: "STEM strand is at high risk with significant workload and retention challenges."
    },
    ABM: {
      Low: "ABM strand is performing well with low risk indicators.",
      Medium: "ABM strand shows medium risk, possibly due to moderate teacher workload.",
      High: "ABM strand faces high risk with potential issues in teacher satisfaction and retention."
    },
    ICT: {
      Low: "ICT strand is currently low risk but should monitor workload and performance.",
      Medium: "ICT strand has medium risk with some concerns in student satisfaction.",
      High: "ICT strand is high risk with critical challenges in workload and teacher retention."
    },
    HUMMS: {
      Low: "HUMMS strand maintains low risk with good performance metrics.",
      Medium: "HUMMS strand shows medium risk, possibly due to teacher satisfaction issues.",
      High: "HUMMS strand is high risk with significant challenges in performance and retention."
    },
    GAS: {
      Low: "GAS strand is low risk with stable teaching and student satisfaction.",
      Medium: "GAS strand has medium risk due to workload and performance fluctuations.",
      High: "GAS strand is high risk with critical issues in teacher workload and resignations."
    }
  };

  return (
    <div
      className="strand-risk-analysis-container"
      style={{
        marginTop: "1rem",
        color: "#ccc",
        backgroundColor: "#121212",
        padding: "12px",
        borderRadius: "8px",
        maxHeight: "600px",
        overflowY: "auto",
        boxSizing: "border-box",
      }}
    >
      <h4>Analysis of the Risk Assessment</h4>
      {Object.entries(weightedRiskResults).map(([strand, data]) => {
        const riskLevel = data.risk_level || "Low";
        const riskData = strandSpecificRisks[strand] || {};
        const description = riskData.Description || (defaultRiskDescriptions[strand] ? defaultRiskDescriptions[strand][riskLevel] : "No detailed risk description available.");
        return (
          <div key={strand} style={{ marginBottom: "1rem" }}>
            <strong>{strand} Strand</strong> - Risk Level: <em>{riskLevel}</em>
            <p>
              Possible risks and impact: {description}
            </p>
          </div>
        );
      })}
    </div>
  );
};

const RiskAnalysis = (props) => {
  const { burnoutAnalysis, recommendations } = props;

  if (!burnoutAnalysis) return null;

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
        flexDirection: "column",
        gap: "20px",
        marginTop: "1rem",
        color: "#ccc",
        fontStyle: "italic",
        backgroundColor: "#121212",
        padding: "12px",
        borderRadius: "8px",
        height: "100%",
        boxSizing: "border-box",
      }}
    >
      <div
        className="burnout-analysis"
        style={{
          flex: "0 0 auto",
          overflowY: "auto",
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
          flex: "1 1 auto",
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
};

const RiskAssessmentChart = () => {
  const [weightedRiskResults, setWeightedRiskResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/risk_assessment")
      .then((response) => response.json())
      .then((json) => {
        setWeightedRiskResults(json);
        console.log("Risk Heatmap data:", json);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching weighted risk assessment data:", error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div>Loading risk assessment data...</div>;
  }

  if (!weightedRiskResults) {
    return <div>No risk assessment data available.</div>;
  }

  return (
    <div>
      <RiskHeatmapChart weightedRiskResults={weightedRiskResults} />
    </div>
  );
};

export { RiskHeatmapChart, RiskAnalysis, RiskAssessmentChart, StrandRiskAnalysis };
