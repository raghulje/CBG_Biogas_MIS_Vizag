import { useMemo } from 'react';
import { Typography, TextField, Grid, InputAdornment } from '@mui/material';
import { useFormContext, useWatch } from 'react-hook-form';
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

function FeedRow({
  title,
  qtyName,
  tsName,
  vsName,
  isReadOnly,
  register,
}: {
  title: string;
  qtyName: string;
  tsName: string;
  vsName: string;
  isReadOnly: boolean;
  register: ReturnType<typeof useFormContext>['register'];
}) {
  return (
    <FieldGroup title={title}>
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label="Qty"
            type="number"
            inputProps={{ step: 'any', inputMode: 'decimal' }}
            InputProps={{ endAdornment: unitAdornment('kg') }}
            {...register(qtyName)}
            disabled={isReadOnly}
            sx={misFormFieldSx}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label="TS"
            type="number"
            inputProps={{ step: 'any', inputMode: 'decimal' }}
            InputProps={{ endAdornment: unitAdornment('%') }}
            {...register(tsName)}
            disabled={isReadOnly}
            sx={misFormFieldSx}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label="VS"
            type="number"
            inputProps={{ step: 'any', inputMode: 'decimal' }}
            InputProps={{ endAdornment: unitAdornment('%') }}
            {...register(vsName)}
            disabled={isReadOnly}
            sx={misFormFieldSx}
          />
        </Grid>
      </Grid>
    </FieldGroup>
  );
}

