// authService.js
export const login = async (username, password) => {
  try {
    const response = await fetch('http://localhost:8000/api/auth.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    console.log('Login API Response:', data); // Log complete response


    if (data.success) {
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userRole', data.role);
      return { success: true, data };
    } else {
      return { success: false, message: data.message || 'Login failed' };
    }
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, message: 'Network error. Please try again.' };
  }
};



export const logout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userRole');
  // Redirect to login page
  window.location.href = '/login';
};

export const getCurrentRole = () => {
  return localStorage.getItem('userRole');
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('authToken');
};
