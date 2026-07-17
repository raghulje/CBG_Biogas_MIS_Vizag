import { useState } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Paper,
  CircularProgress,
  InputAdornment,
  IconButton,
  Link,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { tokens } from '../../themes';
import LockResetIcon from '@mui/icons-material/LockReset';
import { authService } from '../../services/authService';
import refexLogo from '../../assets/refex-logo.png';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const search = useLocation().search;
  const tokenInQuery = new URLSearchParams(search).get('token') || '';
  const [token] = useState(tokenInQuery);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return setMessage({ type: 'error', text: 'Token is required. Open the link from your email.' });
    if (password.length < 6) return setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
    if (password !== confirm) return setMessage({ type: 'error', text: 'Passwords do not match' });
    setLoading(true);
    setMessage(null);
    try {
      await authService.resetPassword(token, password);
      setMessage({ type: 'success', text: 'Password reset successful. Redirecting to login...' });
      setTimeout(() => navigate('/login'), 1500);
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.response?.data?.message || 'Failed to reset password' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        bgcolor: tokens.bg,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 440,
          p: { xs: 3, sm: 4 },
          borderRadius: `${tokens.radius.dialog}px`,
          border: `1px solid ${tokens.border}`,
          boxShadow: tokens.shadow.md,
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <img src={refexLogo} alt="Company logo" style={{ height: 48, marginBottom: 12 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 0.5 }}>
            <LockResetIcon sx={{ color: tokens.primary.main }} aria-hidden />
            <Typography sx={{ fontSize: 18, fontWeight: 600, color: tokens.text.primary }}>
              Reset password
            </Typography>
          </Box>
          <Typography sx={{ fontSize: 14, color: tokens.text.secondary }}>
            Choose a new password for your Biogas MIS account.
          </Typography>
        </Box>

        {message && (
          <Alert severity={message.type} sx={{ mb: 2 }} role="alert">
            {message.text}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <input type="hidden" value={token} aria-hidden="true" />
          <TextField
            fullWidth
            required
            label="New password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            sx={{ mb: 2 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((v) => !v)}
                    edge="end"
                    size="small"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            fullWidth
            required
            label="Confirm password"
            type={showConfirm ? 'text' : 'password'}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            sx={{ mb: 3 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                    onClick={() => setShowConfirm((v) => !v)}
                    edge="end"
                    size="small"
                  >
                    {showConfirm ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
            size="large"
            sx={{ mb: 2, minHeight: 44 }}
          >
            {loading ? <CircularProgress size={22} color="inherit" aria-label="Resetting password" /> : 'Reset password'}
          </Button>
          <Typography variant="body2" textAlign="center" color="text.secondary">
            <Link component={RouterLink} to="/login" underline="hover" color="primary">
              Back to login
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
