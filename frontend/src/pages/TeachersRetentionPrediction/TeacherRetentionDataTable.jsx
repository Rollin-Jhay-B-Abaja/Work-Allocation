import React from 'react';

const TeacherRetentionDataTable = ({ data }) => {
  if (!data || data.length === 0) {
    return <div>No saved data available.</div>;
  }

  return (
    <div style={{ overflowX: 'auto', maxWidth: '800vh' }}>
      <table className="saved-data-table" style={{ minWidth: '1000vh' }}>
        <thead>
          <tr>
            <th>id</th>
            <th>year</th>
            <th>teachers_STEM</th>
            <th>teachers_ABM</th>
            <th>teachers_GAS</th>
            <th>teachers_HUMSS</th>
            <th>teachers_ICT</th>
            <th>students_STEM</th>
            <th>students_ABM</th>
            <th>students_GAS</th>
            <th>students_HUMSS</th>
            <th>students_ICT</th>
            <th>historical_resignations</th>
            <th>historical_retentions</th>
            <th>workload_per_teacher</th>
            <th>salary_ratio</th>
            <th>professional_dev_hours</th>
            <th>target_ratio</th>
            <th>max_class_size</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index}>
              <td>{row.id}</td>
              <td>{row.year}</td>
              <td>{row.teachers_STEM}</td>
              <td>{row.teachers_ABM}</td>
              <td>{row.teachers_GAS}</td>
              <td>{row.teachers_HUMSS}</td>
              <td>{row.teachers_ICT}</td>
              <td>{row.students_STEM}</td>
              <td>{row.students_ABM}</td>
              <td>{row.students_GAS}</td>
              <td>{row.students_HUMSS}</td>
              <td>{row.students_ICT}</td>
              <td>{row.historical_resignations}</td>
              <td>{row.historical_retentions}</td>
              <td>{row.workload_per_teacher}</td>
              <td>{row.salary_ratio}</td>
              <td>{row.professional_dev_hours}</td>
              <td>{row.target_ratio}</td>
              <td>{row.max_class_size}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TeacherRetentionDataTable;
