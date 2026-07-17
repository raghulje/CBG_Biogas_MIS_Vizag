import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import type { SxProps, Theme } from '@mui/material/styles';
import { format, isValid, parseISO } from 'date-fns';

function parseDateString(value: string): Date | null {
  if (!value) return null;
  const parsed = parseISO(value.length === 7 ? `${value}-01` : value);
  return isValid(parsed) ? parsed : null;
}

export type AppDateFieldProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  size?: 'small' | 'medium';
  fullWidth?: boolean;
  disabled?: boolean;
  required?: boolean;
  sx?: SxProps<Theme>;
  /** `date` → yyyy-MM-dd; `month` → yyyy-MM */
  viewsMode?: 'date' | 'month';
};

/**
 * Shared date field using MUI X DatePicker (string value yyyy-MM-dd / yyyy-MM).
 * Replaces native `<input type="date">` so the calendar matches the design system.
 */
export function AppDateField({
  label,
  value,
  onChange,
  size = 'small',
  fullWidth,
  disabled,
  required,
  sx,
  viewsMode = 'date',
}: AppDateFieldProps) {
  const isMonth = viewsMode === 'month';

  return (
    <DatePicker
      label={label}
      value={parseDateString(value)}
      onChange={(next) => {
        if (!next || !isValid(next)) {
          onChange('');
          return;
        }
        onChange(format(next, isMonth ? 'yyyy-MM' : 'yyyy-MM-dd'));
      }}
      disabled={disabled}
      views={isMonth ? ['year', 'month'] : undefined}
      openTo={isMonth ? 'month' : 'day'}
      format={isMonth ? 'MMM yyyy' : 'dd MMM yyyy'}
      slotProps={{
        textField: {
          size,
          fullWidth,
          required,
          sx,
        },
        actionBar: {
          actions: ['clear', 'today'],
        },
        popper: {
          placement: 'bottom-start',
        },
      }}
    />
  );
}
