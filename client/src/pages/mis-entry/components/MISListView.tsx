
import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Tooltip,
  IconButton,
  MenuItem,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  TablePagination,
  Stack,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  DeleteForever as DeleteForeverIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  FileUpload as ImportIcon,
  FileDownload as ExportIcon,
  Print as PrintIcon,
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
  IndeterminateCheckBox as IndeterminateCheckBoxIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { tokens } from '../../../themes';
import { PageHeader, FilterToolbar } from '../../../components/ui/PageChrome';
import type { MISEntry } from '../../../mocks/misEntries';

import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import MESSAGES from '../../../utils/messages';

import { useAuth } from '../../../context/AuthContext';
import { EmptyState, ErrorState, TableSkeleton } from '../../../components/ui/FeedbackStates';



function displayStatus(status: string | undefined): string {
  if (!status || typeof status !== 'string') return 'Draft';
  const s = status.toLowerCase();
  if (s === 'approved') return 'Approved';
  if (s === 'submitted' || s === 'under_review') return 'Submitted';
  if (s === 'rejected') return 'Rejected';
  if (s === 'deleted') return 'Deleted';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

interface MISListViewProps {
  entries: MISEntry[];
  loading?: boolean;
  loadError?: string | null;
  onRetryLoad?: () => void;
  onCreateNew: () => void;
  onEdit: (entry: MISEntry) => void;
  onView: (entry: MISEntry) => void;
  onDelete: (entry: MISEntry) => void;
  onBulkDelete?: (ids: string[]) => Promise<{ deleted: number; failed: number } | null>;
  onImportSuccess?: () => void;
  onImportError?: (err: any) => void;
  isAdmin?: boolean;
  onHardDelete?: (entryId: number) => void;
  showDeleted?: boolean;
  onShowDeletedChange?: (value: boolean) => void;
}

/** Width-only — height / radius / focus come from the design system theme */
const FILTER_CONTROL_SX = {
  '& .MuiOutlinedInput-root': {
    bgcolor: tokens.surface,
  },
};

export default function MISListView({
  entries,
  loading = false,
  loadError = null,
  onRetryLoad,
  onCreateNew,
  onEdit,
  onView,
  onDelete,
  onImportSuccess,
  onImportError,
  onBulkDelete,
  isAdmin,
  onHardDelete,
  showDeleted = false,
  onShowDeletedChange,
}: MISListViewProps) {
  const theme = useTheme();
  // Parent component will handle notifications for import/export/delete results.
  const { hasPermission } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<MISEntry | null>(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [reportDownloadingId, setReportDownloadingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [page, setPage] = useState(0);
  const rowsPerPage = 10;

  const canCreate = hasPermission('mis_entry', 'create');
  const canUpdate = hasPermission('mis_entry', 'update');
  const canImport = hasPermission('mis_entry', 'import');
  const canExport = hasPermission('mis_entry', 'export');
  const canDelete = hasPermission('mis_entry', 'delete');

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const { misService } = await import('../../../services/misService');
      await misService.importEntries(file);
      onImportSuccess?.();
    } catch (error: any) {
      console.error(error);
      onImportError?.(error);
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  };



  const handleDownloadFinalMisReport = async (entry: MISEntry) => {
    setReportDownloadingId(entry.id);
    try {
      const { misService } = await import('../../../services/misService');
      const blob = await misService.downloadEntryFinalMisReport(entry.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const datePart = entry.date ? String(entry.date).slice(0, 10) : 'report';
      a.download = `Final_MIS_Report_${datePart}.html`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error(error);
      onImportError?.({ response: { data: { message: MESSAGES.FINAL_MIS_REPORT_DOWNLOAD_FAILED } } });
    } finally {
      setReportDownloadingId(null);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const { misService } = await import('../../../services/misService');
      const params: Record<string, string> = {};
      if (startDate) params.startDate = startDate.toISOString().slice(0, 10);
      if (endDate) params.endDate = endDate.toISOString().slice(0, 10);
      if (statusFilter !== 'All') params.status = statusFilter.toLowerCase();
      const blob = await misService.exportEntries(params);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mis_entries_export_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error(error);
      // Parent owns notifications; do not show snackbar here.
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const { misService } = await import('../../../services/misService');
      const blob = await misService.getImportTemplate();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'MIS_Import_Template.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error(error);
      // Parent owns notifications; do not show snackbar here.
    }
  };

  const isApproverOnly = hasPermission('mis_entry', 'approve') && !hasPermission('mis_entry', 'update') && !hasPermission('mis_entry', 'create');

  const filteredEntries = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return entries.filter((entry) => {
      const matchesSearch =
        String(entry.id).toLowerCase().includes(q) ||
        (entry.createdBy && String(entry.createdBy).toLowerCase().includes(q));
      const entryStatusDisplay = displayStatus(entry.status);
      const matchesStatus = statusFilter === 'All' || entryStatusDisplay === statusFilter;
      const entryDate = new Date(entry.date);
      const matchesDateRange =
        (!startDate || entryDate >= startDate) && (!endDate || entryDate <= endDate);
      const isDraft = String(entry.status || '').toLowerCase() === 'draft';
      if (isApproverOnly && isDraft) return false; // approvers should not see drafts
      return matchesSearch && matchesStatus && matchesDateRange;
    });
  }, [entries, searchQuery, statusFilter, startDate, endDate, isApproverOnly]);

  const pageCount = Math.max(1, Math.ceil(filteredEntries.length / rowsPerPage));
  const paginatedEntries = useMemo(
    () => filteredEntries.slice(page * rowsPerPage, (page + 1) * rowsPerPage),
    [filteredEntries, page, rowsPerPage]
  );

  const handleDeleteClick = (entry: MISEntry) => {
    setEntryToDelete(entry);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!entryToDelete) return;
    try {
      await Promise.resolve(onDelete(entryToDelete));
    } catch (error: any) {
      console.error('Delete failed:', error);
      // Parent will handle error notifications.
    } finally {
      setDeleteDialogOpen(false);
      setEntryToDelete(null);
    }
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const allIds = new Set(filteredEntries.map(entry => entry.id));
      setSelectedIds(allIds);
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkDelete = () => {
    setBulkDeleteDialogOpen(true);
  };

  const handleBulkDeleteConfirm = () => {
    (async () => {
      const ids = Array.from(selectedIds);
      try {
        if (typeof onBulkDelete === 'function') {
          await onBulkDelete(ids);
        } else {
          // Fallback: call single-delete handler for each id (no snackbars here)
          for (const id of ids) {
            const entry = entries.find(e => e.id === id);
            if (!entry) continue;
            try {
              // parent onDelete is expected to handle notifications
              // we await to keep order and avoid overwhelming backend
              // eslint-disable-next-line @typescript-eslint/no-empty-function
              await Promise.resolve(onDelete(entry)).catch(() => { });
            } catch (err) {
              console.error('Bulk delete fallback failed for', id, err);
            }
          }
        }
      } finally {
        setSelectedIds(new Set());
        setBulkDeleteDialogOpen(false);
      }
    })();
  };

  const getStatusColor = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'submitted' || s === 'under_review') return { bg: tokens.primary.soft, color: tokens.primary.main };
    if (s === 'approved') return { bg: tokens.success.soft, color: tokens.success.main };
    if (s === 'draft') return { bg: tokens.warning.soft, color: tokens.warning.main };
    if (s === 'rejected') return { bg: tokens.danger.soft, color: tokens.danger.main };
    if (s === 'deleted') return { bg: tokens.divider, color: tokens.text.secondary };
    return { bg: tokens.divider, color: tokens.text.secondary };
  };

  return (
    <Box className="aos-fade-up">
      <PageHeader
        dense
        title="MIS Entry Records"
        subtitle="Create, review, and manage daily plant MIS entries"
        actions={
          <>
          {canExport && (
            <Button
              variant="outlined"
              color="primary"
              startIcon={<ExportIcon />}
              onClick={handleDownloadTemplate}
            >
              Download Template
            </Button>
          )}
          {canImport && (
            <>
              <input
                type="file"
                id="import-excel"
                style={{ display: 'none' }}
                accept=".xlsx, .xls"
                onChange={handleImport}
              />
              <label htmlFor="import-excel">
                <Button
                  component="span"
                  variant="contained"
                  color="primary"
                  startIcon={importing ? <CircularProgress size={20} color="inherit" /> : <ImportIcon />}
                  disabled={importing}
                >
                  {importing ? 'Importing…' : 'Import'}
                </Button>
              </label>
            </>
          )}
          {canExport && (
            <Button
              variant="outlined"
              startIcon={exporting ? <CircularProgress size={20} /> : <ExportIcon />}
              onClick={handleExport}
              disabled={exporting || entries.length === 0}
            >
              {exporting ? 'Exporting…' : 'Export'}
            </Button>
          )}
          {canCreate && (
            <Button
              variant="contained"
              color="success"
              startIcon={<AddIcon />}
              onClick={onCreateNew}
            >
              Create New Entry
            </Button>
          )}
          </>
        }
      />

      {loadError && (
        <ErrorState message={loadError} onRetry={onRetryLoad} />
      )}
      {loading && !loadError && (
        <Box sx={{ mb: 3 }}>
          <TableSkeleton rows={5} cols={isMobile ? 2 : 6} />
        </Box>
      )}

      {/* Cohesive enterprise filter toolbar */}
      <Box sx={{ display: loading || loadError ? 'none' : undefined }}>
        <FilterToolbar title="Filters" dense>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={1.5}
              alignItems={{ xs: 'stretch', md: 'center' }}
              useFlexGap
              flexWrap="wrap"
            >
              <TextField
                size="small"
                label="Search"
                placeholder="ID or Creator..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                inputProps={{ 'aria-label': 'Search entries by ID or creator' }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: tokens.text.secondary, fontSize: 18 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ ...FILTER_CONTROL_SX, flex: { md: '1 1 200px' }, minWidth: { md: 200 }, maxWidth: { md: 280 } }}
              />
              <TextField
                size="small"
                select
                label="Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                sx={{ ...FILTER_CONTROL_SX, width: { xs: '100%', md: 150 } }}
              >
                <MenuItem value="All">All Status</MenuItem>
                <MenuItem value="Draft">Draft</MenuItem>
                <MenuItem value="Submitted">Submitted</MenuItem>
                <MenuItem value="Approved">Approved</MenuItem>
                <MenuItem value="Rejected">Rejected</MenuItem>
              </TextField>
              <DatePicker
                label="From"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                slotProps={{
                  textField: {
                    size: 'small',
                    sx: { ...FILTER_CONTROL_SX, width: { xs: '100%', md: 150 } },
                  },
                }}
              />
              <DatePicker
                label="To"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                slotProps={{
                  textField: {
                    size: 'small',
                    sx: { ...FILTER_CONTROL_SX, width: { xs: '100%', md: 150 } },
                  },
                }}
              />
              <Tooltip title="Reset filters">
                <IconButton
                  aria-label="Clear filters"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('All');
                    setStartDate(null);
                    setEndDate(null);
                  }}
                  sx={{
                    width: 44,
                    height: 44,
                    flexShrink: 0,
                    border: `1px solid ${tokens.border}`,
                    color: tokens.text.secondary,
                    bgcolor: tokens.surface,
                    '&:hover': {
                      bgcolor: tokens.primary.soft,
                      color: tokens.primary.main,
                      borderColor: tokens.primary.border,
                    },
                  }}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              {isAdmin && onShowDeletedChange && (
                <FormControlLabel
                  sx={{
                    m: 0,
                    ml: { md: 0.5 },
                    height: 44,
                    pl: 1.5,
                    pr: 1,
                    borderRadius: `${tokens.radius.button}px`,
                    border: `1px solid ${tokens.border}`,
                    bgcolor: tokens.bg,
                    '& .MuiFormControlLabel-label': {
                      fontSize: 13,
                      fontWeight: 500,
                      color: tokens.text.secondary,
                      whiteSpace: 'nowrap',
                    },
                  }}
                  control={
                    <Checkbox
                      size="small"
                      checked={showDeleted}
                      onChange={(e) => onShowDeletedChange(e.target.checked)}
                      sx={{ py: 0 }}
                    />
                  }
                  label="Show deleted"
                />
              )}
            </Stack>
          </LocalizationProvider>
        </FilterToolbar>
      </Box>

      {/* Records Table (Desktop) */}
      <Card
        className="glass-card-strong aos-fade-up aos-delay-200"
        sx={{
          borderRadius: '14px',
          overflow: 'hidden',
          display: { xs: 'none', md: loading || loadError ? 'none' : 'block' },
        }}
      >
        <TableContainer sx={{ maxHeight: '60vh' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                {/* Multi-select header checkbox hidden for now */}
                {/* <TableCell padding="checkbox" sx={{ bgcolor: tokens.bg }}>
                  <Checkbox
                    indeterminate={selectedIds.size > 0 && selectedIds.size < filteredEntries.length}
                    checked={filteredEntries.length > 0 && selectedIds.size === filteredEntries.length}
                    onChange={handleSelectAll}
                    sx={{
                      color: tokens.primary.main,
                      '&.Mui-checked': { color: tokens.primary.main },
                      '&.MuiCheckbox-indeterminate': { color: tokens.primary.main },
                    }}
                  />
                </TableCell> */}
                <TableCell sx={{ fontWeight: 700, color: tokens.primary.main, fontSize: '0.95rem', bgcolor: tokens.bg }}>
                  Entry ID
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: tokens.primary.main, fontSize: '0.95rem', bgcolor: tokens.bg }}>
                  Date
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: tokens.primary.main, fontSize: '0.95rem', bgcolor: tokens.bg }}>
                  Created By
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: tokens.primary.main, fontSize: '0.95rem', bgcolor: tokens.bg }}>
                  Status
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: tokens.primary.main, fontSize: '0.95rem', bgcolor: tokens.bg }}>
                  CBG Produced
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: tokens.primary.main, fontSize: '0.95rem', bgcolor: tokens.bg }}>
                  CBG Sold
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: tokens.primary.main, fontSize: '0.95rem', bgcolor: tokens.bg }}>
                  Total Biogas
                </TableCell>
                <TableCell
                  sx={{ fontWeight: 700, color: tokens.primary.main, fontSize: '0.95rem', bgcolor: tokens.bg }}
                  align="center"
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedEntries.map((entry) => {
                const statusColors = getStatusColor(entry.status);
                return (
                  <TableRow
                    key={entry.id}
                    className="hover-lift"
                    sx={{
                      transition: 'all 0.3s ease',
                      backgroundColor: selectedIds.has(entry.id) ? 'rgba(40, 121, 182, 0.05)' : 'transparent',
                      '&:hover': {
                        backgroundColor: selectedIds.has(entry.id) ? tokens.primary.soft : tokens.primary.soft,
                      },
                    }}
                  >
                    {/* Row multi-select checkbox hidden for now */}
                    {/* <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedIds.has(entry.id)}
                        onChange={() => handleSelectOne(entry.id)}
                        sx={{
                          color: tokens.primary.main,
                          '&.Mui-checked': { color: tokens.primary.main },
                        }}
                      />
                    </TableCell> */}
                    <TableCell sx={{ fontWeight: 600, color: tokens.text.primary }}>{entry.id}</TableCell>
                    <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                    <TableCell>{entry.createdBy}</TableCell>
                    <TableCell>
                      <Chip
                        label={displayStatus(entry.status)}
                        size="small"
                        sx={{
                          fontWeight: 600,
                          backgroundColor: statusColors.bg,
                          color: statusColors.color,
                          borderRadius: '8px',
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>
                      {entry.compressedBiogas?.produced ?? 0} kg
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>
                      {entry.compressedBiogas?.cbgSold ?? 0} kg
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>
                      {entry.rawBiogas?.totalRawBiogas ?? 0} m³
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => onView(entry)}
                            sx={{
                              color: tokens.primary.main,
                              backgroundColor: tokens.primary.soft,
                              '&:hover': { backgroundColor: 'rgba(40, 121, 182, 0.2)' },
                            }}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Download Final MIS Report (same as email)">
                          <IconButton
                            size="small"
                            onClick={() => handleDownloadFinalMisReport(entry)}
                            disabled={reportDownloadingId === entry.id}
                            sx={{
                              color: tokens.info.main,
                              backgroundColor: 'rgba(29, 154, 212, 0.1)',
                              '&:hover': { backgroundColor: 'rgba(29, 154, 212, 0.2)' },
                            }}
                          >
                            {reportDownloadingId === entry.id ? (
                              <CircularProgress size={18} color="inherit" />
                            ) : (
                              <PrintIcon fontSize="small" />
                            )}
                          </IconButton>
                        </Tooltip>
                        {canUpdate && (
                          <Tooltip title="Edit Entry">
                            <IconButton
                              size="small"
                              onClick={() => onEdit(entry)}
                              sx={{
                                color: tokens.success.main,
                                backgroundColor: tokens.success.soft,
                                '&:hover': { backgroundColor: 'rgba(125, 194, 68, 0.2)' },
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {canDelete && (String(entry.status || '').toLowerCase() === 'draft' || isAdmin) && (
                          <Tooltip title="Delete Entry">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteClick(entry)}
                              sx={{
                                color: tokens.danger.main,
                                backgroundColor: tokens.danger.soft,
                                '&:hover': { backgroundColor: tokens.danger.soft },
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {/* If entry is already soft-deleted, admin can permanently remove it */}
                        {isAdmin && String(entry.status || '').toLowerCase() === 'deleted' && (
                          <Tooltip title="Permanently Delete">
                            <IconButton
                              size="small"
                              onClick={() => onHardDelete?.(entry.id)}
                              sx={{
                                color: tokens.danger.dark,
                                backgroundColor: 'rgba(185, 28, 28, 0.08)',
                                '&:hover': { backgroundColor: 'rgba(185, 28, 28, 0.14)' },
                              }}
                            >
                              <DeleteForeverIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredEntries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <Typography variant="body1" sx={{ color: tokens.text.secondary }}>
                      <EmptyState
                        title="No records found"
                        description="No MIS entries match your filters. Adjust filters or create a new entry."
                        actionLabel={canCreate ? 'Create New Entry' : undefined}
                        onAction={canCreate ? onCreateNew : undefined}
                      />
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
          <TablePagination
            component="div"
            count={filteredEntries.length}
            page={page}
            onPageChange={(_e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[]}
          />
        </Box>
      </Card>

      {/* Mobile Card List View */}
      <Box sx={{ display: { xs: loading || loadError ? 'none' : 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
        {paginatedEntries.map((entry) => {
          const statusColors = getStatusColor(entry.status);
          return (
            <Card key={entry.id} className="glass-card" sx={{ borderRadius: '14px', overflow: 'visible' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: tokens.primary.main }}>
                      #{entry.id}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(entry.date).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Chip
                    label={displayStatus(entry.status)}
                    size="small"
                    sx={{
                      fontWeight: 600,
                      backgroundColor: statusColors.bg,
                      color: statusColors.color,
                      borderRadius: '8px',
                    }}
                  />
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">CBG Produced:</Typography>
                    <Typography variant="body2" fontWeight={600}>{entry.compressedBiogas?.produced ?? 0} kg</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">CBG Sold:</Typography>
                    <Typography variant="body2" fontWeight={600}>{entry.compressedBiogas?.cbgSold ?? 0} kg</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Total Biogas:</Typography>
                    <Typography variant="body2" fontWeight={600}>{entry.rawBiogas?.totalRawBiogas ?? 0} m³</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Created By:</Typography>
                    <Typography variant="body2" fontWeight={500}>{entry.createdBy}</Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<ViewIcon />}
                    onClick={() => onView(entry)}
                    sx={{ borderRadius: '10px', borderColor: tokens.primary.main, color: tokens.primary.main }}
                  >
                    View
                  </Button>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={reportDownloadingId === entry.id ? <CircularProgress size={16} /> : <PrintIcon />}
                    onClick={() => handleDownloadFinalMisReport(entry)}
                    disabled={reportDownloadingId === entry.id}
                    sx={{ borderRadius: '10px', borderColor: tokens.info.main, color: tokens.info.main }}
                  >
                    Report
                  </Button>
                  {canUpdate && (
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<EditIcon />}
                      onClick={() => onEdit(entry)}
                      sx={{ borderRadius: '10px', borderColor: tokens.success.main, color: tokens.success.main }}
                    >
                      Edit
                    </Button>
                  )}
                  {canDelete && (String(entry.status || '').toLowerCase() === 'draft' || isAdmin) && (
                    <IconButton
                      onClick={() => handleDeleteClick(entry)}
                      sx={{
                        borderRadius: '10px',
                        color: tokens.danger.main,
                        border: '1px solid rgba(238, 106, 49, 0.5)'
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                  {isAdmin && String(entry.status || '').toLowerCase() === 'deleted' && (
                    <IconButton
                      onClick={() => onHardDelete?.(entry.id)}
                      sx={{
                        borderRadius: '10px',
                        color: tokens.danger.dark,
                        border: '1px solid rgba(185, 28, 28, 0.5)'
                      }}
                      aria-label="Permanently delete"
                    >
                      <DeleteForeverIcon />
                    </IconButton>
                  )}
                </Box>
              </CardContent>
            </Card>
          );
        })}
        {filteredEntries.length === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 5, textAlign: 'center' }}>
            <EmptyState
              title="No records found"
              description="No MIS entries match your filters."
              actionLabel={canCreate ? 'Create New Entry' : undefined}
              onAction={canCreate ? onCreateNew : undefined}
            />
          </Box>
        )}
        {/* Mobile pagination controls */}
        {filteredEntries.length > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1, mt: 2 }}>
            <IconButton
              onClick={() => { setPage((p) => Math.max(0, p - 1)); }}
              disabled={page === 0}
              aria-label="previous page"
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="body2">Page {page + 1} of {pageCount}</Typography>
            <IconButton
              onClick={() => { setPage((p) => Math.min(pageCount - 1, p + 1)); }}
              disabled={page >= pageCount - 1}
              aria-label="next page"
            >
              <ArrowForwardIcon />
            </IconButton>
          </Box>
        )}
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        TransitionComponent={undefined}
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : '20px',
            p: 1,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, color: tokens.danger.main }}>Confirm Delete</DialogTitle>
        <DialogContent className="aos-fade-up">
          <Typography>
            Are you sure you want to delete entry <strong>{entryToDelete?.id}</strong>? This action
            cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setDeleteDialogOpen(false)} sx={{ minWidth: 96 }}>
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={confirmDelete} sx={{ minWidth: 96 }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog
        open={bulkDeleteDialogOpen}
        onClose={() => setBulkDeleteDialogOpen(false)}
        TransitionComponent={undefined}
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : '20px',
            minWidth: isMobile ? '100%' : '400px',
          },
        }}
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, rgba(238, 106, 49, 0.1) 0%, rgba(238, 106, 49, 0.05) 100%)',
            fontWeight: 700,
            color: tokens.danger.main,
            borderBottom: '1px solid rgba(238, 106, 49, 0.2)',
          }}
        >
          Confirm Bulk Delete
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }} className="aos-fade-up">
          <Typography variant="body1" sx={{ color: tokens.text.primary, mb: 2 }}>
            Are you sure you want to delete <strong>{selectedIds.size}</strong> selected {selectedIds.size === 1 ? 'entry' : 'entries'}?
          </Typography>
          <Typography variant="body2" sx={{ color: tokens.text.secondary }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setBulkDeleteDialogOpen(false)} sx={{ minWidth: 96 }}>
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={handleBulkDeleteConfirm} sx={{ minWidth: 112 }}>
            Delete {selectedIds.size} {selectedIds.size === 1 ? 'Entry' : 'Entries'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
