import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, LabelList,
} from 'recharts';

const strandColors = {
  STEM: '#52c41a',   // Green
  ABM: '#ff4d4f',    // Red
  GAS: '#fa8c16',    // Orange
  HUMSS: '#fadb14',  // Yellow
  ICT: '#1890ff',    // Blue
};

const strands = [
  { key: 'STEM', label: 'Science, Technology, Engineering, and Mathematics (STEM)' },
  { key: 'ABM', label: 'Accountancy, Business, and Management (ABM)' },
  { key: 'GAS', label: 'General Academic Strand (GAS)' },
  { key: 'HUMSS', label: 'Humanities and Social Sciences (HUMSS)' },
  { key: 'ICT', label: 'Information and Communications Technology (ICT)' },
];

const CategoryLegend = () => {
  return (
    <div style={{ display: 'flex', gap: 40, color: 'white', fontSize: 12, marginBottom: 8, justifyContent: 'center' }}>
      <div>
        <div style={{ fontWeight: 'bold', marginBottom: 4 }}>Retaining</div>
        <div style={{ display: 'flex', gap: 10 }}>
          {strands.map(({ key, label }) => (
            <div key={`retain-legend-${key}`} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <div style={{ width: 12, height: 12, backgroundColor: strandColors[key], borderRadius: 2 }}></div>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div style={{ fontWeight: 'bold', marginBottom: 4 }}>Resigning</div>
        <div style={{ display: 'flex', gap: 10 }}>
          {strands.map(({ key, label }) => (
            <div key={`resign-legend-${key}`} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <div style={{ width: 12, height: 12, backgroundColor: strandColors[key], borderRadius: 2, opacity: 0.6 }}></div>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};



const PredictionChart = ({ data }) => {
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [hoveredYear, setHoveredYear] = useState(null);
  const [hoveredStrand, setHoveredStrand] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  if (!data || data.length === 0) {
    return <div>No data available for chart.</div>;
  }

  // Transform data to have unique keys per strand and type, and calculate percentages
  const chartData = data.map(item => {
    const yearData = { year: item.year };
    strands.forEach(({ key }) => {
      const resign = item.resignations_count ? item.resignations_count[key] || 0 : 0;
      const retain = item.retentions_count ? item.retentions_count[key] || 0 : 0;
      // const hire = item.hires_needed ? item.hires_needed[key] || 0 : 0; // removed hires from this chart
      const total = resign + retain || 1; // avoid division by zero, exclude hires from total
      yearData[`${key}_resignations`] = (resign / total) * 100;
      yearData[`${key}_retentions`] = (retain / total) * 100;
      // yearData[`${key}_hires`] = hire; // removed hires from this chart
    });
    return yearData;
  });

  const handleMouseEnter = (data, index, e, category, strand) => {
    setHoveredCategory(category);
    setHoveredYear(data.year);
    setHoveredStrand(strand);
    setTooltipPosition({ x: e.chartX, y: e.chartY });
  };

  const handleMouseLeave = () => {
    setHoveredCategory(null);
    setHoveredYear(null);
    setHoveredStrand(null);
  };

  // Prepare tooltip data for hovered category, year, and strand
  let tooltipData = null;
  if (hoveredCategory && hoveredYear && hoveredStrand) {
    const yearData = chartData.find(d => d.year === hoveredYear);
    if (yearData) {
      tooltipData = [{
        strand: hoveredStrand,
        value: yearData[`${hoveredStrand}_${hoveredCategory}`] || 0,
      }];
    }
  }

  const categoryNames = {
    resignations: 'Resigning',
    retentions: 'Retaining',
    hires: 'To be Hired',
  };

  // Layman's terms explanations for tooltip categories
  const categoryExplanations = {
    resignations: 'Teachers expected to leave their jobs',
    retentions: 'Teachers expected to stay in their jobs',
  };

  return (
    <div style={{ marginTop:'-10px', width: '100%', height: 220, position: 'relative', color: 'white' }}>
      <h2 style={{ marginBottom: '8px' }}>Predicting teachers who will leave and stay for 3 Years</h2>
      <p style={{ marginTop: 0, marginBottom: 16, fontSize: 14, maxWidth: 600 }}>
        This chart predicts the percentage of teachers who will stay (retain) and who will leave (resign) in each (strand) over the next three years. Hover over the bars to see detailed percentages.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 12, color: 'white', fontSize: 12 }}>
        <div style={{ display: 'flex', gap: 20, marginBottom: 8 }}>
          {strands.map(({ key, label }) => (
            <div key={key} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <div style={{ width: 12, height: 12, backgroundColor: strandColors[key], borderRadius: 2 }}></div>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top: 50, right: 30, left: 20, bottom: 40,
            }}
            barCategoryGap="5%"
            barGap={4}
          >
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="year"
            tick={({ x, y, payload }) => {
              const year = payload.value;
              return (
                <g transform={`translate(${x},${y + 10})`}>
                  <text x={0} y={0} fill="white" fontSize={12} textAnchor="middle">{year}</text>
                  <text x={-20} y={18} fill="white" fontSize={10} textAnchor="middle">Resign</text>
                  <text x={20} y={18} fill="white" fontSize={10} textAnchor="middle">Retain</text>
                </g>
              );
            }}
          />
          <YAxis label={{ value: 'Number of Teachers', angle: -90, position: 'insideLeft', fill: 'white', fontSize: 12 }} />
          {/* Removed default legend */}
          {/* <Legend content={<CustomLegend />} /> */}
          {strands.map(({ key }) => (
            <Bar
              key={`resign-${key}`}
              dataKey={`${key}_resignations`}
              fill={strandColors[key]}
              name={`${key} Resigning`}
              cursor="pointer"
              onMouseEnter={(data, index, e) => handleMouseEnter(data, index, e, 'resignations', key)}
              onMouseLeave={handleMouseLeave}
            />
          ))}
          {strands.map(({ key }) => (
            <Bar
              key={`retain-${key}`}
              dataKey={`${key}_retentions`}
              fill={strandColors[key]}
              name={`${key} Retaining`}
              cursor="pointer"
              onMouseEnter={(data, index, e) => handleMouseEnter(data, index, e, 'retentions', key)}
              onMouseLeave={handleMouseLeave}
            />
          ))}
      </BarChart>
      </ResponsiveContainer>
      {tooltipData && (
        <div
          style={{
            position: 'absolute',
            pointerEvents: 'none',
            backgroundColor: '#333',
            color: 'white',
            padding: '5px 10px',
            borderRadius: 4,
            top: tooltipPosition.y,
            left: tooltipPosition.x,
            transform: 'translate(10px, -100%)',
            whiteSpace: 'nowrap',
            fontSize: 12,
            zIndex: 1000,
          }}
        >
          <div>{`Year: ${hoveredYear}`}</div>
          <div><strong>{categoryNames[hoveredCategory]}</strong></div>
          <div style={{ fontStyle: 'italic', fontSize: 11, marginBottom: 4 }}>
            {categoryExplanations[hoveredCategory]}
          </div>
          {tooltipData.map(({ strand, value }) => (
            <div key={strand}>{`${strand}: ${value.toFixed(1)}%`}</div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PredictionChart;
