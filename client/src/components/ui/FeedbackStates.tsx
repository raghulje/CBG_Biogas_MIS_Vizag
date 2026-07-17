import { Box, Typography, Button, Alert, Skeleton, Stack } from '@mui/material';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import type { ReactNode } from 'react';
import { tokens } from '../../themes';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
}

export function EmptyState({
  title = 'No data found',
  description = 'There is nothing to show here yet.',
  actionLabel,
  onAction,
  icon,
}: EmptyStateProps) {
  return (
    <Box
      role="status"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        py: 6,
        px: 3,
        gap: 1.5,
        bgcolor: tokens.surface,
        border: `1px solid ${tokens.border}`,
        borderRadius: `${tokens.radius.card}px`,
        boxShadow: tokens.shadow.sm,
      }}
    >
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: `${tokens.radius.card}px`,
          bgcolor: tokens.primary.soft,
          color: tokens.primary.main,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 0.5,
        }}
        aria-hidden
      >
        {icon || <InboxOutlinedIcon sx={{ fontSize: tokens.control.iconLg }} />}
      </Box>
      <Typography sx={{ fontSize: 16, fontWeight: 600, color: tokens.text.primary }}>
        {title}
      </Typography>
      <Typography sx={{ fontSize: 14, color: tokens.text.secondary, maxWidth: 360 }}>
        {description}
      </Typography>
      {actionLabel && onAction && (
        <Button variant="contained" color="primary" onClick={onAction} sx={{ mt: 1 }}>
          {actionLabel}
        </Button>
      )}
    </Box>
  );
}

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'We could not load this data. Please try again.',
  onRetry,
}: ErrorStateProps) {
  return (
    <Box sx={{ py: 1 }}>
      <Alert
        severity="error"
        icon={<ErrorOutlineIcon />}
        sx={{
          borderRadius: `${tokens.radius.card}px`,
          border: `1px solid ${tokens.danger.soft}`,
          bgcolor: tokens.danger.soft,
          '& .MuiAlert-message': { width: '100%' },
        }}
        action={
          onRetry ? (
            <Button color="inherit" size="small" onClick={onRetry} aria-label="Retry loading">
              Retry
            </Button>
          ) : undefined
        }
      >
        <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{title}</Typography>
        <Typography sx={{ fontSize: 13 }}>{message}</Typography>
      </Alert>
    </Box>
  );
}

interface TableSkeletonProps {
  rows?: number;
  cols?: number;
}

export function TableSkeleton({ rows = 6, cols = 5 }: TableSkeletonProps) {
  return (
    <Box
      aria-busy="true"
      aria-label="Loading table"
      sx={{
        bgcolor: tokens.surface,
        border: `1px solid ${tokens.border}`,
        borderRadius: `${tokens.radius.table}px`,
        p: 2,
        boxShadow: tokens.shadow.sm,
      }}
    >
      <Stack spacing={1.5}>
        <Skeleton variant="rounded" height={40} sx={{ borderRadius: '10px', bgcolor: tokens.divider }} />
        {Array.from({ length: rows }).map((_, i) => (
          <Stack key={i} direction="row" spacing={1}>
            {Array.from({ length: cols }).map((__, j) => (
              <Skeleton
                key={j}
                variant="rounded"
                height={36}
                sx={{ flex: 1, borderRadius: '8px', bgcolor: i % 2 === 0 ? tokens.divider : '#F8FAFC' }}
              />
            ))}
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}

interface KpiSkeletonProps {
  count?: number;
}

export function KpiSkeleton({ count = 4 }: KpiSkeletonProps) {
  return (
    <Box
      aria-busy="true"
      aria-label="Loading metrics"
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: `repeat(${Math.min(count, 4)}, 1fr)` },
        gap: 2,
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton
          key={i}
          variant="rounded"
          height={120}
          sx={{ borderRadius: `${tokens.radius.card}px`, bgcolor: tokens.divider }}
        />
      ))}
    </Box>
  );
}
