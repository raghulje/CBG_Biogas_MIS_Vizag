import { Link as RouterLink } from 'react-router-dom';
import { Box, Typography, Button, Paper } from '@mui/material';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import refexLogo from '../assets/refex-logo.png';
import { tokens } from '../themes';

export default function NotFound() {
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
          maxWidth: 480,
          p: { xs: 3, sm: 5 },
          textAlign: 'center',
          borderRadius: `${tokens.radius.dialog}px`,
          border: `1px solid ${tokens.border}`,
          boxShadow: tokens.shadow.md,
        }}
      >
        <img src={refexLogo} alt="Company logo" style={{ height: 44, marginBottom: 16 }} />
        <Typography
          sx={{
            fontSize: { xs: 64, sm: 80 },
            fontWeight: 700,
            color: tokens.primary.main,
            lineHeight: 1,
            mb: 1,
          }}
          aria-hidden
        >
          404
        </Typography>
        <Typography sx={{ fontSize: 18, fontWeight: 600, color: tokens.text.primary, mb: 1 }}>
          Page not found
        </Typography>
        <Typography sx={{ fontSize: 14, color: tokens.text.secondary, mb: 3 }}>
          The page you are looking for does not exist or is no longer available.
        </Typography>
        <Button
          component={RouterLink}
          to="/dashboard"
          variant="contained"
          startIcon={<HomeOutlinedIcon />}
          size="large"
        >
          Go to Dashboard
        </Button>
      </Paper>
    </Box>
  );
}
