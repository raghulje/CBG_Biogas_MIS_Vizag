import {
  Typography,
  TextField,
  Grid,
  Box,
  IconButton,
  MenuItem,
  Chip,
  InputAdornment,
} from '@mui/material';
import { Trash2 } from 'lucide-react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import {
  FormSection,
  FieldGroup,
  misFormFieldSx,
  dangerIconBtnSx,
  SECTION_ACCENTS,
} from '../FormSectionChrome';

interface Props {
  digesters?: any[];
  isReadOnly: boolean;
  onAddDigester?: () => void;
  onRemoveDigester?: (id: number) => void;
}

const unitAdornment = (unit: string) => (
  <InputAdornment position="end">
    <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: '#8C9AAF' }}>{unit}</Typography>
  </InputAdornment>
);

export default function DigestersSection({ isReadOnly }: Props) {
  const { control, register } = useFormContext();
  const { fields, remove } = useFieldArray({
    control,
    name: 'digesters',
  });

  const accent = SECTION_ACCENTS.digesters;

  return (
    <FormSection
      id="section-digesters"
      title="Digester"
      subtitle="Feeding, discharge, slurry health & monitoring (single digester plant)"
      accentKey="digesters"
    >
      {fields.length > 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {fields.map((digester, index) => (
            <Box
              key={digester.id}
              sx={{
                borderRadius: '18px',
                border: '1px solid #E5EDF6',
                boxShadow: '0 6px 20px rgba(16,24,40,.04)',
                overflow: 'hidden',
                bgcolor: '#fff',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 4,
                  background: `linear-gradient(90deg, ${accent.accent}, ${accent.iconBg})`,
                },
              }}
            >
              <Box sx={{ p: { xs: 2.25, md: 3 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, gap: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0, flex: 1 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        bgcolor: accent.iconBg,
                        color: accent.iconColor,
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: 13,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {String(index + 1).padStart(2, '0')}
                    </Box>
                    <TextField
                      variant="standard"
                      {...register(`digesters.${index}.name`)}
                      InputProps={{
                        disableUnderline: isReadOnly,
                        style: { fontSize: '1.15rem', fontWeight: 600 },
                      }}
                      disabled={isReadOnly}
                      sx={{ flex: 1, maxWidth: 280 }}
                    />
                    <Chip
                      label="Running"
                      size="small"
                      sx={{
                        height: 24,
                        fontWeight: 700,
                        fontSize: 11,
                        bgcolor: '#E8F5EE',
                        color: '#2EAF61',
                        display: { xs: 'none', sm: 'inline-flex' },
                      }}
                    />
                  </Box>
                  {!isReadOnly && fields.length > 1 && (
                    <IconButton onClick={() => remove(index)} size="small" sx={dangerIconBtnSx} aria-label="Remove digester">
                      <Trash2 size={16} />
                    </IconButton>
                  )}
                </Box>

                <FieldGroup title="Feeding Data">
                  <Grid container spacing={2.5}>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Total Slurry Feed"
                        type="number"
                        inputProps={{ step: 'any', inputMode: 'decimal' }}
                        InputProps={{ endAdornment: unitAdornment('kg') }}
                        {...register(`digesters.${index}.feeding.totalSlurryFeed`)}
                        disabled={isReadOnly}
                        sx={misFormFieldSx}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Avg TS"
                        type="number"
                        inputProps={{ step: 'any', inputMode: 'decimal' }}
                        InputProps={{ endAdornment: unitAdornment('%') }}
                        {...register(`digesters.${index}.feeding.avgTs`)}
                        disabled={isReadOnly}
                        sx={misFormFieldSx}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Avg VS"
                        type="number"
                        inputProps={{ step: 'any', inputMode: 'decimal' }}
                        InputProps={{ endAdornment: unitAdornment('%') }}
                        {...register(`digesters.${index}.feeding.avgVs`)}
                        disabled={isReadOnly}
                        sx={misFormFieldSx}
                      />
                    </Grid>
                  </Grid>
                </FieldGroup>

                <FieldGroup title="Discharge Data">
                  <Grid container spacing={2.5}>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Total Slurry Out"
                        type="number"
                        inputProps={{ step: 'any', inputMode: 'decimal' }}
                        InputProps={{ endAdornment: unitAdornment('kg') }}
                        {...register(`digesters.${index}.discharge.totalSlurryOut`)}
                        disabled={isReadOnly}
                        sx={misFormFieldSx}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Avg TS"
                        type="number"
                        inputProps={{ step: 'any', inputMode: 'decimal' }}
                        InputProps={{ endAdornment: unitAdornment('%') }}
                        {...register(`digesters.${index}.discharge.avgTs`)}
                        disabled={isReadOnly}
                        sx={misFormFieldSx}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Avg VS"
                        type="number"
                        inputProps={{ step: 'any', inputMode: 'decimal' }}
                        InputProps={{ endAdornment: unitAdornment('%') }}
                        {...register(`digesters.${index}.discharge.avgVs`)}
                        disabled={isReadOnly}
                        sx={misFormFieldSx}
                      />
                    </Grid>
                  </Grid>
                </FieldGroup>

                <FieldGroup title="Slurry Characteristics">
                  <Grid container spacing={2.5}>
                    {[
                      { label: 'Lignin', key: 'lignin', unit: '%' },
                      { label: 'VFA', key: 'vfa' },
                      { label: 'Alkalinity', key: 'alkalinity' },
                      { label: 'VFA:ALK Ratio', key: 'vfaAlkRatio' },
                      { label: 'Ash', key: 'ash', unit: '%' },
                      { label: 'Density', key: 'density' },
                      { label: 'pH', key: 'ph' },
                      { label: 'Temperature', key: 'temperature', unit: '°C' },
                      { label: 'Pressure', key: 'pressure', unit: 'bar' },
                      { label: 'Slurry Level', key: 'slurryLevel', unit: '%' },
                    ].map(({ label, key, unit }) => (
                      <Grid item xs={6} sm={4} md={3} key={key}>
                        <TextField
                          fullWidth
                          label={label}
                          type="number"
                          inputProps={{ step: 'any', inputMode: 'decimal' }}
                          InputProps={unit ? { endAdornment: unitAdornment(unit) } : undefined}
                          {...register(`digesters.${index}.characteristics.${key}`)}
                          disabled={isReadOnly}
                          sx={misFormFieldSx}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </FieldGroup>

                <FieldGroup title="Health Monitoring">
                  <Grid container spacing={2.5}>
                    <Grid item xs={6} sm={4} md={3}>
                      <TextField
                        fullWidth
                        label="HRT"
                        type="number"
                        inputProps={{ step: 'any', inputMode: 'decimal' }}
                        {...register(`digesters.${index}.health.hrt`)}
                        disabled={isReadOnly}
                        sx={misFormFieldSx}
                      />
                    </Grid>
                    <Grid item xs={6} sm={4} md={3}>
                      <TextField
                        fullWidth
                        label="VS Destruction"
                        type="number"
                        inputProps={{ step: 'any', inputMode: 'decimal' }}
                        InputProps={{ endAdornment: unitAdornment('%') }}
                        {...register(`digesters.${index}.health.vsDestruction`)}
                        disabled={isReadOnly}
                        sx={misFormFieldSx}
                      />
                    </Grid>
                    <Grid item xs={6} sm={4} md={3}>
                      <TextField
                        fullWidth
                        label="OLR"
                        type="number"
                        inputProps={{ step: 'any', inputMode: 'decimal' }}
                        {...register(`digesters.${index}.health.olr`)}
                        disabled={isReadOnly}
                        sx={misFormFieldSx}
                      />
                    </Grid>
                    <Grid item xs={6} sm={4} md={3}>
                      <TextField
                        fullWidth
                        label="Balloon Level"
                        type="number"
                        inputProps={{ step: 'any', inputMode: 'decimal' }}
                        InputProps={{ endAdornment: unitAdornment('%') }}
                        {...register(`digesters.${index}.health.balloonLevel`)}
                        disabled={isReadOnly}
                        sx={misFormFieldSx}
                      />
                    </Grid>
                    <Grid item xs={6} sm={4} md={3}>
                      <TextField
                        fullWidth
                        select
                        label="Agitator Condition"
                        defaultValue="OK"
                        {...register(`digesters.${index}.health.agitatorCondition`)}
                        disabled={isReadOnly}
                        sx={misFormFieldSx}
                      >
                        <MenuItem value="OK">OK</MenuItem>
                        <MenuItem value="Not OK">Not OK</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid item xs={6} sm={4} md={3}>
                      <TextField
                        fullWidth
                        label="Foaming Level"
                        type="number"
                        inputProps={{ step: 'any', inputMode: 'decimal' }}
                        {...register(`digesters.${index}.health.foamingLevel`)}
                        disabled={isReadOnly}
                        sx={misFormFieldSx}
                      />
                    </Grid>
                  </Grid>
                </FieldGroup>
              </Box>
            </Box>
          ))}
        </Box>
      ) : (
        <Typography sx={{ fontSize: 14, color: '#64748B' }}>No digester data available.</Typography>
      )}
    </FormSection>
  );
}
