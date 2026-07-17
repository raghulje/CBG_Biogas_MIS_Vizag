import { useState, useEffect, memo } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Assignment as AssignmentIcon,
  AdminPanelSettings as AdminIcon,
  Logout as LogoutIcon,
  Assessment as AssessmentIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  NotificationsActive as NotificationsIcon,
  Storefront as StoreIcon,
} from '@mui/icons-material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tokens } from '../themes';
import refexLogo from '../assets/refex-logo.png';

const drawerWidth = 264;
const drawerCollapsedWidth = 72;
const NAV_ITEM_HEIGHT = 44;
const ICON_SIZE = 20;
const TRANSITION = 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1), margin 0.2s cubic-bezier(0.4, 0, 0.2, 1)';

interface LayoutProps {
  children?: React.ReactNode;
}

const SessionTimerDisplay = memo(function SessionTimerDisplay({ loginAt }: { loginAt: string }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = new Date(loginAt).getTime();
    const update = () => setElapsed(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [loginAt]);

  const formatElapsed = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  return (
    <Tooltip title={`Signed in ${new Date(loginAt).toLocaleString()}`} arrow>
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          alignItems: 'center',
          gap: 0.75,
          px: 1.25,
          py: 0.5,
          borderRadius: '8px',
          bgcolor: tokens.primary.soft,
        }}
      >
        <AccessTimeIcon sx={{ color: tokens.primary.main, fontSize: 18 }} aria-hidden />
        <Typography
          sx={{
            fontSize: 12,
            fontWeight: 600,
            color: tokens.primary.main,
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
          }}
          aria-hidden="true"
        >
          {formatElapsed(elapsed)}
        </Typography>
      </Box>
    </Tooltip>
  );
});

