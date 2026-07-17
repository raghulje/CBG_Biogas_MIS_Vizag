import { createTheme, alpha } from '@mui/material/styles';

/**
 * Biogas MIS Enterprise Design System
 * Tokens aligned to Refex brand + Azure / Fabric / ServiceNow density.
 */

export const tokens = {
  primary: {
    main: '#2879B6',
    hover: '#23669A',
    soft: '#EAF4FB',
    border: '#BFDDF0',
    light: '#4A9AD0',
    dark: '#1B5F8F',
  },
  success: { main: '#34A853', soft: '#EDF8F0', dark: '#2D8E46', light: '#5CBB72' },
  warning: { main: '#F59E0B', soft: '#FFF7E6', dark: '#D97706', light: '#FBBF24' },
  danger: { main: '#DC3545', soft: '#FDECEC', dark: '#B02A37', light: '#E4606D' },
  info: { main: '#0288D1', soft: '#E1F5FE', dark: '#01579B', light: '#29B6F6' },
  bg: '#F6F8FB',
  surface: '#FFFFFF',
  border: '#E5E7EB',
  divider: '#EEF2F7',
  text: {
    primary: '#1E293B',
    secondary: '#64748B',
    muted: '#64748B',
  },
  shadow: {
    sm: '0 1px 2px rgba(15,23,42,0.05)',
    md: '0 6px 18px rgba(15,23,42,0.06)',
    lg: '0 12px 32px rgba(15,23,42,0.08)',
  },
  radius: {
    button: 10,
    input: 10,
    card: 14,
    dialog: 16,
    table: 14,
    chip: 8,
  },
  /** Shared control metrics — buttons, inputs, selects, date fields */
  control: {
    height: 44,
    heightSm: 36,
    paddingX: 16,
    paddingXSm: 12,
    iconSm: 18,
    iconMd: 20,
    iconLg: 24,
    focusRing: 3,
  },
  /** 4pt spacing scale — prefer these values in layout sx */
  space: {
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    8: 32,
    10: 40,
  },
};

/** Admin theme presets — classic is the product default; others keep primary brand identity variants */
export const themePresets = {
  classic: {
    key: 'classic',
    name: 'Classic (Blue)',
    palette: {
      primary: { main: tokens.primary.main, light: tokens.primary.light, dark: tokens.primary.dark },
      secondary: { main: tokens.success.main, light: tokens.success.light, dark: tokens.success.dark },
      background: { default: tokens.bg, paper: tokens.surface },
      text: { primary: tokens.text.primary, secondary: tokens.text.secondary },
    },
  },
  professional: {
    key: 'professional',
    name: 'Professional (Blue-Green)',
    palette: {
      primary: { main: '#1f6e8c', light: '#57a3c6', dark: '#164d63' },
      secondary: { main: tokens.success.main, light: tokens.success.light, dark: tokens.success.dark },
      background: { default: tokens.bg, paper: tokens.surface },
      text: { primary: tokens.text.primary, secondary: tokens.text.secondary },
    },
  },
  slate: {
    key: 'slate',
    name: 'Slate (Gray)',
    palette: {
      primary: { main: '#2c3e50', light: '#3b5569', dark: '#1f2a33' },
      secondary: { main: '#64748B', light: '#94A3B8', dark: '#475569' },
      background: { default: tokens.bg, paper: tokens.surface },
      text: { primary: tokens.text.primary, secondary: tokens.text.secondary },
    },
  },
  emerald: {
    key: 'emerald',
    name: 'Emerald (Green)',
    palette: {
      primary: { main: '#116b4a', light: '#389b70', dark: '#0b4b34' },
      secondary: { main: tokens.success.main, light: tokens.success.light, dark: tokens.success.dark },
      background: { default: tokens.bg, paper: tokens.surface },
      text: { primary: tokens.text.primary, secondary: tokens.text.secondary },
    },
  },
  charcoal: {
    key: 'charcoal',
    name: 'Charcoal',
    palette: {
      primary: { main: '#1b2b34', light: '#334953', dark: '#0f1a1f' },
      secondary: { main: '#6b7280', light: '#9aa0a8', dark: '#4a4f56' },
      background: { default: tokens.bg, paper: tokens.surface },
      text: { primary: tokens.text.primary, secondary: tokens.text.secondary },
    },
  },
};

