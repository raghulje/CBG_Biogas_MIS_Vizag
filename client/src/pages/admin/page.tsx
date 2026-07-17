import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
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
  MenuItem,
  Tabs,
  Tab,
  Checkbox,
  FormControlLabel,
  Divider,
  Alert,
  CircularProgress,
  TablePagination,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Zoom,
} from '@mui/material';
import { useTheme, useMediaQuery } from '@mui/material';
import { alpha } from '@mui/material/styles';
import ErrorBoundary from '../../components/ErrorBoundary';
import { themePresets, tokens } from '../../themes';
import { PageHeader } from '../../components/ui/PageChrome';
import { AppDateField } from '../../components/ui/AppDateField';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  FileDownload as FileDownloadIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { adminService } from '../../services/adminService';
import MESSAGES from '../../utils/messages';

function formatTemplateUpdatedAt(value?: string) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface Permission {
  page: string;
  read: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
  approve?: boolean; // MIS Entry only: approve/reject submitted entries
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string | { name: string };
  permissions: Permission[];
  is_custom_perm?: boolean;
}

interface ActivityLog {
  id: number;
  user: string;
  action: string;
  entity: string;
  description: string;
  formatted_description: string;
  changes: { field: string; from: string; to: string }[];
  timestamp: string;
  original_timestamp?: string;
}

interface SessionRow {
  userId: number;
  userName: string;
  lastLogin: string;
  loginTime: string;
  logoutTime: string;
  sessionDurationMinutes: number;
  device?: string | null;
  userAgent?: string | null;
  ipAddress?: string | null;
}

interface EmailTemplate {
  id: number;
  name: string;
  type: 'entry_not_created' | 'entry_not_submitted' | 'submission_to_manager' | 'review_request';
  subject: string;
  body: string;
  placeholders: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SchedulerConfig {
  id: number;
  notificationType: 'entry_not_created' | 'entry_not_submitted' | 'submission_to_manager' | 'review_request';
  isEnabled: boolean;
  checkTime: string;
  recipientRoles: string[];
  reminderFrequency: 'once' | 'daily' | 'hourly';
  templateId: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

// MIS Entry Email recipients (submit + no-entry reminder)
function MISEntryEmailPanel({
  formConfig,
  message,
  setMessage,
  onRefresh,
}: {
  formConfig: any;
  message: { type: string; text: string } | null;
  setMessage: (m: { type: 'success' | 'error'; text: string } | null) => void;
  onRefresh?: () => void;
}) {
  const [submitNotifyEmails, setSubmitNotifyEmails] = useState<string[]>([]);
  const [entryNotCreatedEmails, setEntryNotCreatedEmails] = useState<string[]>([]);
  const [notSubmittedNotifyEmails, setNotSubmittedNotifyEmails] = useState<string[]>([]);
  const [escalationNotifyEmails, setEscalationNotifyEmails] = useState<string[]>([]);
  const [newSubmitEmail, setNewSubmitEmail] = useState('');
  const [newNoEntryEmail, setNewNoEntryEmail] = useState('');
  const [newNotSubmittedEmail, setNewNotSubmittedEmail] = useState('');
  const [newEscalationEmail, setNewEscalationEmail] = useState('');
  const [saving, setSaving] = useState(false);

  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Only initialize from props if not yet initialized
    if (!initialized && formConfig?.mis_email_config) {
      const config = formConfig.mis_email_config;
      setSubmitNotifyEmails(Array.isArray(config.submit_notify_emails) ? config.submit_notify_emails : []);
      setEntryNotCreatedEmails(Array.isArray(config.entry_not_created_emails) ? config.entry_not_created_emails : []);
      setNotSubmittedNotifyEmails(Array.isArray(config.not_submitted_notify_emails) ? config.not_submitted_notify_emails : []);
      setEscalationNotifyEmails(Array.isArray(config.escalation_notify_emails) ? config.escalation_notify_emails : []);
      setInitialized(true);
    }
  }, [formConfig?.mis_email_config, initialized]);

  // Fallback: if formConfig is not available but we need to load (e.g. direct access/refresh)
  useEffect(() => {
    if (!initialized && !formConfig) {
      adminService.getMISEmailConfig().then((data: any) => {
        if (data) {
          setSubmitNotifyEmails(Array.isArray(data.submit_notify_emails) ? data.submit_notify_emails : []);
          setEntryNotCreatedEmails(Array.isArray(data.entry_not_created_emails) ? data.entry_not_created_emails : []);
          setNotSubmittedNotifyEmails(Array.isArray(data.not_submitted_notify_emails) ? data.not_submitted_notify_emails : []);
          setEscalationNotifyEmails(Array.isArray(data.escalation_notify_emails) ? data.escalation_notify_emails : []);
          setInitialized(true);
        }
      }).catch(() => { });
    }
  }, [initialized, formConfig]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await adminService.saveMISEmailConfig({
        submit_notify_emails: submitNotifyEmails,
        entry_not_created_emails: entryNotCreatedEmails,
        not_submitted_notify_emails: notSubmittedNotifyEmails,
        escalation_notify_emails: escalationNotifyEmails,
      });
      setMessage({ type: 'success', text: 'MIS Entry email settings saved.' });
      if (onRefresh) onRefresh();
    } catch (e: any) {
      setMessage({ type: 'error', text: e?.response?.data?.message || 'Failed to save.' });
    } finally {
      setSaving(false);
    }
  };

  const addEmail = (which: 'submit' | 'noEntry' | 'notSubmitted' | 'escalation', email: string) => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    if (which === 'submit') {
      if (!submitNotifyEmails.includes(trimmed)) setSubmitNotifyEmails([...submitNotifyEmails, trimmed]);
      setNewSubmitEmail('');
    } else if (which === 'noEntry') {
      if (!entryNotCreatedEmails.includes(trimmed)) setEntryNotCreatedEmails([...entryNotCreatedEmails, trimmed]);
      setNewNoEntryEmail('');
    } else if (which === 'notSubmitted') {
      if (!notSubmittedNotifyEmails.includes(trimmed)) setNotSubmittedNotifyEmails([...notSubmittedNotifyEmails, trimmed]);
      setNewNotSubmittedEmail('');
    } else if (which === 'escalation') {
      if (!escalationNotifyEmails.includes(trimmed)) setEscalationNotifyEmails([...escalationNotifyEmails, trimmed]);
      setNewEscalationEmail('');
    }
  };

  const removeEmail = (which: 'submit' | 'noEntry' | 'notSubmitted' | 'escalation', email: string) => {
    if (which === 'submit') setSubmitNotifyEmails(submitNotifyEmails.filter(e => e !== email));
    else if (which === 'noEntry') setEntryNotCreatedEmails(entryNotCreatedEmails.filter(e => e !== email));
    else if (which === 'notSubmitted') setNotSubmittedNotifyEmails(notSubmittedNotifyEmails.filter(e => e !== email));
    else if (which === 'escalation') setEscalationNotifyEmails(escalationNotifyEmails.filter(e => e !== email));
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 600, color: tokens.text.primary, mb: 2 }}>
        MIS Entry – Email Recipients
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Configure who receives emails when an MIS entry is submitted, and who is notified when no entry is created for the day (checked at the scheduled time in Scheduler Configuration).
      </Typography>
      {message && (
        <Alert severity={message.type as any} onClose={() => setMessage(null)} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ p: 2, borderRadius: `${tokens.radius.card}px` }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1, color: tokens.primary.main }}>
              When an MIS entry is submitted – send to:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <TextField
                size="small"
                fullWidth
                placeholder="email@example.com"
                value={newSubmitEmail}
                onChange={(e) => setNewSubmitEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addEmail('submit', newSubmitEmail)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: `${tokens.radius.button}px` } }}
              />
              <Button variant="contained" onClick={() => addEmail('submit', newSubmitEmail)} sx={{ borderRadius: `${tokens.radius.button}px`, whiteSpace: 'nowrap' }}>
                Add
              </Button>
            </Box>
            <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
              {submitNotifyEmails.map((email) => (
                <li key={email} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Typography variant="body2">{email}</Typography>
                  <IconButton size="small" onClick={() => removeEmail('submit', email)} sx={{ color: tokens.danger.main, p: 0.25 }}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </li>
              ))}
              {submitNotifyEmails.length === 0 && (
                <Typography variant="body2" color="text.secondary">No emails. Add above or leave empty to use Manager/Admin users.</Typography>
              )}
            </Box>
          </Card>
        </Grid>
        {/* Mobile SMTP card removed from this panel to avoid referencing parent SMTP state.
                The SMTP settings are available in the SMTP tab (responsive there). */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ p: 2, borderRadius: `${tokens.radius.card}px` }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1, color: tokens.primary.main }}>
              If no entry created for the day (at scheduled time) – send to:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <TextField
                size="small"
                fullWidth
                placeholder="email@example.com"
                value={newNoEntryEmail}
                onChange={(e) => setNewNoEntryEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addEmail('noEntry', newNoEntryEmail)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: `${tokens.radius.button}px` } }}
              />
              <Button variant="contained" onClick={() => addEmail('noEntry', newNoEntryEmail)} sx={{ borderRadius: `${tokens.radius.button}px`, whiteSpace: 'nowrap' }}>
                Add
              </Button>
            </Box>
            <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
              {entryNotCreatedEmails.map((email) => (
                <li key={email} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Typography variant="body2">{email}</Typography>
                  <IconButton size="small" onClick={() => removeEmail('noEntry', email)} sx={{ color: tokens.danger.main, p: 0.25 }}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </li>
              ))}
              {entryNotCreatedEmails.length === 0 && (
                <Typography variant="body2" color="text.secondary">No emails. Add above or leave empty to use Operator users.</Typography>
              )}
            </Box>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ p: 2, borderRadius: `${tokens.radius.card}px` }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1, color: tokens.primary.main }}>
              Pending submission (scheduled reminders) – send to:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <TextField
                size="small"
                fullWidth
                placeholder="email@example.com"
                value={newNotSubmittedEmail}
                onChange={(e) => setNewNotSubmittedEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addEmail('notSubmitted', newNotSubmittedEmail)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: `${tokens.radius.button}px` } }}
              />
              <Button variant="contained" onClick={() => addEmail('notSubmitted', newNotSubmittedEmail)} sx={{ borderRadius: `${tokens.radius.button}px`, whiteSpace: 'nowrap' }}>
                Add
              </Button>
            </Box>
            <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
              {notSubmittedNotifyEmails.map((email) => (
                <li key={email} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Typography variant="body2">{email}</Typography>
                  <IconButton size="small" onClick={() => removeEmail('notSubmitted', email)} sx={{ color: tokens.danger.main, p: 0.25 }}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </li>
              ))}
              {notSubmittedNotifyEmails.length === 0 && (
                <Typography variant="body2" color="text.secondary">No emails. Falling back to Operator users.</Typography>
              )}
            </Box>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ p: 2, borderRadius: `${tokens.radius.card}px` }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1, color: tokens.primary.main }}>
              Escalation (entry missing at EOD) – send to:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <TextField
                size="small"
                fullWidth
                placeholder="email@example.com"
                value={newEscalationEmail}
                onChange={(e) => setNewEscalationEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addEmail('escalation', newEscalationEmail)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: `${tokens.radius.button}px` } }}
              />
              <Button variant="contained" onClick={() => addEmail('escalation', newEscalationEmail)} sx={{ borderRadius: `${tokens.radius.button}px`, whiteSpace: 'nowrap' }}>
                Add
              </Button>
            </Box>
            <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
              {escalationNotifyEmails.map((email) => (
                <li key={email} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Typography variant="body2">{email}</Typography>
                  <IconButton size="small" onClick={() => removeEmail('escalation', email)} sx={{ color: tokens.danger.main, p: 0.25 }}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </li>
              ))}
              {escalationNotifyEmails.length === 0 && (
                <Typography variant="body2" color="text.secondary">No emails. Falling back to Manager users.</Typography>
              )}
            </Box>
          </Card>
        </Grid>
      </Grid>
      <Button
        variant="contained"
        startIcon={saving ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : <SaveIcon />}
        onClick={handleSave}
        disabled={saving}
        sx={{ mt: 3, borderRadius: `${tokens.radius.button}px`, textTransform: 'none', color: '#fff' }}
      >
        Save MIS Entry Email Settings
      </Button>
    </Box>
  );
}

