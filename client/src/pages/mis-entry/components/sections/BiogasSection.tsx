import {
  Typography,
  TextField,
  Grid,
  Box,
  Button,
  IconButton,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  useMediaQuery,
  InputAdornment,
} from '@mui/material';
import { useFormContext, useFieldArray, Controller } from 'react-hook-form';
import { PlusCircle, UserPlus, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { customerService } from '../../../../services/customerService';
import { useAuth } from '../../../../context/AuthContext';
import { useSnackbar } from 'notistack';
import {
  FormSection,
  misFormFieldSx,
  primaryBtnSx,
  secondaryBtnSx,
  dangerIconBtnSx,
  productCardSx,
} from '../FormSectionChrome';

const SELLING_PRODUCTS = ['CBG', 'FOM', 'LFOM'] as const;
const FUEL_TYPES = ['Petrol', 'Diesel'] as const;

interface Props {
  selectedEntry?: any;
  isReadOnly: boolean;
}

const unitAdornment = (unit: string) => (
  <InputAdornment position="end">
    <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: '#8C9AAF' }}>{unit}</Typography>
  </InputAdornment>
);

const PRODUCT_META: Record<string, { accent: string; description: string }> = {
  CBG: { accent: '#2879B6', description: 'Compressed biogas customer sales' },
  FOM: { accent: '#059669', description: 'Fermented organic manure sales' },
  LFOM: { accent: '#D97706', description: 'Liquid FOM customer sales' },
};

const FUEL_META: Record<string, { accent: string; description: string }> = {
  Petrol: { accent: '#2879B6', description: 'Petrol utilized for plant operations' },
  Diesel: { accent: '#E65100', description: 'Diesel utilized for plant operations' },
};

