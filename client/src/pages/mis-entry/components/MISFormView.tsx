
import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Save as SaveIcon,
  Send as SendIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useForm, FormProvider, Controller, SubmitHandler } from 'react-hook-form';
import type { MISEntry } from '../../../mocks/misEntries';
import RawMaterialsSection from './sections/RawMaterialsSection';
import FeedMixingTankSection from './sections/FeedMixingTankSection';
import DigestersSection from './sections/DigestersSection';
import SLSMachineSection from './sections/SLSMachineSection';
import BiogasSection from './sections/BiogasSection';
import OtherSections from './sections/OtherSections';
import MISFormNav from './MISFormNav';
import { FormSection, MIS_FORM_BG, misFormFieldSx, primaryBtnSx, secondaryBtnSx } from './FormSectionChrome';
import { misService } from '../../../services/misService';
import { useAuth } from '../../../context/AuthContext';
import { tokens } from '../../../themes';
import { PageHeader } from '../../../components/ui/PageChrome';
import { AppDateField } from '../../../components/ui/AppDateField';

interface Digester {
  id: number;
  name: string;
  feeding: { totalSlurryFeed: number; avgTs: number; avgVs: number };
  discharge: { totalSlurryOut: number; avgTs: number; avgVs: number };
  characteristics: {
    lignin: number;
    vfa: number;
    alkalinity: number;
    vfaAlkRatio: number;
    ash: number;
    density: number;
    ph: number;
    temperature: number;
    pressure: number;
    slurryLevel: number;
  };
  health: {
    hrt: number;
    vsDestruction: number;
    olr: number;
    balloonLevel: number;
    agitatorCondition: string;
    foamingLevel: number;
  };
}

interface MISFormViewProps {
  viewMode: 'create' | 'edit' | 'view';
  selectedEntry: MISEntry | null;
  digesters: Digester[];
  onBackToList: () => void;
  onAddDigester: () => void;
  onRemoveDigester: (id: number) => void;
  onSubmitSuccess?: (mode: 'create' | 'edit') => void;
  onDraftSaved?: (mode: 'create' | 'edit') => void;
  onApprove?: () => void;
  onReject?: () => void;
}


const ProgressiveRender = ({ children, delay }: { children: React.ReactNode; delay: number }) => {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setReady(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);
  return ready ? <>{children}</> : null;
};

