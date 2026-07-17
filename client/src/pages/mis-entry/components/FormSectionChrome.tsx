import type { ReactNode } from 'react';
import { Box, Typography, keyframes } from '@mui/material';
import type { LucideIcon } from 'lucide-react';
import {
  Package,
  Blend,
  Factory,
  Flame,
  Cylinder,
  ShoppingCart,
  Fuel,
  Cog,
  Leaf,
  Droplets,
  FlaskConical,
  Zap,
  Users,
  Activity,
  ShieldCheck,
  MessageSquare,
  CalendarDays,
} from 'lucide-react';
import { tokens } from '../../../themes';

export const MIS_FORM_BG = '#F5F8FC';

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

export const misSectionCardSx = {
  mb: 4,
  borderRadius: '20px',
  border: '1px solid #E5EDF6',
  boxShadow: '0 8px 30px rgba(16,24,40,.05)',
  bgcolor: '#fff',
  overflow: 'hidden',
  scrollMarginTop: '140px',
  animation: `${fadeUp} 0.25s ease-out both`,
};

export const misFormFieldSx = {
  '& .MuiOutlinedInput-root': {
    minHeight: 46,
    height: 46,
    borderRadius: '12px',
    fontSize: 15,
    fontWeight: 500,
    bgcolor: '#fff',
    '& fieldset': { borderColor: '#D6E3F0' },
    '&:hover fieldset': { borderColor: '#8FB9E7' },
    '&.Mui-focused': {
      boxShadow: 'none',
      '& fieldset': { borderColor: tokens.primary.main, borderWidth: 1.5 },
    },
    '&.Mui-disabled': { bgcolor: '#F8FAFC' },
  },
  '& .MuiInputBase-input': {
    fontSize: 15,
    fontWeight: 500,
    py: '11px',
    '&::placeholder': { color: '#8C9AAF', opacity: 1 },
  },
  '& .MuiInputLabel-root': {
    fontSize: 13,
    fontWeight: 500,
    color: tokens.text.secondary,
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: tokens.primary.main,
  },
  '& .MuiFormHelperText-root': { fontSize: 12 },
  // Multiline override
  '& .MuiOutlinedInput-root.MuiInputBase-multiline': {
    height: 'auto',
    minHeight: 46,
    alignItems: 'flex-start',
  },
};

export type SectionAccent = {
  iconBg: string;
  iconColor: string;
  accent: string;
};

export const SECTION_ACCENTS: Record<string, SectionAccent> = {
  rawMaterials: { iconBg: '#E8F5EE', iconColor: '#2EAF61', accent: '#2EAF61' },
  feedMixing: { iconBg: '#EAF4FB', iconColor: '#2879B6', accent: '#2879B6' },
  digesters: { iconBg: '#F3EEFF', iconColor: '#7C5CFC', accent: '#7C5CFC' },
  sls: { iconBg: '#EEF2F7', iconColor: '#64748B', accent: '#64748B' },
  rawBiogas: { iconBg: '#FFF4E8', iconColor: '#E07A2F', accent: '#E07A2F' },
  rawBiogasQuality: { iconBg: '#FFF7E6', iconColor: '#D97706', accent: '#D97706' },
  cbg: { iconBg: '#E8F8F0', iconColor: '#0F9F6E', accent: '#0F9F6E' },
  sales: { iconBg: '#EAF4FB', iconColor: '#2879B6', accent: '#2879B6' },
  fuel: { iconBg: '#FFF7E6', iconColor: '#D97706', accent: '#D97706' },
  compressors: { iconBg: '#EEF2F7', iconColor: '#475569', accent: '#475569' },
  fertilizer: { iconBg: '#E8F5EE', iconColor: '#2EAF61', accent: '#2EAF61' },
  utilities: { iconBg: '#EAF4FB', iconColor: '#2879B6', accent: '#2879B6' },
  manpower: { iconBg: '#F3EEFF', iconColor: '#7C5CFC', accent: '#7C5CFC' },
  availability: { iconBg: '#E8F8F0', iconColor: '#0F9F6E', accent: '#0F9F6E' },
  hse: { iconBg: '#FDECEC', iconColor: '#DC3545', accent: '#DC3545' },
  remarks: { iconBg: '#EEF2F7', iconColor: '#64748B', accent: '#64748B' },
  date: { iconBg: '#EAF4FB', iconColor: '#2879B6', accent: '#2879B6' },
};

export const SECTION_ICONS = {
  rawMaterials: Package,
  feedMixing: Blend,
  digesters: Factory,
  sls: Droplets,
  rawBiogas: Flame,
  rawBiogasQuality: FlaskConical,
  cbg: Cylinder,
  sales: ShoppingCart,
  fuel: Fuel,
  compressors: Cog,
  fertilizer: Leaf,
  utilities: Zap,
  manpower: Users,
  availability: Activity,
  hse: ShieldCheck,
  remarks: MessageSquare,
  date: CalendarDays,
} as const;

