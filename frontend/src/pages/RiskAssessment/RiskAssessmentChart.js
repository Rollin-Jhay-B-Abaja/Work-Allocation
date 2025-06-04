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

    // Show list of strands in the cluster with layman-friendly explanation
    return (
      <div style={{ color: "#ccc", fontSize: "0.85rem", maxHeight: "300px", overflowY: "auto" }}>
        <strong>Strands in this risk category:</strong>
        <ul>
          {strands.map((strand) => (
            <li key={strand}>{strand}</li>
          ))}
        </ul>
        <p style={{marginTop: "8px"}}>
          This category groups strands with similar risk levels based on teacher workload, performance, and satisfaction.
        </p>
      </div>
    );
  })() : null;

  return (
      <div style={{ color: "#ccc", fontSize: "0.9rem", position: "relative" }}>
      <h3 style={{marginBottom: "10px", color: "#eee"}}>Risk Heatmap Overview</h3>
      <p style={{maxWidth: "600px", marginBottom: "20px", color: "#bbb"}}>
        This heatmap shows the risk levels of different strands based on their impact and likelihood. 
        The colors indicate the severity of risk: green for low, yellow for medium, and red for high. 
        Hover over each cell to see which strands fall into that risk category.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "80px repeat(3, 1fr)", gridTemplateRows: "20px repeat(3, 1fr)", gap: "2px", alignItems: "stretch", width: "600px", height: "140px", backgroundColor: "#1e1e1e", padding: "20px", borderRadius: "1px" }}>
        <div></div>
        {likelihoodLevels.map(level => (
          <div key={level} style={{ textAlign: "center", fontWeight: "bold" }}>{level} Likelihood</div>
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
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
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

  // Improved detailed risk descriptions per strand and risk level with layman-friendly language
  const improvedRiskDescriptions = {
    STEM: {
      Low: "The STEM strand is doing well with stable performance and happy teachers.",
      Medium: "The STEM strand has some concerns like moderate workload and teacher stress.",
      High: "The STEM strand is facing serious challenges with high workload and teacher burnout risk."
    },
    ABM: {
      Low: "The ABM strand is performing well with satisfied teachers and manageable workload.",
      Medium: "The ABM strand has moderate risk due to some workload and satisfaction issues.",
      High: "The ABM strand is at high risk with significant teacher dissatisfaction and retention problems."
    },
    ICT: {
      Low: "The ICT strand is currently low risk with good performance and teacher satisfaction.",
      Medium: "The ICT strand has some concerns about workload and student satisfaction.",
      High: "The ICT strand is high risk with critical challenges in workload and teacher retention."
    },
    HUMMS: {
      Low: "The HUMMS strand is stable with good performance and low risk.",
      Medium: "The HUMMS strand has moderate risk due to teacher satisfaction concerns.",
      High: "The HUMMS strand is facing high risk with significant performance and retention challenges."
    },
    GAS: {
      Low: "The GAS strand is low risk with stable teaching and satisfied teachers.",
      Medium: "The GAS strand has some workload and performance fluctuations causing moderate risk.",
      High: "The GAS strand is high risk with serious issues in teacher workload and resignations."
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
        const description = riskData.Description || (improvedRiskDescriptions[strand] ? improvedRiskDescriptions[strand][riskLevel] : "No detailed risk description available.");
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
