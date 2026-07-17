import { Typography, TextField, Grid, Box, InputAdornment } from '@mui/material';
import { useFormContext } from 'react-hook-form';
import { FormSection, FieldGroup, misFormFieldSx } from '../FormSectionChrome';

interface Props {
  selectedEntry?: any;
  isReadOnly: boolean;
}

const unitAdornment = (unit: string) => (
  <InputAdornment position="end">
    <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: '#8C9AAF' }}>{unit}</Typography>
  </InputAdornment>
);

export default function RawMaterialsSection({ isReadOnly }: Props) {
  const { register } = useFormContext();

  return (
    <FormSection
      id="section-raw-materials"
      title="Raw Materials"
      subtitle="Feed preparation & raw material tracking"
      accentKey="rawMaterials"
    >
      <FieldGroup title="Cow Dung Inventory">
        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Cow Dung Purchased"
              type="number"
              inputProps={{ step: 'any', inputMode: 'decimal' }}
              InputProps={{ endAdornment: unitAdornment('kg') }}
              {...register('rawMaterials.cowDungPurchased')}
              disabled={isReadOnly}
              sx={misFormFieldSx}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Cow Dung in Stock"
              type="number"
              inputProps={{ step: 'any', inputMode: 'decimal' }}
              InputProps={{ endAdornment: unitAdornment('kg') }}
              {...register('rawMaterials.cowDungStock')}
              disabled={isReadOnly}
              sx={misFormFieldSx}
            />
          </Grid>
        </Grid>
      </FieldGroup>

      <FieldGroup title="Old Press Mud">
        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Opening Balance"
              type="number"
              inputProps={{ step: 'any', inputMode: 'decimal' }}
              InputProps={{ endAdornment: unitAdornment('kg') }}
              {...register('rawMaterials.oldPressMudOpeningBalance')}
              disabled={isReadOnly}
              sx={misFormFieldSx}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Purchased"
              type="number"
              inputProps={{ step: 'any', inputMode: 'decimal' }}
              InputProps={{ endAdornment: unitAdornment('kg') }}
              {...register('rawMaterials.oldPressMudPurchased')}
              disabled={isReadOnly}
              sx={misFormFieldSx}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Degradation Loss"
              type="number"
              inputProps={{ step: 'any', inputMode: 'decimal' }}
              InputProps={{ endAdornment: unitAdornment('kg') }}
              {...register('rawMaterials.oldPressMudDegradationLoss')}
              disabled={isReadOnly}
              sx={misFormFieldSx}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Closing Stock"
              type="number"
              inputProps={{ step: 'any', inputMode: 'decimal' }}
              InputProps={{ endAdornment: unitAdornment('kg') }}
              {...register('rawMaterials.oldPressMudClosingStock')}
              disabled={isReadOnly}
              sx={misFormFieldSx}
            />
          </Grid>
        </Grid>
      </FieldGroup>

      <FieldGroup title="Press Mud Overview">
        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="New Press Mud Purchased"
              type="number"
              inputProps={{ step: 'any', inputMode: 'decimal' }}
              InputProps={{ endAdornment: unitAdornment('kg') }}
              {...register('rawMaterials.newPressMudPurchased')}
              disabled={isReadOnly}
              sx={misFormFieldSx}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Press Mud Used"
              type="number"
              inputProps={{ step: 'any', inputMode: 'decimal' }}
              InputProps={{ endAdornment: unitAdornment('kg') }}
              {...register('rawMaterials.pressMudUsed')}
              disabled={isReadOnly}
              sx={misFormFieldSx}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Total Press Mud Stock"
              type="number"
              inputProps={{ step: 'any', inputMode: 'decimal' }}
              InputProps={{ endAdornment: unitAdornment('kg') }}
              {...register('rawMaterials.totalPressMudStock')}
              disabled={isReadOnly}
              sx={misFormFieldSx}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Audit Note"
              multiline
              rows={3}
              {...register('rawMaterials.auditNote')}
              disabled={isReadOnly}
              sx={misFormFieldSx}
            />
          </Grid>
        </Grid>
      </FieldGroup>
    </FormSection>
  );
}