export default function FeedMixingTankSection({ isReadOnly }: Props) {
  const { register, control } = useFormContext();

  const fmt = useWatch({ control, name: 'feedMixingTank' });
  const totals = useMemo(() => {
    const n = (v: any) => Number(v || 0);
    const getQty = (path: any) => n(path?.qty);
    const getTs = (path: any) => n(path?.ts);
    const getVs = (path: any) => n(path?.vs);

    const items = [
      { qty: getQty(fmt?.pressmudFeed), ts: getTs(fmt?.pressmudFeed), vs: getVs(fmt?.pressmudFeed) },
      { qty: getQty(fmt?.cowDungFeed), ts: getTs(fmt?.cowDungFeed), vs: getVs(fmt?.cowDungFeed) },
      { qty: getQty(fmt?.permeateFeed), ts: getTs(fmt?.permeateFeed), vs: getVs(fmt?.permeateFeed) },
      { qty: n(fmt?.waterQty), ts: n(fmt?.waterTs), vs: n(fmt?.waterVs) },
      { qty: getQty(fmt?.pulpFeed), ts: getTs(fmt?.pulpFeed), vs: getVs(fmt?.pulpFeed) },
      { qty: getQty(fmt?.maggieFeed), ts: getTs(fmt?.maggieFeed), vs: getVs(fmt?.maggieFeed) },
      { qty: getQty(fmt?.otherFeedSubstrate), ts: getTs(fmt?.otherFeedSubstrate), vs: getVs(fmt?.otherFeedSubstrate) },
    ];

    const totalQty = items.reduce((sum, it) => sum + n(it.qty), 0);
    const weightedTs = totalQty > 0 ? items.reduce((sum, it) => sum + n(it.qty) * n(it.ts), 0) / totalQty : 0;
    const weightedVs = totalQty > 0 ? items.reduce((sum, it) => sum + n(it.qty) * n(it.vs), 0) / totalQty : 0;

    return { totalQty, weightedTs, weightedVs };
  }, [fmt]);

  return (
    <FormSection
      id="section-feed-mixing"
      title="Feed Mixing"
      subtitle="Substrate blending & slurry preparation"
      accentKey="feedMixing"
    >
      <FeedRow
        title="Pressmud Feed"
        qtyName="feedMixingTank.pressmudFeed.qty"
        tsName="feedMixingTank.pressmudFeed.ts"
        vsName="feedMixingTank.pressmudFeed.vs"
        isReadOnly={isReadOnly}
        register={register}
      />
      <FeedRow
        title="Cow Dung Feed"
        qtyName="feedMixingTank.cowDungFeed.qty"
        tsName="feedMixingTank.cowDungFeed.ts"
        vsName="feedMixingTank.cowDungFeed.vs"
        isReadOnly={isReadOnly}
        register={register}
      />
      <FeedRow
        title="Permeate Feed"
        qtyName="feedMixingTank.permeateFeed.qty"
        tsName="feedMixingTank.permeateFeed.ts"
        vsName="feedMixingTank.permeateFeed.vs"
        isReadOnly={isReadOnly}
        register={register}
      />

      <FieldGroup title="Water Feed">
        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Water Qty"
              type="number"
              inputProps={{ step: 'any', inputMode: 'decimal' }}
              InputProps={{ endAdornment: unitAdornment('kg') }}
              {...register('feedMixingTank.waterQty')}
              disabled={isReadOnly}
              sx={misFormFieldSx}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="TS"
              type="number"
              inputProps={{ step: 'any', inputMode: 'decimal' }}
              InputProps={{ endAdornment: unitAdornment('%') }}
              {...register('feedMixingTank.waterTs')}
              disabled={isReadOnly}
              sx={misFormFieldSx}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="VS"
              type="number"
              inputProps={{ step: 'any', inputMode: 'decimal' }}
              InputProps={{ endAdornment: unitAdornment('%') }}
              {...register('feedMixingTank.waterVs')}
              disabled={isReadOnly}
              sx={misFormFieldSx}
            />
          </Grid>
        </Grid>
      </FieldGroup>

      <FeedRow
        title="Pulp"
        qtyName="feedMixingTank.pulpFeed.qty"
        tsName="feedMixingTank.pulpFeed.ts"
        vsName="feedMixingTank.pulpFeed.vs"
        isReadOnly={isReadOnly}
        register={register}
      />
      <FeedRow
        title="Maggie"
        qtyName="feedMixingTank.maggieFeed.qty"
        tsName="feedMixingTank.maggieFeed.ts"
        vsName="feedMixingTank.maggieFeed.vs"
        isReadOnly={isReadOnly}
        register={register}
      />
      <FeedRow
        title="Other Feed Substrate"
        qtyName="feedMixingTank.otherFeedSubstrate.qty"
        tsName="feedMixingTank.otherFeedSubstrate.ts"
        vsName="feedMixingTank.otherFeedSubstrate.vs"
        isReadOnly={isReadOnly}
        register={register}
      />

      <FieldGroup title="Total">
        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Total Qty"
              type="number"
              value={totals.totalQty.toFixed(2)}
              disabled
              InputProps={{ endAdornment: unitAdornment('kg') }}
              sx={{ ...misFormFieldSx, '& .MuiOutlinedInput-root': { ...misFormFieldSx['& .MuiOutlinedInput-root'], bgcolor: '#F8FAFC' } }}
            />
          </Grid>
        </Grid>
      </FieldGroup>

      <FieldGroup title="Feed Mixing Tank Slurry">
        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Total Slurry"
              type="number"
              inputProps={{ step: 'any', inputMode: 'decimal' }}
              InputProps={{ endAdornment: unitAdornment('kg') }}
              {...register('feedMixingTank.slurry.total')}
              disabled={isReadOnly}
              sx={misFormFieldSx}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Slurry TS"
              type="number"
              inputProps={{ step: 'any', inputMode: 'decimal' }}
              InputProps={{ endAdornment: unitAdornment('%') }}
              {...register('feedMixingTank.slurry.ts')}
              disabled={isReadOnly}
              sx={misFormFieldSx}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Slurry VS"
              type="number"
              inputProps={{ step: 'any', inputMode: 'decimal' }}
              InputProps={{ endAdornment: unitAdornment('%') }}
              {...register('feedMixingTank.slurry.vs')}
              disabled={isReadOnly}
              sx={misFormFieldSx}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="pH"
              type="number"
              inputProps={{ step: 'any', inputMode: 'decimal' }}
              {...register('feedMixingTank.slurry.ph')}
              disabled={isReadOnly}
              sx={misFormFieldSx}
            />
          </Grid>
        </Grid>
      </FieldGroup>
    </FormSection>
  );
}