export type NavItem = { id: string; label: string };

export const MIS_FORM_NAV: NavItem[] = [
  { id: 'section-raw-materials', label: 'Raw Materials' },
  { id: 'section-feed-mixing', label: 'Feed Mixing' },
  { id: 'section-digesters', label: 'Digesters' },
  { id: 'section-sls', label: 'SLS Machine' },
  { id: 'section-raw-biogas', label: 'Raw Biogas' },
  { id: 'section-cbg', label: 'CBG' },
  { id: 'section-sales', label: 'Sales' },
  { id: 'section-fuel', label: 'Fuel' },
  { id: 'section-compressors', label: 'Compressors' },
  { id: 'section-fertilizer', label: 'Fertilizer' },
  { id: 'section-utilities', label: 'Utilities & Power' },
  { id: 'section-manpower', label: 'Manpower' },
  { id: 'section-availability', label: 'Plant Availability' },
  { id: 'section-hse', label: 'Health, Safety & Environment' },
  { id: 'section-remarks', label: 'Remarks' },
];

type FormSectionProps = {
  id: string;
  title: string;
  subtitle?: string;
  accentKey: keyof typeof SECTION_ACCENTS;
  icon?: LucideIcon;
  badge?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  sx?: object;
};

export function FormSection({
  id,
  title,
  subtitle,
  accentKey,
  icon,
  badge,
  action,
  children,
  sx = {},
}: FormSectionProps) {
  const accent = SECTION_ACCENTS[accentKey] || SECTION_ACCENTS.rawMaterials;
  const Icon = icon || SECTION_ICONS[accentKey as keyof typeof SECTION_ICONS] || Package;

  return (
    <Box id={id} component="section" sx={{ ...misSectionCardSx, ...sx }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 2,
          px: { xs: 2.5, md: 3.5 },
          pt: { xs: 2.5, md: 3.5 },
          pb: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.75, minWidth: 0 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              bgcolor: accent.iconBg,
              color: accent.iconColor,
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <Icon size={22} strokeWidth={2} />
          </Box>
          <Box sx={{ minWidth: 0, pt: 0.25 }}>
            <Typography
              sx={{
                fontSize: { xs: 22, md: 26 },
                fontWeight: 600,
                color: tokens.text.primary,
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
              }}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography sx={{ mt: 0.5, fontSize: 13.5, fontWeight: 500, color: tokens.text.secondary }}>
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
          {badge}
          {action}
        </Box>
      </Box>

      <Box sx={{ px: { xs: 2.5, md: 3.5 }, pb: { xs: 2.5, md: 3.5 }, pt: 1 }}>{children}</Box>
    </Box>
  );
}

export function FieldGroup({ title, children, sx = {} }: { title?: string; children: ReactNode; sx?: object }) {
  return (
    <Box sx={{ mb: 3, '&:last-child': { mb: 0 }, ...sx }}>
      {title && (
        <Typography
          sx={{
            fontSize: 18,
            fontWeight: 600,
            color: tokens.text.primary,
            mb: 1.75,
            letterSpacing: '-0.01em',
          }}
        >
          {title}
        </Typography>
      )}
      {children}
    </Box>
  );
}

export const primaryBtnSx = {
  height: 44,
  borderRadius: '12px',
  textTransform: 'none' as const,
  fontWeight: 600,
  fontSize: 14,
  px: 2.5,
  background: `linear-gradient(135deg, ${tokens.primary.main} 0%, ${tokens.primary.hover} 100%)`,
  boxShadow: `0 6px 16px ${tokens.primary.main}28`,
  '&:hover': {
    background: `linear-gradient(135deg, ${tokens.primary.hover} 0%, ${tokens.primary.dark} 100%)`,
    boxShadow: `0 8px 20px ${tokens.primary.main}35`,
  },
};

export const secondaryBtnSx = {
  height: 44,
  borderRadius: '12px',
  textTransform: 'none' as const,
  fontWeight: 600,
  fontSize: 14,
  px: 2.5,
  bgcolor: '#fff',
  borderColor: '#D6E3F0',
  color: tokens.text.primary,
  boxShadow: '0 2px 8px rgba(16,24,40,.04)',
  '&:hover': {
    borderColor: tokens.primary.border,
    bgcolor: tokens.primary.soft,
  },
};

export const dangerIconBtnSx = {
  color: tokens.danger.main,
  bgcolor: tokens.danger.soft,
  borderRadius: '10px',
  width: 36,
  height: 36,
  '&:hover': { bgcolor: 'rgba(220,53,69,0.18)' },
};

export const productCardSx = (accent: string) => ({
  borderRadius: '16px',
  border: '1px solid #E5EDF6',
  borderLeft: `4px solid ${accent}`,
  bgcolor: '#fff',
  p: { xs: 2, sm: 2.5 },
  mb: 2,
  boxShadow: '0 4px 16px rgba(16,24,40,.04)',
});
