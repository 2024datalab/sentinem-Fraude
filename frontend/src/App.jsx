import React, { useState } from 'react';
import { ThemeProvider, createTheme, CssBaseline, Box, AppBar, Toolbar, Typography, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Container, Grow } from '@mui/material';
import { Dashboard as DashIcon, Monitor as MonitorIcon, ListAlt as ListIcon, PlayCircle as SimIcon, Security as SecurityIcon } from '@mui/icons-material';
import Overview from './pages/Overview';
import Monitoring from './pages/Monitoring';
import Inbox from './pages/Inbox';
import Simulator from './pages/Simulator';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#00e5ff' }, // Softer cyan
    secondary: { main: '#b388ff' }, // Soft lavender
    background: { default: '#0b111a', paper: '#141a23' },
    text: { primary: '#e0e6ed', secondary: 'rgba(224, 230, 237, 0.7)' },
    error: { main: '#ff5252' },
    warning: { main: '#ffd740' },
    success: { main: '#69f0ae' },
  },
  typography: {
    fontFamily: 'Outfit, sans-serif',
    h4: { fontWeight: 700, letterSpacing: '-0.01em' },
    h5: { fontWeight: 800, letterSpacing: '0.02em' },
  },
});

const drawerWidth = 260;

function App() {
  const [activeTab, setActiveTab] = useState('Overview');

  const menuItems = [
    { text: 'Vue d\'Ensemble', icon: <DashIcon />, id: 'Overview' },
    { text: 'Analyse & Monitoring', icon: <MonitorIcon />, id: 'Monitoring' },
    { text: 'Transactions', icon: <ListIcon />, id: 'Inbox' },
    { text: 'Simulateur IA', icon: <SimIcon />, id: 'Simulator' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'Overview': return <Overview />;
      case 'Monitoring': return <Monitoring />;
      case 'Inbox': return <Inbox />;
      case 'Simulator': return <Simulator />;
      default: return <Overview />;
    }
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default', position: 'relative' }}>
        {/* Background Decorative Elements */}
        <div className="bg-glow-1"></div>
        <div className="bg-glow-2"></div>

        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, bgcolor: 'rgba(11, 17, 26, 0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }} elevation={0}>
          <Toolbar sx={{ height: 80 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', p: 1, borderRadius: 2, mr: 2 }}>
              <SecurityIcon sx={{ color: 'primary.main', fontSize: 28 }} />
            </Box>
            <Typography variant="h5" noWrap component="div" sx={{ fontWeight: '800', letterSpacing: 1, color: 'white' }}>
              SENTINELLE <span style={{ color: '#00e5ff' }}>FRAUDE</span>
            </Typography>
          </Toolbar>
        </AppBar>
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: {
              width: drawerWidth,
              boxSizing: 'border-box',
              bgcolor: 'rgba(11, 17, 26, 0.5)',
              borderRight: '1px solid rgba(255,255,255,0.05)',
              backdropFilter: 'blur(20px)'
            },
          }}
        >
          <Toolbar sx={{ height: 80 }} />
          <Box sx={{ overflow: 'auto', mt: 4 }}>
            <List sx={{ px: 2 }}>
              {menuItems.map((item) => (
                <ListItem key={item.text} disablePadding sx={{ mb: 1.5 }}>
                  <ListItemButton
                    onClick={() => setActiveTab(item.id)}
                    selected={activeTab === item.id}
                    sx={{
                      borderRadius: 3,
                      py: 1.5,
                      transition: 'all 0.2s ease',
                      '&.Mui-selected': {
                        bgcolor: 'rgba(0, 229, 255, 0.12)',
                        color: 'primary.main',
                        '&:hover': { bgcolor: 'rgba(0, 229, 255, 0.18)' }
                      },
                      '&.Mui-selected .MuiListItemIcon-root': { color: 'primary.main' },
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.04)', transform: 'translateX(4px)' }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 45 }}>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 600 }} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>
        </Drawer>
        <Box component="main" sx={{ flexGrow: 1, p: 5, minHeight: '100vh', transition: 'all 0.3s ease' }}>
          <Toolbar sx={{ height: 80 }} />
          <Container maxWidth="xl" sx={{ px: { md: 4 } }}>
            <Grow in={true} key={activeTab} timeout={500}>
              <Box>
                {renderContent()}
              </Box>
            </Grow>
          </Container>
          <Box sx={{ mt: 8, pb: 4, textAlign: 'center', opacity: 0.4 }}>
            <Typography variant="caption" sx={{ letterSpacing: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <SecurityIcon sx={{ fontSize: 14 }} /> SYSTÈME DE PROTECTION BANCAIRE | © 2026 SENTINELLE IA
            </Typography>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
