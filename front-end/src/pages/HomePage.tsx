import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Box, Typography, TextField, Button, Paper, Card, CardContent, InputAdornment } from '@mui/material';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';

const HomePage: React.FC = () => {
  const [companyName, setCompanyName] = useState('');
  const [taskDomain, setTaskDomain] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (companyName && taskDomain) {
      navigate('/template', { state: { companyName, taskDomain } });
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      width: '100vw',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f0fdfa 0%, #e0e7ff 100%)',
    }}>
      {/* Abstract background shapes */}
      <Box sx={{
        position: 'absolute',
        top: '-120px',
        left: '-120px',
        width: 400,
        height: 400,
        borderRadius: '50%',
        background: 'radial-gradient(circle at 60% 40%, #a5b4fc 0%, #818cf8 100%)',
        opacity: 0.22,
        filter: 'blur(8px)',
        zIndex: 0,
      }} />
      <Box sx={{
        position: 'absolute',
        bottom: '-120px',
        right: '-120px',
        width: 500,
        height: 500,
        borderRadius: '50%',
        background: 'radial-gradient(circle at 40% 60%, #6ee7b7 0%, #34d399 100%)',
        opacity: 0.15,
        filter: 'blur(12px)',
        zIndex: 0,
      }} />
      <Box sx={{
        position: 'absolute',
        top: '30%',
        left: '60%',
        width: 200,
        height: 200,
        borderRadius: '50%',
        background: 'radial-gradient(circle at 50% 50%, #fcd34d 0%, #fbbf24 100%)',
        opacity: 0.10,
        filter: 'blur(16px)',
        zIndex: 0,
      }} />
      <Container maxWidth="sm" sx={{ zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <Card elevation={8} sx={{ width: '100%', borderRadius: 4, p: 2, background: 'rgba(255,255,255,0.95)' }}>
          <CardContent>
            <Box display="flex" flexDirection="column" alignItems="center" gap={3}>
              <BusinessCenterIcon sx={{ fontSize: 56, color: '#6366f1', mb: 1 }} />
              <Typography variant="h4" fontWeight={700} gutterBottom align="center">
                Consulting Template Generator
              </Typography>
              <Typography variant="subtitle1" color="text.secondary" align="center" sx={{ mb: 2 }}>
                Instantly create beautiful, professional consulting templates for any company or domain.
              </Typography>
              <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                <TextField
                  label="Company Name"
                  variant="outlined"
                  fullWidth
                  required
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BusinessCenterIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  label="Task / Domain"
                  variant="outlined"
                  fullWidth
                  required
                  value={taskDomain}
                  onChange={e => setTaskDomain(e.target.value)}
                  sx={{ mb: 4 }}
                />
                <Box display="flex" justifyContent="center">
                  <Button type="submit" variant="contained" size="large" sx={{ px: 6, py: 1.5, fontWeight: 600, fontSize: 18, borderRadius: 3, background: 'linear-gradient(90deg, #6366f1 0%, #34d399 100%)' }}>
                    Generate
                  </Button>
                </Box>
              </form>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default HomePage; 