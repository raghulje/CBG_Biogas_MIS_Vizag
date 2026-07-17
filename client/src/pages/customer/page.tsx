
import { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Button,
    Card,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Chip,
    InputAdornment,
    useMediaQuery,
    useTheme,
    Alert,
    Zoom,
    TablePagination,
    Stack,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Search as SearchIcon,
    Business as BusinessIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import MESSAGES from '../../utils/messages';
import { customerService } from '../../services/customerService';
import { useAuth } from '../../context/AuthContext';
import { EmptyState, ErrorState, TableSkeleton } from '../../components/ui/FeedbackStates';
import { PageHeader, FilterToolbar } from '../../components/ui/PageChrome';
import { tokens } from '../../themes';

export interface Customer {
    id: number;
    name: string;
    type: string;
    email: string;
    phone: string;
    address: string;
    gst_number: string;
    pan_number: string;
    status: 'active' | 'inactive';
}

const CUSTOMER_TYPES = [
    'CBG',
    'FOM',
    'LFOM',
    'Petrol',
    'Diesel'
];

export default function CustomerPage() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const { user, hasPermission } = useAuth();
    const { enqueueSnackbar } = useSnackbar();
    const canCreate = hasPermission('customer', 'create');
    const canUpdate = hasPermission('customer', 'update');
    const canDelete = hasPermission('customer', 'delete');

    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Dialog State
    const [open, setOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        type: '',
        email: '',
        phone: '',
        address: '',
        gst_number: '',
        pan_number: '',
        status: 'active'
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [serverError, setServerError] = useState<string | null>(null);

    // Debounce search input to avoid API spam on every keystroke
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(t);
    }, [search]);

    useEffect(() => {
        const controller = new AbortController();
        let cancelled = false;

        const fetchCustomers = async () => {
            setLoading(true);
            setFetchError(null);
            try {
                const data = await customerService.getCustomers(
                    { search: debouncedSearch, status: statusFilter },
                    controller.signal
                );
                if (!cancelled) {
                    setCustomers(Array.isArray(data) ? data : []);
                    setPage(0);
                }
            } catch (err: any) {
                if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return;
                console.error('Failed to fetch customers', err);
                if (!cancelled) {
                    setFetchError(err?.response?.data?.message || 'Failed to load customers. Please try again.');
                    setCustomers([]);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchCustomers();
        return () => {
            cancelled = true;
            controller.abort();
        };
    }, [debouncedSearch, statusFilter]);

    // Used after create/update/delete to refresh without waiting for debounce
    const refreshCustomers = async () => {
        setLoading(true);
        setFetchError(null);
        try {
            const data = await customerService.getCustomers({ search: debouncedSearch, status: statusFilter });
            setCustomers(Array.isArray(data) ? data : []);
        } catch (err: any) {
            console.error('Failed to fetch customers', err);
            setFetchError(err?.response?.data?.message || 'Failed to load customers. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const paginatedCustomers = useMemo(
        () => customers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
        [customers, page, rowsPerPage]
    );

    const handleOpen = (customer?: Customer) => {
        setServerError(null);
        setErrors({});
        if (customer) {
            setSelectedCustomer(customer);
            setFormData({
                name: customer.name || '',
                type: customer.type || '',
                email: customer.email || '',
                phone: customer.phone || '',
                address: customer.address || '',
                gst_number: customer.gst_number || '',
                pan_number: customer.pan_number || '',
                status: customer.status || 'active'
            });
            setEditMode(true);
        } else {
            setSelectedCustomer(null);
            setFormData({
                name: '',
                type: '',
                email: '',
                phone: '',
                address: '',
                gst_number: '',
                pan_number: '',
                status: 'active'
            });
            setEditMode(false);
        }
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedCustomer(null);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const tempErrors: Record<string, string> = {};
        if (!formData.name) tempErrors.name = 'Name is required';
        // if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) tempErrors.email = 'Invalid email';
        setErrors(tempErrors);
        return Object.keys(tempErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setServerError(null);

        try {
            if (editMode && selectedCustomer) {
                await customerService.updateCustomer(selectedCustomer.id, formData);
                enqueueSnackbar(MESSAGES.CUSTOMER_UPDATED, { variant: 'success' });
            } else {
                await customerService.createCustomer(formData);
                enqueueSnackbar(MESSAGES.CUSTOMER_CREATED, { variant: 'success' });
            }
            handleClose();
            refreshCustomers();
        } catch (err: any) {
            console.error('Save failed', err);
            setServerError(err.response?.data?.message || MESSAGES.CUSTOMER_SAVE_FAILED);
            enqueueSnackbar(err.response?.data?.message || MESSAGES.CUSTOMER_SAVE_FAILED, { variant: 'error' });
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this customer?')) {
            try {
                await customerService.deleteCustomer(id);
                refreshCustomers();
                enqueueSnackbar(MESSAGES.CUSTOMER_DELETED, { variant: 'success' });
            } catch (err) {
                console.error('Delete failed', err);
                enqueueSnackbar(MESSAGES.CUSTOMER_SAVE_FAILED, { variant: 'error' });
            }
        }
    };

    return (
        <Box>
                <PageHeader
                    title="Customer Master"
                    subtitle="Manage plant customers and contact details"
                    actions={
                        canCreate ? (
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<AddIcon />}
                                onClick={() => handleOpen()}
                            >
                                Add Customer
                            </Button>
                        ) : undefined
                    }
                />

                <FilterToolbar title="Filters">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', width: '100%' }}>
                        <TextField
                            label="Search customers"
                            placeholder="Search by name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            sx={{ flexGrow: 1, minWidth: 220, maxWidth: 480 }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon color="action" aria-hidden />
                                    </InputAdornment>
                                ),
                            }}
                            inputProps={{ 'aria-label': 'Search customers by name' }}
                        />
                    </Box>
                </FilterToolbar>

                {fetchError && (
                    <ErrorState message={fetchError} onRetry={refreshCustomers} />
                )}

                {loading && !fetchError && (
                    <Box sx={{ p: 2 }}>
                        <TableSkeleton rows={6} cols={isMobile ? 2 : 5} />
                    </Box>
                )}

                {!loading && !fetchError && customers.length === 0 && (
                    <EmptyState
                        title="No customers found"
                        description={debouncedSearch ? 'Try a different search term.' : 'Add your first customer to get started.'}
                        actionLabel={canCreate ? 'Add Customer' : undefined}
                        onAction={canCreate ? () => handleOpen() : undefined}
                    />
                )}

                {/* Mobile cards */}
                {!loading && !fetchError && customers.length > 0 && isMobile && (
                    <Stack spacing={1.5} className="aos-fade-up aos-delay-200">
                        {paginatedCustomers.map((customer) => (
                            <Card key={customer.id} sx={{ p: 2, borderRadius: `${tokens.radius.card}px` }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                                    <Box sx={{ display: 'flex', gap: 1.5, minWidth: 0 }}>
                                        <Box
                                            sx={{
                                                width: 40, height: 40, borderRadius: '50%',
                                                bgcolor: 'primary.main', opacity: 1,
                                                backgroundColor: (t) => `${t.palette.primary.main}14`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: 'primary.main', flexShrink: 0,
                                            }}
                                        >
                                            <BusinessIcon fontSize="small" />
                                        </Box>
                                        <Box sx={{ minWidth: 0 }}>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }} noWrap>
                                                {customer.name}
                                            </Typography>
                                            <Chip label={customer.type || 'N/A'} size="small" color="primary" variant="outlined" sx={{ mt: 0.5 }} />
                                            <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                                                {customer.email || customer.phone || '—'}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Box>
                                        <Chip
                                            label={customer.status === 'active' ? 'Active' : 'Inactive'}
                                            size="small"
                                            color={customer.status === 'active' ? 'success' : 'default'}
                                        />
                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
                                            {canUpdate && (
                                                <IconButton size="small" aria-label={`Edit ${customer.name}`} onClick={() => handleOpen(customer)} color="primary">
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            )}
                                            {canDelete && (
                                                <IconButton size="small" aria-label={`Delete ${customer.name}`} onClick={() => handleDelete(customer.id)} color="error">
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            )}
                                        </Box>
                                    </Box>
                                </Box>
                            </Card>
                        ))}
                        <TablePagination
                            component="div"
                            count={customers.length}
                            page={page}
                            onPageChange={(_, p) => setPage(p)}
                            rowsPerPage={rowsPerPage}
                            onRowsPerPageChange={(e) => {
                                setRowsPerPage(parseInt(e.target.value, 10));
                                setPage(0);
                            }}
                            rowsPerPageOptions={[5, 10, 25]}
                        />
                    </Stack>
                )}

                {/* Desktop table */}
                {!loading && !fetchError && customers.length > 0 && !isMobile && (
                <TableContainer
                    component={Paper}
                    elevation={0}
                    className="aos-fade-up aos-delay-200"
                    sx={{ borderRadius: `${tokens.radius.table}px`, border: '1px solid', borderColor: 'divider' }}
                >
                    <Table aria-label="Customers table">
                        <TableHead sx={{ backgroundColor: 'background.default' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Name</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Type</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Contact</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>GST / PAN</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Status</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600, color: 'text.secondary' }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                                {paginatedCustomers.map((customer) => (
                                    <TableRow key={customer.id} hover>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Box sx={{
                                                    width: 36, height: 36, borderRadius: '50%',
                                                    backgroundColor: (t) => `${t.palette.primary.main}14`,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: 'primary.main'
                                                }}>
                                                    <BusinessIcon fontSize="small" />
                                                </Box>
                                                <Box>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                        {customer.name}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {customer.address ? (customer.address.length > 30 ? customer.address.substring(0, 30) + '...' : customer.address) : '-'}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={customer.type || 'N/A'}
                                                size="small"
                                                color="primary"
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Box>
                                                <Typography variant="body2">{customer.email || '-'}</Typography>
                                                <Typography variant="caption" color="text.secondary">{customer.phone || '-'}</Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Box>
                                                <Typography variant="body2">GST: {customer.gst_number || '-'}</Typography>
                                                <Typography variant="caption" color="text.secondary">PAN: {customer.pan_number || '-'}</Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={customer.status === 'active' ? 'Active' : 'Inactive'}
                                                size="small"
                                                color={customer.status === 'active' ? 'success' : 'default'}
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            {canUpdate && (
                                                <IconButton size="small" aria-label={`Edit ${customer.name}`} onClick={() => handleOpen(customer)} color="primary">
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            )}
                                            {canDelete && (
                                                <IconButton size="small" aria-label={`Delete ${customer.name}`} onClick={() => handleDelete(customer.id)} color="error">
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                        </TableBody>
                    </Table>
                    <TablePagination
                        component="div"
                        count={customers.length}
                        page={page}
                        onPageChange={(_, p) => setPage(p)}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={(e) => {
                            setRowsPerPage(parseInt(e.target.value, 10));
                            setPage(0);
                        }}
                        rowsPerPageOptions={[5, 10, 25, 50]}
                    />
                </TableContainer>
                )}

                {/* Add/Edit Dialog */}
                <Dialog
                    open={open}
                    onClose={handleClose}
                    maxWidth="sm"
                    fullWidth
                    TransitionComponent={Zoom}
                    TransitionProps={{ timeout: 400 }}
                >
                    <DialogTitle>
                        {editMode ? 'Edit Customer' : 'Add New Customer'}
                    </DialogTitle>
                    <DialogContent className="aos-fade-up">
                        {serverError && (
                            <Alert severity="error" sx={{ mb: 2 }}>{serverError}</Alert>
                        )}
                        <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                            <TextField
                                name="name"
                                label="Customer Name"
                                value={formData.name}
                                onChange={handleChange}
                                error={!!errors.name}
                                helperText={errors.name}
                                fullWidth
                                required
                            />

                            <TextField
                                select
                                name="type"
                                label="Customer Type"
                                value={formData.type}
                                onChange={handleChange}
                                fullWidth
                            >
                                {CUSTOMER_TYPES.map((type) => (
                                    <MenuItem key={type} value={type}>
                                        {type}
                                    </MenuItem>
                                ))}
                            </TextField>

                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <TextField
                                    name="email"
                                    label="Email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    fullWidth
                                />
                                <TextField
                                    name="phone"
                                    label="Phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    fullWidth
                                />
                            </Box>

                            <TextField
                                name="address"
                                label="Address"
                                value={formData.address}
                                onChange={handleChange}
                                multiline
                                rows={2}
                                fullWidth
                            />

                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <TextField
                                    name="gst_number"
                                    label="GST Number"
                                    value={formData.gst_number}
                                    onChange={handleChange}
                                    fullWidth
                                />
                                <TextField
                                    name="pan_number"
                                    label="PAN Number"
                                    value={formData.pan_number}
                                    onChange={handleChange}
                                    fullWidth
                                />
                            </Box>

                            <TextField
                                select
                                name="status"
                                label="Status"
                                value={formData.status}
                                onChange={handleChange}
                                fullWidth
                            >
                                <MenuItem value="active">Active</MenuItem>
                                <MenuItem value="inactive">Inactive</MenuItem>
                            </TextField>
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button variant="outlined" onClick={handleClose} sx={{ minWidth: 96 }}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            variant="contained"
                            color="primary"
                            disabled={!formData.name}
                            sx={{ minWidth: 112 }}
                        >
                            {editMode ? 'Update' : 'Create'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
    );
}

