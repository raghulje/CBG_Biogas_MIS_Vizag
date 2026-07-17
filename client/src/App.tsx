import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './router';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useEffect, useState } from 'react';
import { createAppTheme } from './themes';

function App() {
  const [themeKey, setThemeKey] = useState<string>(() => localStorage.getItem('appTheme') || 'classic');
  const [muiTheme, setMuiTheme] = useState(() => createAppTheme(themeKey));

  useEffect(() => {
    // Apply saved theme key
    setMuiTheme(createAppTheme(themeKey));
    localStorage.setItem('appTheme', themeKey);
  }, [themeKey]);

  // Try fetch server-side saved theme (public endpoint)
  useEffect(() => {
    fetch('/api/app-config/theme')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data && data.theme && data.theme !== themeKey) {
          setThemeKey(data.theme);
        }
      })
      .catch(() => { /* ignore */ });
  }, []);

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <BrowserRouter basename={__BASE_PATH__}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;