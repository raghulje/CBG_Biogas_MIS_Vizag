import { TextField, Grid, InputAdornment, Typography } from '@mui/material';
import { useFormContext } from 'react-hook-form';
import { FormSection, misFormFieldSx } from '../FormSectionChrome';

interface Props {
  selectedEntry?: any;
  isReadOnly: boolean;
}

const unitAdornment = (unit: string) => (
  <InputAdornment position="end">
    <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: '#8C9AAF' }}>{unit}</Typography>
  </InputAdornment>
);

export default function OtherSections({ isReadOnly }: Props) {
  const { register } = useFormContext();

  return (
    <>
      <FormSection
        id="section-fertilizer"
        title="Fertilizer"
        subtitle="FOM production, inventory & revenue"
        accentKey="fertilizer"
      >
        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={6} md={3}><TextField fullWidth label="FOM Produced" type="number" inputProps={{ step: 'any', inputMode: 'decimal' }} InputProps={{ endAdornment: unitAdornment('kg') }} {...register('fertilizer.fomProduced')} disabled={isReadOnly} sx={misFormFieldSx} /></Grid>
          <Grid item xs={12} sm={6} md={3}><TextField fullWidth label="Inventory" type="number" inputProps={{ step: 'any', inputMode: 'decimal' }} InputProps={{ endAdornment: unitAdornment('kg') }} {...register('fertilizer.inventory')} disabled={isReadOnly} sx={misFormFieldSx} /></Grid>
          <Grid item xs={12} sm={6} md={3}><TextField fullWidth label="Sold" type="number" inputProps={{ step: 'any', inputMode: 'decimal' }} InputProps={{ endAdornment: unitAdornment('kg') }} {...register('fertilizer.sold')} disabled={isReadOnly} sx={misFormFieldSx} /></Grid>
          <Grid item xs={12} sm={6} md={3}><TextField fullWidth label="Weighted Average" type="number" inputProps={{ step: 'any', inputMode: 'decimal' }} {...register('fertilizer.weightedAverage')} disabled={isReadOnly} sx={misFormFieldSx} /></Grid>
          <Grid item xs={12} sm={6} md={3}><TextField fullWidth label="Revenue" type="number" inputProps={{ step: 'any', inputMode: 'decimal' }} {...register('fertilizer.revenue1')} disabled={isReadOnly} sx={misFormFieldSx} /></Grid>
          <Grid item xs={12} sm={6} md={3}><TextField fullWidth label="Lagoon Liquid Sold" type="number" inputProps={{ step: 'any', inputMode: 'decimal' }} InputProps={{ endAdornment: unitAdornment('L') }} {...register('fertilizer.lagoonLiquidSold')} disabled={isReadOnly} sx={misFormFieldSx} /></Grid>
          <Grid item xs={12} sm={6} md={3}><TextField fullWidth label="Revenue (Liquid)" type="number" inputProps={{ step: 'any', inputMode: 'decimal' }} {...register('fertilizer.revenue2')} disabled={isReadOnly} sx={misFormFieldSx} /></Grid>
          <Grid item xs={12} sm={6} md={3}><TextField fullWidth label="Loose FOM Sold" type="number" inputProps={{ step: 'any', inputMode: 'decimal' }} InputProps={{ endAdornment: unitAdornment('kg') }} {...register('fertilizer.looseFomSold')} disabled={isReadOnly} sx={misFormFieldSx} /></Grid>
          <Grid item xs={12} sm={6} md={3}><TextField fullWidth label="Revenue (Loose)" type="number" inputProps={{ step: 'any', inputMode: 'decimal' }} {...register('fertilizer.revenue3')} disabled={isReadOnly} sx={misFormFieldSx} /></Grid>
        </Grid>
      </FormSection>

      <FormSection id="section-utilities" title="Utilities & Power" subtitle="Energy consumption metrics" accentKey="utilities">
        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Electricity Consumption" type="number" inputProps={{ step: 'any', inputMode: 'decimal' }} InputProps={{ endAdornment: unitAdornment('kWh') }} {...register('utilities.electricityConsumption')} disabled={isReadOnly} sx={misFormFieldSx} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Specific Power Consumption" type="number" inputProps={{ step: 'any', inputMode: 'decimal' }} {...register('utilities.specificPowerConsumption')} disabled={isReadOnly} sx={misFormFieldSx} /></Grid>
        </Grid>
      </FormSection>

      <FormSection id="section-manpower" title="Manpower" subtitle="Staffing for the shift" accentKey="manpower">
        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Refex SREL" type="number" inputProps={{ step: 'any', inputMode: 'decimal' }} {...register('manpower.refexSrelStaff')} disabled={isReadOnly} sx={misFormFieldSx} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Third Party" type="number" inputProps={{ step: 'any', inputMode: 'decimal' }} {...register('manpower.thirdPartyStaff')} disabled={isReadOnly} sx={misFormFieldSx} /></Grid>
        </Grid>
      </FormSection>

      <FormSection id="section-availability" title="Plant Availability" subtitle="Uptime and downtime tracking" accentKey="availability">
        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={6} md={3}><TextField fullWidth label="Working Hours" type="number" inputProps={{ step: 'any', inputMode: 'decimal' }} InputProps={{ endAdornment: unitAdornment('h') }} {...register('plantAvailability.workingHours')} disabled={isReadOnly} sx={misFormFieldSx} /></Grid>
          <Grid item xs={12} sm={6} md={3}><TextField fullWidth label="Scheduled Downtime" type="number" inputProps={{ step: 'any', inputMode: 'decimal' }} InputProps={{ endAdornment: unitAdornment('h') }} {...register('plantAvailability.scheduledDowntime')} disabled={isReadOnly} sx={misFormFieldSx} /></Grid>
          <Grid item xs={12} sm={6} md={3}><TextField fullWidth label="Unscheduled Downtime" type="number" inputProps={{ step: 'any', inputMode: 'decimal' }} InputProps={{ endAdornment: unitAdornment('h') }} {...register('plantAvailability.unscheduledDowntime')} disabled={isReadOnly} sx={misFormFieldSx} /></Grid>
          <Grid item xs={12} sm={6} md={3}><TextField fullWidth label="Total Availability" type="number" inputProps={{ step: 'any', inputMode: 'decimal' }} InputProps={{ endAdornment: unitAdornment('%') }} {...register('plantAvailability.totalAvailability')} disabled={isReadOnly} sx={misFormFieldSx} /></Grid>
        </Grid>
      </FormSection>

      <FormSection id="section-hse" title="Health, Safety & Environment" subtitle="Incidents and safety indicators" accentKey="hse">
        <Grid container spacing={2.5}>
          <Grid item xs={6} sm={4} md={3}><TextField fullWidth label="Safety LTI" type="number" inputProps={{ step: 'any', inputMode: 'decimal' }} {...register('hse.safetyLti')} disabled={isReadOnly} sx={misFormFieldSx} /></Grid>
          <Grid item xs={6} sm={4} md={3}><TextField fullWidth label="Near Misses" type="number" inputProps={{ step: 'any', inputMode: 'decimal' }} {...register('hse.nearMisses')} disabled={isReadOnly} sx={misFormFieldSx} /></Grid>
          <Grid item xs={6} sm={4} md={3}><TextField fullWidth label="First Aid" type="number" inputProps={{ step: 'any', inputMode: 'decimal' }} {...register('hse.firstAid')} disabled={isReadOnly} sx={misFormFieldSx} /></Grid>
          <Grid item xs={6} sm={4} md={3}><TextField fullWidth label="Reportable Incidents" type="number" inputProps={{ step: 'any', inputMode: 'decimal' }} {...register('hse.reportableIncidents')} disabled={isReadOnly} sx={misFormFieldSx} /></Grid>
          <Grid item xs={6} sm={4} md={3}><TextField fullWidth label="MTI" type="number" inputProps={{ step: 'any', inputMode: 'decimal' }} {...register('hse.mti')} disabled={isReadOnly} sx={misFormFieldSx} /></Grid>
          <Grid item xs={6} sm={4} md={3}><TextField fullWidth label="Other Incidents" type="number" inputProps={{ step: 'any', inputMode: 'decimal' }} {...register('hse.otherIncidents')} disabled={isReadOnly} sx={misFormFieldSx} /></Grid>
          <Grid item xs={6} sm={4} md={3}><TextField fullWidth label="Fatalities" type="number" inputProps={{ step: 'any', inputMode: 'decimal' }} {...register('hse.fatalities')} disabled={isReadOnly} sx={misFormFieldSx} /></Grid>
        </Grid>
      </FormSection>

      <FormSection
        id="section-remarks"
        title="Remarks"
        subtitle="Breakdown reasons and operational notes"
        accentKey="remarks"
        sx={{ mb: 1.5 }}
      >
        <TextField
          fullWidth
          label="Breakdown Reason / Other Remarks"
          multiline
          rows={4}
          {...register('remarks')}
          disabled={isReadOnly}
          sx={misFormFieldSx}
        />
      </FormSection>
    </>
  );
}
