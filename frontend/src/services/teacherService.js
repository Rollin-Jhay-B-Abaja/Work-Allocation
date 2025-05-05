const API_URL = 'http://localhost:8000/api/employee_handler.php';

export async function getTeachers() {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error('Failed to fetch teachers');
  }
  return await response.json();
}

export async function getTeacherById(teacher_id) {
  const response = await fetch(API_URL + '?employee_id=' + teacher_id);
  if (!response.ok) {
    throw new Error('Failed to fetch teacher');
  }
  return await response.json();
}

export async function saveTeacher(teacher) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(teacher)
  });
  if (!response.ok) {
    throw new Error('Failed to save teacher');
  }
  return await response.json();
}

export async function deleteTeacher(teacher_id) {
  const response = await fetch(API_URL + '?employee_id=' + teacher_id, {
    method: 'DELETE'
  });
  if (!response.ok) {
    throw new Error('Failed to delete teacher');
  }
  return await response.json();
}