// Final MIS Report email: recipients, subject, body, schedule (daily/weekly/monthly/quarterly/custom + time/cron)
function FinalMISReportEmailPanel({
  message,
  setMessage,
}: {
  message: { type: string; text: string } | null;
  setMessage: (m: { type: 'success' | 'error'; text: string } | null) => void;
}) {
  const [toEmails, setToEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [subject, setSubject] = useState('Final MIS Report');
  const [body, setBody] = useState('');
  const [scheduleType, setScheduleType] = useState<string>('monthly');
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [isActive, setIsActive] = useState(true);
  const [lastSuccessfulPeriodEnd, setLastSuccessfulPeriodEnd] = useState<string | null>(null);
  const [scheduleFailurePeriodEnd, setScheduleFailurePeriodEnd] = useState<string | null>(null);
  const [scheduleFailureSummary, setScheduleFailureSummary] = useState<string | null>(null);
  const [scheduleFailureLastAttemptAt, setScheduleFailureLastAttemptAt] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [testStartDate, setTestStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [testEndDate, setTestEndDate] = useState(() => new Date().toISOString().slice(0, 10));

  const loadConfig = useCallback(async () => {
    try {
      const data: any = await adminService.getFinalMISReportConfig();
      if (data) {
        setToEmails(Array.isArray(data.to_emails) ? data.to_emails : []);
        setSubject(data.subject || 'Final MIS Report');
        setBody(data.body || '');
        setScheduleType(data.schedule_type || 'monthly');
        setScheduleTime(data.schedule_time || '09:00');
        setIsActive(data.is_active !== false);
        setLastSuccessfulPeriodEnd(data.last_successful_period_end || null);
        setScheduleFailurePeriodEnd(data.schedule_failure_period_end || null);
        setScheduleFailureSummary(data.schedule_failure_summary || null);
        setScheduleFailureLastAttemptAt(data.schedule_failure_last_attempt_at || null);
      }
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => { loadConfig(); }, [loadConfig]);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const addEmail = () => {
    const trimmed = newEmail.trim().toLowerCase();
    if (!trimmed) return;
    if (!toEmails.includes(trimmed)) setToEmails([...toEmails, trimmed]);
    setNewEmail('');
  };

  const removeEmail = (email: string) => setToEmails(toEmails.filter(e => e !== email));

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await adminService.saveFinalMISReportConfig({
        to_emails: toEmails,
        subject,
        body,
        schedule_type: scheduleType,
        schedule_time: scheduleTime,
        is_active: isActive,
      });
      setMessage({ type: 'success', text: 'Final MIS Report email settings saved.' });
      await loadConfig();
    } catch (e: any) {
      setMessage({ type: 'error', text: e?.response?.data?.message || 'Failed to save.' });
    } finally {
      setSaving(false);
    }
  };

  const handleSendTest = async () => {
    if (toEmails.length === 0) {
      setMessage({ type: 'error', text: 'Add at least one recipient before sending a test.' });
      return;
    }
    setSendingTest(true);
    setMessage(null);
    try {
      const result = await adminService.sendTestFinalMISReport(testStartDate, testEndDate);
      if (result?.queued) {
        setMessage({
          type: 'success',
          text:
            result.message ||
            `Test report queued for ${testStartDate} to ${testEndDate}. It will arrive shortly; open Email delivery logs if you need Sent/Failed details.`,
        });
      } else {
        setMessage({ type: 'success', text: `Test report sent for ${testStartDate} to ${testEndDate}.` });
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e?.response?.data?.message || 'Failed to send test.' });
    } finally {
      setSendingTest(false);
    }
    loadConfig();
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 600, color: tokens.text.primary, mb: 2 }}>
        Final MIS Report – Email &amp; Schedule
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Send the Final MIS Report (same format and colors as the report page) to business heads by email. Configure recipients, subject, optional body, and when to send (daily, weekly, monthly, quarterly, or custom cron).
      </Typography>
      {message && (
        <Alert severity={message.type as any} onClose={() => setMessage(null)} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}
      {scheduleFailurePeriodEnd && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: `${tokens.radius.card}px` }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
            Scheduled report not delivered yet
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Period end <strong>{scheduleFailurePeriodEnd}</strong>
            {scheduleFailureLastAttemptAt && (
              <> — last attempt {new Date(scheduleFailureLastAttemptAt).toLocaleString()}</>
            )}
            . The scheduler will keep retrying. Fix SMTP if needed; check <strong>Email delivery logs</strong>.
            {scheduleFailureSummary && (
              <>
                {' '}
                <Typography component="span" variant="body2" sx={{ display: 'block', mt: 1, fontFamily: 'monospace', fontSize: '0.8rem' }}>
                  {scheduleFailureSummary}
                </Typography>
              </>
            )}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            A one-time alert email may have been sent to Final MIS recipients and MIS Entry escalation addresses (if configured) when this failure was first detected.
          </Typography>
        </Alert>
      )}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ p: 2, borderRadius: `${tokens.radius.card}px` }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1, color: tokens.primary.main }}>
              Recipients (report will be sent to these emails)
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <TextField
                size="small"
                fullWidth
                placeholder="email@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addEmail())}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: `${tokens.radius.button}px` } }}
              />
              <Button variant="contained" onClick={addEmail} fullWidth={isMobile} sx={{ borderRadius: `${tokens.radius.button}px`, whiteSpace: 'nowrap' }}>
                Add
              </Button>
            </Box>
            <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
              {toEmails.map((email) => (
                <li key={email} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Typography variant="body2">{email}</Typography>
                  <IconButton size="small" onClick={() => removeEmail(email)} sx={{ color: tokens.danger.main, p: 0.25 }}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </li>
              ))}
              {toEmails.length === 0 && (
                <Typography variant="body2" color="text.secondary">No recipients. Add emails above.</Typography>
              )}
            </Box>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ p: 2, borderRadius: `${tokens.radius.card}px` }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1, color: tokens.primary.main }}>
              Email content
            </Typography>
            <TextField
              size="small"
              fullWidth
              label="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              sx={{ mb: 1.5, '& .MuiOutlinedInput-root': { borderRadius: `${tokens.radius.button}px` } }}
            />
            <TextField
              size="small"
              fullWidth
              multiline
              rows={3}
              label="Body (optional HTML intro before the report table)"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="e.g. Dear Team, Please find the consolidated report below."
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: `${tokens.radius.button}px` } }}
            />
          </Card>
        </Grid>
        <Grid item xs={12}>
          <Card variant="outlined" sx={{ p: 2, borderRadius: `${tokens.radius.card}px` }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1, color: tokens.primary.main }}>
              Schedule – when to send the report
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  size="small"
                  fullWidth
                  label="Frequency"
                  value={scheduleType}
                  onChange={(e) => setScheduleType(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: `${tokens.radius.button}px` } }}
                >
                  <MenuItem value="daily">Daily (previous day)</MenuItem>
                  <MenuItem value="weekly">Weekly (previous week, Monday run)</MenuItem>
                  <MenuItem value="monthly">Monthly (previous month, 1st run)</MenuItem>
                  <MenuItem value="quarterly">Quarterly (previous quarter)</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  size="small"
                  fullWidth
                  label="Time (24h)"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  placeholder="09:00"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: `${tokens.radius.button}px` } }}
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <FormControlLabel
                  control={<Checkbox checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />}
                  label="Active"
                />
              </Grid>
            </Grid>
            <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
              The server checks every 15 minutes. After your send time (e.g. 09:00), it retries the same report period until SMTP succeeds (including several quick retries per attempt). For daily, the report covers the previous calendar day in the server&apos;s timezone. Test emails do not update &quot;last successful period&quot; below. If scheduled delivery fails, a one-time alert email goes to Final MIS recipients plus addresses under <strong>MIS Entry Email → Escalation notify</strong> (if set).
            </Typography>
            {lastSuccessfulPeriodEnd && (
              <Typography variant="caption" display="block" sx={{ mt: 1, color: tokens.success.dark, fontWeight: 600 }}>
                Last successful scheduled report (period end date): {lastSuccessfulPeriodEnd}
              </Typography>
            )}
          </Card>
        </Grid>
        <Grid item xs={12}>
          <Card variant="outlined" sx={{ p: 2, borderRadius: `${tokens.radius.card}px` }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1, color: tokens.primary.main }}>
              Send test report now
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
              <AppDateField label="Start date" value={testStartDate} onChange={setTestStartDate} sx={{ width: 168 }} />
              <AppDateField label="End date" value={testEndDate} onChange={setTestEndDate} sx={{ width: 168 }} />
              <Button variant="outlined" onClick={handleSendTest} disabled={sendingTest || toEmails.length === 0} startIcon={sendingTest ? <CircularProgress size={18} /> : null} fullWidth={isMobile} sx={{ borderRadius: `${tokens.radius.button}px`, textTransform: 'none' }}>
                {sendingTest ? 'Sending…' : 'Send test report'}
              </Button>
            </Box>
          </Card>
        </Grid>
      </Grid>
      <Button
        variant="contained"
        startIcon={saving ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : <SaveIcon />}
        onClick={handleSave}
        disabled={saving}
        fullWidth={isMobile}
        sx={{ mt: 3, borderRadius: `${tokens.radius.button}px`, textTransform: 'none', color: '#fff' }}
      >
        Save Final MIS Report Email Settings
      </Button>
    </Box>
  );
}

