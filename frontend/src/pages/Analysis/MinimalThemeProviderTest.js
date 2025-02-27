import React from 'react';
import { ThemeProvider } from 'react-bootstrap';

const MinimalThemeProviderTest = () => {
  return (
    <ThemeProvider>
      <div>
        <h1>Theme Provider Test</h1>
        <p>If you see this text, the ThemeProvider is working correctly.</p>
      </div>
    </ThemeProvider>
  );
};

export default MinimalThemeProviderTest;
