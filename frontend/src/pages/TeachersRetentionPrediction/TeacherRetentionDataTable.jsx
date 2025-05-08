import React from 'react';

const TeacherRetentionDataTable = ({ data }) => {
  if (!data || data.length === 0) {
    return <div>No saved data available.</div>;
  }

  return (
      <table className="saved-data-table">
        <thead>
          <tr>
            <th>id</th>
            <th>year</th>
            <th>strand_name</th>
            <th>teachers_count</th>
            <th>students_count</th>
            <th>target_ratio</th>
            <th>max_class_size</th>
            <th>salary_ratio</th>
            <th>professional_dev_hours</th>
            <th>historical_resignations</th>
            <th>historical_retentions</th>
            <th>workload_per_teacher</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index}>
              <td>{row.id}</td>
              <td>{row.year}</td>
              <td>{row.strand_name}</td>
              <td>{row.teachers_count}</td>
              <td>{row.students_count}</td>
              <td>{row.target_ratio}</td>
              <td>{row.max_class_size}</td>
              <td>{row.salary_ratio}</td>
              <td>{row.professional_dev_hours}</td>
              <td>{row.historical_resignations}</td>
              <td>{row.historical_retentions}</td>
              <td>{row.workload_per_teacher}</td>
            </tr>
          ))}
        </tbody>
      </table>
  );
};

export default TeacherRetentionDataTable;
