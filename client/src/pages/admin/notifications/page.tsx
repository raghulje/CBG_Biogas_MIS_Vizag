import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Tab,
  Tabs,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import { adminService } from '../../../services/adminService';
import { PageHeader, SurfaceCard } from '../../../components/ui/PageChrome';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useSnackbar } from 'notistack';
import MESSAGES from '../../../utils/messages';
import { tokens } from '../../../themes';

interface Scheduler {
  id: number;
  name: string;
  cron_expression: string;
  job_type: string;
  is_active: boolean;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: { name: string };
}

interface Template {
  id: number;
  name: string;
  subject: string;
  body: string;
}

function TabPanel(props: { children?: React.ReactNode; index: number; value: number }) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: { xs: 2, sm: 2.5 } }}>{children}</Box>}
    </div>
  );
}

const timeFieldSx = {
  width: '100%',
  '& .MuiOutlinedInput-root': {
    borderRadius: `${tokens.radius.input}px`,
  },
};

const primaryBtnSx = {
  textTransform: 'none' as const,
  fontWeight: 600,
  borderRadius: `${tokens.radius.button}px`,
  minWidth: 140,
  height: 40,
};

function RecipientList({
  title,
  description,
  users,
  selected,
  onToggle,
  isPhone,
}: {
  title: string;
  description: string;
  users: User[];
  selected: string[];
  onToggle: (email: string) => void;
  isPhone: boolean;
}) {
  return (
    <SurfaceCard
      title={title}
      sx={{ height: '100%' }}
    >
      <Typography sx={{ fontSize: 13, color: tokens.text.secondary, mb: 1.5, mt: -0.5, lineHeight: 1.45 }}>
        {description}
      </Typography>
      <Box
        sx={{
          maxHeight: { xs: '46vh', md: 340 },
          overflow: 'auto',
          border: `1px solid ${tokens.border}`,
          borderRadius: `${tokens.radius.input}px`,
          bgcolor: tokens.bg,
          '&::-webkit-scrollbar': { width: 6 },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: tokens.border,
            borderRadius: 4,
          },
        }}
      >
        <List dense={!isPhone} disablePadding>
          {users.length === 0 ? (
            <Box sx={{ p: 2.5, textAlign: 'center' }}>
              <Typography sx={{ fontSize: 13, color: tokens.text.muted }}>No users available</Typography>
            </Box>
          ) : (
            users.map((user) => {
              const checked = selected.includes(user.email);
              return (
                <ListItem
                  key={user.id}
                  onClick={() => onToggle(user.email)}
                  sx={{
                    cursor: 'pointer',
                    minHeight: isPhone ? 52 : 44,
                    px: 1.5,
                    borderBottom: `1px solid ${tokens.divider}`,
                    bgcolor: checked ? tokens.primary.soft : 'transparent',
                    '&:hover': { bgcolor: checked ? tokens.primary.soft : 'rgba(40,121,182,0.04)' },
                    '&:last-child': { borderBottom: 'none' },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <Checkbox
                      edge="start"
                      checked={checked}
                      disableRipple
                      size="small"
                      sx={{
                        color: tokens.primary.main,
                        '&.Mui-checked': { color: tokens.primary.main },
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={user.name}
                    secondary={`${user.email} · ${user.role?.name || '—'}`}
                    primaryTypographyProps={{
                      sx: { fontSize: 13.5, fontWeight: 600, color: tokens.text.primary },
                    }}
                    secondaryTypographyProps={{
                      sx: { fontSize: 12, color: tokens.text.muted },
                    }}
                  />
                </ListItem>
              );
            })
          )}
        </List>
      </Box>
      <Typography sx={{ mt: 1.25, fontSize: 12, fontWeight: 600, color: tokens.text.muted }}>
        {selected.length} selected
      </Typography>
    </SurfaceCard>
  );
}

export default function NotificationConfigPage() {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isPhone = useMediaQuery('(max-width:768px)');
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [schedulers, setSchedulers] = useState<Scheduler[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);

  const [siteUserEmails, setSiteUserEmails] = useState<string[]>([]);
  const [managerEmails, setManagerEmails] = useState<string[]>([]);
  const [submitEmails, setSubmitEmails] = useState<string[]>([]);
  const [approvedEditors, setApprovedEditors] = useState<string[]>([]);

  const [creationCheckTime, setCreationCheckTime] = useState<Date | null>(null);
  const [escalationCheckTime, setEscalationCheckTime] = useState<Date | null>(null);
  const [misStartTime, setMisStartTime] = useState<Date | null>(null);
  const [misEndTime, setMisEndTime] = useState<Date | null>(null);
  const [reminderStartTime, setReminderStartTime] = useState<Date | null>(null);
  const [reminderInterval, setReminderInterval] = useState<number>(60);
  const [reminderCount, setReminderCount] = useState<number>(4);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [schedList, userList, templateList, misConfig, nsched] = await Promise.all([
        adminService.getSchedulers(),
        adminService.getUsers(),
        adminService.getTemplates(),
        adminService.getMISEmailConfig(),
        adminService.getNotificationSchedule(),
      ]);

      setSchedulers(schedList);
      setUsers(userList);
      setTemplates(templateList);

      setSiteUserEmails(misConfig.entry_not_created_emails || []);
      setManagerEmails(misConfig.escalation_notify_emails || []);
      setSubmitEmails(misConfig.submit_notify_emails || []);
      setApprovedEditors(misConfig.approved_editor_emails || []);

      if (nsched) {
        const parseTime = (t: string) => {
          const [h, m] = (t || '00:00').split(':').map((s) => Number(s));
          const d = new Date();
          d.setHours(h, m || 0, 0, 0);
          return d;
        };
        setMisStartTime(nsched.mis_start_time ? parseTime(nsched.mis_start_time) : null);
        setMisEndTime(nsched.mis_end_time ? parseTime(nsched.mis_end_time) : null);
        setReminderStartTime(
          nsched.reminder_start_time
            ? parseTime(nsched.reminder_start_time)
            : nsched.mis_end_time
              ? parseTime(nsched.mis_end_time)
              : null,
        );
        setReminderInterval(nsched.reminder_interval_minutes || 60);
        setReminderCount(nsched.reminder_count || 4);
      }

      const creationJob = schedList.find((s: Scheduler) => s.job_type === 'mis_creation_check');
      if (creationJob) {
        const [mm, hh] = creationJob.cron_expression.split(' ');
        const date = new Date();
        date.setHours(parseInt(hh), parseInt(mm));
        setCreationCheckTime(date);
      } else {
        const d = new Date();
        d.setHours(16, 45);
        setCreationCheckTime(d);
      }

      const escalationJob = schedList.find((s: Scheduler) => s.job_type === 'mis_escalation_check');
      if (escalationJob) {
        const [mm, hh] = escalationJob.cron_expression.split(' ');
        const date = new Date();
        date.setHours(parseInt(hh), parseInt(mm));
        setEscalationCheckTime(date);
      } else {
        const d = new Date();
        d.setHours(17, 30);
        setEscalationCheckTime(d);
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (tabValue === 1) {
      fetchData();
    }
  }, [tabValue]);

  const handleSaveSchedule = async () => {
    try {
      setError(null);
      setSuccess(null);

      const creationJob = schedulers.find((s) => s.job_type === 'mis_creation_check');
      const escalationJob = schedulers.find((s) => s.job_type === 'mis_escalation_check');

      if (creationCheckTime && creationJob) {
        const cron = `${creationCheckTime.getMinutes()} ${creationCheckTime.getHours()} * * *`;
        await adminService.updateScheduler(creationJob.id, { cron_expression: cron });
      } else if (creationCheckTime && !creationJob) {
        const cron = `${creationCheckTime.getMinutes()} ${creationCheckTime.getHours()} * * *`;
        await adminService.createScheduler({
          name: 'MIS Creation Check',
          cron_expression: cron,
          job_type: 'mis_creation_check',
          is_active: true,
        });
      }

      if (escalationCheckTime && escalationJob) {
        const cron = `${escalationCheckTime.getMinutes()} ${escalationCheckTime.getHours()} * * *`;
        await adminService.updateScheduler(escalationJob.id, { cron_expression: cron });
      } else if (escalationCheckTime && !escalationJob) {
        const cron = `${escalationCheckTime.getMinutes()} ${escalationCheckTime.getHours()} * * *`;
        await adminService.createScheduler({
          name: 'MIS Escalation Check',
          cron_expression: cron,
          job_type: 'mis_escalation_check',
          is_active: true,
        });
      }

      if (misStartTime && misEndTime) {
        const fmt = (d: Date) =>
          `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        await adminService.saveNotificationSchedule({
          mis_start_time: fmt(misStartTime),
          mis_end_time: fmt(misEndTime),
          reminder_start_time: reminderStartTime ? fmt(reminderStartTime) : fmt(misEndTime),
          reminder_interval_minutes: Number(reminderInterval),
          reminder_count: Number(reminderCount),
        });
      }

      setSuccess('Schedule updated successfully');
      enqueueSnackbar(MESSAGES.SCHEDULE_UPDATED, { variant: 'success' });
      await fetchData();
    } catch (err) {
      setError('Failed to save schedule');
      enqueueSnackbar(MESSAGES.SCHEDULE_UPDATE_FAILED, { variant: 'error' });
    }
  };

  const handleSaveRecipients = async () => {
    try {
      setError(null);
      setSuccess(null);

      await adminService.saveMISEmailConfig({
        entry_not_created_emails: siteUserEmails,
        not_submitted_notify_emails: siteUserEmails,
        submit_notify_emails: submitEmails,
        escalation_notify_emails: managerEmails,
        approved_editor_emails: approvedEditors,
      });
      setSuccess('Recipients updated successfully');
      enqueueSnackbar(MESSAGES.RECIPIENTS_UPDATED, { variant: 'success' });
    } catch (err) {
      setError('Failed to save recipients');
      enqueueSnackbar(MESSAGES.RECIPIENTS_UPDATE_FAILED, { variant: 'error' });
    }
  };

  const handleToggleSiteUser = (email: string) => {
    if (!email) return;
    setSiteUserEmails((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email],
    );
  };

  const handleToggleManager = (email: string) => {
    if (!email) return;
    setManagerEmails((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email],
    );
  };

  const handleToggleSubmitNotify = (email: string) => {
    if (!email) return;
    setSubmitEmails((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email],
    );
  };

  const handleToggleApprovedEditor = (email: string) => {
    if (!email) return;
    setApprovedEditors((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email],
    );
  };

  // Keep template save path available for future use (templates managed in Admin Email Templates)
  void templates;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 280, gap: 1.5 }}>
        <CircularProgress size={36} />
        <Typography sx={{ fontSize: 14, color: tokens.text.secondary, fontWeight: 500 }}>
          Loading notification settings…
        </Typography>
      </Box>
    );
  }

  const tabSx = {
    minHeight: 48,
    px: { xs: 0.5, sm: 1 },
    borderBottom: `1px solid ${tokens.divider}`,
    '& .MuiTab-root': {
      textTransform: 'none',
      fontWeight: 600,
      fontSize: 13.5,
      minHeight: 48,
      px: { xs: 1.75, sm: 2.25 },
      color: tokens.text.secondary,
    },
    '& .Mui-selected': {
      color: `${tokens.primary.main} !important`,
    },
    '& .MuiTabs-indicator': {
      backgroundColor: tokens.primary.main,
      height: 3,
      borderRadius: '3px 3px 0 0',
    },
  };

  return (
    <Box>
      <PageHeader
        dense
        title="In-App Notifications"
        subtitle="Configure schedules and recipient mappings"
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: `${tokens.radius.button}px` }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2, borderRadius: `${tokens.radius.button}px` }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Box
        sx={{
          bgcolor: tokens.surface,
          borderRadius: `${tokens.radius.card}px`,
          overflow: 'hidden',
          border: `1px solid ${tokens.border}`,
          boxShadow: tokens.shadow.sm,
        }}
      >
        <Tabs
          value={tabValue}
          onChange={(_, v) => setTabValue(v)}
          variant={isMobile ? 'scrollable' : 'standard'}
          scrollButtons={isMobile ? 'auto' : false}
          sx={tabSx}
        >
          <Tab label="Schedule" />
          <Tab label="Recipients Mapping" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <SurfaceCard title="Daily Check (Site Users)">
                  <Typography sx={{ fontSize: 13, color: tokens.text.secondary, mb: 2, lineHeight: 1.55, mt: -0.5 }}>
                    At this time, the system checks if an entry exists for today.
                    <br />
                    If none → notify site users (Not Created).
                    <br />
                    If draft → notify site users (Not Submitted).
                  </Typography>
                  <TimePicker
                    label="Check Time"
                    value={creationCheckTime}
                    onChange={(val) => setCreationCheckTime(val)}
                    slotProps={{ textField: { fullWidth: true, size: 'small', sx: timeFieldSx } }}
                  />
                </SurfaceCard>
              </Grid>

              <Grid item xs={12} md={6}>
                <SurfaceCard title="Escalation Check (Managers)">
                  <Typography sx={{ fontSize: 13, color: tokens.text.secondary, mb: 2, lineHeight: 1.55, mt: -0.5 }}>
                    At this time, the system re-checks if the entry is submitted.
                    <br />
                    If missing or still draft → notify managers (Escalation).
                  </Typography>
                  <TimePicker
                    label="Escalation Time"
                    value={escalationCheckTime}
                    onChange={(val) => setEscalationCheckTime(val)}
                    slotProps={{ textField: { fullWidth: true, size: 'small', sx: timeFieldSx } }}
                  />
                </SurfaceCard>
              </Grid>

              <Grid item xs={12}>
                <SurfaceCard title="MIS Filling Window & Reminders">
                  <Typography sx={{ fontSize: 13, color: tokens.text.secondary, mb: 2, lineHeight: 1.55, mt: -0.5 }}>
                    Configure the daily MIS window and reminder cadence for operators.
                  </Typography>
                  <Grid container spacing={1.75}>
                    <Grid item xs={12} sm={6} md={4}>
                      <TimePicker
                        label="MIS Start Time"
                        value={misStartTime}
                        onChange={(v) => setMisStartTime(v)}
                        slotProps={{ textField: { fullWidth: true, size: 'small', sx: timeFieldSx } }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <TimePicker
                        label="MIS End Time"
                        value={misEndTime}
                        onChange={(v) => setMisEndTime(v)}
                        slotProps={{ textField: { fullWidth: true, size: 'small', sx: timeFieldSx } }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <TimePicker
                        label="Reminder Start Time"
                        value={reminderStartTime}
                        onChange={(v) => setReminderStartTime(v)}
                        slotProps={{ textField: { fullWidth: true, size: 'small', sx: timeFieldSx } }}
                      />
                    </Grid>
                    <Grid item xs={6} sm={3} md={2}>
                      <TextField
                        label="Interval (min)"
                        type="number"
                        size="small"
                        fullWidth
                        value={reminderInterval}
                        onChange={(e) => setReminderInterval(Number(e.target.value || 0))}
                      />
                    </Grid>
                    <Grid item xs={6} sm={3} md={2}>
                      <TextField
                        label="Reminder Count"
                        type="number"
                        size="small"
                        fullWidth
                        value={reminderCount}
                        onChange={(e) => setReminderCount(Number(e.target.value || 0))}
                      />
                    </Grid>
                  </Grid>
                </SurfaceCard>
              </Grid>
            </Grid>

            <Box sx={{ mt: 2.5, display: 'flex', justifyContent: { xs: 'stretch', sm: 'flex-end' } }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSaveSchedule}
                fullWidth={isMobile}
                sx={primaryBtnSx}
              >
                Save Schedule
              </Button>
            </Box>
          </LocalizationProvider>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <RecipientList
                title="Site Users (Daily Alerts)"
                description='Receive "Not Created" and "Not Submitted" alerts.'
                users={users}
                selected={siteUserEmails}
                onToggle={handleToggleSiteUser}
                isPhone={isPhone}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <RecipientList
                title="Managers (Escalation Alerts)"
                description='Receive "Escalation" alerts when entries remain unsubmitted.'
                users={users}
                selected={managerEmails}
                onToggle={handleToggleManager}
                isPhone={isPhone}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <RecipientList
                title="Approved Editors"
                description="Users allowed to edit MIS entries after approval."
                users={users}
                selected={approvedEditors}
                onToggle={handleToggleApprovedEditor}
                isPhone={isPhone}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <RecipientList
                title="Approvers (Submission Review)"
                description="Receive submission notifications and can approve entries."
                users={users}
                selected={submitEmails}
                onToggle={handleToggleSubmitNotify}
                isPhone={isPhone}
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 2.5, display: 'flex', justifyContent: { xs: 'stretch', sm: 'flex-end' } }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSaveRecipients}
              fullWidth={isMobile}
              sx={primaryBtnSx}
            >
              Save Recipients
            </Button>
          </Box>
        </TabPanel>
      </Box>
    </Box>
  );
}