export default function MISFormView({
  viewMode,
  selectedEntry,
  digesters, // We might ignore this prop and use form state
  onBackToList,
  onAddDigester, // We might ignore this prop
  onRemoveDigester, // We might ignore this prop
  onSubmitSuccess,
  onDraftSaved,
  onApprove,
  onReject,
}: MISFormViewProps) {
  const isReadOnly = viewMode === 'view';
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultCreateValues = {
    date: new Date().toISOString().split('T')[0],
    shift: 'General',
    digesters: [
      { id: 1, name: 'Digester 01', feeding: {}, discharge: {}, characteristics: {}, health: {} },
    ],
    rawMaterials: {},
    feedMixingTank: {},
    slsMachine: {},
    rawBiogas: {},
    rawBiogasQuality: {},
    compressedBiogas: {},
    cbgSales: [],
    fuelUtilized: [],
    compressors: {},
    fertilizer: {},
    utilities: {},
    manpower: {},
    plantAvailability: {},
    hse: {},
    remarks: ''
  };

  const methods = useForm<any>({
    defaultValues: defaultCreateValues,
    shouldUnregister: false
  });

  useEffect(() => {
    if (viewMode === 'create' && !selectedEntry) {
      methods.reset(defaultCreateValues);
    } else if (selectedEntry) {
      methods.reset(selectedEntry);
    }
  }, [viewMode, selectedEntry]);

  const { hasPermission } = useAuth();
  const canSave = (viewMode === 'create' && hasPermission('mis_entry', 'create')) ||
    (viewMode === 'edit' && hasPermission('mis_entry', 'update'));
  const canApprove = hasPermission('mis_entry', 'approve');
  const s = String(selectedEntry?.status || '').toLowerCase();
  const hideSubmitAndDraft = selectedEntry && ['approved', 'rejected'].includes(s);

  const onSubmit: SubmitHandler<any> = async (data) => {
    if (!canSave) {
      setError('You do not have permission to save.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const payload = { ...data, status: 'submitted' };
      if (viewMode === 'edit' && selectedEntry) {
        await misService.updateEntry(Number(selectedEntry.id), payload);
        await misService.submitEntry(Number(selectedEntry.id));
        onSubmitSuccess?.('edit');
      } else {
        const res = await misService.createEntry(payload);
        await misService.submitEntry(Number(res.id));
        onSubmitSuccess?.('create');
      }
      onBackToList();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to submit entry');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!canSave) {
      setError('You do not have permission to save draft.');
      return;
    }
    const data = methods.getValues();
    setSubmitting(true);
    setError(null);
    try {
      const payload = { ...data, status: 'draft' };
      if (viewMode === 'edit' && selectedEntry) {
        await misService.updateEntry(Number(selectedEntry.id), payload);
        onDraftSaved?.('edit');
      } else {
        await misService.createEntry(payload);
        onDraftSaved?.('create');
      }
      onBackToList();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save draft');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedEntry || !canApprove) return;
    setSubmitting(true);
    try {
      await misService.approveEntry(Number(selectedEntry.id));
      onApprove?.();
      onBackToList();
    } catch (err: any) {
      setError('Failed to approve entry');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedEntry || !canApprove) return;
    const reason = prompt('Please enter rejection reason:');
    if (reason === null) return;
    setSubmitting(true);
    try {
      await misService.rejectEntry(Number(selectedEntry.id), reason);
      onReject?.();
      onBackToList();
    } catch (err: any) {
      setError('Failed to reject entry');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'submitted' || s === 'under_review') {
      return { bg: tokens.primary.soft, color: tokens.primary.dark, border: 'rgba(40,121,182,0.28)' };
    }
    if (s === 'approved') {
      return { bg: tokens.success.soft, color: tokens.success.dark, border: 'rgba(52,168,83,0.3)' };
    }
    if (s === 'draft') {
      return { bg: tokens.warning.soft, color: tokens.warning.dark, border: 'rgba(245,158,11,0.35)' };
    }
    if (s === 'rejected') {
      return { bg: tokens.danger.soft, color: tokens.danger.main, border: 'rgba(220,53,69,0.3)' };
    }
    if (s === 'deleted') {
      return { bg: tokens.divider, color: tokens.text.secondary, border: tokens.border };
    }
    return { bg: tokens.divider, color: tokens.text.secondary, border: tokens.border };
  };

  const formTitle =
    viewMode === 'create'
      ? 'Create New MIS Entry'
      : viewMode === 'edit'
        ? `Edit: ${selectedEntry?.id}`
        : `View: ${selectedEntry?.id}`;

  return (
    <FormProvider {...methods}>
      <Box
        component="form"
        onSubmit={methods.handleSubmit(onSubmit)}
        sx={{
          position: 'relative',
          bgcolor: MIS_FORM_BG,
          mx: { xs: -2, sm: -3 },
          px: { xs: 2, sm: 3 },
          py: { xs: 0.75, md: 1.25 },
          // Avoid minHeight:100% — it stretches the form and leaves a huge gap
          // above the sticky Submit bar after the last section (Remarks).
          borderRadius: { md: '16px' },
        }}
      >
        {submitting && (
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1300,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(15, 23, 42, 0.35)',
            }}
          >
            <Box
              sx={{
                bgcolor: tokens.surface,
                borderRadius: `${tokens.radius.dialog}px`,
                p: 3,
                boxShadow: tokens.shadow.lg,
                border: `1px solid ${tokens.border}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <CircularProgress size={44} color="primary" />
              <Typography variant="body1" fontWeight={600} color="text.primary">
                Saving…
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Please wait, do not close the page.
              </Typography>
            </Box>
          </Box>
        )}

        <PageHeader
          dense
          title={formTitle}
          subtitle="Daily plant operations entry"
          actions={
            <>
              <IconButton
                onClick={onBackToList}
                aria-label="Back to MIS list"
                size="small"
                sx={{
                  border: `1px solid ${tokens.border}`,
                  borderRadius: '10px',
                  color: tokens.text.secondary,
                  bgcolor: tokens.surface,
                  width: 34,
                  height: 34,
                  '&:hover': { bgcolor: tokens.bg, color: tokens.primary.main, borderColor: tokens.primary.border },
                }}
              >
                <ArrowBackIcon sx={{ fontSize: 18 }} />
              </IconButton>
              {selectedEntry && (() => {
                const statusStyle = getStatusColor(selectedEntry.status);
                const label = String(selectedEntry.status || '')
                  .replace(/_/g, ' ')
                  .replace(/\b\w/g, (c) => c.toUpperCase());
                return (
                  <Chip
                    label={label}
                    size="small"
                    sx={{
                      height: 28,
                      fontWeight: 700,
                      fontSize: 12,
                      letterSpacing: '0.01em',
                      bgcolor: statusStyle.bg,
                      color: statusStyle.color,
                      border: `1px solid ${statusStyle.border}`,
                      borderRadius: '999px',
                      '& .MuiChip-label': { px: 1.25 },
                    }}
                  />
                );
              })()}
              {!isReadOnly ? (
                <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                  {canSave && !hideSubmitAndDraft && (
                    <>
                      <Button
                        variant="outlined"
                        startIcon={<SaveIcon />}
                        onClick={handleSaveDraft}
                        disabled={submitting}
                        sx={secondaryBtnSx}
                      >
                        Save Draft
                      </Button>
                      <Button
                        variant="contained"
                        startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                        type="submit"
                        disabled={submitting}
                        sx={{
                          ...primaryBtnSx,
                          background: `linear-gradient(135deg, ${tokens.success.main} 0%, ${tokens.success.dark} 100%)`,
                          boxShadow: `0 6px 16px ${tokens.success.main}28`,
                          '&:hover': {
                            background: `linear-gradient(135deg, ${tokens.success.dark} 0%, #246B38 100%)`,
                          },
                        }}
                      >
                        Submit
                      </Button>
                    </>
                  )}
                </Box>
              ) : (
                selectedEntry && String(selectedEntry.status || '').toLowerCase() === 'submitted' && canApprove && (
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Button
                      variant="contained"
                      color="success"
                      onClick={handleApprove}
                      disabled={submitting}
                      sx={primaryBtnSx}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="contained"
                      color="error"
                      onClick={handleReject}
                      disabled={submitting}
                      sx={{ ...primaryBtnSx, background: `linear-gradient(135deg, ${tokens.danger.main}, ${tokens.danger.dark})` }}
                    >
                      Reject
                    </Button>
                  </Box>
                )
              )}
            </>
          }
        />

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }}>{error}</Alert>}

        <MISFormNav />

        <Box sx={{ minWidth: 0 }}>
          {viewMode === 'create' && (
            <FormSection
              id="section-date"
              title="Entry Date"
              subtitle="Select the operational date for this MIS entry"
              accentKey="date"
            >
              <Controller
                name="date"
                control={methods.control}
                rules={{ required: true }}
                render={({ field }) => (
                  <AppDateField
                    fullWidth
                    label="Date"
                    required
                    value={field.value || ''}
                    onChange={field.onChange}
                    sx={{ ...misFormFieldSx, maxWidth: 320 }}
                  />
                )}
              />
            </FormSection>
          )}

          <RawMaterialsSection isReadOnly={isReadOnly} />
          <ProgressiveRender delay={100}>
            <FeedMixingTankSection isReadOnly={isReadOnly} />
          </ProgressiveRender>
          <ProgressiveRender delay={200}>
            <DigestersSection isReadOnly={isReadOnly} />
          </ProgressiveRender>
          <ProgressiveRender delay={300}>
            <SLSMachineSection isReadOnly={isReadOnly} />
          </ProgressiveRender>
          <ProgressiveRender delay={400}>
            <BiogasSection isReadOnly={isReadOnly} />
          </ProgressiveRender>
          <ProgressiveRender delay={500}>
            <OtherSections isReadOnly={isReadOnly} />
          </ProgressiveRender>

          {!isReadOnly && (
            <Box
              sx={{
                display: 'flex',
                gap: 1.5,
                justifyContent: 'flex-end',
                flexWrap: 'wrap',
                alignItems: 'center',
                mt: 1,
                mb: 0,
                pt: 0.5,
                // Mobile: compact sticky bar without stretching parent height
                position: { xs: 'sticky', md: 'static' },
                bottom: { xs: 0, md: 'auto' },
                zIndex: { xs: 12, md: 'auto' },
                bgcolor: { xs: 'rgba(255,255,255,0.96)', md: 'transparent' },
                backdropFilter: { xs: 'blur(8px)', md: 'none' },
                borderTop: { xs: `1px solid ${tokens.border}`, md: 'none' },
                boxShadow: { xs: '0 -4px 16px rgba(15,23,42,0.06)', md: 'none' },
                mx: { xs: -2, md: 0 },
                px: { xs: 2, md: 0 },
                py: { xs: 1.5, md: 0 },
                pb: { xs: 'calc(12px + env(safe-area-inset-bottom, 0px))', md: 0 },
              }}
            >
              {canSave && !hideSubmitAndDraft && (
                <>
                  <Button
                    variant="outlined"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveDraft}
                    disabled={submitting}
                    sx={{
                      ...secondaryBtnSx,
                      flex: { xs: 1, md: 'initial' },
                      display: { xs: 'flex', md: 'none' },
                    }}
                  >
                    Save Draft
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                    type="submit"
                    disabled={submitting}
                    size="large"
                    sx={{
                      ...primaryBtnSx,
                      flex: { xs: 1, md: 'initial' },
                      background: `linear-gradient(135deg, ${tokens.success.main} 0%, ${tokens.success.dark} 100%)`,
                      boxShadow: `0 6px 16px ${tokens.success.main}28`,
                      '&:hover': {
                        background: `linear-gradient(135deg, ${tokens.success.dark} 0%, #246B38 100%)`,
                      },
                    }}
                  >
                    Submit
                  </Button>
                </>
              )}
            </Box>
          )}
        </Box>
      </Box>
    </FormProvider>
  );
}
