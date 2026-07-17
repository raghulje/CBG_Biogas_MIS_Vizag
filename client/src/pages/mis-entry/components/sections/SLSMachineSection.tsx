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

export default function SLSMachineSection({ isReadOnly }: Props) {
  const { register } = useFormContext();

  return (
    <FormSection
      id="section-sls"
      title="SLS Machine"
      subtitle="Solid-liquid separation operations"
      accentKey="sls"
    >
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6} md={4}>
          <TextField fullWidth label="Water Consumption" type="number" inputProps={{ step: 'any', inputMode: 'decimal' }} InputProps={{ endAdornment: unitAdornment('L') }} {...register('slsMachine.waterConsumption')} disabled={isReadOnly} sx={misFormFieldSx} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <TextField fullWidth label="Poly Electrolyte" type="number" inputProps={{ step: 'any', inputMode: 'decimal' }} InputProps={{ endAdornment: unitAdornment('kg') }} {...register('slsMachine.polyElectrolyte')} disabled={isReadOnly} sx={misFormFieldSx} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <TextField fullWidth label="Solution" type="number" inputProps={{ step: 'any', inputMode: 'decimal' }} {...register('slsMachine.solution')} disabled={isReadOnly} sx={misFormFieldSx} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <TextField fullWidth label="Slurry Feed" type="number" inputProps={{ step: 'any', inputMode: 'decimal' }} InputProps={{ endAdornment: unitAdornment('kg') }} {...register('slsMachine.slurryFeed')} disabled={isReadOnly} sx={misFormFieldSx} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <TextField fullWidth label="Wet Cake Production" type="number" inputProps={{ step: 'any', inputMode: 'decimal' }} InputProps={{ endAdornment: unitAdornment('kg') }} {...register('slsMachine.wetCakeProduction')} disabled={isReadOnly} sx={misFormFieldSx} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <TextField fullWidth label="Wet Cake TS" type="number" inputProps={{ step: 'any', inputMode: 'decimal' }} InputProps={{ endAdornment: unitAdornment('%') }} {...register('slsMachine.wetCakeTs')} disabled={isReadOnly} sx={misFormFieldSx} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <TextField fullWidth label="Wet Cake VS" type="number" inputProps={{ step: 'any', inputMode: 'decimal' }} InputProps={{ endAdornment: unitAdornment('%') }} {...register('slsMachine.wetCakeVs')} disabled={isReadOnly} sx={misFormFieldSx} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <TextField fullWidth label="Liquid Produced" type="number" inputProps={{ step: 'any', inputMode: 'decimal' }} InputProps={{ endAdornment: unitAdornment('L') }} {...register('slsMachine.liquidProduced')} disabled={isReadOnly} sx={misFormFieldSx} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <TextField fullWidth label="Liquid TS" type="number" inputProps={{ step: 'any', inputMode: 'decimal' }} InputProps={{ endAdornment: unitAdornment('%') }} {...register('slsMachine.liquidTs')} disabled={isReadOnly} sx={misFormFieldSx} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <TextField fullWidth label="Liquid VS" type="number" inputProps={{ step: 'any', inputMode: 'decimal' }} InputProps={{ endAdornment: unitAdornment('%') }} {...register('slsMachine.liquidVs')} disabled={isReadOnly} sx={misFormFieldSx} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <TextField fullWidth label="Liquid Sent to Lagoon" type="number" inputProps={{ step: 'any', inputMode: 'decimal' }} InputProps={{ endAdornment: unitAdornment('L') }} {...register('slsMachine.liquidSentToLagoon')} disabled={isReadOnly} sx={misFormFieldSx} />
        </Grid>
      </Grid>
    </FormSection>
  );
}
