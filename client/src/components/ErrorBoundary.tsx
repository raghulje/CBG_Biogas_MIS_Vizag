import React from 'react';
import { Box, Typography, Button } from '@mui/material';

type Props = { children: React.ReactNode };
type State = { hasError: boolean; error?: any };

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, info: any) {
    // log to console for now
    console.error('ErrorBoundary caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 3, borderRadius: 2, background: '#fff', boxShadow: 1 }}>
          <Typography variant="h6" sx={{ color: 'error.main', mb: 1 }}>
            Something went wrong rendering this panel.
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            Please try refreshing the page, or contact the administrator.
          </Typography>
          <Button variant="outlined" onClick={() => window.location.reload()}>
            Reload
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;