export function createAppTheme(presetKey = 'classic') {
  const preset = (themePresets as Record<string, typeof themePresets.classic>)[presetKey] || themePresets.classic;
  const primaryMain = preset.palette.primary.main;
  const isClassic = presetKey === 'classic' || !presetKey;

  // Product chrome always uses enterprise tokens for classic; presets only tint primary
  const primary = isClassic
    ? { main: tokens.primary.main, light: tokens.primary.light, dark: tokens.primary.hover }
    : preset.palette.primary;

  const theme = createTheme({
    palette: {
      mode: 'light',
      primary,
      secondary: {
        main: tokens.success.main,
        light: tokens.success.light,
        dark: tokens.success.dark,
      },
      success: {
        main: tokens.success.main,
        light: tokens.success.light,
        dark: tokens.success.dark,
      },
      warning: {
        main: tokens.warning.main,
        light: tokens.warning.light,
        dark: tokens.warning.dark,
      },
      error: {
        main: tokens.danger.main,
        light: tokens.danger.light,
        dark: tokens.danger.dark,
      },
      info: {
        main: tokens.info.main,
        light: tokens.info.light,
        dark: tokens.info.dark,
      },
      background: {
        default: tokens.bg,
        paper: tokens.surface,
      },
      text: {
        primary: tokens.text.primary,
        secondary: tokens.text.secondary,
        disabled: tokens.text.muted,
      },
      divider: tokens.divider,
      action: {
        hover: tokens.primary.soft,
        selected: tokens.primary.soft,
        focus: alpha(primary.main, 0.12),
      },
    },
    shape: {
      borderRadius: tokens.radius.card,
    },
    spacing: 8,
    typography: {
      fontFamily: '"Inter", system-ui, -apple-system, "Segoe UI", sans-serif',
      h1: { fontSize: '1.75rem', fontWeight: 700, lineHeight: 1.3, color: tokens.text.primary },
      h2: { fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.3, color: tokens.text.primary },
      h3: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.35, color: tokens.text.primary },
      h4: { fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.3, letterSpacing: '-0.01em' },
      h5: { fontSize: '1.125rem', fontWeight: 600, lineHeight: 1.35 },
      h6: { fontSize: '1rem', fontWeight: 600, lineHeight: 1.35 },
      subtitle1: { fontSize: '0.9375rem', fontWeight: 600, lineHeight: 1.4 },
      subtitle2: { fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.4 },
      body1: { fontSize: '0.875rem', fontWeight: 400, lineHeight: 1.5 },
      body2: { fontSize: '0.875rem', fontWeight: 400, lineHeight: 1.5 },
      caption: { fontSize: '0.75rem', fontWeight: 400, lineHeight: 1.4, color: tokens.text.secondary },
      overline: { fontSize: '0.6875rem', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' },
      button: { fontSize: '0.875rem', fontWeight: 600, textTransform: 'none', letterSpacing: 0 },
    },
    shadows: [
      'none',
      tokens.shadow.sm,
      tokens.shadow.sm,
      tokens.shadow.md,
      tokens.shadow.md,
      tokens.shadow.md,
      tokens.shadow.lg,
      tokens.shadow.lg,
      tokens.shadow.lg,
      tokens.shadow.lg,
      tokens.shadow.lg,
      tokens.shadow.lg,
      tokens.shadow.lg,
      tokens.shadow.lg,
      tokens.shadow.lg,
      tokens.shadow.lg,
      tokens.shadow.lg,
      tokens.shadow.lg,
      tokens.shadow.lg,
      tokens.shadow.lg,
      tokens.shadow.lg,
      tokens.shadow.lg,
      tokens.shadow.lg,
      tokens.shadow.lg,
      tokens.shadow.lg,
    ],
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          ':root': {
            '--color-primary': tokens.primary.main,
            '--color-primary-hover': tokens.primary.hover,
            '--color-primary-soft': tokens.primary.soft,
            '--color-primary-border': tokens.primary.border,
            '--color-success': tokens.success.main,
            '--color-success-soft': tokens.success.soft,
            '--color-warning': tokens.warning.main,
            '--color-warning-soft': tokens.warning.soft,
            '--color-danger': tokens.danger.main,
            '--color-danger-soft': tokens.danger.soft,
            '--color-info': tokens.info.main,
            '--color-bg': tokens.bg,
            '--color-surface': tokens.surface,
            '--color-border': tokens.border,
            '--color-divider': tokens.divider,
            '--color-text-primary': tokens.text.primary,
            '--color-text-secondary': tokens.text.secondary,
            '--color-text-muted': tokens.text.muted,
            '--radius-button': `${tokens.radius.button}px`,
            '--radius-input': `${tokens.radius.input}px`,
            '--radius-card': `${tokens.radius.card}px`,
            '--radius-dialog': `${tokens.radius.dialog}px`,
            '--shadow-sm': tokens.shadow.sm,
            '--shadow-md': tokens.shadow.md,
            '--shadow-lg': tokens.shadow.lg,
          },
          body: {
            backgroundColor: tokens.bg,
            color: tokens.text.primary,
          },
          '*:focus-visible': {
            outline: `2px solid ${tokens.primary.main}`,
            outlineOffset: 2,
          },
          // Form fields use border color for focus — no outline/glow ring
          '.MuiOutlinedInput-root:focus-within, .MuiOutlinedInput-root.Mui-focused, .MuiPickersOutlinedInput-root:focus-within, .MuiPickersOutlinedInput-root.Mui-focused, .MuiFilledInput-root.Mui-focused, .MuiInputBase-root.Mui-focused, input:focus-visible, textarea:focus-visible, select:focus-visible': {
            outline: 'none !important',
            boxShadow: 'none !important',
          },
          '.MuiOutlinedInput-input:focus-visible, .MuiSelect-select:focus-visible, .MuiAutocomplete-input:focus-visible': {
            outline: 'none !important',
            boxShadow: 'none !important',
          },
          '::-webkit-scrollbar': { width: 8, height: 8 },
          '::-webkit-scrollbar-thumb': {
            backgroundColor: '#CBD5E1',
            borderRadius: 4,
          },
          '::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            borderRadius: tokens.radius.button,
            height: tokens.control.height,
            minHeight: tokens.control.height,
            paddingLeft: tokens.control.paddingX,
            paddingRight: tokens.control.paddingX,
            fontWeight: 600,
            fontSize: '0.875rem',
            lineHeight: 1.25,
            boxShadow: 'none',
            transition:
              'background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease',
            '&.Mui-disabled': {
              opacity: 0.55,
              boxShadow: 'none',
            },
            '&:focus-visible': {
              outline: `2px solid ${tokens.primary.main}`,
              outlineOffset: 2,
            },
            '& .MuiButton-startIcon': {
              marginRight: tokens.space[2],
              marginLeft: -2,
              '& > *:nth-of-type(1)': { fontSize: tokens.control.iconMd },
            },
            '& .MuiButton-endIcon': {
              marginLeft: tokens.space[2],
              marginRight: -2,
              '& > *:nth-of-type(1)': { fontSize: tokens.control.iconMd },
            },
            '& .MuiCircularProgress-root': {
              width: `${tokens.control.iconMd}px !important`,
              height: `${tokens.control.iconMd}px !important`,
            },
          },
          sizeSmall: {
            height: tokens.control.heightSm,
            minHeight: tokens.control.heightSm,
            paddingLeft: tokens.control.paddingXSm,
            paddingRight: tokens.control.paddingXSm,
            fontSize: '0.8125rem',
            '& .MuiButton-startIcon > *:nth-of-type(1)': { fontSize: tokens.control.iconSm },
            '& .MuiButton-endIcon > *:nth-of-type(1)': { fontSize: tokens.control.iconSm },
          },
          sizeLarge: {
            height: 48,
            minHeight: 48,
            paddingLeft: tokens.space[5],
            paddingRight: tokens.space[5],
            fontSize: '0.9375rem',
          },
          contained: {
            boxShadow: 'none',
            '&:hover': {
              boxShadow: tokens.shadow.sm,
            },
            '&:active': {
              boxShadow: 'none',
              transform: 'translateY(0.5px)',
            },
          },
          containedPrimary: {
            backgroundColor: tokens.primary.main,
            '&:hover': { backgroundColor: tokens.primary.hover },
          },
          containedError: {
            backgroundColor: tokens.danger.main,
            '&:hover': { backgroundColor: tokens.danger.dark },
          },
          containedSuccess: {
            backgroundColor: tokens.success.main,
            '&:hover': { backgroundColor: tokens.success.dark },
          },
          outlined: {
            borderWidth: 1,
            borderColor: tokens.border,
            color: tokens.text.primary,
            backgroundColor: tokens.surface,
            boxShadow: 'none',
            '&:hover': {
              borderColor: tokens.primary.border,
              backgroundColor: tokens.primary.soft,
              color: tokens.primary.main,
              boxShadow: 'none',
            },
          },
          outlinedPrimary: {
            borderColor: tokens.primary.border,
            color: tokens.primary.main,
            '&:hover': {
              borderColor: tokens.primary.main,
              backgroundColor: tokens.primary.soft,
            },
          },
          outlinedError: {
            borderColor: alpha(tokens.danger.main, 0.45),
            color: tokens.danger.main,
            '&:hover': {
              borderColor: tokens.danger.main,
              backgroundColor: tokens.danger.soft,
            },
          },
          text: {
            color: tokens.text.secondary,
            boxShadow: 'none',
            '&:hover': {
              backgroundColor: tokens.primary.soft,
              color: tokens.primary.main,
              boxShadow: 'none',
            },
          },
          textPrimary: {
            color: tokens.primary.main,
            '&:hover': { backgroundColor: tokens.primary.soft },
          },
          textError: {
            color: tokens.danger.main,
            '&:hover': { backgroundColor: tokens.danger.soft },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: tokens.radius.button,
            width: 40,
            height: 40,
            padding: tokens.space[2],
            color: tokens.text.secondary,
            transition: 'background-color 0.15s ease, color 0.15s ease',
            '&:hover': { backgroundColor: tokens.primary.soft, color: tokens.primary.main },
            '&:focus-visible': {
              outline: `2px solid ${tokens.primary.main}`,
              outlineOffset: 2,
            },
            '& .MuiSvgIcon-root': { fontSize: tokens.control.iconMd },
          },
          sizeSmall: {
            width: 32,
            height: 32,
            padding: 6,
            '& .MuiSvgIcon-root': { fontSize: tokens.control.iconSm },
          },
          sizeLarge: {
            width: 48,
            height: 48,
            '& .MuiSvgIcon-root': { fontSize: tokens.control.iconLg },
          },
        },
      },
      MuiTextField: {
        defaultProps: { size: 'small', variant: 'outlined' },
      },
      MuiFormControl: {
        defaultProps: { size: 'small', variant: 'outlined' },
      },
      MuiSelect: {
        defaultProps: { size: 'small' },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: tokens.radius.input,
            backgroundColor: tokens.surface,
            minHeight: tokens.control.height,
            height: tokens.control.height,
            boxSizing: 'border-box',
            transition: 'box-shadow 0.15s ease, background-color 0.15s ease',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: tokens.border,
              borderWidth: 1,
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: tokens.primary.border,
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: tokens.primary.main,
              borderWidth: 1.5,
            },
            '&.Mui-focused': {
              boxShadow: 'none',
            },
            '&.Mui-error.Mui-focused': {
              boxShadow: 'none',
            },
            '&.MuiInputBase-multiline': {
              height: 'auto',
              minHeight: tokens.control.height,
              alignItems: 'flex-start',
            },
            '&.MuiInputBase-sizeSmall': {
              minHeight: tokens.control.height,
              height: tokens.control.height,
              '&.MuiInputBase-multiline': {
                height: 'auto',
                minHeight: tokens.control.height,
              },
            },
          },
          input: {
            paddingTop: 10,
            paddingBottom: 10,
            paddingLeft: 14,
            paddingRight: 14,
            fontSize: '0.875rem',
            height: 'auto',
            boxSizing: 'border-box',
          },
          inputSizeSmall: {
            paddingTop: 10,
            paddingBottom: 10,
          },
          adornedStart: {
            paddingLeft: tokens.space[3],
          },
          adornedEnd: {
            paddingRight: tokens.space[2],
          },
          notchedOutline: {
            borderColor: tokens.border,
          },
        },
      },
      MuiInputAdornment: {
        styleOverrides: {
          root: {
            color: tokens.text.muted,
            '& .MuiSvgIcon-root': { fontSize: tokens.control.iconMd },
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            fontSize: '0.875rem',
            fontWeight: 500,
            color: tokens.text.secondary,
            '&.Mui-focused': { color: tokens.primary.main },
          },
          sizeSmall: {
            transform: 'translate(14px, 11px) scale(1)',
            '&.MuiInputLabel-shrink': {
              transform: 'translate(14px, -9px) scale(0.75)',
            },
          },
        },
      },
      MuiFormHelperText: {
        styleOverrides: {
          root: { fontSize: '0.75rem', marginLeft: 4, marginTop: 4 },
        },
      },
      MuiAutocomplete: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              paddingTop: 0,
              paddingBottom: 0,
              minHeight: tokens.control.height,
              height: tokens.control.height,
              '&.MuiInputBase-sizeSmall': {
                paddingTop: 0,
                paddingBottom: 0,
              },
            },
            '& .MuiOutlinedInput-root .MuiAutocomplete-input': {
              paddingTop: 0,
              paddingBottom: 0,
            },
          },
          tag: {
            height: 24,
            margin: 2,
          },
          endAdornment: {
            right: 8,
          },
        },
      },
      MuiCheckbox: {
        defaultProps: { size: 'small' },
        styleOverrides: {
          root: {
            padding: tokens.space[2],
            color: tokens.border,
            '&.Mui-checked': { color: tokens.primary.main },
          },
        },
      },
      MuiRadio: {
        defaultProps: { size: 'small' },
        styleOverrides: {
          root: { padding: tokens.space[2] },
        },
      },
      MuiSwitch: {
        styleOverrides: {
          root: { padding: 8 },
        },
      },
      MuiFormControlLabel: {
        styleOverrides: {
          root: {
            marginLeft: -4,
            marginRight: tokens.space[3],
          },
          label: {
            fontSize: '0.875rem',
            fontWeight: 500,
            color: tokens.text.secondary,
          },
        },
      },
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            borderRadius: tokens.radius.card,
            border: `1px solid ${tokens.border}`,
            boxShadow: tokens.shadow.sm,
            backgroundColor: tokens.surface,
          },
        },
      },
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
          outlined: {
            borderColor: tokens.border,
          },
          rounded: {
            borderRadius: tokens.radius.card,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: tokens.surface,
            color: tokens.text.primary,
            boxShadow: 'none',
            borderBottom: `1px solid ${tokens.border}`,
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            borderRight: `1px solid ${tokens.border}`,
            backgroundColor: tokens.surface,
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: tokens.radius.button,
            marginLeft: 8,
            marginRight: 8,
            marginBottom: 2,
            minHeight: 44,
            '&.Mui-selected': {
              backgroundColor: tokens.primary.soft,
              color: tokens.primary.main,
              fontWeight: 600,
              '& .MuiListItemIcon-root': { color: tokens.primary.main },
              '&:hover': { backgroundColor: alpha(tokens.primary.main, 0.12) },
            },
            '&:hover': {
              backgroundColor: alpha(tokens.primary.main, 0.06),
            },
          },
        },
      },
      MuiListItemIcon: {
        styleOverrides: {
          root: {
            minWidth: 40,
            color: tokens.text.secondary,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: tokens.radius.chip,
            fontWeight: 500,
            fontSize: '0.75rem',
            height: 24,
          },
          sizeMedium: { height: 28 },
          colorPrimary: {
            backgroundColor: tokens.primary.soft,
            color: tokens.primary.main,
          },
          colorSuccess: {
            backgroundColor: tokens.success.soft,
            color: tokens.success.dark,
          },
          colorWarning: {
            backgroundColor: tokens.warning.soft,
            color: tokens.warning.dark,
          },
          colorError: {
            backgroundColor: tokens.danger.soft,
            color: tokens.danger.dark,
          },
          colorInfo: {
            backgroundColor: tokens.info.soft,
            color: tokens.info.dark,
          },
          icon: {
            fontSize: tokens.control.iconSm,
            marginLeft: 6,
          },
          deleteIcon: {
            fontSize: tokens.control.iconSm,
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: tokens.radius.dialog,
            boxShadow: tokens.shadow.lg,
            border: `1px solid ${tokens.border}`,
          },
        },
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: {
            fontSize: '1.125rem',
            fontWeight: 600,
            lineHeight: 1.35,
            padding: `${tokens.space[5]}px ${tokens.space[6]}px ${tokens.space[3]}px`,
            borderBottom: `1px solid ${tokens.divider}`,
          },
        },
      },
      MuiDialogContent: {
        styleOverrides: {
          root: {
            padding: `${tokens.space[5]}px ${tokens.space[6]}px`,
            '&.MuiDialogContent-dividers': {
              borderColor: tokens.divider,
            },
          },
        },
      },
      MuiDialogActions: {
        styleOverrides: {
          root: {
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            flexWrap: 'wrap',
            padding: `${tokens.space[3]}px ${tokens.space[6]}px ${tokens.space[4]}px`,
            borderTop: `1px solid ${tokens.divider}`,
            gap: tokens.space[2],
            '& > :not(style) ~ :not(style)': {
              marginLeft: 0,
            },
            // Secondary dialog actions default to outlined affordance when left as plain Buttons
            '& > .MuiButton-text': {
              border: `1px solid ${tokens.border}`,
              backgroundColor: tokens.surface,
              color: tokens.text.primary,
              paddingLeft: tokens.control.paddingX,
              paddingRight: tokens.control.paddingX,
              '&:hover': {
                borderColor: tokens.primary.border,
                backgroundColor: tokens.primary.soft,
                color: tokens.primary.main,
              },
            },
          },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            '& .MuiTableCell-head': {
              backgroundColor: '#F8FAFC',
              color: tokens.text.secondary,
              fontWeight: 600,
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.03em',
              borderBottom: `1px solid ${tokens.border}`,
              whiteSpace: 'nowrap',
              height: 48,
              padding: `${tokens.space[3]}px ${tokens.space[4]}px`,
              '& .MuiTableSortLabel-icon': {
                fontSize: tokens.control.iconSm,
                opacity: 0.5,
              },
            },
          },
        },
      },
      MuiTableBody: {
        styleOverrides: {
          root: {
            '& .MuiTableRow-root': {
              height: 52,
            },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: `1px solid ${tokens.divider}`,
            fontSize: '0.875rem',
            padding: `${tokens.space[3]}px ${tokens.space[4]}px`,
            color: tokens.text.primary,
            verticalAlign: 'middle',
          },
          sizeSmall: {
            padding: `${tokens.space[2]}px ${tokens.space[3]}px`,
          },
          paddingCheckbox: {
            padding: `0 ${tokens.space[2]}px 0 ${tokens.space[4]}px`,
            width: 48,
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            transition: 'background-color 0.12s ease',
            '&:nth-of-type(even)': {
              backgroundColor: alpha('#F8FAFC', 0.7),
            },
            '&:hover': {
              backgroundColor: `${tokens.primary.soft} !important`,
            },
            '&.MuiTableRow-hover:hover': {
              backgroundColor: tokens.primary.soft,
            },
          },
        },
      },
      MuiTableContainer: {
        styleOverrides: {
          root: {
            borderRadius: tokens.radius.table,
            border: `1px solid ${tokens.border}`,
            boxShadow: tokens.shadow.sm,
            backgroundColor: tokens.surface,
          },
        },
      },
      MuiTablePagination: {
        styleOverrides: {
          root: {
            borderTop: `1px solid ${tokens.divider}`,
            color: tokens.text.secondary,
            minHeight: 52,
            overflow: 'hidden',
          },
          toolbar: {
            minHeight: 52,
            paddingLeft: tokens.space[4],
            paddingRight: tokens.space[2],
          },
          selectLabel: { fontSize: '0.8125rem' },
          displayedRows: { fontSize: '0.8125rem' },
          select: {
            borderRadius: tokens.radius.input,
          },
          actions: {
            marginLeft: tokens.space[3],
            '& .MuiIconButton-root': {
              width: 32,
              height: 32,
            },
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          root: {
            minHeight: tokens.control.height,
            borderBottom: `1px solid ${tokens.divider}`,
          },
          indicator: {
            height: 2,
            borderRadius: 1,
            backgroundColor: tokens.primary.main,
          },
          flexContainer: {
            gap: tokens.space[1],
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
            fontSize: '0.875rem',
            minHeight: tokens.control.height,
            minWidth: 0,
            paddingLeft: tokens.space[4],
            paddingRight: tokens.space[4],
            borderRadius: `${tokens.radius.button}px ${tokens.radius.button}px 0 0`,
            color: tokens.text.secondary,
            transition: 'color 0.15s ease, background-color 0.15s ease',
            '&:hover': {
              color: tokens.primary.main,
              backgroundColor: alpha(tokens.primary.main, 0.04),
            },
            '&.Mui-selected': {
              color: tokens.primary.main,
              fontWeight: 600,
            },
            '& .MuiTab-iconWrapper': {
              marginBottom: '0 !important',
              marginRight: tokens.space[2],
              '& .MuiSvgIcon-root': { fontSize: tokens.control.iconMd },
            },
          },
        },
      },
      MuiButtonGroup: {
        defaultProps: {
          disableElevation: true,
          disableRipple: false,
        },
        styleOverrides: {
          root: {
            gap: tokens.space[2], // 8px — Fabric-style spaced segments
            boxShadow: 'none',
            backgroundColor: 'transparent',
          },
          grouped: {
            minWidth: 88,
            borderRadius: `${tokens.radius.button}px !important`,
            marginLeft: '0 !important',
            border: `1px solid ${tokens.border} !important`,
            boxShadow: 'none',
            transition:
              'background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease',
            '&:hover': {
              zIndex: 1,
              borderColor: `${tokens.primary.border} !important`,
            },
            '&:focus-visible': {
              zIndex: 2,
            },
            // Active / selected segment
            '&.MuiButton-contained': {
              borderColor: `${tokens.primary.main} !important`,
              boxShadow: tokens.shadow.sm,
              zIndex: 2,
              '&:hover': {
                borderColor: `${tokens.primary.hover} !important`,
                boxShadow: tokens.shadow.md,
              },
            },
          },
          groupedOutlinedHorizontal: {
            '&:not(:first-of-type)': {
              borderLeft: `1px solid ${tokens.border} !important`,
              marginLeft: '0 !important',
            },
            '&:first-of-type': {
              borderTopLeftRadius: `${tokens.radius.button}px !important`,
              borderBottomLeftRadius: `${tokens.radius.button}px !important`,
            },
            '&:last-of-type': {
              borderTopRightRadius: `${tokens.radius.button}px !important`,
              borderBottomRightRadius: `${tokens.radius.button}px !important`,
            },
          },
          groupedContainedHorizontal: {
            '&:not(:first-of-type)': {
              borderLeft: `1px solid ${tokens.primary.main} !important`,
              marginLeft: '0 !important',
            },
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: tokens.radius.input,
            border: '1px solid',
            alignItems: 'center',
          },
          standardError: {
            backgroundColor: tokens.danger.soft,
            borderColor: alpha(tokens.danger.main, 0.25),
            color: tokens.danger.dark,
          },
          standardSuccess: {
            backgroundColor: tokens.success.soft,
            borderColor: alpha(tokens.success.main, 0.25),
            color: tokens.success.dark,
          },
          standardWarning: {
            backgroundColor: tokens.warning.soft,
            borderColor: alpha(tokens.warning.main, 0.25),
            color: tokens.warning.dark,
          },
          standardInfo: {
            backgroundColor: tokens.info.soft,
            borderColor: alpha(tokens.info.main, 0.25),
            color: tokens.info.dark,
          },
        },
      },
      MuiSkeleton: {
        styleOverrides: {
          root: { borderRadius: tokens.radius.input },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: tokens.text.primary,
            fontSize: '0.75rem',
            borderRadius: 8,
            padding: '6px 10px',
          },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: { borderColor: tokens.divider },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            borderRadius: tokens.radius.input,
            border: `1px solid ${tokens.border}`,
            boxShadow: tokens.shadow.md,
            marginTop: 4,
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            fontSize: '0.875rem',
            borderRadius: 8,
            margin: '2px 6px',
            minHeight: 36,
            '&:hover': { backgroundColor: tokens.primary.soft },
            '&.Mui-selected': {
              backgroundColor: tokens.primary.soft,
              color: tokens.primary.main,
              '&:hover': { backgroundColor: alpha(tokens.primary.main, 0.14) },
            },
          },
        },
      },
      MuiAccordion: {
        styleOverrides: {
          root: {
            border: `1px solid ${tokens.border}`,
            borderRadius: `${tokens.radius.card}px !important`,
            boxShadow: 'none',
            '&:before': { display: 'none' },
            '&.Mui-expanded': { margin: 0 },
          },
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: { borderRadius: 4, height: 6, backgroundColor: tokens.primary.soft },
          bar: { borderRadius: 4 },
        },
      },
    },
  });

  // MUI X DatePicker — aligned to enterprise tokens (not in core MUI typings)
  const pickerComponents = {
    MuiPickersOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: tokens.radius.input,
          minHeight: tokens.control.heightSm,
          backgroundColor: tokens.surface,
          '& .MuiPickersOutlinedInput-notchedOutline': {
            borderColor: tokens.border,
          },
          '&:hover .MuiPickersOutlinedInput-notchedOutline': {
            borderColor: tokens.primary.border,
          },
          '&.Mui-focused .MuiPickersOutlinedInput-notchedOutline': {
            borderColor: tokens.primary.main,
            borderWidth: 1.5,
          },
          '&.Mui-focused': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiPickersTextField: {
      defaultProps: { size: 'small' },
    },
    MuiPickerPopper: {
      styleOverrides: {
        paper: {
          borderRadius: tokens.radius.dialog,
          border: `1px solid ${tokens.border}`,
          boxShadow: tokens.shadow.lg,
          overflow: 'hidden',
        },
      },
    },
    MuiPickersLayout: {
      styleOverrides: {
        root: {
          backgroundColor: tokens.surface,
          '& .MuiPickersLayout-actionBar': {
            padding: '8px 12px 12px',
            borderTop: `1px solid ${tokens.divider}`,
            justifyContent: 'space-between',
            '& .MuiButton-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.8125rem',
              borderRadius: tokens.radius.button,
              minWidth: 64,
              color: tokens.primary.main,
              '&:hover': {
                backgroundColor: tokens.primary.soft,
              },
            },
          },
        },
      },
    },
    MuiDateCalendar: {
      styleOverrides: {
        root: {
          width: 320,
          maxHeight: 'none',
          backgroundColor: tokens.surface,
          fontFamily: 'inherit',
        },
      },
    },
    MuiPickersCalendarHeader: {
      styleOverrides: {
        root: {
          paddingLeft: 16,
          paddingRight: 8,
          marginTop: 8,
          marginBottom: 4,
        },
        label: {
          fontWeight: 700,
          fontSize: '0.9375rem',
          color: tokens.text.primary,
        },
        switchViewButton: {
          borderRadius: tokens.radius.button,
          color: tokens.text.primary,
          '&:hover': { backgroundColor: tokens.primary.soft },
        },
      },
    },
    MuiPickersArrowSwitcher: {
      styleOverrides: {
        button: {
          borderRadius: tokens.radius.button,
          color: tokens.text.secondary,
          '&:hover': {
            backgroundColor: tokens.primary.soft,
            color: tokens.primary.main,
          },
        },
      },
    },
    MuiDayCalendar: {
      styleOverrides: {
        weekDayLabel: {
          fontSize: '0.75rem',
          fontWeight: 600,
          color: tokens.text.secondary,
          width: 36,
          height: 32,
        },
        header: {
          justifyContent: 'space-around',
          paddingLeft: 8,
          paddingRight: 8,
        },
      },
    },
    MuiPickersDay: {
      styleOverrides: {
        root: {
          width: 36,
          height: 36,
          margin: '2px',
          fontSize: '0.8125rem',
          fontWeight: 500,
          borderRadius: 10,
          color: tokens.text.primary,
          border: 'none',
          transition: 'background-color 0.15s ease, color 0.15s ease',
          '&:hover': {
            backgroundColor: tokens.primary.soft,
          },
          '&.Mui-selected': {
            backgroundColor: `${tokens.primary.main} !important`,
            color: '#fff !important',
            fontWeight: 700,
            border: 'none !important',
            '&:hover': {
              backgroundColor: `${tokens.primary.hover} !important`,
            },
            '&:focus': {
              backgroundColor: `${tokens.primary.main} !important`,
            },
          },
          '&.MuiPickersDay-today': {
            border: `1.5px solid ${tokens.primary.main}`,
            backgroundColor: 'transparent',
            '&.Mui-selected': {
              border: 'none',
              backgroundColor: `${tokens.primary.main} !important`,
            },
          },
        },
        dayOutsideMonth: {
          color: tokens.text.muted,
          opacity: 0.45,
        },
      },
    },
    MuiMonthCalendar: {
      styleOverrides: {
        button: {
          borderRadius: tokens.radius.button,
          fontWeight: 600,
          '&.Mui-selected': {
            backgroundColor: tokens.primary.main,
            color: '#fff',
            '&:hover': { backgroundColor: tokens.primary.hover },
          },
        },
      },
    },
    MuiYearCalendar: {
      styleOverrides: {
        button: {
          borderRadius: tokens.radius.button,
          fontWeight: 600,
          '&.Mui-selected': {
            backgroundColor: tokens.primary.main,
            color: '#fff',
            '&:hover': { backgroundColor: tokens.primary.hover },
          },
        },
      },
    },
  };

  return {
    ...theme,
    components: {
      ...theme.components,
      ...pickerComponents,
    },
  } as ReturnType<typeof createTheme>;
}
