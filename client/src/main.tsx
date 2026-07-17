import { StrictMode } from 'react'
import './i18n'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { SnackbarProvider } from 'notistack'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <SnackbarProvider maxSnack={4} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <App />
      </SnackbarProvider>
    </LocalizationProvider>
  </StrictMode>,
)
