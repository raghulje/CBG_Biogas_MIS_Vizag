import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  CircularProgress,
  InputAdornment,
  IconButton,
  Alert,
  FormControlLabel,
  Checkbox,
  keyframes,
  useMediaQuery,
} from '@mui/material';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import refexLogo from '../../assets/refex-logo.png';
import loginHero from '../../assets/login-hero.svg';
import { useSnackbar } from 'notistack';
import MESSAGES from '../../utils/messages';
import { tokens } from '../../themes';

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const features = [
  {
    icon: <AssignmentOutlinedIcon sx={{ fontSize: 18 }} />,
    title: 'Daily MIS & Data Entry',
    desc: 'Capture and manage plant operational data efficiently.',
  },
  {
    icon: <InsightsOutlinedIcon sx={{ fontSize: 18 }} />,
    title: 'Advanced Analytics',
    desc: 'Powerful dashboards and production insights.',
  },
  {
    icon: <SecurityOutlinedIcon sx={{ fontSize: 18 }} />,
    title: 'Enterprise Grade Security',
    desc: 'Secure authentication and role-based access.',
  },
];

export default function LoginPage() {
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const { login, isAuthenticated, loading: authLoading } = useAuth();
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const isMdUp = useMediaQuery('(min-width:900px)');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
      return;
    }
    window.scrollTo(0, 0);
  }, [isAuthenticated, navigate]);

  if (authLoading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#F6F8FB',
        }}
        role="status"
        aria-label="Checking session"
      >
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      await login(formData.email, formData.password);
      navigate('/dashboard');
    } catch (err: any) {
      if (!err.response) {
        setError(
          'Cannot connect to server. Check that the backend is running and VITE_API_URL matches the server port.'
        );
        return;
      }
      const msg = err.response?.data?.message || err.response?.data?.error;
      setError(msg || 'Invalid email or password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const anim = (name: string, delay = '0s') =>
    reduceMotion ? 'none' : `${name} 0.55s ease-out ${delay} both`;

  const inputSx = {
    mb: 1.75,
    '& .MuiOutlinedInput-root': {
      borderRadius: '12px',
      bgcolor: 'rgba(255,255,255,0.78)',
      minHeight: 48,
      backdropFilter: 'blur(6px)',
      transition: 'box-shadow 0.2s ease, background-color 0.2s ease',
      '& fieldset': { borderColor: 'rgba(229,231,235,0.95)' },
      '&:hover': {
        bgcolor: 'rgba(255,255,255,0.95)',
        '& fieldset': { borderColor: tokens.primary.border },
      },
      '&.Mui-focused': {
        bgcolor: '#fff',
        boxShadow: 'none',
        '& fieldset': { borderColor: tokens.primary.main, borderWidth: 1.5 },
      },
    },
    '& .MuiInputLabel-root': { fontWeight: 500, color: tokens.text.secondary },
  };

  const loginCard = (
    <Box
      sx={{
        position: 'relative',
        zIndex: 2,
        width: '100%',
        maxWidth: { xs: 480, md: 420, lg: 460 },
        p: { xs: 3.25, sm: 4, md: 3.75, lg: 4.25 },
        borderRadius: '24px',
        border: '1px solid rgba(255,255,255,0.9)',
        bgcolor: 'rgba(255,255,255,0.78)',
        boxShadow: `
          0 4px 24px rgba(40,121,182,0.07),
          0 24px 56px rgba(15,23,42,0.08),
          inset 0 1px 0 rgba(255,255,255,0.95)
        `,
        backdropFilter: 'blur(22px) saturate(1.2)',
        WebkitBackdropFilter: 'blur(22px) saturate(1.2)',
        animation: anim(fadeUp, '0.12s'),
        '@media (max-height: 780px) and (min-width: 900px)': {
          p: 3.25,
        },
      }}
    >
      <Box sx={{ mb: 2.5 }}>
        <Box
          component="img"
          src={refexLogo}
          alt="Refex logo"
          sx={{ height: { xs: 42, md: 40 }, width: 'auto', objectFit: 'contain', mb: 2, display: 'block' }}
        />
        <Typography
          sx={{
            fontSize: { xs: 28, md: 26, lg: 28 },
            fontWeight: 700,
            color: tokens.text.primary,
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
            mb: 0.5,
          }}
        >
          Welcome Back
        </Typography>
        <Typography sx={{ fontSize: 14, color: tokens.text.secondary, lineHeight: 1.45 }}>
          Sign in to continue to Industrial Biogas Plant MIS
        </Typography>
      </Box>

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <TextField
          fullWidth
          id="email"
          name="email"
          label="Email Address"
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
          autoComplete="email"
          placeholder="user@refex.com"
          sx={inputSx}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <EmailOutlinedIcon sx={{ fontSize: 20, color: tokens.text.muted }} />
              </InputAdornment>
            ),
          }}
        />
        <TextField
          fullWidth
          id="password"
          name="password"
          label="Password"
          type={showPassword ? 'text' : 'password'}
          value={formData.password}
          onChange={handleChange}
          required
          autoComplete="current-password"
          sx={{ ...inputSx, mb: 1.25 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LockOutlinedIcon sx={{ fontSize: 20, color: tokens.text.muted }} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                  size="small"
                >
                  {showPassword ? <VisibilityOffOutlinedIcon fontSize="small" /> : <VisibilityOutlinedIcon fontSize="small" />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 0.5 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                size="small"
                sx={{ color: tokens.border, '&.Mui-checked': { color: tokens.primary.main } }}
              />
            }
            label={
              <Typography sx={{ fontSize: 13, color: tokens.text.secondary, fontWeight: 500 }}>Remember me</Typography>
            }
            sx={{ m: 0 }}
          />
          <Button
            variant="text"
            size="small"
            onClick={() => {
              setForgotEmail('');
              setForgotError('');
              setForgotOpen(true);
            }}
            sx={{
              color: tokens.primary.main,
              fontWeight: 600,
              fontSize: 13,
              px: 0.5,
              minHeight: 32,
              height: 32,
              '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' },
            }}
          >
            Forgot Password?
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 1.5, borderRadius: '12px', py: 0.5 }} role="alert">
            {error}
          </Alert>
        )}

        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={isSubmitting}
          endIcon={!isSubmitting ? <ArrowForwardIcon sx={{ fontSize: 18 }} /> : undefined}
          sx={{
            height: 48,
            borderRadius: '12px',
            fontSize: 15,
            fontWeight: 600,
            textTransform: 'none',
            background: `linear-gradient(135deg, ${tokens.primary.main} 0%, ${tokens.primary.hover} 100%)`,
            boxShadow: `0 10px 24px ${tokens.primary.main}35`,
            '&:hover': {
              background: `linear-gradient(135deg, ${tokens.primary.hover} 0%, ${tokens.primary.dark} 100%)`,
              boxShadow: `0 14px 28px ${tokens.primary.main}45`,
            },
            '&.Mui-disabled': { background: tokens.primary.border, color: '#fff' },
          }}
        >
          {isSubmitting ? <CircularProgress size={22} color="inherit" /> : 'Sign In'}
        </Button>
      </Box>

      <Box sx={{ mt: 2.25, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75 }}>
        <VerifiedUserOutlinedIcon sx={{ fontSize: 15, color: tokens.success.main }} />
        <Typography sx={{ fontSize: 11.5, fontWeight: 500, color: tokens.text.secondary }}>
          Secured with enterprise-grade encryption
        </Typography>
      </Box>

      <Box sx={{ mt: 2, pt: 1.75, borderTop: `1px solid ${tokens.divider}`, textAlign: 'center' }}>
        <Typography sx={{ fontSize: 11.5, color: tokens.text.secondary, fontWeight: 500 }}>
          Built & Maintained by Refex AI Team
        </Typography>
        <Typography sx={{ fontSize: 11, color: tokens.text.muted, mt: 0.25 }}>
          Version 2.0.0 · © {new Date().getFullYear()} Refex Group
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box
      sx={{
        position: 'relative',
        height: { xs: 'auto', md: '100vh' },
        minHeight: '100vh',
        '@supports (height: 100dvh)': {
          height: { md: '100dvh' },
          minHeight: '100dvh',
        },
        overflow: { xs: 'auto', md: 'hidden' },
        bgcolor: '#F4F8FC',
      }}
    >
      {/* Soft full-page atmosphere — no hard panels */}
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          background: `
            radial-gradient(ellipse 70% 55% at 12% 0%, rgba(40,121,182,0.14) 0%, transparent 55%),
            radial-gradient(ellipse 55% 50% at 88% 10%, rgba(40,121,182,0.1) 0%, transparent 50%),
            radial-gradient(ellipse 70% 55% at 28% 100%, rgba(125,194,68,0.22) 0%, transparent 58%),
            radial-gradient(ellipse 50% 40% at 70% 90%, rgba(125,194,68,0.12) 0%, transparent 55%),
            linear-gradient(165deg, #FFFFFF 0%, #F5FAFF 42%, #F1FAF4 78%, #F6F8FB 100%)
          `,
        }}
      />

      {/* Hero — full plant scene visible (CBG unit, tanks, turbine), soft-edged */}
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          zIndex: 0,
          pointerEvents: 'none',
          left: { xs: '-4%', md: '-1%', lg: '0%' },
          bottom: { xs: 0, md: '1%', lg: '0%' },
          width: { xs: '130%', md: '82%', lg: '84%' },
          height: { xs: '60%', md: '80%', lg: '84%' },
          backgroundImage: `url(${loginHero})`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'left bottom',
          backgroundSize: 'contain',
          // Soft dissolve — keep full illustration readable, no hard frame
          maskImage: {
            xs: 'linear-gradient(to top, #000 50%, transparent 100%)',
            md: `
              linear-gradient(90deg, #000 0%, #000 62%, rgba(0,0,0,0.45) 82%, transparent 100%),
              linear-gradient(180deg, transparent 0%, #000 16%, #000 88%, rgba(0,0,0,0.5) 100%)
            `,
          },
          WebkitMaskImage: {
            xs: 'linear-gradient(to top, #000 50%, transparent 100%)',
            md: `
              linear-gradient(90deg, #000 0%, #000 62%, rgba(0,0,0,0.45) 82%, transparent 100%),
              linear-gradient(180deg, transparent 0%, #000 16%, #000 88%, rgba(0,0,0,0.5) 100%)
            `,
          },
          maskComposite: 'intersect',
          WebkitMaskComposite: 'source-in',
          animation: anim(fadeIn),
        }}
      />

      {/* Ground wash so plant base blends into page */}
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: { xs: '18%', md: '16%' },
          zIndex: 0,
          pointerEvents: 'none',
          background: `
            linear-gradient(180deg, transparent 0%, rgba(241,250,244,0.4) 45%, rgba(246,248,251,0.85) 100%)
          `,
        }}
      />

      {isMdUp ? (
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            height: '100%',
            display: 'grid',
            gridTemplateColumns: '1.15fr 0.85fr',
            minHeight: 0,
          }}
        >
          {/* LEFT — brand copy over blended scene */}
          <Box
            sx={{
              position: 'relative',
              height: '100%',
              pl: { md: 3.5, lg: 5 },
              pr: { md: 2, lg: 3 },
              pt: { md: 3, lg: 3.75 },
              pb: { md: 2.5, lg: 3 },
              display: 'flex',
              flexDirection: 'column',
              minWidth: 0,
            }}
          >
            <Box
              sx={{
                position: 'relative',
                zIndex: 2,
                maxWidth: 360,
                animation: anim(fadeIn),
                // Soft readability wash so copy stays clear over the plant greens
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  inset: { md: '-18px -28px -22px -22px', lg: '-20px -32px -24px -24px' },
                  borderRadius: '28px',
                  background:
                    'radial-gradient(ellipse 90% 80% at 28% 30%, rgba(255,255,255,0.94) 0%, rgba(255,255,255,0.82) 48%, rgba(255,255,255,0.28) 78%, transparent 100%)',
                  pointerEvents: 'none',
                  zIndex: -1,
                },
              }}
            >
              <Box
                component="img"
                src={refexLogo}
                alt="Refex"
                sx={{
                  height: { md: 36, lg: 40 },
                  width: 'auto',
                  objectFit: 'contain',
                  display: 'block',
                  mb: 1.75,
                }}
              />

              <Typography
                sx={{
                  fontSize: { md: 26, lg: 30 },
                  fontWeight: 700,
                  color: tokens.text.primary,
                  letterSpacing: '-0.03em',
                  lineHeight: 1.18,
                  mb: 1,
                }}
              >
                Industrial Biogas Plant MIS
              </Typography>
              <Typography
                sx={{
                  fontSize: { md: 14, lg: 15 },
                  fontWeight: 500,
                  color: tokens.text.secondary,
                  lineHeight: 1.5,
                  mb: 2.5,
                  maxWidth: 300,
                }}
              >
                Real-time Monitoring. Smart Decisions. Sustainable Tomorrow.
              </Typography>

              {/* Feature rows — frosted chips for contrast without heavy cards */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.15 }}>
                {features.map((f, idx) => (
                  <Box
                    key={f.title}
                    sx={{
                      display: 'flex',
                      gap: 1.25,
                      alignItems: 'center',
                      px: 1.35,
                      py: 1.05,
                      borderRadius: '14px',
                      bgcolor: 'rgba(255,255,255,0.78)',
                      border: '1px solid rgba(255,255,255,0.95)',
                      boxShadow: '0 6px 18px rgba(15,23,42,0.05)',
                      backdropFilter: 'blur(10px)',
                      animation: anim(fadeUp, `${0.08 + idx * 0.05}s`),
                    }}
                  >
                    <Box
                      sx={{
                        width: 34,
                        height: 34,
                        borderRadius: '10px',
                        bgcolor: tokens.success.soft,
                        color: tokens.success.main,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {f.icon}
                    </Box>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: tokens.text.primary, lineHeight: 1.25 }}>
                        {f.title}
                      </Typography>
                      <Typography sx={{ fontSize: 12, color: tokens.text.secondary, lineHeight: 1.35, mt: 0.15 }}>
                        {f.desc}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>

            <Box sx={{ flex: 1, minHeight: 40 }} />

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2.5,
                flexWrap: 'wrap',
                animation: anim(fadeUp, '0.28s'),
                '@media (max-height: 700px)': { display: 'none' },
              }}
            >
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: tokens.text.primary }}>
                Powering a Greener Future
              </Typography>
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: tokens.primary.main }}>Enterprise MIS</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CheckCircleOutlineIcon sx={{ fontSize: 15, color: tokens.success.main }} />
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: tokens.success.main }}>Secure Access</Typography>
              </Box>
            </Box>
          </Box>

          {/* RIGHT — login */}
          <Box
            sx={{
              position: 'relative',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              px: { md: 3, lg: 5 },
              py: 2,
            }}
          >
            <Box
              aria-hidden
              sx={{
                position: 'absolute',
                width: '78%',
                maxWidth: 480,
                height: '58%',
                borderRadius: '50%',
                background:
                  'radial-gradient(ellipse at center, rgba(40,121,182,0.12) 0%, rgba(125,194,68,0.06) 45%, transparent 70%)',
                filter: 'blur(28px)',
                pointerEvents: 'none',
              }}
            />
            {loginCard}
          </Box>
        </Box>
      ) : (
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            px: 2.5,
            pt: 3,
            pb: 4,
            gap: 3,
            minHeight: '100vh',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>{loginCard}</Box>

          <Box sx={{ px: 0.5, position: 'relative', zIndex: 1 }}>
            <Box component="img" src={refexLogo} alt="Refex" sx={{ height: 36, mb: 1.5, display: 'block' }} />
            <Typography sx={{ fontSize: 24, fontWeight: 700, color: tokens.text.primary, letterSpacing: '-0.02em', mb: 0.75 }}>
              Industrial Biogas Plant MIS
            </Typography>
            <Typography sx={{ fontSize: 14, color: tokens.text.secondary, mb: 2.25 }}>
              Real-time Monitoring. Smart Decisions. Sustainable Tomorrow.
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
              {features.map((f) => (
                <Box key={f.title} sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start' }}>
                  <Box
                    sx={{
                      width: 34,
                      height: 34,
                      borderRadius: '10px',
                      bgcolor: tokens.success.soft,
                      color: tokens.success.main,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {f.icon}
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: tokens.text.primary }}>{f.title}</Typography>
                    <Typography sx={{ fontSize: 12, color: tokens.text.secondary }}>{f.desc}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>

          <Box sx={{ flex: 1, minHeight: 160 }} />
        </Box>
      )}

      <Dialog open={forgotOpen} onClose={() => !forgotLoading && setForgotOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            Enter your email and we&apos;ll send a password reset link.
          </Typography>
          <TextField
            label="Email"
            type="email"
            value={forgotEmail}
            onChange={(e) => {
              setForgotEmail(e.target.value);
              setForgotError('');
            }}
            fullWidth
            autoFocus
            sx={inputSx}
          />
          {forgotError && (
            <Typography color="error" variant="caption" sx={{ mt: -1, display: 'block' }}>
              {forgotError}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setForgotOpen(false)} disabled={forgotLoading} variant="outlined" sx={{ minWidth: 96 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={async () => {
              if (!forgotEmail) {
                setForgotError('Please enter your email');
                return;
              }
              try {
                setForgotLoading(true);
                await (await import('../../services/authService')).authService.forgotPassword(forgotEmail);
                setForgotLoading(false);
                setForgotOpen(false);
                enqueueSnackbar(MESSAGES.RESET_LINK_SENT, { variant: 'info' });
              } catch (err: any) {
                setForgotLoading(false);
                setForgotError(err.response?.data?.message || 'Failed to send reset link');
              }
            }}
            disabled={forgotLoading}
          >
            {forgotLoading ? <CircularProgress size={22} color="inherit" /> : 'Send Reset Link'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
