
import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TextField,
  Grid,
} from '@mui/material';
import { Layout } from '../../components/Layout';
import { AppDateField } from '../../components/ui/AppDateField';

export default function AuditLogsPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const mockLogs = [
    {
      id: 1,
      timestamp: '2024-01-15 09:30:45',
      user: 'John Doe',
      action: 'Created MIS Entry',
      status: 'Success',
      details: 'Daily MIS form submitted',
    },
    {
      id: 2,
      timestamp: '2024-01-15 08:15:22',
      user: 'Jane Smith',
      action: 'Updated User',
      status: 'Success',
      details: 'Modified user role',
    },
    {
      id: 3,
      timestamp: '2024-01-14 16:45:10',
      user: 'Mike Johnson',
      action: 'Login',
      status: 'Success',
      details: 'User logged in',
    },
    {
      id: 4,
      timestamp: '2024-01-14 14:20:33',
      user: 'John Doe',
      action: 'Deleted MIS Entry',
      status: 'Success',
      details: 'Removed draft entry',
    },
    {
      id: 5,
      timestamp: '2024-01-14 11:05:18',
      user: 'Unknown',
      action: 'Login Attempt',
      status: 'Failed',
      details: 'Invalid credentials',
    },
  ];

  return (
    <Layout>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#0B1F3A', mb: 3 }}>
          Audit Logs
        </Typography>

        <Card sx={{ mb: 3, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#111827' }}>
              Filter Logs
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField fullWidth label="User" size="small" />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField fullWidth label="Action" size="small" />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <AppDateField fullWidth label="Start Date" value={startDate} onChange={setStartDate} />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <AppDateField fullWidth label="End Date" value={endDate} onChange={setEndDate} />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <CardContent>
            <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #e0e0e0' }}>
              <Table>
                <TableHead sx={{ backgroundColor: 'rgba(11, 31, 58, 0.05)' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, color: '#0B1F3A' }}>Timestamp</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#0B1F3A' }}>User</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#0B1F3A' }}>Action</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#0B1F3A' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#0B1F3A' }}>Details</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mockLogs.map((log) => (
                    <TableRow key={log.id} hover>
                      <TableCell sx={{ fontSize: '0.875rem' }}>{log.timestamp}</TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{log.user}</TableCell>
                      <TableCell>{log.action}</TableCell>
                      <TableCell>
                        <Chip
                          label={log.status}
                          size="small"
                          sx={{ 
                            fontWeight: 600,
                            backgroundColor: log.status === 'Success' ? '#059669' : '#DC2626',
                            color: '#ffffff',
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: '#6B7280' }}>{log.details}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>
    </Layout>
  );
}
