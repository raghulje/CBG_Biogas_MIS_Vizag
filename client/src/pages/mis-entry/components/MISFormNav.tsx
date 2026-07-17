import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';
import { MIS_FORM_NAV } from './FormSectionChrome';
import { tokens } from '../../../themes';

/** Springy jelly easing — overshoots then settles */
const JELLY = 'cubic-bezier(0.34, 1.56, 0.64, 1)';
const JELLY_SOFT = 'cubic-bezier(0.22, 1.4, 0.36, 1)';

/**
 * Horizontal sticky tab navigator with scroll-spy + sliding jelly pill.
 * Visual-only — does not affect form state.
 */
export default function MISFormNav() {
  const [activeId, setActiveId] = useState(MIS_FORM_NAV[0]?.id ?? '');
  const trackRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [pill, setPill] = useState({ left: 0, width: 0, ready: false });

  const updatePill = useCallback(() => {
    const track = trackRef.current;
    const btn = btnRefs.current[activeId];
    if (!track || !btn) return;
    setPill({
      left: btn.offsetLeft,
      width: btn.offsetWidth,
      ready: true,
    });
  }, [activeId]);

  useLayoutEffect(() => {
    updatePill();
  }, [updatePill]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const onResize = () => updatePill();
    window.addEventListener('resize', onResize);
    track.addEventListener('scroll', onResize, { passive: true });
    return () => {
      window.removeEventListener('resize', onResize);
      track.removeEventListener('scroll', onResize);
    };
  }, [updatePill]);

  // Keep active tab visible in the horizontal scroller
  useEffect(() => {
    const btn = btnRefs.current[activeId];
    btn?.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
  }, [activeId]);

  useEffect(() => {
    let observer: IntersectionObserver | null = null;
    let cancelled = false;

    const setup = () => {
      if (cancelled) return;
      const elements = MIS_FORM_NAV.map((item) => document.getElementById(item.id)).filter(
        (el): el is HTMLElement => Boolean(el),
      );
      if (!elements.length) {
        window.setTimeout(setup, 200);
        return;
      }

      observer?.disconnect();
      observer = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
          if (visible[0]?.target?.id) setActiveId(visible[0].target.id);
        },
        { rootMargin: '-20% 0px -55% 0px', threshold: [0.1, 0.25, 0.5] },
      );
      elements.forEach((el) => observer?.observe(el));
    };

    setup();
    const refresh = window.setTimeout(setup, 800);

    return () => {
      cancelled = true;
      window.clearTimeout(refresh);
      observer?.disconnect();
    };
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveId(id);
  };

  // Match Layout AppBar height exactly — removes the gray strip under the header
  const stickyTop = {
    xs: 'calc(56px + env(safe-area-inset-top, 0px))',
    sm: 'calc(64px + env(safe-area-inset-top, 0px))',
  };

  return (
    <Box
      component="nav"
      aria-label="Form sections"
      sx={{
        position: 'sticky',
        top: stickyTop,
        zIndex: 20,
        mb: 3,
        mx: { xs: -2, sm: -3 },
        px: { xs: 2, sm: 3 },
        // Flush with AppBar — same surface, no gap band
        bgcolor: tokens.surface,
        borderBottom: `1px solid ${tokens.divider}`,
        boxShadow: '0 4px 14px rgba(15, 23, 42, 0.04)',
      }}
    >
      <Box
        ref={trackRef}
        sx={{
          position: 'relative',
          display: 'flex',
          gap: 0.35,
          overflowX: 'auto',
          py: 1,
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {/* Sliding jelly pill */}
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            top: 8,
            left: 0,
            height: 'calc(100% - 16px)',
            width: pill.width || 0,
            borderRadius: '999px',
            bgcolor: tokens.primary.soft,
            boxShadow: pill.ready
              ? `inset 0 0 0 1px ${tokens.primary.main}22, 0 4px 12px ${tokens.primary.main}18`
              : 'none',
            transform: `translateX(${pill.left}px)`,
            opacity: pill.ready ? 1 : 0,
            pointerEvents: 'none',
            zIndex: 0,
            transition: pill.ready
              ? `transform 480ms ${JELLY}, width 420ms ${JELLY_SOFT}, opacity 180ms ease`
              : 'none',
            willChange: 'transform, width',
          }}
        />

        {MIS_FORM_NAV.map((item) => {
          const active = activeId === item.id;
          return (
            <Box
              key={item.id}
              component="button"
              type="button"
              ref={(node: HTMLButtonElement | null) => {
                btnRefs.current[item.id] = node;
              }}
              onClick={() => scrollTo(item.id)}
              sx={{
                position: 'relative',
                zIndex: 1,
                flexShrink: 0,
                border: 'none',
                cursor: 'pointer',
                px: 1.85,
                py: 1,
                borderRadius: '999px',
                bgcolor: 'transparent',
                color: active ? tokens.primary.dark : tokens.text.secondary,
                fontSize: 13,
                fontWeight: active ? 700 : 500,
                fontFamily: 'inherit',
                whiteSpace: 'nowrap',
                letterSpacing: active ? '-0.01em' : 0,
                transform: active ? 'scale(1.04)' : 'scale(1)',
                transition: `color 280ms ease, transform 480ms ${JELLY}, font-weight 200ms ease`,
                '&:hover': {
                  color: tokens.primary.main,
                  transform: 'scale(1.03)',
                },
                '&:active': {
                  transform: 'scale(0.97)',
                  transition: `transform 120ms ${JELLY_SOFT}`,
                },
              }}
            >
              {item.label}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
