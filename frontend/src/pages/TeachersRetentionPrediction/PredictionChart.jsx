import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, LabelList,
} from 'recharts';

const colors = {
  resignations: '#ff4d4f',
  retentions: '#52c41a',
  hires: '#1890ff',
};

const strands = ['STEM', 'ABM', 'GAS', 'HUMSS', 'ICT'];

// Custom legend component to group legend items by category color
const CustomLegend = (props) => {
  const { payload } = props;

  if (!payload) return null;

  const groups = {
    resignations: [],
    retentions: [],
    hires: [],
  };

  payload.forEach(item => {
    if (item.dataKey.includes('resignations')) {
      groups.resignations.push(item);
    } else if (item.dataKey.includes('retentions')) {
      groups.retentions.push(item);
    } else if (item.dataKey.includes('hires')) {
      groups.hires.push(item);
    }
  });

  const renderGroup = (groupName, items, color) => (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4, fontSize: 12, color: 'white' }}>
      <div style={{ width: 12, height: 12, backgroundColor: color, marginRight: 6, borderRadius: 2 }}></div>
      <div>
        {items.map((item) => (
          <span key={item.dataKey} style={{ marginRight: 8 }}>
            {item.value}
          </span>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ padding: 4, backgroundColor: '#1e1e1e', borderRadius: 4 }}>
      {renderGroup('Resignations', groups.resignations, colors.resignations)}
      {renderGroup('Retentions', groups.retentions, colors.retentions)}
      {renderGroup('Hires', groups.hires, colors.hires)}
    </div>
  );
};

const PredictionChart = ({ data }) => {
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [hoveredYear, setHoveredYear] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  if (!data || data.length === 0) {
    return <div>No data available for chart.</div>;
  }

  // Transform data to have unique keys per strand and type
  const chartData = data.map(item => {
    const yearData = { year: item.year };
    strands.forEach(strand => {
      yearData[`${strand}_resignations`] = item.resignations_count ? item.resignations_count[strand] || 0 : 0;
      yearData[`${strand}_retentions`] = item.retentions_count ? item.retentions_count[strand] || 0 : 0;
      yearData[`${strand}_hires`] = item.hires_needed ? item.hires_needed[strand] || 0 : 0;
    });
    return yearData;
  });

  const handleMouseEnter = (data, index, e, category) => {
    setHoveredCategory(category);
    setHoveredYear(data.year);
    setTooltipPosition({ x: e.chartX, y: e.chartY });
  };

  const handleMouseLeave = () => {
    setHoveredCategory(null);
    setHoveredYear(null);
  };

  // Prepare tooltip data for hovered category and year
  let tooltipData = null;
  if (hoveredCategory && hoveredYear) {
    const yearData = chartData.find(d => d.year === hoveredYear);
    if (yearData) {
      tooltipData = strands.map(strand => ({
        strand,
        value: yearData[`${strand}_${hoveredCategory}`] || 0,
      }));
    }
  }

  const categoryNames = {
    resignations: 'Resigning',
    retentions: 'Retaining',
    hires: 'To be Hired',
  };

  return (
    <div style={{ width: '100%', height: 300, position: 'relative' }}>
      <h2 style={{ marginBottom: '12px' }}>Prediction Visualization</h2>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{
            top: 20, right: 30, left: 20, bottom: 5,
          }}
        >
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis label={{ value: 'Count', angle: -90, position: 'insideLeft', fill: 'white', fontSize: 12 }} />
          <Legend content={<CustomLegend />} />
          {strands.map((strand) => (
            <Bar
              key={`resign-${strand}`}
              dataKey={`${strand}_resignations`}
              fill={colors.resignations}
              name={`${strand} Resigning`}
              cursor="pointer"
              onMouseEnter={(data, index, e) => handleMouseEnter(data, index, e, 'resignations')}
              onMouseLeave={handleMouseLeave}
            >
              <LabelList 
                dataKey={`${strand}_resignations`} 
                position="top" 
                fill="white" 
                fontSize={10} 
                formatter={(value) => value} 
              />
            </Bar>
          ))}
          {strands.map((strand) => (
            <Bar
              key={`retain-${strand}`}
              dataKey={`${strand}_retentions`}
              fill={colors.retentions}
              name={`${strand} Retaining`}
              cursor="pointer"
              onMouseEnter={(data, index, e) => handleMouseEnter(data, index, e, 'retentions')}
              onMouseLeave={handleMouseLeave}
            >
              <LabelList 
                dataKey={`${strand}_retentions`} 
                position="top" 
                fill="white" 
                fontSize={10} 
                formatter={(value) => value} 
              />
            </Bar>
          ))}
          {strands.map((strand) => (
            <Bar
              key={`hire-${strand}`}
              dataKey={`${strand}_hires`}
              fill={colors.hires}
              name={`${strand} To be Hired`}
              cursor="pointer"
              onMouseEnter={(data, index, e) => handleMouseEnter(data, index, e, 'hires')}
              onMouseLeave={handleMouseLeave}
            >
              <LabelList 
                dataKey={`${strand}_hires`} 
                position="top" 
                fill="white" 
                fontSize={10} 
                formatter={(value) => value} 
              />
            </Bar>
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
          {tooltipData.map(({ strand, value }) => (
            <div key={strand}>{`${strand}: ${value.toFixed(2)}`}</div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PredictionChart;