export default function BiogasSection({ isReadOnly }: Props) {
  const { register, control, watch, setValue } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'cbgSales',
  });
  const { fields: fuelFields, append: fuelAppend, remove: fuelRemove } = useFieldArray({
    control,
    name: 'fuelUtilized',
  });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { hasPermission } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const canCreateCustomer = hasPermission('customer', 'create');

  const [customers, setCustomers] = useState<any[]>([]);
  const cbgSalesRows = watch('cbgSales') || [];
  const fuelUtilizedRows = watch('fuelUtilized') || [];

  const [addCustomerOpen, setAddCustomerOpen] = useState(false);
  const [addCustomerType, setAddCustomerType] = useState<string>('CBG');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [addCustomerSaving, setAddCustomerSaving] = useState(false);

  const fetchCustomers = () => {
    customerService.getCustomers({ status: 'active' }).then(setCustomers).catch(console.error);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (customers.length === 0 || !Array.isArray(cbgSalesRows)) return;
    cbgSalesRows.forEach((row: any, index: number) => {
      if (row.customerId && !row.customerType) {
        const customer = customers.find((c: any) => Number(c.id) === Number(row.customerId));
        if (customer?.type) setValue(`cbgSales.${index}.customerType`, customer.type);
      }
    });
  }, [customers, cbgSalesRows?.length, setValue]);

  const cbgSales = watch('cbgSales');
  useEffect(() => {
    const total = (cbgSales || []).reduce((sum: number, item: any) => sum + (parseFloat(item.quantity) || 0), 0);
    setValue('compressedBiogas.cbgSold', total);
  }, [cbgSales, setValue]);

  const openAddCustomer = (type: string) => {
    setAddCustomerType(type);
    setNewCustomerName('');
    setNewCustomerEmail('');
    setNewCustomerPhone('');
    setAddCustomerOpen(true);
  };

  const handleAddNewCustomer = async () => {
    if (!newCustomerName.trim()) return;
    setAddCustomerSaving(true);
    try {
      await customerService.createCustomer({
        name: newCustomerName.trim(),
        type: addCustomerType,
        email: newCustomerEmail.trim() || undefined,
        phone: newCustomerPhone.trim() || undefined,
        status: 'active',
      });
      fetchCustomers();
      setAddCustomerOpen(false);
      enqueueSnackbar('Customer added successfully', { variant: 'success' });
    } catch (err: any) {
      console.error(err);
    } finally {
      setAddCustomerSaving(false);
    }
  };

  return (
    <>
      <FormSection
        id="section-raw-biogas"
        title="Raw Biogas"
        subtitle="Digester gas output & yield"
        accentKey="rawBiogas"
      >
        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField fullWidth label="Digester Gas" type="number" inputProps={{ step: 'any', inputMode: 'decimal' }} InputProps={{ endAdornment: unitAdornment('m³') }} {...register('rawBiogas.digester01Gas')} disabled={isReadOnly} sx={misFormFieldSx} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField fullWidth label="Total Raw Biogas" type="number" inputProps={{ step: 'any', inputMode: 'decimal' }} InputProps={{ endAdornment: unitAdornment('m³') }} {...register('rawBiogas.totalRawBiogas')} disabled={isReadOnly} sx={misFormFieldSx} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField fullWidth label="RBG Flared" type="number" inputProps={{ step: 'any', inputMode: 'decimal' }} InputProps={{ endAdornment: unitAdornment('m³') }} {...register('rawBiogas.rbgFlared')} disabled={isReadOnly} sx={misFormFieldSx} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField fullWidth label="Gas Yield" type="number" inputProps={{ step: 'any', inputMode: 'decimal' }} {...register('rawBiogas.gasYield')} disabled={isReadOnly} sx={misFormFieldSx} />
          </Grid>
        </Grid>
      </FormSection>

      <FormSection
        id="section-raw-biogas-quality"
        title="Raw Biogas Quality"
        subtitle="Composition analysis"
        accentKey="rawBiogasQuality"
      >
        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={6} md={4}><TextField fullWidth label="CH4" type="number" inputProps={{ step: 'any', inputMode: 'decimal' }} InputProps={{ endAdornment: unitAdornment('%') }} {...register('rawBiogasQuality.ch4')} disabled={isReadOnly} sx={misFormFieldSx} /></Grid>
          <Grid item xs={12} sm={6} md={4}><TextField fullWidth label="CO2" type="number" inputProps={{ step: 'any', inputMode: 'decimal' }} InputProps={{ endAdornment: unitAdornment('%') }} {...register('rawBiogasQuality.co2')} disabled={isReadOnly} sx={misFormFieldSx} /></Grid>
          <Grid item xs={12} sm={6} md={4}><TextField fullWidth label="H2S" type="number" inputProps={{ step: 'any', inputMode: 'decimal' }} InputProps={{ endAdornment: unitAdornment('ppm') }} {...register('rawBiogasQuality.h2s')} disabled={isReadOnly} sx={misFormFieldSx} /></Grid>
          <Grid item xs={12} sm={6} md={4}><TextField fullWidth label="O2" type="number" inputProps={{ step: 'any', inputMode: 'decimal' }} InputProps={{ endAdornment: unitAdornment('%') }} {...register('rawBiogasQuality.o2')} disabled={isReadOnly} sx={misFormFieldSx} /></Grid>
          <Grid item xs={12} sm={6} md={4}><TextField fullWidth label="N2" type="number" inputProps={{ step: 'any', inputMode: 'decimal' }} InputProps={{ endAdornment: unitAdornment('%') }} {...register('rawBiogasQuality.n2')} disabled={isReadOnly} sx={misFormFieldSx} /></Grid>
        </Grid>
      </FormSection>

      <FormSection
        id="section-cbg"
        title="Compressed Biogas"
        subtitle="Production quality, stock & conversion"
        accentKey="cbg"
      >
        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={6} md={4}><TextField fullWidth label="Produced" type="number" inputProps={{ step: 'any', inputMode: 'decimal' }} InputProps={{ endAdornment: unitAdornment('kg') }} {...register('compressedBiogas.produced')} disabled={isReadOnly} sx={misFormFieldSx} /></Grid>
          <Grid item xs={12} sm={6} md={4}><TextField fullWidth label="CH4" type="number" inputProps={{ step: 'any', inputMode: 'decimal' }} InputProps={{ endAdornment: unitAdornment('%') }} {...register('compressedBiogas.ch4')} disabled={isReadOnly} sx={misFormFieldSx} /></Grid>
          <Grid item xs={12} sm={6} md={4}><TextField fullWidth label="CO2" type="number" inputProps={{ step: 'any', inputMode: 'decimal' }} InputProps={{ endAdornment: unitAdornment('%') }} {...register('compressedBiogas.co2')} disabled={isReadOnly} sx={misFormFieldSx} /></Grid>
          <Grid item xs={12} sm={6} md={4}><TextField fullWidth label="H2S" type="number" inputProps={{ step: 'any', inputMode: 'decimal' }} InputProps={{ endAdornment: unitAdornment('ppm') }} {...register('compressedBiogas.h2s')} disabled={isReadOnly} sx={misFormFieldSx} /></Grid>
          <Grid item xs={12} sm={6} md={4}><TextField fullWidth label="O2" type="number" inputProps={{ step: 'any', inputMode: 'decimal' }} InputProps={{ endAdornment: unitAdornment('%') }} {...register('compressedBiogas.o2')} disabled={isReadOnly} sx={misFormFieldSx} /></Grid>
          <Grid item xs={12} sm={6} md={4}><TextField fullWidth label="N2" type="number" inputProps={{ step: 'any', inputMode: 'decimal' }} InputProps={{ endAdornment: unitAdornment('%') }} {...register('compressedBiogas.n2')} disabled={isReadOnly} sx={misFormFieldSx} /></Grid>
          <Grid item xs={12} sm={6} md={4}><TextField fullWidth label="Conversion Ratio" type="number" inputProps={{ step: 'any', inputMode: 'decimal' }} {...register('compressedBiogas.conversionRatio')} disabled={isReadOnly} sx={misFormFieldSx} /></Grid>
          <Grid item xs={12} sm={6} md={4}><TextField fullWidth label="CH4 Slippage" type="number" inputProps={{ step: 'any', inputMode: 'decimal' }} {...register('compressedBiogas.ch4Slippage')} disabled={isReadOnly} sx={misFormFieldSx} /></Grid>
          <Grid item xs={12} sm={6} md={4}><TextField fullWidth label="CBG Stock" type="number" inputProps={{ step: 'any', inputMode: 'decimal' }} InputProps={{ endAdornment: unitAdornment('kg') }} {...register('compressedBiogas.cbgStock')} disabled={isReadOnly} sx={misFormFieldSx} /></Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="CBG Sold"
              type="number"
              inputProps={{ step: 'any', inputMode: 'decimal', readOnly: true }}
              InputProps={{ endAdornment: unitAdornment('kg') }}
              {...register('compressedBiogas.cbgSold')}
              disabled
              sx={{ ...misFormFieldSx, '& .MuiOutlinedInput-root': { bgcolor: '#F8FAFC' } }}
            />
          </Grid>
        </Grid>
      </FormSection>

      <FormSection
        id="section-sales"
        title="Sales"
        subtitle="CBG, FOM & LFOM customer transactions"
        accentKey="sales"
      >
        {SELLING_PRODUCTS.map((productType) => {
          const rowIndices = fields
            .map((_, i) => i)
            .filter((i) => (cbgSalesRows[i]?.customerType || '') === productType);
          const customersForType = customers.filter((c: any) => (c.type || '') === productType);
          const meta = PRODUCT_META[productType];

          return (
            <Box key={productType} sx={productCardSx(meta.accent)}>
              <Typography sx={{ fontSize: 18, fontWeight: 600, color: '#1E293B', mb: 0.5 }}>{productType}</Typography>
              <Typography sx={{ fontSize: 13, color: '#64748B', mb: 2 }}>{meta.description}</Typography>

              {rowIndices.map((index) => (
                <Grid
                  container
                  spacing={2}
                  key={fields[index].id}
                  sx={{ mb: 1.75, alignItems: 'center' }}
                >
                  <Grid item xs={12} sm={5}>
                    <Controller
                      name={`cbgSales.${index}.customerId`}
                      control={control}
                      defaultValue=""
                      render={({ field: controllerField }) => (
                        <TextField
                          select
                          fullWidth
                          label="Customer"
                          value={controllerField.value || ''}
                          onChange={controllerField.onChange}
                          disabled={isReadOnly}
                          InputLabelProps={{ shrink: true }}
                          sx={misFormFieldSx}
                        >
                          {customersForType.map((c: any) => (
                            <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                          ))}
                        </TextField>
                      )}
                    />
                  </Grid>
                  <Grid item xs={10} sm={5}>
                    <TextField
                      fullWidth
                      label="Quantity"
                      type="number"
                      inputProps={{ step: 'any', min: 0 }}
                      InputProps={{ endAdornment: unitAdornment('kg') }}
                      {...register(`cbgSales.${index}.quantity`)}
                      disabled={isReadOnly}
                      InputLabelProps={{ shrink: true }}
                      sx={misFormFieldSx}
                    />
                  </Grid>
                  {!isReadOnly && (
                    <Grid item xs={2} sm={2} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <IconButton size="small" onClick={() => remove(index)} sx={dangerIconBtnSx}>
                        <Trash2 size={16} />
                      </IconButton>
                    </Grid>
                  )}
                </Grid>
              ))}

              {!isReadOnly && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.25, mt: rowIndices.length ? 1.5 : 0 }}>
                  <Button
                    startIcon={<PlusCircle size={16} />}
                    variant="contained"
                    onClick={() => append({ customerType: productType, customerId: '', quantity: '' })}
                    sx={primaryBtnSx}
                  >
                    Add Sale
                  </Button>
                  <Button
                    startIcon={<UserPlus size={16} />}
                    variant="outlined"
                    onClick={() => openAddCustomer(productType)}
                    disabled={!canCreateCustomer}
                    sx={secondaryBtnSx}
                  >
                    Add Customer
                  </Button>
                </Box>
              )}
            </Box>
          );
        })}

        {fields.length === 0 && (
          <Typography sx={{ fontSize: 13.5, color: '#64748B', textAlign: 'center', py: 2 }}>
            No sales entries added. Use &quot;Add Sale&quot; under each product to add customer and quantity.
          </Typography>
        )}
      </FormSection>

      <FormSection
        id="section-fuel"
        title="Fuel"
        subtitle="Petrol & diesel utilization"
        accentKey="fuel"
      >
        {FUEL_TYPES.map((fuelType) => {
          const rowIndices = fuelFields
            .map((_, i) => i)
            .filter((i) => (fuelUtilizedRows[i]?.fuelType || '') === fuelType);
          const customersForType = customers.filter((c: any) => (c.type || '') === fuelType);
          const meta = FUEL_META[fuelType];

          return (
            <Box key={fuelType} sx={productCardSx(meta.accent)}>
              <Typography sx={{ fontSize: 18, fontWeight: 600, color: '#1E293B', mb: 0.5 }}>{fuelType}</Typography>
              <Typography sx={{ fontSize: 13, color: '#64748B', mb: 2 }}>{meta.description}</Typography>

              {rowIndices.map((index) => (
                <Grid container spacing={2} key={fuelFields[index].id} sx={{ mb: 1.75, alignItems: 'center' }}>
                  <Grid item xs={12} sm={5}>
                    <Controller
                      name={`fuelUtilized.${index}.customerId`}
                      control={control}
                      defaultValue=""
                      render={({ field: controllerField }) => (
                        <TextField
                          select
                          fullWidth
                          label="Customer"
                          value={controllerField.value || ''}
                          onChange={controllerField.onChange}
                          disabled={isReadOnly}
                          InputLabelProps={{ shrink: true }}
                          sx={misFormFieldSx}
                        >
                          {customersForType.map((c: any) => (
                            <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                          ))}
                        </TextField>
                      )}
                    />
                  </Grid>
                  <Grid item xs={10} sm={5}>
                    <TextField
                      fullWidth
                      label="Quantity"
                      type="number"
                      inputProps={{ step: 'any', min: 0 }}
                      InputProps={{ endAdornment: unitAdornment('L') }}
                      {...register(`fuelUtilized.${index}.quantity`)}
                      disabled={isReadOnly}
                      InputLabelProps={{ shrink: true }}
                      sx={misFormFieldSx}
                    />
                  </Grid>
                  {!isReadOnly && (
                    <Grid item xs={2} sm={2} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <IconButton size="small" onClick={() => fuelRemove(index)} sx={dangerIconBtnSx}>
                        <Trash2 size={16} />
                      </IconButton>
                    </Grid>
                  )}
                </Grid>
              ))}

              {!isReadOnly && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.25, mt: rowIndices.length ? 1.5 : 0 }}>
                  <Button
                    startIcon={<PlusCircle size={16} />}
                    variant="contained"
                    onClick={() => fuelAppend({ fuelType, customerId: '', quantity: '' })}
                    sx={primaryBtnSx}
                  >
                    Add Sale
                  </Button>
                  <Button
                    startIcon={<UserPlus size={16} />}
                    variant="outlined"
                    onClick={() => openAddCustomer(fuelType)}
                    disabled={!canCreateCustomer}
                    sx={secondaryBtnSx}
                  >
                    Add Customer
                  </Button>
                </Box>
              )}
            </Box>
          );
        })}

        {fuelFields.length === 0 && (
          <Typography sx={{ fontSize: 13.5, color: '#64748B', textAlign: 'center', py: 2 }}>
            No fuel entries added. Use &quot;Add Sale&quot; under each fuel type to add customer and quantity.
          </Typography>
        )}
      </FormSection>

      <FormSection
        id="section-compressors"
        title="Compressors"
        subtitle="Runtime hours tracking"
        accentKey="compressors"
      >
        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth label="Compressor 1 Hours" type="number" inputProps={{ step: 'any', inputMode: 'decimal' }} InputProps={{ endAdornment: unitAdornment('h') }} {...register('compressors.compressor1Hours')} disabled={isReadOnly} sx={misFormFieldSx} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth label="Compressor 2 Hours" type="number" inputProps={{ step: 'any', inputMode: 'decimal' }} InputProps={{ endAdornment: unitAdornment('h') }} {...register('compressors.compressor2Hours')} disabled={isReadOnly} sx={misFormFieldSx} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth label="Total Hours" type="number" inputProps={{ step: 'any', inputMode: 'decimal' }} InputProps={{ endAdornment: unitAdornment('h') }} {...register('compressors.totalHours')} disabled={isReadOnly} sx={misFormFieldSx} />
          </Grid>
        </Grid>
      </FormSection>

      <Dialog
        open={addCustomerOpen}
        onClose={() => setAddCustomerOpen(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: { xs: 0, sm: '16px' },
            maxHeight: { xs: '100vh', sm: '90vh' },
          },
        }}
      >
        <DialogTitle
          component="div"
          sx={{
            fontWeight: 700,
            color: '#0B1F3A',
            pt: 3,
            px: 3,
            pb: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          Add New Customer
        </DialogTitle>
        <DialogContent sx={{ pt: 5, px: 3, pb: 2, overflow: 'visible' }}>
          <Box
            component="form"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              if (newCustomerName.trim()) handleAddNewCustomer();
            }}
            sx={{ pt: '40px' }}
          >
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField fullWidth label="Selling Product" value={addCustomerType} disabled sx={misFormFieldSx} />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Customer Name"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  sx={misFormFieldSx}
                  inputProps={{ 'aria-required': true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={newCustomerEmail}
                  onChange={(e) => setNewCustomerEmail(e.target.value)}
                  sx={misFormFieldSx}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  sx={misFormFieldSx}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setAddCustomerOpen(false)} sx={{ ...secondaryBtnSx, minWidth: 96 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAddNewCustomer}
            disabled={!newCustomerName.trim() || addCustomerSaving}
            sx={{ ...primaryBtnSx, minWidth: 128 }}
          >
            {addCustomerSaving ? 'Saving…' : 'Save Customer'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