export const Layout = ({ children }: LayoutProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, loginAt, hasPermission } = useAuth();
  const dummyUser = user || { name: 'Demo User', role: 'Admin' };
  const theme = useTheme();
  const roleLabel =
    typeof dummyUser.role === 'string' ? dummyUser.role : dummyUser.role?.name || 'User';

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(collapsed));
  }, [collapsed]);

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const handleCollapsedToggle = () => setCollapsed(!collapsed);
  const handleMenu = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const hasAdminAccess = (() => {
    try {
      if (!user) return false;
      const roleName = typeof user.role === 'string' ? user.role : (user.role?.name || '');
      const normalized = String(roleName).toLowerCase();
      if (normalized === 'admin' || normalized === 'superadmin' || normalized === 'super admin') {
        return true;
      }
      return (user.permissions || []).some(
        (p: { resource?: string; action?: string }) =>
          (p.resource === 'config' || p.resource === 'admin') &&
          (p.action === 'read' || p.action === 'update')
      );
    } catch {
      return false;
    }
  })();

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon sx={{ fontSize: ICON_SIZE }} />, path: '/dashboard', visible: hasPermission('dashboard', 'read') },
    { text: 'MIS Entry', icon: <AssignmentIcon sx={{ fontSize: ICON_SIZE }} />, path: '/mis-entry', visible: hasPermission('mis_entry', 'read') },
    { text: 'Final MIS Report', icon: <AssessmentIcon sx={{ fontSize: ICON_SIZE }} />, path: '/final-mis', visible: hasPermission('mis_entry', 'read') },
    { text: 'Customer Master', icon: <StoreIcon sx={{ fontSize: ICON_SIZE }} />, path: '/customers', visible: hasPermission('customer', 'read') },
    ...(hasAdminAccess
      ? [
          { text: 'Admin Panel', icon: <AdminIcon sx={{ fontSize: ICON_SIZE }} />, path: '/admin', visible: true },
          { text: 'In-App Notifications', icon: <NotificationsIcon sx={{ fontSize: ICON_SIZE }} />, path: '/admin/notifications', visible: true },
        ]
      : []),
  ].filter((item) => item.visible);

  const collapseControl = (
    <Tooltip title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} placement="right" arrow>
      <IconButton
        onClick={handleCollapsedToggle}
        size="small"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-expanded={!collapsed}
        sx={{
          display: { xs: 'none', md: 'inline-flex' },
          width: 28,
          height: 28,
          color: tokens.text.secondary,
          borderRadius: '8px',
          transition: 'background-color 0.15s ease, color 0.15s ease',
          '&:hover': {
            bgcolor: tokens.primary.soft,
            color: tokens.primary.main,
          },
        }}
      >
        {collapsed ? (
          <ChevronRightIcon sx={{ fontSize: 18 }} />
        ) : (
          <ChevronLeftIcon sx={{ fontSize: 18 }} />
        )}
      </IconButton>
    </Tooltip>
  );

  const renderDrawerContent = (isCollapsed: boolean) => (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: tokens.surface,
      }}
    >
      {/* Sidebar header — logo + collapse, no heavy dividers */}
      <Box
        sx={{
          minHeight: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          flexDirection: isCollapsed ? 'column' : 'row',
          gap: isCollapsed ? 0.5 : 1,
          px: isCollapsed ? 1 : 2,
          py: isCollapsed ? 1.25 : 1.5,
          flexShrink: 0,
        }}
      >
        <Box
          component="img"
          src={refexLogo}
          alt="Company logo"
          sx={{
            height: isCollapsed ? 28 : 36,
            width: 'auto',
            maxWidth: isCollapsed ? 36 : 148,
            objectFit: 'contain',
            display: 'block',
            transition: 'height 0.2s ease',
          }}
        />
        {collapseControl}
      </Box>

      {/* Navigation */}
      <List
        sx={{
          px: 1,
          pt: 0.5,
          pb: 1,
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
        aria-label="Main navigation"
      >
        {menuItems.map((item) => {
          const selected =
            location.pathname === item.path ||
            (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.25 }}>
              <Tooltip title={isCollapsed ? item.text : ''} placement="right" arrow>
                <ListItemButton
                  selected={selected}
                  onClick={() => {
                    navigate(item.path);
                    setMobileOpen(false);
                  }}
                  aria-current={selected ? 'page' : undefined}
                  sx={{
                    mx: 0.5,
                    borderRadius: '8px',
                    minHeight: NAV_ITEM_HEIGHT,
                    height: NAV_ITEM_HEIGHT,
                    px: isCollapsed ? 1 : 1.5,
                    py: 0,
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'background-color 0.15s ease, color 0.15s ease',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      left: 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 3,
                      height: selected ? 20 : 0,
                      borderRadius: '0 3px 3px 0',
                      bgcolor: tokens.primary.main,
                      opacity: selected ? 1 : 0,
                      transition: 'height 0.15s ease, opacity 0.15s ease',
                    },
                    '&.Mui-selected': {
                      bgcolor: tokens.primary.soft,
                      color: tokens.primary.main,
                      '& .MuiListItemIcon-root': { color: tokens.primary.main },
                      '&:hover': { bgcolor: tokens.primary.soft },
                    },
                    '&:hover': {
                      bgcolor: 'rgba(40, 121, 182, 0.06)',
                    },
                    '&.Mui-focusVisible': {
                      outline: `2px solid ${tokens.primary.main}`,
                      outlineOffset: -2,
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: isCollapsed ? 0 : 36,
                      mr: isCollapsed ? 0 : 0.5,
                      color: selected ? tokens.primary.main : tokens.text.secondary,
                      justifyContent: 'center',
                      transition: 'color 0.15s ease',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontSize: 14,
                      fontWeight: selected ? 600 : 500,
                      color: selected ? tokens.primary.main : tokens.text.primary,
                      noWrap: true,
                      sx: {
                        opacity: isCollapsed ? 0 : 1,
                        width: isCollapsed ? 0 : 'auto',
                        overflow: 'hidden',
                        transition: 'opacity 0.15s ease',
                      },
                    }}
                    sx={{
                      m: 0,
                      display: isCollapsed ? 'none' : 'block',
                    }}
                  />
                </ListItemButton>
              </Tooltip>
            </ListItem>
          );
        })}
      </List>

      {/* Footer: profile + logout — integrated, not a heavy card */}
      <Box
        sx={{
          flexShrink: 0,
          px: 1,
          pt: 1,
          pb: 1.5,
          mt: 'auto',
        }}
      >
        <Box
          sx={{
            mx: 0.5,
            mb: 0.5,
            px: isCollapsed ? 0 : 1.25,
            py: 1,
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            gap: 1.25,
            bgcolor: isCollapsed ? 'transparent' : 'rgba(246, 248, 251, 0.9)',
          }}
        >
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: tokens.primary.soft,
              color: tokens.primary.main,
              fontSize: 13,
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {(dummyUser.name || 'U').charAt(0).toUpperCase()}
          </Avatar>
          {!isCollapsed && (
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                noWrap
                sx={{ fontSize: 13, fontWeight: 600, color: tokens.text.primary, lineHeight: 1.3 }}
              >
                {dummyUser.name}
              </Typography>
              <Typography
                noWrap
                sx={{ fontSize: 11, fontWeight: 500, color: tokens.text.secondary, lineHeight: 1.3 }}
              >
                {roleLabel}
              </Typography>
            </Box>
          )}
        </Box>

        <ListItem disablePadding>
          <Tooltip title={isCollapsed ? 'Logout' : ''} placement="right" arrow>
            <ListItemButton
              onClick={handleLogout}
              aria-label="Logout"
              sx={{
                mx: 0.5,
                borderRadius: '8px',
                minHeight: NAV_ITEM_HEIGHT,
                height: NAV_ITEM_HEIGHT,
                px: isCollapsed ? 1 : 1.5,
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                color: tokens.text.secondary,
                transition: 'background-color 0.15s ease, color 0.15s ease',
                '&:hover': {
                  bgcolor: tokens.danger.soft,
                  color: tokens.danger.main,
                  '& .MuiListItemIcon-root': { color: tokens.danger.main },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: isCollapsed ? 0 : 36,
                  mr: isCollapsed ? 0 : 0.5,
                  justifyContent: 'center',
                  color: 'inherit',
                }}
              >
                <LogoutIcon sx={{ fontSize: ICON_SIZE }} />
              </ListItemIcon>
              {!isCollapsed && (
                <ListItemText
                  primary="Logout"
                  primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }}
                  sx={{ m: 0 }}
                />
              )}
            </ListItemButton>
          </Tooltip>
        </ListItem>
      </Box>
    </Box>
  );

  const currentDrawerWidth = collapsed ? drawerCollapsedWidth : drawerWidth;
  const isDashboard = location.pathname === '/' || location.pathname === '/dashboard';

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: tokens.bg }}>
      <Box
        component="a"
        href="#main-content"
        sx={{
          position: 'absolute',
          left: -9999,
          top: 8,
          zIndex: 4000,
          px: 2,
          py: 1,
          bgcolor: tokens.primary.main,
          color: '#fff',
          borderRadius: '10px',
          fontSize: 14,
          fontWeight: 600,
          textDecoration: 'none',
          '&:focus': { left: 16 },
        }}
      >
        Skip to main content
      </Box>

      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${currentDrawerWidth}px)` },
          ml: { md: `${currentDrawerWidth}px` },
          bgcolor: tokens.surface,
          color: tokens.text.primary,
          borderBottom: `1px solid ${tokens.divider}`,
          boxShadow: 'none',
          transition: TRANSITION,
          paddingTop: 'env(safe-area-inset-top, 0px)',
        }}
      >
        <Toolbar
          sx={{
            minHeight: { xs: 56, sm: 64 },
            px: { xs: 2, sm: 3 },
            gap: { xs: 1, sm: 2 },
            alignItems: 'center',
          }}
        >
          <IconButton
            edge="start"
            onClick={handleDrawerToggle}
            aria-label="Open navigation menu"
            aria-controls="mobile-nav-drawer"
            aria-expanded={mobileOpen}
            sx={{
              display: { md: 'none' },
              color: tokens.text.primary,
              width: 40,
              height: 40,
            }}
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography
              noWrap
              sx={{
                fontWeight: 600,
                fontSize: { xs: 15, sm: 16 },
                color: tokens.text.primary,
                letterSpacing: '-0.01em',
                lineHeight: 1.3,
              }}
            >
              Industrial Biogas Plant MIS
            </Typography>
            <Typography
              noWrap
              sx={{
                display: { xs: 'none', sm: 'block' },
                fontSize: 12,
                color: tokens.text.secondary,
                lineHeight: 1.3,
                mt: 0.25,
              }}
            >
              Operations · Reporting · Administration
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: { xs: 1, sm: 1.5 },
              flexShrink: 0,
            }}
          >
            {loginAt && <SessionTimerDisplay loginAt={loginAt} />}

            <Box
              sx={{
                display: { xs: 'none', sm: 'flex' },
                flexDirection: 'column',
                alignItems: 'flex-end',
                minWidth: 0,
              }}
            >
              <Typography
                noWrap
                sx={{ fontSize: 13, fontWeight: 600, color: tokens.text.primary, lineHeight: 1.25 }}
              >
                {dummyUser.name}
              </Typography>
              <Typography
                noWrap
                sx={{ fontSize: 11, fontWeight: 500, color: tokens.text.secondary, lineHeight: 1.25 }}
              >
                {roleLabel}
              </Typography>
            </Box>

            <IconButton
              onClick={handleMenu}
              aria-label="Account menu"
              aria-haspopup="true"
              aria-expanded={Boolean(anchorEl)}
              aria-controls={anchorEl ? 'account-menu' : undefined}
              sx={{
                p: 0.25,
                borderRadius: '10px',
                transition: 'background-color 0.15s ease',
                '&:hover': { bgcolor: tokens.primary.soft },
              }}
            >
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: tokens.primary.soft,
                  color: tokens.primary.main,
                  fontSize: 14,
                  fontWeight: 600,
                  border: `1px solid ${tokens.primary.border}`,
                }}
              >
                {(dummyUser.name || 'U').charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
          </Box>

          <Menu
            id="account-menu"
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            slotProps={{
              paper: {
                sx: {
                  mt: 1,
                  minWidth: 160,
                  borderRadius: '10px',
                  border: `1px solid ${tokens.border}`,
                  boxShadow: tokens.shadow.md,
                },
              },
            }}
          >
            <MenuItem
              onClick={handleLogout}
              sx={{
                color: tokens.danger.main,
                gap: 1,
                fontSize: 14,
                fontWeight: 500,
                py: 1.25,
              }}
            >
              <LogoutIcon sx={{ fontSize: ICON_SIZE }} />
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{
          width: { md: currentDrawerWidth },
          flexShrink: { md: 0 },
          transition: TRANSITION,
        }}
        aria-label="Sidebar"
      >
        <Drawer
          id="mobile-nav-drawer"
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: `1px solid ${tokens.border}`,
              paddingTop: 'env(safe-area-inset-top, 0px)',
            },
          }}
        >
          {renderDrawerContent(false)}
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: currentDrawerWidth,
              borderRight: `1px solid ${tokens.border}`,
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.easeInOut,
                duration: 200,
              }),
              overflowX: 'hidden',
              bgcolor: tokens.surface,
            },
          }}
        >
          {renderDrawerContent(collapsed)}
        </Drawer>
      </Box>

      <Box
        component="main"
        id="main-content"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${currentDrawerWidth}px)` },
          mt: { xs: 'calc(56px + env(safe-area-inset-top, 0px))', sm: 'calc(64px + env(safe-area-inset-top, 0px))' },
          minHeight: 'calc(100vh - 64px)',
          // Dashboard: tighter chrome so the page fits without vertical scroll
          p: isDashboard ? { xs: 1, sm: 1.25, md: 1.5 } : { xs: 2, sm: 3 },
          pb: isDashboard
            ? 'calc(env(safe-area-inset-bottom, 0px) + 8px)'
            : 'calc(env(safe-area-inset-bottom, 0px) + 24px)',
          bgcolor: tokens.bg,
          transition: TRANSITION,
        }}
      >
        {children ?? <Outlet />}
        {!isDashboard && (
          <Box
            component="footer"
            sx={{
              mt: 3,
              pt: 2,
              pb: 1,
              borderTop: `1px solid ${tokens.divider}`,
              textAlign: 'center',
            }}
          >
            <Typography variant="caption" sx={{ color: tokens.text.muted, letterSpacing: '0.01em' }}>
              Built & Maintained by Refex AI Team © {new Date().getFullYear()}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};
