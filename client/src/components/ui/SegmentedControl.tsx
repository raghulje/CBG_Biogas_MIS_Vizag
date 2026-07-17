import { Box, Button } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import { tokens } from '../../themes';

export type SegmentOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type SegmentedControlProps = {
  options: SegmentOption[];
  value: string;
  onChange: (value: string) => void;
  size?: 'sm' | 'md';
  'aria-label'?: string;
  sx?: SxProps<Theme>;
};

/**
 * Premium connected segmented control (Linear / Vercel / Stripe style).
 * Shared across Dashboard, Final MIS, Reports, Analytics.
 */
export function SegmentedControl({
  options,
  value,
  onChange,
  size = 'md',
  'aria-label': ariaLabel = 'Period filter',
  sx,
}: SegmentedControlProps) {
  const height = size === 'sm' ? 32 : 36;

  return (
    <Box
      role="tablist"
      aria-label={ariaLabel}
      sx={{
        display: 'inline-flex',
        alignItems: 'stretch',
        flexWrap: 'wrap',
        bgcolor: tokens.surface,
        border: `1px solid ${tokens.border}`,
        borderRadius: `${tokens.radius.button}px`,
        overflow: 'hidden',
        boxShadow: tokens.shadow.sm,
        ...sx,
      }}
    >
      {options.map((option, index) => {
        const active = value === option.value;
        const isFirst = index === 0;
        const isLast = index === options.length - 1;

        return (
          <Button
            key={option.value}
            role="tab"
            aria-selected={active}
            disabled={option.disabled}
            disableElevation
            disableRipple={false}
            onClick={() => onChange(option.value)}
            sx={{
              minWidth: { xs: 68, sm: 88 },
              height,
              px: { xs: 1.25, sm: 1.75 },
              py: 0,
              m: 0,
              fontSize: 13,
              fontWeight: active ? 600 : 500,
              letterSpacing: '-0.01em',
              textTransform: 'none',
              lineHeight: 1,
              borderRadius: 0,
              border: 'none',
              borderRight: isLast ? 'none' : `1px solid ${tokens.border}`,
              bgcolor: active ? tokens.primary.main : tokens.surface,
              color: active ? '#fff' : tokens.text.secondary,
              boxShadow: active ? '0 1px 3px rgba(40,121,182,0.35)' : 'none',
              zIndex: active ? 1 : 0,
              transition:
                'background-color 200ms ease, color 200ms ease, box-shadow 200ms ease, transform 200ms ease',
              '&:hover': {
                bgcolor: active ? tokens.primary.hover : alphaWhite,
                color: active ? '#fff' : tokens.text.primary,
                transform: active ? 'none' : 'none',
              },
              '&:active': {
                transform: 'scale(0.98)',
              },
              '&.Mui-disabled': {
                opacity: 0.45,
                color: tokens.text.muted,
              },
              // Outer corners only — matches shared container radius
              ...(isFirst && {
                borderTopLeftRadius: `${tokens.radius.button - 1}px`,
                borderBottomLeftRadius: `${tokens.radius.button - 1}px`,
              }),
              ...(isLast && {
                borderTopRightRadius: `${tokens.radius.button - 1}px`,
                borderBottomRightRadius: `${tokens.radius.button - 1}px`,
              }),
            }}
          >
            {option.label}
          </Button>
        );
      })}
    </Box>
  );
}

const alphaWhite = 'rgba(246,248,251,0.95)';

export default SegmentedControl;
