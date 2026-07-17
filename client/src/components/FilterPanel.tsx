
import { useState } from 'react';
import {
  Card,
  CardContent,
  Grid,
  TextField,
  MenuItem,
  Button,
  Box,
  Typography,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import FilterListIcon from '@mui/icons-material/FilterList';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';

interface FilterPanelProps {
  onApplyFilters: (filters: FilterValues) => void;
  onReset: () => void;
  onExport: () => void;
  onImport: () => void;
}

export interface FilterValues {
  singleDate: Date | null;
  startDate: Date | null;
  endDate: Date | null;
  month: string;
  quarter: string;
  year: string;
  digester: string;
  dataCategory: string;
}

const quarters = [
  { value: '', label: 'All Quarters' },
  { value: 'Q1', label: 'Q1 (Apr-Jun)' },
  { value: 'Q2', label: 'Q2 (Jul-Sep)' },
  { value: 'Q3', label: 'Q3 (Oct-Dec)' },
  { value: 'Q4', label: 'Q4 (Jan-Mar)' },
];

const digesters = [
  { value: 'all', label: 'All' },
  { value: 'D-01', label: 'D-01' },
  { value: 'D-02', label: 'D-02' },
  { value: 'D-03', label: 'D-03' },
];

const dataCategories = [
  { value: 'all', label: 'All Categories' },
  { value: 'feed', label: 'Feed Data' },
  { value: 'digester', label: 'Digester Performance' },
  { value: 'biogas', label: 'Biogas Quality' },
  { value: 'cbg', label: 'CBG Production' },
  { value: 'separator', label: 'Separator Data' },
  { value: 'slurry', label: 'Slurry Management' },
  { value: 'power', label: 'Power Consumption' },
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

const months = [
  { value: '', label: 'All Months' },
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

export default function FilterPanel({
  onApplyFilters,
  onReset,
  onExport,
  onImport,
}: FilterPanelProps) {
  const [filters, setFilters] = useState<FilterValues>({
    singleDate: null,
    startDate: null,
    endDate: null,
    month: '',
    quarter: '',
    year: currentYear.toString(),
    digester: 'all',
    dataCategory: 'all',
  });

  const handleFilterChange = (field: keyof FilterValues, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleApply = () => {
    onApplyFilters(filters);
  };

  const handleReset = () => {
    const resetFilters: FilterValues = {
      singleDate: null,
      startDate: null,
      endDate: null,
      month: '',
      quarter: '',
      year: currentYear.toString(),
      digester: 'all',
      dataCategory: 'all',
    };
    setFilters(resetFilters);
    onReset();
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <FilterListIcon sx={{ fontSize: 20, color: 'primary.main' }} />
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'text.secondary',
            }}
          >
            Filters
          </Typography>
        </Box>

        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Grid container spacing={1.5} alignItems="center">
            {/* Single Date Picker */}
            <Grid item xs={12} sm={6} md={3}>
              <DatePicker
                label="Single Date"
                value={filters.singleDate}
                onChange={(date) => handleFilterChange('singleDate', date)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small',
                  },
                }}
              />
            </Grid>

            {/* Date Range - Start Date */}
            <Grid item xs={12} sm={6} md={3}>
              <DatePicker
                label="Start Date"
                value={filters.startDate}
                onChange={(date) => handleFilterChange('startDate', date)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small',
                  },
                }}
              />
            </Grid>

            {/* Date Range - End Date */}
            <Grid item xs={12} sm={6} md={3}>
              <DatePicker
                label="End Date"
                value={filters.endDate}
                onChange={(date) => handleFilterChange('endDate', date)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small',
                  },
                }}
              />
            </Grid>

            {/* Month Picker */}
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                size="small"
                label="Month"
                value={filters.month}
                onChange={(e) => handleFilterChange('month', e.target.value)}
              >
                {months.map((month) => (
                  <MenuItem key={month.value} value={month.value}>
                    {month.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Quarter Selector */}
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                size="small"
                label="Quarter"
                value={filters.quarter}
                onChange={(e) => handleFilterChange('quarter', e.target.value)}
              >
                {quarters.map((quarter) => (
                  <MenuItem key={quarter.value} value={quarter.value}>
                    {quarter.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Year Selector */}
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                size="small"
                label="Year"
                value={filters.year}
                onChange={(e) => handleFilterChange('year', e.target.value)}
              >
                {years.map((year) => (
                  <MenuItem key={year} value={year.toString()}>
                    {year}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Digester Filter */}
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                size="small"
                label="Digester"
                value={filters.digester}
                onChange={(e) => handleFilterChange('digester', e.target.value)}
              >
                {digesters.map((digester) => (
                  <MenuItem key={digester.value} value={digester.value}>
                    {digester.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Data Category Filter */}
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                size="small"
                label="Data Category"
                value={filters.dataCategory}
                onChange={(e) =>
                  handleFilterChange('dataCategory', e.target.value)
                }
              >
                {dataCategories.map((category) => (
                  <MenuItem key={category.value} value={category.value}>
                    {category.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Action Buttons */}
            <Grid item xs={12}>
              <Box
                sx={{
                  display: 'flex',
                  gap: 1.5,
                  flexWrap: 'wrap',
                  mt: 0.5,
                  justifyContent: 'flex-end',
                }}
              >
                <Button variant="outlined" startIcon={<RestartAltIcon />} onClick={handleReset} sx={{ minWidth: 112 }}>
                  Reset
                </Button>
                <Button variant="outlined" color="primary" startIcon={<FileUploadIcon />} onClick={onImport} sx={{ minWidth: 112 }}>
                  Import
                </Button>
                <Button variant="outlined" color="success" startIcon={<FileDownloadIcon />} onClick={onExport} sx={{ minWidth: 112 }}>
                  Export
                </Button>
                <Button variant="contained" startIcon={<FilterListIcon />} onClick={handleApply} sx={{ minWidth: 128 }}>
                  Apply Filters
                </Button>
              </Box>
            </Grid>
          </Grid>
        </LocalizationProvider>
      </CardContent>
    </Card>
  );
}
