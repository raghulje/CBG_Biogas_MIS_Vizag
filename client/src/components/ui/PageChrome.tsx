import { Box, Typography, Button, Stack } from '@mui/material';
import type { ReactNode, CSSProperties } from 'react';
import { tokens } from '../../themes';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  /** Reduce bottom margin for denser pages */
  dense?: boolean;
}

/** Shared enterprise page chrome — title / subtitle / actions */
export function PageHeader({ title, subtitle, actions, dense }: PageHeaderProps) {
  return (
    <Box
      className="page-header"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexDirection: { xs: 'column', sm: 'row' },
        gap: dense ? 1 : 1.5,
        mb: dense ? 1.25 : 2.5,
        py: dense ? 0 : 0.25,
      }}
    >
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          component="h1"
          sx={{
            fontSize: dense ? 18 : 24,
            fontWeight: 700,
            color: tokens.text.primary,
            lineHeight: 1.25,
            letterSpacing: '-0.015em',
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography sx={{ fontSize: dense ? 12.5 : 14, color: tokens.text.secondary, mt: dense ? 0.15 : 0.5, lineHeight: 1.3 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {actions && (
        <Stack
          direction="row"
          spacing={1}
          flexWrap="wrap"
          useFlexGap
          alignItems="center"
          sx={{ flexShrink: 0 }}
        >
          {actions}
        </Stack>
      )}
    </Box>
  );
}

/** Standard filter-row field widths — use with theme-controlled heights */
export const filterFieldSx = {
  minWidth: 160,
  width: { xs: '100%', sm: 180 },
};

export const filterSelectSx = {
  minWidth: 140,
  width: { xs: '100%', sm: 160 },
};

export const filterDateSx = {
  width: { xs: '100%', sm: 160 },
  minWidth: 140,
};

/** Consistent toolbar action buttons (Import / Export / Load / Save) */
export const filterActionSx = {
  minWidth: 112,
  whiteSpace: 'nowrap' as CSSProperties['whiteSpace'],
};

/**
 * @deprecated Prefer `SegmentedControl` for period filters.
 * Kept for any remaining ButtonGroup call sites during migration.
 */
export const segmentedGroupSx = {
  flexWrap: 'wrap' as const,
  gap: 0,
};

export { SegmentedControl } from './SegmentedControl';
export type { SegmentOption, SegmentedControlProps } from './SegmentedControl';

interface FilterToolbarProps {
  title?: string;
  /** Optional badge next to the title (e.g. record count) */
  titleAdornment?: ReactNode;
  children: ReactNode;
  /** Tighter padding for denser enterprise toolbars */
  dense?: boolean;
  sx?: object;
}

/** Premium filter surface used across list pages */
export function FilterToolbar({ title, titleAdornment, children, dense = true, sx = {} }: FilterToolbarProps) {
  return (
    <Box
      className="filter-toolbar"
      sx={{
        bgcolor: tokens.surface,
        border: `1px solid ${tokens.border}`,
        borderRadius: `${tokens.radius.card}px`,
        boxShadow: tokens.shadow.sm,
        p: { xs: 2, sm: dense ? 2 : 2.5 },
        mb: dense ? 2 : 3,
        ...sx,
      }}
    >
      {(title || titleAdornment) && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1.5,
            flexWrap: 'wrap',
            mb: 1.5,
          }}
        >
          {title && (
            <Typography
              sx={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: tokens.text.muted,
              }}
            >
              {title}
            </Typography>
          )}
          {titleAdornment}
        </Box>
      )}
      {children}
    </Box>
  );
}

/** Standard single-row filter controls cluster */
export function FilterToolbarRow({ children }: { children: ReactNode }) {
  return (
    <Box
      className="filter-toolbar-row"
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 1.5,
      }}
    >
      {children}
    </Box>
  );
}

interface SurfaceCardProps {
  children: ReactNode;
  title?: string;
  action?: ReactNode;
  sx?: object;
}

export function SurfaceCard({ children, title, action, sx = {} }: SurfaceCardProps) {
  return (
    <Box
      sx={{
        bgcolor: tokens.surface,
        border: `1px solid ${tokens.border}`,
        borderRadius: `${tokens.radius.card}px`,
        boxShadow: tokens.shadow.sm,
        overflow: 'hidden',
        ...sx,
      }}
    >
      {(title || action) && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            px: 2.5,
            py: 2,
            borderBottom: `1px solid ${tokens.divider}`,
          }}
        >
          {title && (
            <Typography sx={{ fontSize: 16, fontWeight: 600, color: tokens.text.primary }}>
              {title}
            </Typography>
          )}
          {action}
        </Box>
      )}
      <Box sx={{ p: 2.5 }}>{children}</Box>
    </Box>
  );
}

export { Button };