function EmailDeliveryLogsPanel() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [rows, setRows] = useState<
    {
      id: number;
      recipient: string;
      subject: string;
      status: string;
      error_message: string | null;
      sent_at: string;
      entity_type: string | null;
      entity_id: string | null;
    }[]
  >([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [entityFilter, setEntityFilter] = useState<string>('');
  const [page, setPage] = useState(0);
  const rowsPerPage = 25;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.getEmailLogs({
        limit: rowsPerPage,
        offset: page * rowsPerPage,
        entity_type: entityFilter || undefined,
      });
      setRows(Array.isArray(data.logs) ? data.logs : []);
      setTotal(typeof data.total === 'number' ? data.total : 0);
    } catch {
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, entityFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const formatSource = (t: string | null) => {
    if (t === 'FinalMISReportConfig') return 'Final MIS report';
    if (t === 'FinalMISReportDeliveryAlert') return 'Final MIS failure alert';
    if (t === 'MISDailyEntry') return 'MIS entry / reminder';
    return t || '—';
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 600, color: tokens.text.primary, mb: 1 }}>
        Email delivery logs
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Each row is one SMTP attempt logged by the server (sent or failed). Final MIS scheduled sends include the report date range in the subject when available. If you see failures, open SMTP Configuration and check the server console.
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 2 }}>
        <TextField
          select
          size="small"
          label="Source"
          value={entityFilter}
          onChange={(e) => {
            setEntityFilter(e.target.value);
            setPage(0);
          }}
          sx={{ minWidth: 220, '& .MuiOutlinedInput-root': { borderRadius: `${tokens.radius.button}px` } }}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="FinalMISReportConfig">Final MIS report</MenuItem>
          <MenuItem value="FinalMISReportDeliveryAlert">Final MIS failure alert</MenuItem>
          <MenuItem value="MISDailyEntry">MIS entry / reminders</MenuItem>
        </TextField>
        <Button
          variant="outlined"
          startIcon={loading ? <CircularProgress size={18} /> : <RefreshIcon />}
          onClick={() => load()}
          disabled={loading}
          sx={{ textTransform: 'none', borderRadius: `${tokens.radius.button}px` }}
        >
          Refresh
        </Button>
      </Box>
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: `${tokens.radius.card}px`, maxWidth: '100%' }}>
        <Table size="small" sx={{ minWidth: isMobile ? 600 : undefined }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'rgba(40, 121, 182, 0.06)' }}>
              <TableCell sx={{ fontWeight: 600 }}>Time (server)</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Recipients</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Subject / period</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Source</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Error</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={6}>
                  <Typography variant="body2" color="text.secondary">
                    No log rows yet, or nothing matches this filter.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell sx={{ whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                  {r.sent_at ? new Date(r.sent_at).toLocaleString() : '—'}
                </TableCell>
                <TableCell sx={{ verticalAlign: 'top' }}>
                  <Chip
                    size="small"
                    label={r.status === 'sent' ? 'Sent' : 'Failed'}
                    sx={{
                      fontWeight: 600,
                      backgroundColor: r.status === 'sent' ? 'rgba(19, 155, 73, 0.12)' : 'rgba(238, 106, 49, 0.12)',
                      color: r.status === 'sent' ? tokens.success.dark : tokens.danger.main,
                    }}
                  />
                </TableCell>
                <TableCell sx={{ verticalAlign: 'top', maxWidth: 220, wordBreak: 'break-word' }}>{r.recipient || '—'}</TableCell>
                <TableCell sx={{ verticalAlign: 'top', maxWidth: 360, wordBreak: 'break-word' }}>{r.subject || '—'}</TableCell>
                <TableCell sx={{ verticalAlign: 'top' }}>{formatSource(r.entity_type)}</TableCell>
                <TableCell sx={{ verticalAlign: 'top', maxWidth: 280, wordBreak: 'break-word', color: 'error.main', fontSize: '0.8rem' }}>
                  {r.error_message || '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[rowsPerPage]}
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} of ${count !== -1 ? count : `more than ${to}`}`}
        />
      </TableContainer>
    </Box>
  );
}

const defaultPermissions: Permission[] = [
  { page: 'Dashboard', read: true, create: false, update: false, delete: false },
  { page: 'MIS Entry', read: true, create: true, update: true, delete: false, approve: false },
  { page: 'Consolidated MIS View', read: true, create: false, update: false, delete: false },
  { page: 'Final MIS Report', read: false, create: false, update: false, delete: false },
  { page: 'User Management', read: false, create: false, update: false, delete: false },
  // Roles & Permissions removed — system now uses user-level permissions only
  { page: 'Admin Panel', read: false, create: false, update: false, delete: false },
  { page: 'Audit Logs', read: false, create: false, update: false, delete: false },
  { page: 'Import Data', read: false, create: false, update: false, delete: false },
  { page: 'Customer', read: false, create: false, update: false, delete: false },
];

const adminPermissions: Permission[] = [
  { page: 'Dashboard', read: true, create: true, update: true, delete: true },
  { page: 'MIS Entry', read: true, create: true, update: true, delete: true, approve: true },
  { page: 'Consolidated MIS View', read: true, create: true, update: true, delete: true },
  { page: 'User Management', read: true, create: true, update: true, delete: true },
  // Roles & Permissions removed — no role-based management
  { page: 'Admin Panel', read: true, create: true, update: true, delete: true },
  { page: 'Audit Logs', read: true, create: true, update: true, delete: true },
  { page: 'Import Data', read: true, create: true, update: true, delete: true },
  { page: 'Customer', read: true, create: true, update: true, delete: true },
];

// Mock activity logs data
const mockActivityLogs: ActivityLog[] = [
  {
    id: 1,
    user: 'John Doe',
    action: 'Updated MIS Entry #1234',
    entity: 'MIS Entry',
    description: 'Updated total slurry feed from 150 to 155',
    formatted_description: 'Updated total slurry feed from 150 to 155',
    changes: [
      { field: 'Total Slurry Feed', from: '150 m³', to: '155 m³' }
    ],
    timestamp: '2024-01-15 10:45:00',
  },
  {
    id: 2,
    user: 'Jane Smith',
    action: 'Created MIS Entry #1235',
    entity: 'MIS Entry',
    description: 'Created new entry for 2024-01-15',
    formatted_description: 'Created new entry for 2024-01-15',
    changes: [],
    timestamp: '2024-01-15 08:15:00',
  },
  {
    id: 3,
    user: 'Mike Johnson',
    action: 'Viewed Dashboard',
    entity: 'Dashboard',
    description: 'Viewed main dashboard',
    formatted_description: 'Viewed main dashboard',
    changes: [],
    timestamp: '2024-01-15 07:45:00',
  },
  {
    id: 4,
    user: 'John Doe',
    action: 'Updated Digester D-01 Temperature',
    entity: 'Digester',
    description: 'Updated temperature from 35°C to 37°C',
    formatted_description: 'Updated temperature from 35°C to 37°C',
    changes: [
      { field: 'Temperature', from: '35°C', to: '37°C' }
    ],
    timestamp: '2024-01-15 11:20:00',
  },
];

const mockEmailTemplates: EmailTemplate[] = [
  {
    id: 1,
    name: 'Entry Not Created Notification',
    type: 'entry_not_created',
    subject: 'Reminder: MIS Entry Not Created for {{date}}',
    body: 'Dear {{user_name}},\n\nThis is a reminder that no MIS entry has been created for {{date}}.\n\nPlease create and submit your MIS entry as soon as possible.\n\nThank you,\nBiogas MIS System',
    placeholders: ['{{user_name}}', '{{date}}'],
    isActive: true,
    createdAt: '2024-01-10 10:00:00',
    updatedAt: '2024-01-10 10:00:00',
  },
  {
    id: 2,
    name: 'Entry Not Submitted Notification',
    type: 'entry_not_submitted',
    subject: 'Reminder: MIS Entry #{{entry_id}} Not Submitted',
    body: 'Dear {{user_name}},\n\nYour MIS entry #{{entry_id}} for {{date}} has been created but not submitted yet.\n\nPlease review and submit your entry before the deadline.\n\nThank you,\nBiogas MIS System',
    placeholders: ['{{user_name}}', '{{date}}', '{{entry_id}}'],
    isActive: true,
    createdAt: '2024-01-10 10:00:00',
    updatedAt: '2024-01-10 10:00:00',
  },
  {
    id: 3,
    name: 'Submission to Manager',
    type: 'submission_to_manager',
    subject: 'New MIS Entry Submitted for Review - #{{entry_id}}',
    body: 'Dear Manager,\n\nA new MIS entry has been submitted for your review:\n\nEntry ID: {{entry_id}}\nDate: {{date}}\nSubmitted by: {{user_name}}\nSubmitted at: {{timestamp}}\n\nPlease review and approve or send back for corrections.\n\nThank you,\nBiogas MIS System',
    placeholders: ['{{user_name}}', '{{date}}', '{{entry_id}}', '{{timestamp}}'],
    isActive: true,
    createdAt: '2024-01-10 10:00:00',
    updatedAt: '2024-01-10 10:00:00',
  },
  {
    id: 4,
    name: 'Review Request to Entry Person',
    type: 'review_request',
    subject: 'MIS Entry #{{entry_id}} Requires Corrections',
    body: 'Dear {{user_name}},\n\nYour MIS entry #{{entry_id}} for {{date}} has been reviewed and requires corrections.\n\nReview Comment:\n{{review_comment}}\n\nPlease update the entry and resubmit.\n\nThank you,\nBiogas MIS System',
    placeholders: ['{{user_name}}', '{{date}}', '{{entry_id}}', '{{review_comment}}'],
    isActive: true,
    createdAt: '2024-01-10 10:00:00',
    updatedAt: '2024-01-10 10:00:00',
  },
];

const mockSchedulerConfigs: SchedulerConfig[] = [
  {
    id: 1,
    notificationType: 'entry_not_created',
    isEnabled: true,
    checkTime: '09:00',
    recipientRoles: ['Operator'],
    reminderFrequency: 'once',
    templateId: 1,
  },
  {
    id: 2,
    notificationType: 'entry_not_submitted',
    isEnabled: true,
    checkTime: '17:00',
    recipientRoles: ['Operator'],
    reminderFrequency: 'daily',
    templateId: 2,
  },
  {
    id: 3,
    notificationType: 'submission_to_manager',
    isEnabled: true,
    checkTime: '00:00',
    recipientRoles: ['Admin', 'Manager'],
    reminderFrequency: 'once',
    templateId: 3,
  },
  {
    id: 4,
    notificationType: 'review_request',
    isEnabled: true,
    checkTime: '00:00',
    recipientRoles: ['Operator'],
    reminderFrequency: 'once',
    templateId: 4,
  },
];

import Slide from '@mui/material/Slide';
import { TransitionProps } from '@mui/material/transitions';
import React from 'react';
import { useSnackbar } from 'notistack';

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>,
) {
  return <Zoom ref={ref} {...props} />;
});



export default function AdminPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  // Explicit mobile breakpoint required by project (<=768px)
  const isPhone = useMediaQuery('(max-width:768px)');
  const [tabValue, setTabValue] = useState(0);
  const [openUserDialog, setOpenUserDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userPermissions, setUserPermissions] = useState<Permission[]>(defaultPermissions);
  const [selectedRole, setSelectedRole] = useState('Operator');
  const [saving, setSaving] = useState(false);
  const [selectedThemeKey, setSelectedThemeKey] = useState<string>(() => localStorage.getItem('appTheme') || 'classic');
  const { enqueueSnackbar } = useSnackbar();

  const handleSaveTheme = async () => {
    try {
      setSaving(true);
      await adminService.saveAppTheme(selectedThemeKey);
      localStorage.setItem('appTheme', selectedThemeKey);
      // reload so theme applies globally
      window.location.reload();
    } catch (e: any) {
      setMessage({ type: 'error', text: e?.response?.data?.message || 'Failed to save theme' });
    } finally {
      setSaving(false);
    }
  };
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');

  // Auto-clear toast message; cleans up on unmount / message change
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 3000);
    return () => clearTimeout(t);
  }, [message]);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterUser, setFilterUser] = useState('');
  const [filterActionType, setFilterActionType] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [loading, setLoading] = useState(false);

  const [openTemplateDialog, setOpenTemplateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [templateType, setTemplateType] = useState<EmailTemplate['type']>('entry_not_created');
  const [templateSubject, setTemplateSubject] = useState('');
  const [templateBody, setTemplateBody] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const [users, setUsers] = useState<User[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [lastLoginsByUser, setLastLoginsByUser] = useState<Record<number, string>>({});
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [schedulerConfigs, setSchedulerConfigs] = useState<SchedulerConfig[]>([]);

  // Role Permissions tab: which role is being edited and the permission matrix
  const [selectedRoleIdForPerms, setSelectedRoleIdForPerms] = useState<number | null>(null);
  const [rolePermissionsEdit, setRolePermissionsEdit] = useState<Permission[]>(defaultPermissions);

  // Single form-config (roles, permissions, smtp_config, scheduler_config) - loaded once
  const [formConfig, setFormConfig] = useState<{
    roles: { id: number; name: string; permissions?: any[] }[];
    permissions: { id: number; name: string; resource: string; action: string }[];
    smtp_config: any;
    scheduler_config: any[];
    mis_email_config?: { submit_notify_emails: string[]; entry_not_created_emails: string[] };
  } | null>(null);

  // SMTP Configuration form state (primary source; synced from formConfig when tab or config loads)
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpSecure, setSmtpSecure] = useState(false);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [smtpFromEmail, setSmtpFromEmail] = useState('');
  const [smtpFromName, setSmtpFromName] = useState('');
  const [smtpId, setSmtpId] = useState<number | null>(null);
  const [smtpTestTo, setSmtpTestTo] = useState('');
  const [smtpTesting, setSmtpTesting] = useState(false);

  // EACH PAGE HAS A UNIQUE RESOURCE — prevents cross-page permission bleed
  const pageToResource: Record<string, string> = {
    'Dashboard': 'dashboard',
    'MIS Entry': 'mis_entry',
    'Consolidated MIS View': 'consolidated_mis',
    'User Management': 'user',
    'Admin Panel': 'config',
    'Final MIS Report': 'config',
    'Audit Logs': 'audit',
    'Import Data': 'import_data',
    'Customer': 'customer'
  };

  const mapBackendPermissionsToUI = (backendPerms: any[]): Permission[] => {
    // Start with a clean slate based on defaultPermissions structure (all false)
    const uiPerms = defaultPermissions.map(p => ({
      ...p,
      read: false,
      create: false,
      update: false,
      delete: false,
      approve: false
    }));

    if (!backendPerms || !Array.isArray(backendPerms)) return uiPerms;

    // Build a reverse map: resource -> page name (1:1, no collisions)
    const resourceToPage: Record<string, string> = {};
    for (const [page, res] of Object.entries(pageToResource)) {
      resourceToPage[res] = page;
    }

    backendPerms.forEach(bp => {
      const { resource, action } = bp;
      // Find the EXACT page that owns this resource (1:1 mapping)
      const targetPage = resourceToPage[resource];
      if (!targetPage) return; // skip legacy/derived permissions like mis_entry:submit

      const uiPerm = uiPerms.find(up => up.page === targetPage);
      if (!uiPerm) return;

      if (action === 'read' || action === '*') (uiPerm as any).read = true;
      if (action === 'create' || action === '*') (uiPerm as any).create = true;
      if (action === 'update' || action === '*') (uiPerm as any).update = true;
      if (action === 'delete' || action === '*') (uiPerm as any).delete = true;
      if (action === 'approve' || action === '*') (uiPerm as any).approve = true;
    });

    return uiPerms;
  };


  // Load form-config once (roles, permissions, smtp_config, scheduler_config) - single API
  const loadFormConfig = useCallback(async () => {
    try {
      const data = await adminService.getFormConfig();
      setFormConfig(data);
      if (tabValue === 3) {
        setSchedulerConfigs(Array.isArray(data?.scheduler_config) ? data.scheduler_config : []);
      }
      if (data?.roles?.length && selectedRoleIdForPerms == null) {
        setSelectedRoleIdForPerms(data.roles[0].id);
      }
    } catch (e) {
      console.error('Failed to load form config', e);
      setFormConfig(null);
    }
  }, []); // intentionally stable — tab/role updates applied from returned data only when needed

  useEffect(() => {
    loadFormConfig();
  }, [loadFormConfig]);

  // Apply scheduler configs from formConfig when switching to that tab (no refetch)
  useEffect(() => {
    if (tabValue === 3 && formConfig) {
      setSchedulerConfigs(Array.isArray(formConfig?.scheduler_config) ? formConfig.scheduler_config : []);
    }
  }, [tabValue, formConfig]);

  // When selected role for permissions changes, load that role's permissions from formConfig
  useEffect(() => {
    if (!formConfig?.roles || selectedRoleIdForPerms == null) return;
    const role = formConfig.roles.find((r: any) => Number(r.id) === Number(selectedRoleIdForPerms));
    if (role) {
      setRolePermissionsEdit(
        (role.permissions && Array.isArray(role.permissions))
          ? mapBackendPermissionsToUI(role.permissions)
          : defaultPermissions
      );
    }
  }, [selectedRoleIdForPerms, formConfig]);

  // Helper: apply saved SMTP config into form state (backend uses snake_case: auth_user, from_email)
  const applySmtpConfigToForm = (c: any) => {
    if (!c) {
      setSmtpId(null);
      setSmtpHost('');
      setSmtpPort('587');
      setSmtpSecure(false);
      setSmtpUser('');
      setSmtpPass('');
      setSmtpFromEmail('');
      setSmtpFromName('');
      return;
    }
    setSmtpId(c.id ?? null);
    setSmtpHost(c.host ?? '');
    setSmtpPort(c.port != null ? String(c.port) : '587');
    setSmtpSecure(Boolean(c.secure));
    setSmtpUser((c.auth_user ?? c.authUser) ?? '');
    setSmtpPass(''); // Never prefill password
    setSmtpFromEmail((c.from_email ?? c.fromEmail) ?? '');
    setSmtpFromName((c.from_name ?? c.fromName) ?? '');
  };

  // When user opens SMTP tab: sync form from formConfig, or refetch SMTP config so values show from DB
  useEffect(() => {
    if (tabValue !== 3) return;
    const c = formConfig?.smtp_config;
    if (c && (c.id || c.host || c.auth_user || c.from_email)) {
      applySmtpConfigToForm(c);
      return;
    }
    // No smtp_config in formConfig: refetch SMTP directly so we show saved values (e.g. after is_active fix)
    let cancelled = false;
    adminService.getSMTPConfig().then((data: any) => {
      if (cancelled || !data) return;
      applySmtpConfigToForm(data);
      setFormConfig((prev: any) => (prev ? { ...prev, smtp_config: data } : prev));
    }).catch(() => { });
    return () => { cancelled = true; };
  }, [tabValue, formConfig?.smtp_config]);

  useEffect(() => {
    loadData();
  }, [tabValue, formConfig]);

  const handleSaveSMTP = async () => {
    const host = smtpHost?.trim();
    const port = Number(smtpPort);
    const user = smtpUser?.trim();
    const fromEmail = smtpFromEmail?.trim();
    if (!host || !user || !fromEmail) {
      setMessage({ type: 'error', text: 'Host, Username, and From Email are required.' });
      return;
    }
    if (isNaN(port) || port < 1 || port > 65535) {
      setMessage({ type: 'error', text: 'Port must be between 1 and 65535.' });
      return;
    }
    if (!smtpId && !smtpPass?.trim()) {
      setMessage({ type: 'error', text: 'Password is required when creating a new SMTP config.' });
      return;
    }
    try {
      setSaving(true);
      setMessage(null);
      const payload: any = {
        host,
        port,
        secure: smtpSecure,
        auth_user: user,
        from_email: fromEmail,
        from_name: smtpFromName?.trim() || undefined,
      };
      if (smtpPass?.trim()) payload.auth_pass = smtpPass.trim();
      if (smtpId) {
        await adminService.updateSMTPConfig(smtpId, payload);
        setMessage({ type: 'success', text: 'SMTP settings updated successfully.' });
      } else {
        await adminService.createSMTPConfig(payload);
        setMessage({ type: 'success', text: 'SMTP settings saved successfully.' });
      }
      const fresh = await adminService.getFormConfig();
      setFormConfig(fresh);
      if (fresh?.smtp_config) {
        applySmtpConfigToForm(fresh.smtp_config);
      }
      setSmtpPass(''); // Clear password after save
    } catch (e: any) {
      setMessage({ type: 'error', text: e.response?.data?.message || 'Failed to save SMTP settings.' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestSMTP = async () => {
    const to = smtpTestTo?.trim();
    if (!to) {
      setMessage({ type: 'error', text: 'Enter a test recipient email address.' });
      return;
    }
    const host = smtpHost?.trim();
    const user = smtpUser?.trim();
    const fromEmail = smtpFromEmail?.trim();
    const hasFormConfig = host && user && fromEmail;
    if (!hasFormConfig && !smtpId) {
      setMessage({ type: 'error', text: 'Save SMTP config first, or fill in Host, Username, and From Email to test.' });
      return;
    }
    if (hasFormConfig && !smtpPass?.trim() && !smtpId) {
      setMessage({ type: 'error', text: 'Password is required to test new config (or save first then test with saved config).' });
      return;
    }
    try {
      setSmtpTesting(true);
      setMessage(null);
      let payload: any = { to };
      // Use saved config (send only to) when we have saved config and no password in form
      if (smtpId && !smtpPass?.trim()) {
        payload = { to };
      } else if (hasFormConfig && (smtpPass?.trim() || smtpId)) {
        payload = {
          to,
          host,
          port: Number(smtpPort) || 587,
          secure: smtpSecure,
          auth_user: user,
          from_email: fromEmail,
          from_name: smtpFromName?.trim() || undefined,
        };
        if (smtpPass?.trim()) payload.auth_pass = smtpPass.trim();
      }
      await adminService.testSMTPConfig(payload);
      setMessage({ type: 'success', text: 'Test email sent successfully. Check the recipient inbox.' });
    } catch (e: any) {
      setMessage({ type: 'error', text: e.response?.data?.message || 'Failed to send test email.' });
    } finally {
      setSmtpTesting(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      if (tabValue === 0) {
        const data = await adminService.getUsers();
        setUsers((data || [])
          .filter((u: any) => u.is_active !== false)
          .map((u: any) => {
            const roleName = u.role?.name || u.role || 'Operator';
            const hasCustom = u.is_custom_perm || (u.permissions && Array.isArray(u.permissions) && u.permissions.length > 0);
            const perms = hasCustom
              ? mapBackendPermissionsToUI(u.permissions)
              : (roleName === 'Admin' || roleName === 'SuperAdmin')
                ? adminPermissions // Give Admins the full admin matrix in UI
                : defaultPermissions; // Everyone else starts empty if no custom perms

            return {
              ...u,
              role: roleName,
              permissions: perms,
              is_custom_perm: hasCustom
            };
          }));
      } else if (tabValue === 1) {
        const [auditData, sessionsData] = await Promise.all([
          adminService.getAuditLogs(),
          adminService.getSessions({ limit: 100 }).catch(() => ({ sessions: [], lastLogins: {} }))
        ]);
        setActivityLogs((Array.isArray(auditData) ? auditData : []).map((log: any) => ({
          id: log.id,
          user: log.user || log.actor?.name || 'System',
          entity: log.entity || 'System',
          timestamp: log.timestamp || log.createdAt || log.created_at || '',
          action: log.action || '',
          changes: Array.isArray(log.changes) ? log.changes : [],
          formatted_description: log.formatted_description || log.description || '',
          description: log.description || log.formatted_description || '',
        })));
        setSessions(Array.isArray(sessionsData?.sessions) ? sessionsData.sessions : []);
        const lastLogins: Record<number, string> = {};
        if (sessionsData?.lastLogins && typeof sessionsData.lastLogins === 'object') {
          for (const [uid, iso] of Object.entries(sessionsData.lastLogins)) {
            if (iso) lastLogins[Number(uid)] = String(iso);
          }
        }
        setLastLoginsByUser(lastLogins);
      } else if (tabValue === 2) {
        const data = await adminService.getTemplates();
        setEmailTemplates(Array.isArray(data) ? data : []);
      } else if (tabValue === 3) {
        // Use form-config (single API) instead of getSchedulers()
        setSchedulerConfigs(Array.isArray(formConfig?.scheduler_config) ? formConfig.scheduler_config : []);
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Failed to load data' });
      if (tabValue === 0) setUsers([]);
      if (tabValue === 1) {
        setActivityLogs([]);
        setSessions([]);
        setLastLoginsByUser({});
      }
      if (tabValue === 2) setEmailTemplates([]);
      if (tabValue === 3) setSchedulerConfigs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (role: string) => {
    setSelectedRole(role);
    if (role === 'Admin') {
      setUserPermissions(adminPermissions);
    } else if (role === 'Manager') {
      setUserPermissions(adminPermissions.map(p => ({ ...p, delete: false }))); // Manager can see everything but delete less
    } else {
      setUserPermissions(defaultPermissions);
    }
  };

  const handlePermissionChange = (pageIndex: number, permissionType: keyof Permission) => {
    if (permissionType === 'page') return;
    if (permissionType === 'approve' && userPermissions[pageIndex]?.page !== 'MIS Entry') return;
    const pageName = userPermissions[pageIndex].page;

    const newValue = !userPermissions[pageIndex][permissionType];
    setUserPermissions(prev =>
      prev.map((perm, idx) =>
        idx === pageIndex ? { ...perm, [permissionType]: newValue } : perm
      )
    );
  };


  const handleOpenCreateUser = () => {
    setMessage(null);
    setEditingUser(null);
    setUserName('');
    setUserEmail('');
    setUserPassword('');
    setSelectedRole('Operator');
    setUserPermissions(defaultPermissions);
    setOpenUserDialog(true);
  };

  const handleOpenEditUser = (user: any) => {
    setMessage(null);
    setEditingUser(user);
    setUserName(user.name);
    setUserEmail(user.email);
    setUserPassword('');
    const roleName = typeof user.role === 'string' ? user.role : (user.role?.name || 'Operator');
    setSelectedRole(roleName);

    // Use the permissions already mapped in loadData (which are now Permission[] structure)
    setUserPermissions(user.permissions || defaultPermissions);
    setOpenUserDialog(true);
  };

  const handleSaveUser = async () => {
    console.log('handleSaveUser called', { userName, userEmail, selectedRole, editingUser });
    if (!userName || !userEmail || (!editingUser && !userPassword)) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }

    try {
      setSaving(true);
      // Find actual role ID from formConfig to avoid hardcoding
      const roleObj = formConfig?.roles?.find((r: any) => r.name === selectedRole);
      const role_id = roleObj ? roleObj.id : (selectedRole === 'Admin' ? 1 : (selectedRole === 'Manager' ? 2 : 3));

      const userData = {
        name: userName,
        email: userEmail,
        password: userPassword || undefined,
        role: selectedRole,
        role_id,
        permissions: userPermissions
      };

      if (editingUser) {
        await adminService.updateUser(editingUser.id, userData);
        setMessage({ type: 'success', text: 'User updated successfully' });
        enqueueSnackbar(MESSAGES.USER_UPDATED, { variant: 'success' });
      } else {
        await adminService.createUser(userData);
        setMessage({ type: 'success', text: 'User created successfully' });
        enqueueSnackbar(MESSAGES.USER_CREATED, { variant: 'success' });
      }
      setOpenUserDialog(false);
      loadData();
    } catch (e: any) {
      console.error('Save user error:', e);
      const msg = e.response?.data?.message || 'Failed to save user';
      setMessage({ type: 'error', text: msg });
      enqueueSnackbar(msg, { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm('Deactivate this user? They will no longer be able to log in.')) return;
    try {
      await adminService.deleteUser(userId);
      setMessage({ type: 'success', text: 'User deactivated' });
      enqueueSnackbar(MESSAGES.USER_DEACTIVATED, { variant: 'success' });
      loadData();
    } catch (e: any) {
      setMessage({ type: 'error', text: e.response?.data?.message || 'Failed to deactivate user' });
      enqueueSnackbar(e.response?.data?.message || MESSAGES.USER_DEACTIVATE_FAILED, { variant: 'error' });
    }
  };


  const handleSavePermissions = async () => {
    if (selectedRoleIdForPerms == null || !formConfig?.permissions) {
      setMessage({ type: 'error', text: 'Select a role and ensure config is loaded.' });
      return;
    }
    try {
      setSaving(true);
      const permissionIds: number[] = [];
      for (const perm of rolePermissionsEdit) {
        const resource = pageToResource[perm.page];
        if (!resource) continue;
        for (const action of ['read', 'create', 'update', 'delete'] as const) {
          if (perm[action]) {
            const p = formConfig.permissions.find(
              (x: any) => x.resource === resource && x.action === action
            );
            if (p?.id) permissionIds.push(Number(p.id));
          }
        }
      }
      const role = formConfig.roles?.find((r: any) => Number(r.id) === Number(selectedRoleIdForPerms));
      // Destructive overwrite: do NOT preserve any existing non-checkbox permissions.
      // permissionIds is built exclusively from the UI checkboxes above so saving will
      // replace role permissions with exactly what was selected in the UI.
      await adminService.assignPermissions({
        roleId: selectedRoleIdForPerms,
        permissionIds,
      });
      setMessage({ type: 'success', text: 'Permissions saved successfully!' });
      enqueueSnackbar(MESSAGES.PERMISSIONS_SAVED, { variant: 'success' });
      // Refetch form config so role permissions persist when revisiting or refreshing
      const fresh = await adminService.getFormConfig();
      setFormConfig(fresh);
    } catch (error: any) {
      console.error('Failed to save permissions', error);
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to save permissions.' });
    } finally {
      setSaving(false);
    }
  };

  const handleRolePermissionsTabRoleChange = (roleId: number) => {
    setSelectedRoleIdForPerms(roleId);
  };

  const handleRolePermissionCheckboxChange = (pageIndex: number, action: keyof Permission) => {
    if (action === 'page') return;
    setRolePermissionsEdit(prev =>
      prev.map((p, i) =>
        i === pageIndex ? { ...p, [action]: !p[action] } : p
      )
    );
  };

  // Activity Logs functions
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRefreshLogs = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
    setMessage({ type: 'success', text: 'Activity logs refreshed!' });
  };

  const handleExportLogs = () => {
    if (filteredLogs.length === 0) {
      setMessage({ type: 'error', text: 'No logs to export.' });
      return;
    }

    const headers = ['User', 'Action', 'Entity', 'Description', 'Timestamp'];
    const csvContent = [
      headers.join(','),
      ...filteredLogs.map(log => {
        const row = [
          `"${log.user}"`,
          `"${log.action}"`,
          `"${log.entity}"`,
          `"${log.formatted_description.replace(/"/g, '""')}"`, // Escape quotes
          `"${log.timestamp}"`
        ];
        return row.join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setMessage({ type: 'success', text: 'Activity logs exported successfully!' });
  };

  const handleApplyFilters = () => {
    // Filter logic would be implemented here
    setPage(0);
    setMessage({ type: 'success', text: 'Filters applied!' });
  };

  const handleResetFilters = () => {
    setFilterUser('');
    setFilterActionType('all');
    setFilterDateFrom('');
    setFilterDateTo('');
    setPage(0);
  };

  const getActionTypeColor = (actionType: string) => {
    switch (actionType) {
      case 'create':
        return tokens.success.main;
      case 'update':
        return tokens.primary.main;
      case 'delete':
        return tokens.danger.main;
      case 'login':
        return tokens.warning.main;
      case 'view':
        return tokens.text.secondary;
      default:
        return tokens.text.primary;
    }
  };

  const getActionTypeLabel = (actionType: string) => {
    return actionType.charAt(0).toUpperCase() + actionType.slice(1);
  };

  const formatDateTime = (iso: string | undefined) => {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
      return iso;
    }
  };

  // Filter logs based on current filters
  const filteredLogs = useMemo(() => {
    const userQ = filterUser.toLowerCase();
    return activityLogs.filter(log => {
      if (filterUser && !log.user.toLowerCase().includes(userQ)) return false;
      if (filterActionType !== 'all') {
        const action = log.action.toLowerCase();
        if (filterActionType === 'create' && !action.includes('creat')) return false;
        if (filterActionType === 'update' && !action.includes('updat')) return false;
        if (filterActionType === 'delete' && !action.includes('delet')) return false;
        if (filterActionType === 'login' && !action.includes('log')) return false;
        if (filterActionType === 'view' && !action.includes('view')) return false;
      }
      if (filterDateFrom && new Date(log.timestamp) < new Date(filterDateFrom)) return false;
      if (filterDateTo && new Date(log.timestamp) > new Date(filterDateTo)) return false;
      return true;
    });
  }, [activityLogs, filterUser, filterActionType, filterDateFrom, filterDateTo]);

  const paginatedLogs = useMemo(
    () => filteredLogs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredLogs, page, rowsPerPage]
  );

  // Email Templates functions
  const getTemplateTypeLabel = (type: EmailTemplate['type']) => {
    switch (type) {
      case 'entry_not_created':
        return 'Entry Not Created';
      case 'entry_not_submitted':
        return 'Entry Not Submitted';
      case 'submission_to_manager':
        return 'Submission to Manager';
      case 'review_request':
        return 'Review Request';
      default:
        return type;
    }
  };

  const getTemplateTypeColor = (type: EmailTemplate['type']) => {
    switch (type) {
      case 'entry_not_created':
        return tokens.danger.main;
      case 'entry_not_submitted':
        return tokens.warning.main;
      case 'submission_to_manager':
        return tokens.primary.main;
      case 'review_request':
        return tokens.success.main;
      default:
        return tokens.text.primary;
    }
  };

  const getPlaceholdersForType = (type: EmailTemplate['type']): string[] => {
    const common = ['{{user_name}}', '{{date}}'];
    switch (type) {
      case 'entry_not_created':
        return common;
      case 'entry_not_submitted':
        return [...common, '{{entry_id}}'];
      case 'submission_to_manager':
        return [...common, '{{entry_id}}', '{{timestamp}}'];
      case 'review_request':
        return [...common, '{{entry_id}}', '{{review_comment}}'];
      default:
        return common;
    }
  };

  const handleOpenCreateTemplate = () => {
    setEditingTemplate(null);
    setTemplateName('');
    setTemplateType('entry_not_created');
    setTemplateSubject('');
    setTemplateBody('');
    setShowPreview(false);
    setOpenTemplateDialog(true);
  };

  const handleOpenEditTemplate = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setTemplateName(template.name);
    setTemplateType(template.type);
    setTemplateSubject(template.subject);
    setTemplateBody(template.body);
    setShowPreview(false);
    setOpenTemplateDialog(true);
  };

  const handleSaveTemplate = async () => {
    try {
      setSaving(true);
      const placeholders = getPlaceholdersForType(templateType);

      const templateData = {
        name: templateName,
        type: templateType,
        subject: templateSubject,
        body: templateBody,
        placeholders,
        isActive: true
      };

      if (editingTemplate) {
        await adminService.updateTemplate(editingTemplate.id, templateData);
        setMessage({ type: 'success', text: 'Template updated successfully!' });
      } else {
        await adminService.createTemplate(templateData);
        setMessage({ type: 'success', text: 'Template created successfully!' });
      }
      setOpenTemplateDialog(false);
      loadData();
    } catch (error) {
      console.error('Failed to save template', error);
      setMessage({ type: 'error', text: 'Failed to save template.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTemplate = async (templateId: number) => {
    try {
      setSaving(true);
      await adminService.deleteTemplate(templateId);
      setMessage({ type: 'success', text: 'Template deleted successfully!' });
      loadData();
    } catch (error) {
      console.error('Failed to delete template', error);
      setMessage({ type: 'error', text: 'Failed to delete template.' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleTemplateStatus = async (templateId: number) => {
    try {
      setSaving(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setEmailTemplates(
        emailTemplates.map(t =>
          t.id === templateId ? { ...t, isActive: !t.isActive } : t
        )
      );
      setMessage({ type: 'success', text: 'Template status updated!' });
    } catch (error) {
      console.error('Failed to update template status', error);
      setMessage({ type: 'error', text: 'Failed to update template status.' });
    } finally {
      setSaving(false);
    }
  };

  const insertPlaceholder = (placeholder: string) => {
    setTemplateBody(prev => prev + ' ' + placeholder);
  };

  const renderPreview = () => {
    let previewSubject = templateSubject;
    let previewBody = templateBody;

    // Replace placeholders with sample data
    const sampleData: Record<string, string> = {
      '{{user_name}}': 'John Doe',
      '{{date}}': '2024-01-15',
      '{{entry_id}}': '1234',
      '{{timestamp}}': '2024-01-15 14:30:00',
      '{{review_comment}}': 'Please update the biogas production values for Digester D-02.',
    };

    Object.entries(sampleData).forEach(([placeholder, value]) => {
      previewSubject = previewSubject.replace(new RegExp(placeholder, 'g'), value);
      previewBody = previewBody.replace(new RegExp(placeholder, 'g'), value);
    });

    return (
      <Box sx={{ mt: 2, p: 2, backgroundColor: 'rgba(40, 121, 182, 0.05)', borderRadius: `${tokens.radius.card}px` }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: tokens.primary.main, mb: 1 }}>
          Preview
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
          Subject: {previewSubject}
        </Typography>
        <Divider sx={{ my: 1 }} />
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
          {previewBody}
        </Typography>
      </Box>
    );
  };

  // Scheduler state
  const [schedulerActive, setSchedulerActive] = useState(true);
  const [testingNotification, setTestingNotification] = useState(false);
  const [openSchedulerDialog, setOpenSchedulerDialog] = useState(false);
  const [editingScheduler, setEditingScheduler] = useState<SchedulerConfig | null>(null);
  const [schedulerNotificationType, setSchedulerNotificationType] = useState<SchedulerConfig['notificationType']>('entry_not_created');
  const [schedulerCheckTime, setSchedulerCheckTime] = useState('09:00');
  const [schedulerRecipientRoles, setSchedulerRecipientRoles] = useState<string[]>(['Operator']);
  const [schedulerReminderFrequency, setSchedulerReminderFrequency] = useState<'once' | 'daily' | 'hourly'>('once');
  const [schedulerTemplateId, setSchedulerTemplateId] = useState(1);

  // Scheduler functions
  const getNotificationTypeLabel = (type: SchedulerConfig['notificationType']) => {
    switch (type) {
      case 'entry_not_created':
        return 'Entry Not Created';
      case 'entry_not_submitted':
        return 'Entry Not Submitted';
      case 'submission_to_manager':
        return 'Submission to Manager';
      case 'review_request':
        return 'Review Request';
      default:
        return type;
    }
  };

  const getNotificationTypeColor = (type: SchedulerConfig['notificationType']) => {
    switch (type) {
      case 'entry_not_created':
        return tokens.danger.main;
      case 'entry_not_submitted':
        return tokens.warning.main;
      case 'submission_to_manager':
        return tokens.primary.main;
      case 'review_request':
        return tokens.success.main;
      default:
        return tokens.text.primary;
    }
  };

  const handleToggleScheduler = async () => {
    try {
      setSaving(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setSchedulerActive(!schedulerActive);
      setMessage({
        type: 'success',
        text: schedulerActive ? 'Scheduler deactivated!' : 'Scheduler activated!'
      });
    } catch (error) {
      console.error('Failed to toggle scheduler', error);
      setMessage({ type: 'error', text: 'Failed to toggle scheduler.' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestNotification = async (config: SchedulerConfig) => {
    try {
      setTestingNotification(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setMessage({
        type: 'success',
        text: `Test notification sent for ${getNotificationTypeLabel(config.notificationType)}!`
      });
    } catch (error) {
      console.error('Failed to send test notification', error);
      setMessage({ type: 'error', text: 'Failed to send test notification.' });
    } finally {
      setTestingNotification(false);
    }
  };

  const handleToggleSchedulerConfig = async (configId: number) => {
    try {
      setSaving(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setSchedulerConfigs(
        (schedulerConfigs || []).map(config =>
          config.id === configId ? { ...config, isEnabled: !config.isEnabled } : config
        )
      );
      setMessage({ type: 'success', text: 'Notification status updated!' });
    } catch (error) {
      console.error('Failed to update notification status', error);
      setMessage({ type: 'error', text: 'Failed to update notification status.' });
    } finally {
      setSaving(false);
    }
  };

  const handleOpenEditScheduler = (config: SchedulerConfig) => {
    setEditingScheduler(config);
    setSchedulerNotificationType(config.notificationType);
    setSchedulerCheckTime(config.checkTime);
    setSchedulerRecipientRoles(Array.isArray(config.recipientRoles) ? config.recipientRoles : []);
    setSchedulerReminderFrequency(config.reminderFrequency);
    setSchedulerTemplateId(config.templateId);
    setOpenSchedulerDialog(true);
  };

  const handleSaveSchedulerConfig = async () => {
    try {
      setSaving(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (editingScheduler) {
        setSchedulerConfigs(
          (schedulerConfigs || []).map(config =>
            config.id === editingScheduler.id
              ? {
                ...config,
                checkTime: schedulerCheckTime,
                recipientRoles: schedulerRecipientRoles,
                reminderFrequency: schedulerReminderFrequency,
                templateId: schedulerTemplateId,
              }
              : config
          )
        );
        setMessage({ type: 'success', text: 'Scheduler configuration updated!' });
      }
      setOpenSchedulerDialog(false);
    } catch (error) {
      console.error('Failed to save scheduler config', error);
      setMessage({ type: 'error', text: 'Failed to save scheduler configuration.' });
    } finally {
      setSaving(false);
    }
  };

  const handleRoleToggle = (role: string) => {
    setSchedulerRecipientRoles(prev => {
      const cur = Array.isArray(prev) ? prev : [];
      return cur.includes(role) ? cur.filter(r => r !== role) : [...cur, role];
    });
  };

  return (
    <>
    <Box className="aos-fade-up">
        <PageHeader
          dense
          title="Admin Panel"
          subtitle="Users, activity, email configuration, and system settings"
        />

        <Card
          className="aos-fade-up aos-delay-200"
          sx={{
            borderRadius: `${tokens.radius.card}px`,
            overflow: 'hidden',
            border: `1px solid ${tokens.border}`,
            boxShadow: tokens.shadow.sm,
            bgcolor: tokens.surface,
          }}
        >
          <Box
            sx={{
              borderBottom: `1px solid ${tokens.divider}`,
              background: tokens.surface,
            }}
          >
            <Tabs
              value={tabValue}
              onChange={(_, newValue) => setTabValue(newValue)}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              sx={{
                minHeight: 48,
                px: { xs: 0.5, sm: 1 },
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: 13.5,
                  minHeight: 48,
                  px: { xs: 1.5, sm: 2 },
                  color: tokens.text.secondary,
                  borderRadius: `${tokens.radius.button}px ${tokens.radius.button}px 0 0`,
                },
                '& .Mui-selected': {
                  color: `${tokens.primary.main} !important`,
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: tokens.primary.main,
                  height: 3,
                  borderRadius: '3px 3px 0 0',
                },
              }}
            >
              <Tab label="User Management" />
              <Tab label="User Activity Logs" />
              <Tab label="Email Templates" />
              <Tab label="SMTP Configuration" />
              {/* Scheduler Configuration tab hidden for now */}
              <Tab label="MIS Entry Email" />
              <Tab label="Final MIS Report Email" />
              <Tab label="Email delivery logs" />
            </Tabs>
          </Box>
          {/* Compact settings toolbar — theme + save aligned, no empty expanse */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'stretch', sm: 'center' },
              justifyContent: 'space-between',
              gap: 1.5,
              px: { xs: 2, sm: 2.5 },
              py: 1.5,
              borderBottom: `1px solid ${tokens.divider}`,
              bgcolor: tokens.bg,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
              <Typography
                sx={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: tokens.text.muted,
                  whiteSpace: 'nowrap',
                }}
              >
                Theme
              </Typography>
              <TextField
                select
                size="small"
                value={selectedThemeKey}
                onChange={(e) => setSelectedThemeKey(e.target.value)}
                sx={{
                  minWidth: { xs: 0, sm: 200 },
                  flex: { xs: 1, sm: '0 1 220px' },
                  maxWidth: 280,
                }}
              >
                {Object.values(themePresets).map((p: any) => (
                  <MenuItem key={p.key} value={p.key}>{p.name}</MenuItem>
                ))}
              </TextField>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSaveTheme}
                disabled={saving}
                sx={{ minWidth: 120, whiteSpace: 'nowrap', borderRadius: `${tokens.radius.button}px` }}
              >
                Save Theme
              </Button>
            </Box>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <CardContent sx={{ p: { xs: 2, sm: 2.5 }, pt: { xs: 2, sm: 2.5 } }}>
              <Box sx={{ display: 'flex', flexDirection: isPhone ? 'column' : 'row', justifyContent: 'space-between', alignItems: isPhone ? 'stretch' : 'center', gap: isPhone ? 1.5 : 0, mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: tokens.text.primary, fontSize: 16 }}>
                  Users
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleOpenCreateUser}
                  size={isPhone ? 'large' : 'medium'}
                  fullWidth={isPhone}
                  sx={{
                    textTransform: 'none',
                    borderRadius: `${tokens.radius.card}px`,
                    color: '#fff',
                    whiteSpace: 'nowrap',
                    minHeight: isPhone ? 48 : undefined,
                  }}
                >
                  Create User
                </Button>
              </Box>

              <TableContainer component={Paper} className="glass-card" sx={{ borderRadius: `${tokens.radius.card}px`, boxShadow: 'none', display: { xs: 'none', md: 'block' } }}>
                <Table>
                  <TableHead sx={{ background: tokens.bg }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, color: tokens.primary.main }}>Name</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: tokens.primary.main }}>Email</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: tokens.primary.main }}>Role</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: tokens.primary.main }} align="right">
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map(user => (
                      <TableRow key={user.id} className="hover-lift" sx={{ transition: 'all 0.3s ease' }}>
                        <TableCell sx={{ fontWeight: 500 }}>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{typeof user.role === 'string' ? user.role : user.role?.name}</TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenEditUser(user)}
                            sx={{
                              color: tokens.success.main,
                              backgroundColor: 'rgba(125, 194, 68, 0.1)',
                              borderRadius: `${tokens.radius.card}px`,
                              mr: 1,
                              '&:hover': { backgroundColor: 'rgba(125, 194, 68, 0.2)' },
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteUser(user.id)}
                            sx={{
                              color: tokens.danger.main,
                              backgroundColor: 'rgba(238, 106, 49, 0.1)',
                              borderRadius: `${tokens.radius.card}px`,
                              '&:hover': { backgroundColor: 'rgba(238, 106, 49, 0.2)' },
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {/* Mobile Card List View for Users */}
              <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, mt: 2 }}>
                {users.map(user => (
                  <Card key={user.id} variant="outlined" sx={{ borderRadius: `${tokens.radius.card}px`, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Box>
                          <Typography variant="subtitle1" fontWeight={700} color="#333842">{user.name}</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1, wordBreak: 'break-all' }}>{user.email}</Typography>
                          <Chip
                            label={typeof user.role === 'string' ? user.role : user.role?.name}
                            size="small"
                            sx={{
                              backgroundColor: 'rgba(40, 121, 182, 0.1)',
                              color: tokens.primary.main,
                              fontWeight: 600,
                              borderRadius: '8px',
                              height: '24px'
                            }}
                          />
                        </Box>
                        <IconButton
                          size="medium"
                          onClick={() => handleOpenEditUser(user)}
                          sx={{
                            color: tokens.primary.main,
                            bgcolor: 'rgba(40,121,182,0.1)',
                            '&:hover': { bgcolor: 'rgba(40,121,182,0.2)' }
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Box>
                      <Divider sx={{ my: 1.5 }} />
                      <Button
                        variant="outlined"
                        color="error"
                        fullWidth
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDeleteUser(user.id)}
                        sx={{ minWidth: 112 }}
                      >
                        Remove User
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </CardContent>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <CardContent sx={{ p: isPhone ? 2 : 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: tokens.text.primary }}>
                  User Activity Logs
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
                    onClick={handleRefreshLogs}
                    disabled={loading}
                    sx={{
                      textTransform: 'none',
                      borderRadius: `${tokens.radius.card}px`,
                      borderColor: tokens.primary.main,
                      color: tokens.primary.main,
                      whiteSpace: 'nowrap',
                      '&:hover': {
                        borderColor: tokens.primary.main,
                        backgroundColor: 'rgba(40, 121, 182, 0.05)',
                      },
                    }}
                  >
                    Refresh
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<FileDownloadIcon />}
                    onClick={handleExportLogs}
                    sx={{
                      textTransform: 'none',
                      borderRadius: `${tokens.radius.card}px`,
                      color: '#fff',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Export Logs
                  </Button>
                </Box>
              </Box>

              {message && (
                <Alert
                  severity={message.type}
                  sx={{
                    mb: 2,
                    borderRadius: `${tokens.radius.card}px`,
                    '&.MuiAlert-standardSuccess': {
                      backgroundColor: 'rgba(125, 194, 68, 0.1)',
                      color: tokens.success.dark,
                    },
                  }}
                >
                  {message.text}
                </Alert>
              )}

              {/* Filters */}
              {isPhone ? (
                <Accordion sx={{ mb: 3, borderRadius: '14px !important', background: '#fff', border: '1px solid #e2e8f0', boxShadow: 'none', '&:before': { display: 'none' } }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography sx={{ fontWeight: 600, color: tokens.text.primary }}>Filters</Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Search User"
                          placeholder="Enter user name"
                          value={filterUser}
                          onChange={(e) => setFilterUser(e.target.value)}
                          size="small"
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: `${tokens.radius.button}px` } }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          select
                          label="Action Type"
                          value={filterActionType}
                          onChange={(e) => setFilterActionType(e.target.value)}
                          size="small"
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: `${tokens.radius.button}px` } }}
                        >
                          <MenuItem value="all">All Actions</MenuItem>
                          <MenuItem value="create">Create</MenuItem>
                          <MenuItem value="update">Update</MenuItem>
                          <MenuItem value="delete">Delete</MenuItem>
                          <MenuItem value="login">Login</MenuItem>
                          <MenuItem value="view">View</MenuItem>
                        </TextField>
                      </Grid>
                      <Grid item xs={12}>
                        <AppDateField
                          fullWidth
                          label="Date From"
                          value={filterDateFrom}
                          onChange={setFilterDateFrom}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <AppDateField
                          fullWidth
                          label="Date To"
                          value={filterDateTo}
                          onChange={setFilterDateTo}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            variant="contained"
                            onClick={handleApplyFilters}
                            
                            sx={{
                              textTransform: 'none',
                              borderRadius: `${tokens.radius.card}px`,
                              color: '#fff',
                              whiteSpace: 'nowrap',
                              flex: 1,
                            }}
                          >
                            Apply
                          </Button>
                          <Button
                            variant="outlined"
                            onClick={handleResetFilters}
                            sx={{
                              textTransform: 'none',
                              borderRadius: `${tokens.radius.card}px`,
                              borderColor: tokens.text.secondary,
                              color: tokens.text.secondary,
                              whiteSpace: 'nowrap',
                              '&:hover': {
                                borderColor: tokens.text.secondary,
                                backgroundColor: 'rgba(88, 89, 91, 0.05)',
                              },
                            }}
                          >
                            Reset
                          </Button>
                        </Box>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              ) : (
                <Card className="glass-card" sx={{ borderRadius: `${tokens.radius.card}px`, mb: 3, p: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: tokens.text.primary, mb: 2 }}>
                    Filters
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        fullWidth
                        label="Search User"
                        placeholder="Enter user name"
                        value={filterUser}
                        onChange={(e) => setFilterUser(e.target.value)}
                        size="small"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: `${tokens.radius.button}px` } }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        fullWidth
                        select
                        label="Action Type"
                        value={filterActionType}
                        onChange={(e) => setFilterActionType(e.target.value)}
                        size="small"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: `${tokens.radius.button}px` } }}
                      >
                        <MenuItem value="all">All Actions</MenuItem>
                        <MenuItem value="create">Create</MenuItem>
                        <MenuItem value="update">Update</MenuItem>
                        <MenuItem value="delete">Delete</MenuItem>
                        <MenuItem value="login">Login</MenuItem>
                        <MenuItem value="view">View</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                      <AppDateField
                        fullWidth
                        label="Date From"
                        value={filterDateFrom}
                        onChange={setFilterDateFrom}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                      <AppDateField
                        fullWidth
                        label="Date To"
                        value={filterDateTo}
                        onChange={setFilterDateTo}
                      />
                    </Grid>
                    <Grid item xs={12} sm={12} md={2}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="contained"
                          onClick={handleApplyFilters}
                          
                          sx={{
                            textTransform: 'none',
                            borderRadius: `${tokens.radius.card}px`,
                            color: '#fff',
                            whiteSpace: 'nowrap',
                            flex: 1,
                          }}
                        >
                          Apply
                        </Button>
                        <Button
                          variant="outlined"
                          onClick={handleResetFilters}
                          sx={{
                            textTransform: 'none',
                            borderRadius: `${tokens.radius.card}px`,
                            borderColor: tokens.text.secondary,
                            color: tokens.text.secondary,
                            whiteSpace: 'nowrap',
                            '&:hover': {
                              borderColor: tokens.text.secondary,
                              backgroundColor: 'rgba(88, 89, 91, 0.05)',
                            },
                          }}
                        >
                          Reset
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </Card>
              )}

              {/* Login sessions: Last Login, Login time, Logout time, Session duration */}
              {sessions.length > 0 && (
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: tokens.text.primary, mt: 3, mb: 1.5 }}>
                  Login sessions (active session time)
                </Typography>
              )}
              {sessions.length > 0 && (
                isPhone ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
                    {sessions.slice(0, 5).map((s, idx) => (
                      <Card key={`session-mobile-${s.userId}-${idx}`} variant="outlined" sx={{ borderRadius: `${tokens.radius.card}px`, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <CardContent sx={{ p: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                            <Typography variant="subtitle2" fontWeight={700} color="#333842">{s.userName}</Typography>
                            <Chip
                              size="small"
                              label={s.sessionDurationMinutes >= 60
                                ? `${Math.floor(s.sessionDurationMinutes / 60)}h ${s.sessionDurationMinutes % 60}m`
                                : `${s.sessionDurationMinutes} min`}
                              sx={{
                                height: 24,
                                fontSize: '0.75rem',
                                bgcolor: 'rgba(40, 121, 182, 0.1)',
                                color: tokens.primary.main,
                                fontWeight: 600
                              }}
                            />
                          </Box>
                          <Grid container spacing={2}>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary" display="block">Last Login</Typography>
                              <Typography variant="body2" fontWeight={500} fontSize="0.85rem">
                                {formatDateTime(s.lastLogin).split(' ')[0]}
                                <Box component="span" sx={{ display: 'block', color: 'text.secondary', fontSize: '0.75rem' }}>
                                  {formatDateTime(s.lastLogin).split(' ').slice(1).join(' ')}
                                </Box>
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary" display="block">Device / IP</Typography>
                              <Typography variant="body2" fontWeight={500} fontSize="0.85rem" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {s.device || 'Unknown'}
                                <Box component="span" sx={{ display: 'block', color: 'text.secondary', fontSize: '0.75rem' }}>
                                  {s.ipAddress || '-'}
                                </Box>
                              </Typography>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                ) : (
                  <TableContainer component={Paper} className="glass-card" sx={{ borderRadius: `${tokens.radius.card}px`, boxShadow: 'none', mb: 3, overflowX: 'auto' }}>
                    <Table size="small" sx={{ minWidth: 650 }}>
                      <TableHead sx={{ background: tokens.bg }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700, color: tokens.primary.main }}>User</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: tokens.primary.main }}>Last Login</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: tokens.primary.main }}>Login Time</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: tokens.primary.main }}>Logout Time</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: tokens.primary.main }}>Session Duration</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: tokens.primary.main }}>Device</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: tokens.primary.main }}>IP</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {sessions.slice(0, 20).map((s, idx) => (
                          <TableRow key={`session-${s.userId}-${idx}`} className="hover-lift">
                            <TableCell sx={{ fontWeight: 500 }}>{s.userName}</TableCell>
                            <TableCell sx={{ fontSize: '0.875rem', color: tokens.text.secondary }}>{formatDateTime(s.lastLogin)}</TableCell>
                            <TableCell sx={{ fontSize: '0.875rem', color: tokens.text.secondary }}>{formatDateTime(s.loginTime)}</TableCell>
                            <TableCell sx={{ fontSize: '0.875rem', color: tokens.text.secondary }}>{formatDateTime(s.logoutTime)}</TableCell>
                            <TableCell sx={{ fontSize: '0.875rem', color: tokens.text.primary }}>
                              {s.sessionDurationMinutes >= 60
                                ? `${Math.floor(s.sessionDurationMinutes / 60)}h ${s.sessionDurationMinutes % 60}m`
                                : `${s.sessionDurationMinutes} min`}
                            </TableCell>
                            <TableCell sx={{ fontSize: '0.875rem', color: tokens.text.secondary }}>{s.device || '-'}</TableCell>
                            <TableCell sx={{ fontSize: '0.875rem', color: tokens.text.secondary }}>{s.ipAddress || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ))}

              {/* Activity Logs Table */}
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: tokens.text.primary, mb: 1.5 }}>
                Activity log
              </Typography>
              {isPhone ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {paginatedLogs.length > 0 ? (
                    paginatedLogs.map((log) => (
                      <Card key={log.id} variant="outlined" sx={{ borderRadius: `${tokens.radius.card}px`, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <CardContent sx={{ p: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: tokens.text.primary }}>{log.user}</Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>{log.timestamp}</Typography>
                            </Box>
                            <Chip
                              label={log.action}
                              size="small"
                              sx={{
                                fontWeight: 600,
                                borderRadius: '6px',
                                height: 24,
                                backgroundColor: log.action.toLowerCase().includes('delete') ? '#ffebee' :
                                  log.action.toLowerCase().includes('create') ? '#e8f5e9' :
                                    log.action.toLowerCase().includes('update') ? '#e3f2fd' : '#f5f5f5',
                                color: log.action.toLowerCase().includes('delete') ? '#d32f2f' :
                                  log.action.toLowerCase().includes('create') ? '#2e7d32' :
                                    log.action.toLowerCase().includes('update') ? '#1976d2' : '#616161'
                              }}
                            />
                          </Box>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', mb: 0.5, display: 'block' }}>{log.entity}</Typography>
                          <Box sx={{ bgcolor: 'rgba(0,0,0,0.02)', p: 1.5, borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                            <Typography variant="body2" sx={{ color: tokens.text.primary, mb: log.changes?.length ? 1 : 0 }}>{log.description}</Typography>
                            {log.changes && log.changes.length > 0 && (
                              <Box sx={{ mt: 1 }}>
                                {log.changes.map((change, i) => (
                                  <Typography key={i} variant="caption" display="block" sx={{ color: tokens.text.secondary, lineHeight: 1.6 }}>
                                    {change.field}: <Box component="span" sx={{ textDecoration: 'line-through', color: '#9e9e9e' }}>{change.from}</Box> → <Box component="span" sx={{ fontWeight: 600, color: '#2e7d32' }}>{change.to}</Box>
                                  </Typography>
                                ))}
                              </Box>
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Typography color="text.secondary">No activity logs found</Typography>
                  )}
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                    <Button onClick={() => handleChangePage(null as any, Math.max(0, page - 1))} disabled={page === 0} sx={{ mr: 1, borderRadius: '8px' }} variant="outlined" size="small">Prev</Button>
                    <Button onClick={() => handleChangePage(null as any, page + 1)} disabled={(page + 1) * rowsPerPage >= filteredLogs.length} variant="outlined"  size="small">Next</Button>
                  </Box>
                </Box>
              ) : (
                <TableContainer component={Paper} className="glass-card" sx={{ borderRadius: `${tokens.radius.card}px`, boxShadow: 'none', overflowX: 'auto' }}>
                  <Table sx={{ minWidth: 800 }}>
                    <TableHead sx={{ background: tokens.bg }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, color: tokens.primary.main }}>User</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: tokens.primary.main }}>Action</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: tokens.primary.main }}>Entity</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: tokens.primary.main }}>Description</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: tokens.primary.main }}>Timestamp</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedLogs.length > 0 ? (
                        paginatedLogs.map((log) => (
                          <TableRow key={log.id} className="hover-lift" sx={{ transition: 'all 0.3s ease' }}>
                            <TableCell sx={{ fontWeight: 500 }}>{log.user}</TableCell>
                            <TableCell>
                              <Chip
                                label={log.action}
                                size="small"
                                sx={{
                                  fontWeight: 600,
                                  borderRadius: '8px',
                                  backgroundColor: log.action.toLowerCase().includes('delete') ? '#ffebee' :
                                    log.action.toLowerCase().includes('create') ? '#e8f5e9' :
                                      log.action.toLowerCase().includes('update') ? '#e3f2fd' : '#f5f5f5',
                                  color: log.action.toLowerCase().includes('delete') ? '#d32f2f' :
                                    log.action.toLowerCase().includes('create') ? '#2e7d32' :
                                      log.action.toLowerCase().includes('update') ? '#1976d2' : '#616161'
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ fontWeight: 500 }}>{log.entity}</TableCell>
                            <TableCell sx={{ fontSize: '0.875rem', color: tokens.text.secondary }}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>{log.description}</Typography>
                              {log.changes && log.changes.length > 0 && (
                                <Box component="ul" sx={{ m: 0, pl: 2, mt: 0.5 }}>
                                  {log.changes.map((change, i) => (
                                    <Typography component="li" key={i} variant="caption" display="list-item" sx={{ color: tokens.text.secondary }}>
                                      {change.field}: <span style={{ textDecoration: 'line-through', color: '#9e9e9e' }}>{change.from}</span> &rarr; <span style={{ fontWeight: 600, color: '#2e7d32' }}>{change.to}</span>
                                    </Typography>
                                  ))}
                                </Box>
                              )}
                            </TableCell>
                            <TableCell sx={{ fontSize: '0.875rem', color: tokens.text.secondary }}>{log.timestamp}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} align="center" sx={{ py: 4, color: tokens.text.secondary }}>
                            No activity logs found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    component="div"
                    count={filteredLogs.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    sx={{
                      borderTop: '1px solid rgba(40, 121, 182, 0.1)',
                      '& .MuiTablePagination-toolbar': {
                        paddingLeft: 2,
                        paddingRight: 2,
                      },
                    }}
                  />
                </TableContainer>
              )}
            </CardContent>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <CardContent sx={{ p: isPhone ? 2 : 3 }}>
              <ErrorBoundary>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, gap: 2, flexWrap: 'wrap' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: tokens.text.primary, fontSize: '1.125rem' }}>
                    Email Templates
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleOpenCreateTemplate}
                    sx={{
                      textTransform: 'none',
                      borderRadius: `${tokens.radius.button}px`,
                      color: '#fff',
                      whiteSpace: 'nowrap',
                      boxShadow: 'none',
                    }}
                  >
                    Create Template
                  </Button>
                </Box>

                {message && (
                  <Alert
                    severity={message.type}
                    sx={{
                      mb: 2,
                      borderRadius: `${tokens.radius.card}px`,
                      '&.MuiAlert-standardSuccess': {
                        backgroundColor: 'rgba(125, 194, 68, 0.1)',
                        color: tokens.success.dark,
                      },
                    }}
                  >
                    {message.text}
                  </Alert>
                )}

                {/* Mobile SMTP card (phone only) */}
                <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 2 }}>
                  <Card variant="outlined" sx={{ p: 2, borderRadius: `${tokens.radius.card}px` }}>
                    <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1, color: tokens.primary.main }}>
                      SMTP Settings
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Configure mail server used for notifications. Save then Send Test to verify.
                    </Typography>
                    <TextField fullWidth label="SMTP Host" value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} sx={{ mb: 1 }} />
                    <TextField fullWidth label="SMTP Port" value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} sx={{ mb: 1 }} />
                    <TextField fullWidth label="Username" value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} sx={{ mb: 1 }} />
                    <TextField fullWidth label="Password" type="password" value={smtpPass} onChange={(e) => setSmtpPass(e.target.value)} sx={{ mb: 1 }} />
                    <TextField fullWidth label="From Email" value={smtpFromEmail} onChange={(e) => setSmtpFromEmail(e.target.value)} sx={{ mb: 1 }} />
                    <TextField fullWidth label="From Name" value={smtpFromName} onChange={(e) => setSmtpFromName(e.target.value)} sx={{ mb: 1 }} />
                    <FormControlLabel control={<Checkbox checked={smtpSecure} onChange={(e) => setSmtpSecure(e.target.checked)} sx={{ color: tokens.primary.main }} />} label="Use TLS/SSL (secure)" />
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
                      <Button variant="contained" onClick={handleSaveSMTP} disabled={saving} fullWidth size="large" sx={{ borderRadius: `${tokens.radius.button}px` }}>
                        {saving ? 'Saving…' : 'Save SMTP Settings'}
                      </Button>
                      <TextField size="small" label="Test recipient email" placeholder="test@example.com" value={smtpTestTo} onChange={(e) => setSmtpTestTo(e.target.value)} sx={{ mt: 1 }} />
                      <Button variant="outlined" onClick={handleTestSMTP} disabled={smtpTesting || !smtpTestTo?.trim()} fullWidth size="large" sx={{ borderRadius: `${tokens.radius.button}px` }}>
                        {smtpTesting ? 'Sending…' : 'Send Test Email'}
                      </Button>
                    </Box>
                  </Card>
                </Box>

                <Grid container spacing={1.5}>
                  {emailTemplates.map((template) => {
                    const accent = getTemplateTypeColor(template.type);
                    const placeholders = template.placeholders || [];
                    return (
                      <Grid item xs={12} sm={6} lg={4} key={template.id}>
                        <Card
                          variant="outlined"
                          sx={{
                            height: '100%',
                            borderRadius: `${tokens.radius.card}px`,
                            border: `1px solid ${tokens.border}`,
                            boxShadow: tokens.shadow.sm,
                            overflow: 'hidden',
                            transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                            '&:hover': {
                              borderColor: tokens.primary.border,
                              boxShadow: tokens.shadow.md,
                            },
                          }}
                        >
                          <Box sx={{ display: 'flex', minHeight: '100%' }}>
                            <Box sx={{ width: 4, flexShrink: 0, bgcolor: accent }} />
                            <Box sx={{ flex: 1, p: 1.75, display: 'flex', flexDirection: 'column', gap: 1.25, minWidth: 0 }}>
                              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                  <Typography
                                    variant="subtitle2"
                                    sx={{
                                      fontWeight: 700,
                                      color: tokens.text.primary,
                                      lineHeight: 1.3,
                                      wordBreak: 'break-word',
                                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                                      fontSize: '0.8125rem',
                                    }}
                                  >
                                    {template.name}
                                  </Typography>
                                  <Chip
                                    label={getTemplateTypeLabel(template.type)}
                                    size="small"
                                    sx={{
                                      mt: 0.75,
                                      height: 22,
                                      fontSize: '0.6875rem',
                                      fontWeight: 600,
                                      backgroundColor: `${accent}14`,
                                      color: accent,
                                      borderRadius: `${tokens.radius.chip}px`,
                                    }}
                                  />
                                </Box>
                                <Chip
                                  size="small"
                                  icon={template.isActive ? <CheckCircleIcon sx={{ fontSize: '14px !important' }} /> : <CancelIcon sx={{ fontSize: '14px !important' }} />}
                                  label={template.isActive ? 'Active' : 'Off'}
                                  onClick={() => handleToggleTemplateStatus(template.id)}
                                  sx={{
                                    height: 24,
                                    fontWeight: 600,
                                    fontSize: '0.6875rem',
                                    cursor: 'pointer',
                                    flexShrink: 0,
                                    backgroundColor: template.isActive ? tokens.success.soft : tokens.bg,
                                    color: template.isActive ? tokens.success.dark : tokens.text.secondary,
                                    '& .MuiChip-icon': {
                                      color: 'inherit',
                                      ml: 0.5,
                                    },
                                  }}
                                />
                              </Box>

                              <Box sx={{ minWidth: 0 }}>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    display: 'block',
                                    fontWeight: 600,
                                    color: tokens.text.secondary,
                                    letterSpacing: '0.04em',
                                    textTransform: 'uppercase',
                                    fontSize: '0.65rem',
                                    mb: 0.25,
                                  }}
                                >
                                  Subject
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: tokens.text.primary,
                                    fontSize: '0.8125rem',
                                    lineHeight: 1.4,
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                  }}
                                >
                                  {template.subject || '—'}
                                </Typography>
                              </Box>

                              {placeholders.length > 0 && (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  {placeholders.slice(0, 4).map((placeholder) => (
                                    <Chip
                                      key={placeholder}
                                      label={placeholder}
                                      size="small"
                                      sx={{
                                        height: 20,
                                        fontSize: '0.65rem',
                                        fontWeight: 500,
                                        backgroundColor: tokens.primary.soft,
                                        color: tokens.primary.dark,
                                        borderRadius: 6,
                                        '& .MuiChip-label': { px: 0.75 },
                                      }}
                                    />
                                  ))}
                                  {placeholders.length > 4 && (
                                    <Chip
                                      label={`+${placeholders.length - 4}`}
                                      size="small"
                                      sx={{
                                        height: 20,
                                        fontSize: '0.65rem',
                                        fontWeight: 600,
                                        backgroundColor: tokens.bg,
                                        color: tokens.text.secondary,
                                        borderRadius: 6,
                                      }}
                                    />
                                  )}
                                </Box>
                              )}

                              <Box
                                sx={{
                                  mt: 'auto',
                                  pt: 0.5,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: 1,
                                  borderTop: `1px solid ${tokens.divider}`,
                                }}
                              >
                                <Typography variant="caption" sx={{ color: tokens.text.secondary, fontSize: '0.6875rem' }}>
                                  {formatTemplateUpdatedAt(template.updatedAt)}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleOpenEditTemplate(template)}
                                    aria-label="Edit template"
                                    sx={{
                                      width: 30,
                                      height: 30,
                                      color: tokens.primary.main,
                                      backgroundColor: tokens.primary.soft,
                                      borderRadius: `${tokens.radius.button}px`,
                                      '&:hover': { backgroundColor: alpha(tokens.primary.main, 0.16) },
                                    }}
                                  >
                                    <EditIcon sx={{ fontSize: 16 }} />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDeleteTemplate(template.id)}
                                    aria-label="Delete template"
                                    sx={{
                                      width: 30,
                                      height: 30,
                                      color: tokens.danger.main,
                                      backgroundColor: tokens.danger.soft,
                                      borderRadius: `${tokens.radius.button}px`,
                                      '&:hover': { backgroundColor: alpha(tokens.danger.main, 0.14) },
                                    }}
                                  >
                                    <DeleteIcon sx={{ fontSize: 16 }} />
                                  </IconButton>
                                </Box>
                              </Box>
                            </Box>
                          </Box>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              </ErrorBoundary>
            </CardContent>
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <CardContent sx={{ p: isPhone ? 2 : 3 }}>
              <ErrorBoundary>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: tokens.text.primary }}>
                  SMTP Settings
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Configure the mail server used for notifications and test emails. Save your settings, then use &quot;Send Test Email&quot; to verify.
                </Typography>
                <Alert severity="info" sx={{ mb: 2, borderRadius: `${tokens.radius.card}px` }}>
                  <Typography variant="body2">
                    <strong>Gmail / Google Workspace:</strong> error 535 &quot;BadCredentials&quot; from gsmtp means Google rejected the password. Use an{' '}
                    <a href="https://support.google.com/accounts/answer/185833" target="_blank" rel="noopener noreferrer">
                      App Password
                    </a>{' '}
                    (requires 2-Step Verification on that Google account), not your normal login password. SMTP username must be the full mailbox address. Port <strong>587</strong> with TLS usually works (leave &quot;SSL&quot; unchecked unless using port 465).
                  </Typography>
                </Alert>
                {message && (
                  <Alert
                    severity={message.type}
                    sx={{
                      mb: 2,
                      borderRadius: `${tokens.radius.card}px`,
                      '&.MuiAlert-standardSuccess': { backgroundColor: 'rgba(125, 194, 68, 0.1)', color: tokens.success.dark },
                    }}
                  >
                    {message.text}
                  </Alert>
                )}
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="SMTP Host"
                      required
                      placeholder="smtp.gmail.com"
                      value={smtpHost}
                      onChange={(e) => setSmtpHost(e.target.value)}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: `${tokens.radius.button}px` } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="SMTP Port"
                      type="number"
                      required
                      placeholder="587"
                      value={smtpPort}
                      onChange={(e) => setSmtpPort(e.target.value)}
                      inputProps={{ min: 1, max: 65535 }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: `${tokens.radius.button}px` } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Username"
                      required
                      placeholder="user@example.com"
                      value={smtpUser}
                      onChange={(e) => setSmtpUser(e.target.value)}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: `${tokens.radius.button}px` } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Password"
                      type="password"
                      placeholder={smtpId ? 'Leave blank to keep current' : ''}
                      value={smtpPass}
                      onChange={(e) => setSmtpPass(e.target.value)}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: `${tokens.radius.button}px` } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="From Email"
                      required
                      placeholder="noreply@example.com"
                      value={smtpFromEmail}
                      onChange={(e) => setSmtpFromEmail(e.target.value)}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: `${tokens.radius.button}px` } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="From Name"
                      placeholder="Biogas MIS"
                      value={smtpFromName}
                      onChange={(e) => setSmtpFromName(e.target.value)}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: `${tokens.radius.button}px` } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={smtpSecure}
                          onChange={(e) => setSmtpSecure(e.target.checked)}
                          sx={{ color: tokens.primary.main, '&.Mui-checked': { color: tokens.primary.main } }}
                        />
                      }
                      label="Use TLS/SSL (secure)"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} />
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', flexDirection: isPhone ? 'column' : 'row', gap: 2, flexWrap: 'wrap', alignItems: isPhone ? 'stretch' : 'center' }}>
                      <Button
                        variant="contained"
                        onClick={handleSaveSMTP}
                        disabled={saving}
                        fullWidth={isPhone}
                        startIcon={saving ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : null}
                        
                        sx={{ textTransform: 'none', borderRadius: `${tokens.radius.button}px`, px: 4, color: '#fff', whiteSpace: 'nowrap' }}
                      >
                        {saving ? 'Saving…' : 'Save SMTP Settings'}
                      </Button>
                      <TextField
                        size="small"
                        fullWidth={isPhone}
                        label="Test recipient email"
                        placeholder="test@example.com"
                        value={smtpTestTo}
                        onChange={(e) => setSmtpTestTo(e.target.value)}
                        sx={{ minWidth: isPhone ? '100%' : 220, '& .MuiOutlinedInput-root': { borderRadius: `${tokens.radius.button}px` } }}
                      />
                      <Button
                        variant="outlined"
                        onClick={handleTestSMTP}
                        disabled={smtpTesting || !smtpTestTo?.trim()}
                        fullWidth={isPhone}
                        startIcon={smtpTesting ? <CircularProgress size={20} /> : null}
                        sx={{
                          textTransform: 'none',
                          borderRadius: `${tokens.radius.card}px`,
                          borderColor: tokens.primary.main,
                          color: tokens.primary.main,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {smtpTesting ? 'Sending…' : 'Send Test Email'}
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </ErrorBoundary>
            </CardContent>
          </TabPanel>

          {false && (<TabPanel value={tabValue} index={4}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: tokens.text.primary }}>
                    Notification Scheduler
                  </Typography>
                  <Typography variant="body2" sx={{ color: tokens.text.secondary, mt: 0.5 }}>
                    Configure automated in-app notifications for MIS workflow
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: tokens.text.secondary }}>
                      Scheduler Status:
                    </Typography>
                    <Chip
                      label={schedulerActive ? 'Active' : 'Inactive'}
                      size="small"
                      sx={{
                        backgroundColor: schedulerActive ? 'rgba(125, 194, 68, 0.15)' : 'rgba(238, 106, 49, 0.15)',
                        color: schedulerActive ? tokens.success.main : tokens.danger.main,
                        fontWeight: 600,
                        borderRadius: '8px',
                      }}
                    />
                  </Box>
                  <Button
                    variant={schedulerActive ? 'outlined' : 'contained'}
                    onClick={handleToggleScheduler}
                    disabled={saving}
                    
                    sx={{
                      textTransform: 'none',
                      borderRadius: `${tokens.radius.card}px`,
                      whiteSpace: 'nowrap',
                      ...(schedulerActive && {
                        borderColor: tokens.danger.main,
                        color: tokens.danger.main,
                        '&:hover': {
                          borderColor: tokens.danger.main,
                          backgroundColor: 'rgba(238, 106, 49, 0.05)',
                        },
                      }),
                      ...(schedulerActive ? {} : { color: '#fff' }),
                    }}
                  >
                    {schedulerActive ? 'Deactivate Scheduler' : 'Activate Scheduler'}
                  </Button>
                </Box>
              </Box>

              {message && (
                <Alert
                  severity={message.type}
                  sx={{
                    mb: 2,
                    borderRadius: `${tokens.radius.card}px`,
                    '&.MuiAlert-standardSuccess': {
                      backgroundColor: 'rgba(125, 194, 68, 0.1)',
                      color: tokens.success.dark,
                    },
                  }}
                >
                  {message.text}
                </Alert>
              )}

              {/* Workflow Diagram */}
              <Card
                className="glass-card"
                sx={{
                  borderRadius: `${tokens.radius.card}px`,
                  p: 3,
                  mb: 3,
                  borderLeft: '4px solid #2879b6',
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: tokens.text.primary, mb: 2 }}>
                  MIS Entry Workflow
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <Chip
                    label="1. Entry Created"
                    sx={{
                      backgroundColor: 'rgba(40, 121, 182, 0.1)',
                      color: tokens.primary.main,
                      fontWeight: 600,
                    }}
                  />
                  <Typography sx={{ color: tokens.text.secondary }}>→</Typography>
                  <Chip
                    label="2. Entry Submitted"
                    sx={{
                      backgroundColor: 'rgba(125, 194, 68, 0.1)',
                      color: tokens.success.main,
                      fontWeight: 600,
                    }}
                  />
                  <Typography sx={{ color: tokens.text.secondary }}>→</Typography>
                  <Chip
                    label="3. Manager Review"
                    sx={{
                      backgroundColor: 'rgba(245, 158, 33, 0.1)',
                      color: tokens.warning.main,
                      fontWeight: 600,
                    }}
                  />
                  <Typography sx={{ color: tokens.text.secondary }}>→</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Chip
                      label="✓ Approve → Consolidated MIS"
                      size="small"
                      sx={{
                        backgroundColor: 'rgba(19, 155, 73, 0.1)',
                        color: tokens.success.dark,
                        fontWeight: 600,
                      }}
                    />
                    <Chip
                      label="✗ Send Back with Comment"
                      size="small"
                      sx={{
                        backgroundColor: 'rgba(238, 106, 49, 0.1)',
                        color: tokens.danger.main,
                        fontWeight: 600,
                      }}
                    />
                  </Box>
                </Box>
              </Card>

              {/* Notification Configurations */}
              <Grid container spacing={3}>
                {(schedulerConfigs || []).map((config, index) => {
                  const template = emailTemplates.find(t => t.id === config.templateId);
                  return (
                    <Grid item xs={12} md={6} key={config.id}>
                      <Card
                        className="glass-card hover-lift"
                        sx={{
                          borderRadius: `${tokens.radius.card}px`,
                          p: 2.5,
                          transition: 'all 0.3s ease',
                          borderLeft: `4px solid ${getNotificationTypeColor(config.notificationType)}`,
                        }}
                        data-aos="fade-up"
                        data-aos-delay={index * 100}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: tokens.text.primary, mb: 0.5 }}>
                              {getNotificationTypeLabel(config.notificationType)}
                            </Typography>
                            <Chip
                              label={config.isEnabled ? 'Enabled' : 'Disabled'}
                              size="small"
                              sx={{
                                backgroundColor: config.isEnabled
                                  ? 'rgba(125, 194, 68, 0.15)'
                                  : 'rgba(88, 89, 91, 0.15)',
                                color: config.isEnabled ? tokens.success.main : tokens.text.secondary,
                                fontWeight: 600,
                                borderRadius: '8px',
                              }}
                            />
                          </Box>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={config.isEnabled}
                                onChange={() => handleToggleSchedulerConfig(config.id)}
                                sx={{
                                  color: tokens.success.main,
                                  '&.Mui-checked': { color: tokens.success.main },
                                }}
                              />
                            }
                            label=""
                            sx={{ m: 0 }}
                          />
                        </Box>

                        <Grid container spacing={2} sx={{ mb: 2 }}>
                          <Grid item xs={6}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: tokens.text.secondary, mb: 0.5 }}>
                              Check Time:
                            </Typography>
                            <Typography variant="body2" sx={{ color: tokens.text.primary }}>
                              {config.checkTime}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: tokens.text.secondary, mb: 0.5 }}>
                              Frequency:
                            </Typography>
                            <Typography variant="body2" sx={{ color: tokens.text.primary, textTransform: 'capitalize' }}>
                              {config.reminderFrequency}
                            </Typography>
                          </Grid>
                        </Grid>

                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: tokens.text.secondary, mb: 0.5 }}>
                            Recipients:
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {(config.recipientRoles || []).map(role => (
                              <Chip
                                key={role}
                                label={role}
                                size="small"
                                sx={{
                                  backgroundColor: 'rgba(40, 121, 182, 0.1)',
                                  color: tokens.primary.main,
                                  fontSize: '0.75rem',
                                  height: '24px',
                                }}
                              />
                            ))}
                          </Box>
                        </Box>

                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: tokens.text.secondary, mb: 0.5 }}>
                            Email Template:
                          </Typography>
                          <Typography variant="body2" sx={{ color: tokens.text.primary }}>
                            {template?.name || 'Not assigned'}
                          </Typography>
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleOpenEditScheduler(config)}
                            sx={{
                              textTransform: 'none',
                              borderRadius: `${tokens.radius.card}px`,
                              borderColor: tokens.primary.main,
                              color: tokens.primary.main,
                              flex: 1,
                              whiteSpace: 'nowrap',
                              '&:hover': {
                                borderColor: tokens.primary.main,
                                backgroundColor: 'rgba(40, 121, 182, 0.05)',
                              },
                            }}
                          >
                            <EditIcon sx={{ fontSize: 16, mr: 0.5 }} />
                            Configure
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleTestNotification(config)}
                            disabled={testingNotification || !config.isEnabled}
                            sx={{
                              textTransform: 'none',
                              borderRadius: `${tokens.radius.card}px`,
                              borderColor: tokens.success.main,
                              color: tokens.success.main,
                              flex: 1,
                              whiteSpace: 'nowrap',
                              '&:hover': {
                                borderColor: tokens.success.main,
                                backgroundColor: 'rgba(125, 194, 68, 0.05)',
                              },
                            }}
                          >
                            {testingNotification ? (
                              <CircularProgress size={16} sx={{ mr: 0.5 }} />
                            ) : (
                              <RefreshIcon sx={{ fontSize: 16, mr: 0.5 }} />
                            )}
                            Test
                          </Button>
                        </Box>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </CardContent>
          </TabPanel>)}

          <TabPanel value={tabValue} index={4}>
            <CardContent sx={{ p: 3 }}>
              <MISEntryEmailPanel
                formConfig={formConfig}
                message={message}
                setMessage={setMessage}
                onRefresh={loadFormConfig}
              />
            </CardContent>
          </TabPanel>
          <TabPanel value={tabValue} index={5}>
            <CardContent sx={{ p: 3 }}>
              <FinalMISReportEmailPanel message={message} setMessage={setMessage} />
            </CardContent>
          </TabPanel>
          <TabPanel value={tabValue} index={6}>
            <CardContent sx={{ p: 3 }}>
              <EmailDeliveryLogsPanel />
            </CardContent>
          </TabPanel>
        </Card>
      </Box>

      {/* Create/Edit User Dialog with Permissions */}
      <Dialog
        open={openUserDialog}
        onClose={() => setOpenUserDialog(false)}
        maxWidth="md"
        fullWidth
        TransitionComponent={Transition}
        fullScreen={isPhone}
        PaperProps={{ sx: { borderRadius: isPhone ? 0 : `${tokens.radius.dialog}px` } }}
      >
        <DialogTitle
          sx={{
            fontWeight: 600,
            color: tokens.primary.main,
            background: tokens.primary.soft,
          }}
        >
          {editingUser ? 'Edit User' : 'Create New User'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }} className="aos-fade-up">
          {message && (
            <Alert
              severity={message.type}
              sx={{
                mb: 2,
                borderRadius: `${tokens.radius.card}px`,
                '&.MuiAlert-standardSuccess': {
                  backgroundColor: 'rgba(125, 194, 68, 0.1)',
                  color: tokens.success.dark,
                },
              }}
            >
              {message.text}
            </Alert>
          )}
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Name"
                  required
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: `${tokens.radius.button}px` } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  required
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: `${tokens.radius.button}px` } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  required={!editingUser}
                  placeholder={editingUser ? 'Leave blank to keep current' : ''}
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: `${tokens.radius.button}px` } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Role"
                  value={selectedRole}
                  onChange={e => handleRoleChange(e.target.value)}
                  required
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: `${tokens.radius.button}px` } }}
                >
                  <MenuItem value="Admin">Admin</MenuItem>
                  <MenuItem value="Manager">Manager</MenuItem>
                  <MenuItem value="Operator">Operator</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" sx={{ fontWeight: 600, color: tokens.text.primary, mb: 0.5 }}>
              User Permissions
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Assign access per page for this user. These permissions apply only to this user and are the primary way to manage access.
            </Typography>

            <TableContainer component={Paper} className="glass-card" sx={{ borderRadius: `${tokens.radius.card}px`, boxShadow: 'none', display: { xs: 'none', md: 'block' } }}>
              <Table size="small">
                <TableHead sx={{ background: tokens.bg }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: tokens.primary.main }}>Page</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, color: tokens.primary.main }}>
                      Read
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, color: tokens.success.main }}>
                      Create
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, color: tokens.warning.main }}>
                      Update
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, color: tokens.danger.main }}>
                      Delete
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, color: tokens.success.main }}>
                      Approve
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {userPermissions.map((perm, index) => (
                    <TableRow key={perm.page}>
                      <TableCell sx={{ fontWeight: 500 }}>{perm.page}</TableCell>
                      <TableCell align="center">
                        <Checkbox
                          checked={perm.read}
                          onChange={() => handlePermissionChange(index, 'read')}
                          size="small"
                          sx={{ color: tokens.primary.main, '&.Mui-checked': { color: tokens.primary.main } }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Checkbox
                          checked={perm.create}
                          onChange={() => handlePermissionChange(index, 'create')}
                          size="small"
                          sx={{ color: tokens.success.main, '&.Mui-checked': { color: tokens.success.main } }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Checkbox
                          checked={perm.update}
                          onChange={() => handlePermissionChange(index, 'update')}
                          size="small"
                          sx={{ color: tokens.warning.main, '&.Mui-checked': { color: tokens.warning.main } }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Checkbox
                          checked={perm.delete}
                          onChange={() => handlePermissionChange(index, 'delete')}
                          size="small"
                          sx={{ color: tokens.danger.main, '&.Mui-checked': { color: tokens.danger.main } }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        {perm.page === 'MIS Entry' ? (
                          <Checkbox
                            checked={!!perm.approve}
                            onChange={() => handlePermissionChange(index, 'approve')}
                            size="small"
                            sx={{ color: tokens.success.main, '&.Mui-checked': { color: tokens.success.main } }}
                          />
                        ) : (
                          <span style={{ color: '#ccc' }}>—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Mobile Stacked List for Permissions */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
              {userPermissions.map((perm, index) => (
                <Card key={perm.page} variant="outlined" sx={{ borderRadius: `${tokens.radius.card}px`, p: 2 }}>
                  <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1, color: tokens.primary.main }}>
                    {perm.page}
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {['read', 'create', 'update', 'delete', ...(perm.page === 'MIS Entry' ? ['approve'] : [])].map((action) => (
                      <Box key={action} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>{action}</Typography>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={(perm as any)[action]}
                              onChange={() => handlePermissionChange(index, action as any)}
                              size="medium"
                              sx={{ p: 0.5, color: action === 'read' ? tokens.primary.main : action === 'create' ? tokens.success.main : action === 'update' ? tokens.warning.main : action === 'approve' ? tokens.success.main : tokens.danger.main, '&.Mui-checked': { color: action === 'read' ? tokens.primary.main : action === 'create' ? tokens.success.main : action === 'update' ? tokens.warning.main : action === 'approve' ? tokens.success.main : tokens.danger.main } }}
                            />
                          }
                          label=""
                          sx={{ m: 0 }}
                        />
                      </Box>
                    ))}
                  </Box>
                </Card>
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ flexDirection: isPhone ? 'column' : 'row' }}>
          <Button variant="outlined" onClick={() => setOpenUserDialog(false)} fullWidth={isPhone} sx={{ minWidth: 96 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveUser}
            fullWidth={isPhone}
            sx={{ minWidth: 128, whiteSpace: 'nowrap' }}
          >
            {editingUser ? 'Save Changes' : 'Create User'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Email Template Dialog */}
      <Dialog
        open={openTemplateDialog}
        onClose={() => setOpenTemplateDialog(false)}
        maxWidth="md"
        fullWidth
        TransitionComponent={Transition}
        fullScreen={isPhone}
        PaperProps={{ sx: { borderRadius: isPhone ? 0 : `${tokens.radius.dialog}px` } }}
      >
        <DialogTitle
          sx={{
            fontWeight: 600,
            color: tokens.primary.main,
            background: tokens.primary.soft,
          }}
        >
          {editingTemplate ? 'Edit Email Template' : 'Create Email Template'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }} className="aos-fade-up">
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Template Name"
                  required
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g., Entry Not Created Notification"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: `${tokens.radius.button}px` } }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Template Type"
                  value={templateType}
                  onChange={(e) => setTemplateType(e.target.value as EmailTemplate['type'])}
                  required
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: `${tokens.radius.button}px` } }}
                >
                  <MenuItem value="entry_not_created">Entry Not Created</MenuItem>
                  <MenuItem value="entry_not_submitted">Entry Not Submitted</MenuItem>
                  <MenuItem value="submission_to_manager">Submission to Manager</MenuItem>
                  <MenuItem value="review_request">Review Request to Entry Person</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email Subject"
                  required
                  value={templateSubject}
                  onChange={(e) => setTemplateSubject(e.target.value)}
                  placeholder="e.g., Reminder: MIS Entry Not Created for {{date}}"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: `${tokens.radius.button}px` } }}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: tokens.text.secondary, mb: 1 }}>
                  Available Placeholders:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {getPlaceholdersForType(templateType).map(placeholder => (
                    <Chip
                      key={placeholder}
                      label={placeholder}
                      size="small"
                      onClick={() => insertPlaceholder(placeholder)}
                      sx={{
                        backgroundColor: 'rgba(40, 121, 182, 0.1)',
                        color: tokens.primary.main,
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: 'rgba(40, 121, 182, 0.2)',
                        },
                      }}
                    />
                  ))}
                </Box>
                <TextField
                  fullWidth
                  label="Email Body"
                  required
                  multiline
                  rows={8}
                  value={templateBody}
                  onChange={(e) => setTemplateBody(e.target.value)}
                  placeholder="Enter your email template content here. Click placeholders above to insert them."
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: `${tokens.radius.button}px` } }}
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  onClick={() => setShowPreview(!showPreview)}
                  sx={{
                    textTransform: 'none',
                    borderRadius: `${tokens.radius.card}px`,
                    borderColor: tokens.primary.main,
                    color: tokens.primary.main,
                    whiteSpace: 'nowrap',
                    '&:hover': {
                      borderColor: tokens.primary.main,
                      backgroundColor: 'rgba(40, 121, 182, 0.05)',
                    },
                  }}
                >
                  {showPreview ? 'Hide Preview' : 'Show Preview'}
                </Button>
                {showPreview && renderPreview()}
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ flexDirection: isPhone ? 'column' : 'row' }}>
          <Button variant="outlined" onClick={() => setOpenTemplateDialog(false)} fullWidth={isPhone} sx={{ minWidth: 96 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveTemplate}
            disabled={saving || !templateName || !templateSubject || !templateBody}
            startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            fullWidth={isPhone}
            sx={{ minWidth: 128, whiteSpace: 'nowrap' }}
          >
            {editingTemplate ? 'Save Changes' : 'Create Template'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Scheduler Configuration Dialog */}
      <Dialog
        open={openSchedulerDialog}
        onClose={() => setOpenSchedulerDialog(false)}
        maxWidth="sm"
        fullWidth
        TransitionComponent={Transition}
        
      >
        <DialogTitle
          sx={{
            fontWeight: 600,
            color: tokens.primary.main,
            background: tokens.primary.soft,
          }}
        >
          Configure Notification Scheduler
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }} className="aos-fade-up">
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notification Type"
                  value={getNotificationTypeLabel(schedulerNotificationType)}
                  disabled
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: `${tokens.radius.button}px` } }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Check Time"
                  type="time"
                  value={schedulerCheckTime}
                  onChange={(e) => setSchedulerCheckTime(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: `${tokens.radius.button}px` } }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Reminder Frequency"
                  value={schedulerReminderFrequency}
                  onChange={(e) => setSchedulerReminderFrequency(e.target.value as 'once' | 'daily' | 'hourly')}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: `${tokens.radius.button}px` } }}
                >
                  <MenuItem value="once">Once</MenuItem>
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="hourly">Hourly</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Email Template"
                  value={schedulerTemplateId}
                  onChange={(e) => setSchedulerTemplateId(Number(e.target.value))}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: `${tokens.radius.button}px` } }}
                >
                  {emailTemplates
                    .filter(t => t.type === schedulerNotificationType)
                    .map(template => (
                      <MenuItem key={template.id} value={template.id}>
                        {template.name}
                      </MenuItem>
                    ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: tokens.text.secondary, mb: 1 }}>
                  Recipient Roles:
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {['Admin', 'Manager', 'Operator'].map(role => (
                    <FormControlLabel
                      key={role}
                      control={
                        <Checkbox
                          checked={(schedulerRecipientRoles || []).includes(role)}
                          onChange={() => handleRoleToggle(role)}
                          sx={{
                            color: tokens.primary.main,
                            '&.Mui-checked': { color: tokens.primary.main },
                          }}
                        />
                      }
                      label={role}
                    />
                  ))}
                </Box>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ flexDirection: isPhone ? 'column' : 'row' }}>
          <Button variant="outlined" onClick={() => setOpenSchedulerDialog(false)} fullWidth={isPhone} sx={{ minWidth: 96 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveSchedulerConfig}
            disabled={saving || (Array.isArray(schedulerRecipientRoles) ? schedulerRecipientRoles.length === 0 : true)}
            startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            fullWidth={isPhone}
            sx={{ minWidth: 128, whiteSpace: 'nowrap' }}
          >
            Save Configuration
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
