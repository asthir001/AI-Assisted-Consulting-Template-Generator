import React, { useEffect, useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Container, Box, Typography, Button, Paper, CircularProgress, TextField, MenuItem, Select, InputLabel, FormControl, Alert, Skeleton, Switch, FormControlLabel, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme, ThemeProvider, createTheme } from '@mui/material/styles';

const refinementOptions = [
  'Add Section',
  'Refine Pitch',
  'Expand Company Details',
  'Graph Visualization',
  'Other',
];

const graphOptions = [
  'Revenue Over Time',
  'Net Income Over Time',
  'Market Size & Forecasts',
  'Employee Growth Over Time',
  'Online Review Sentiment Over Time'
];

const pdfStyles = {
  page: {
    padding: 24,
    fontFamily: 'Helvetica',
    fontSize: 12,
    backgroundColor: '#fff',
  },
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1976d2',
  },
  subheading: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
    color: '#333',
  },
  paragraph: {
    marginBottom: 8,
    color: '#222',
  },
  bullet: {
    marginLeft: 12,
    marginBottom: 4,
  },
  blockquote: {
    borderLeft: '4px solid #1976d2',
    paddingLeft: 8,
    color: '#555',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  code: {
    backgroundColor: '#f5f5f5',
    padding: 2,
    borderRadius: 2,
    fontSize: 11,
    fontFamily: 'Courier',
  },
};

// Simple markdown to PDF component
const MarkdownToPDF = ({ markdown }: { markdown: string }) => {
  // Split by lines and render headings, bullets, etc.
  const lines = markdown.split('\n');
  return (
    <div style={pdfStyles.page}>
      {lines.map((line, idx) => {
        if (/^# /.test(line)) return <span key={idx} style={pdfStyles.heading}>{line.replace(/^# /, '')}</span>;
        if (/^## /.test(line)) return <span key={idx} style={pdfStyles.subheading}>{line.replace(/^## /, '')}</span>;
        if (/^\* /.test(line)) return <span key={idx} style={pdfStyles.bullet}>• {line.replace(/^\* /, '')}</span>;
        if (/^> /.test(line)) return <span key={idx} style={pdfStyles.blockquote}>{line.replace(/^> /, '')}</span>;
        if (/^```/.test(line)) return null;
        if (/^\s*$/.test(line)) return <span key={idx} style={pdfStyles.paragraph}> </span>;
        return <span key={idx} style={pdfStyles.paragraph}>{line}</span>;
      })}
    </div>
  );
};

// Helper to convert markdown to PDF-safe elements
const parseMarkdownForPDF = (markdown: string) => {
  const lines = markdown.split('\n');
  return lines.map((line, idx) => {
    if (/^# /.test(line)) return <span key={idx} style={pdfStyles.heading}>{line.replace(/^# /, '')}</span>;
    if (/^## /.test(line)) return <span key={idx} style={pdfStyles.subheading}>{line.replace(/^## /, '')}</span>;
    if (/^\* /.test(line)) return <span key={idx} style={pdfStyles.bullet}>• {line.replace(/^\* /, '')}</span>;
    if (/^> /.test(line)) return <span key={idx} style={pdfStyles.blockquote}>{line.replace(/^> /, '')}</span>;
    if (/^```/.test(line)) return <span key={idx} style={pdfStyles.paragraph}> </span>; // Instead of null
    if (/^\s*$/.test(line)) return <span key={idx} style={pdfStyles.paragraph}> </span>;
    return <span key={idx} style={pdfStyles.paragraph}>{line}</span>;
  });
};

// Simulated loading lines
const simulatedLines = [
  'Generating introduction...',
  'Adding pitch deck...',
  'Filling in company details...',
  'Formatting template...',
  'Finalizing...',
];

const exportFormats = [
  { label: 'PDF', value: 'pdf' },
  { label: 'Word (DOCX)', value: 'docx' },
  { label: 'Text (TXT)', value: 'txt' },
];

const TemplatePage: React.FC = () => {
  const location = useLocation() as any;
  const navigate = useNavigate();
  const { companyName, taskDomain } = location.state || {};
  const [template, setTemplate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refineOption, setRefineOption] = useState(refinementOptions[0]);
  const [visualizeData, setvisualizeData] = useState('');
  const [refinePrompt, setRefinePrompt] = useState('');
  const [refineLoading, setRefineLoading] = useState(false);
  const [refineError, setRefineError] = useState('');
  const [streamed, setStreamed] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  // Remove simLines and simulated loading
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState('pdf');
  const [exportLoading, setExportLoading] = useState(false);

  // Theme for dark mode
  const theme = useMemo(() => createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: { main: '#1976d2' },
    },
  }), [darkMode]);

  // Real-time streaming for generate
  useEffect(() => {
    if (!companyName || !taskDomain) {
      navigate('/');
      return;
    }
    setLoading(true);
    setError('');
    setTemplate('');
    setStreamed('');
    fetch('http://localhost:8000/generate-template', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company_name: companyName,
        task_or_domain: taskDomain,
      }),
    })
      .then(async (res) => {
        if (!res.body) throw new Error('No stream');
        const reader = res.body.getReader();
        let result = '';
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          const chunk = new TextDecoder().decode(value);
          result += chunk;
          setStreamed(result);
        }
        setTemplate(result);
      })
      .catch(() => setError('Failed to generate template.'))
      .finally(() => setLoading(false));
  }, [companyName, taskDomain, navigate]);

  // Real-time streaming for refine
  useEffect(() => {
    if (refineOption !== 'Graph Visualization') setvisualizeData('');
  }, [refineOption]);

  const handleRefine = (e: React.FormEvent) => {
    e.preventDefault();
    setRefineLoading(true);
    setRefineError('');
    setStreamed('');
    setTemplate(''); // Clear previous template so only new stream is shown
    fetch('http://localhost:8000/refine-template', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        template,
        refinement_option: refineOption,
        refinement_prompt: refinePrompt,
        ...(refineOption === 'Graph Visualization' && { visualize_data: visualizeData }),
      }),
    })
      .then(async (res) => {
        if (!res.body) throw new Error('No stream');
        const reader = res.body.getReader();
        let result = '';
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          const chunk = new TextDecoder().decode(value);
          result += chunk;
          setStreamed(result);
        }
        setTemplate(result);
      })
      .catch(() => setRefineError('Failed to refine template.'))
      .finally(() => setRefineLoading(false));
  };

  // Markdown render with Material UI styles and advanced plugins
  const renderMarkdown = (md: string) => (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({node, ...props}: {node?: any, [key: string]: any}) => <Typography variant="h4" fontWeight={700} gutterBottom {...props} />,
        h2: ({node, ...props}: {node?: any, [key: string]: any}) => <Typography variant="h5" fontWeight={600} gutterBottom {...props} />,
        h3: ({node, ...props}: {node?: any, [key: string]: any}) => <Typography variant="h6" fontWeight={600} gutterBottom {...props} />,
        p: ({node, ...props}: {node?: any, [key: string]: any}) => <Typography variant="body1" paragraph {...props} />,
        ul: ({node, ...props}: {node?: any, [key: string]: any}) => <Box component="ul" sx={{pl: 4, mb: 2}} {...props} />,
        ol: ({node, ...props}: {node?: any, [key: string]: any}) => <Box component="ol" sx={{pl: 4, mb: 2}} {...props} />,
        li: ({node, ...props}: {node?: any, [key: string]: any}) => <li style={{marginBottom: 8}} {...props} />,
        strong: ({node, ...props}: {node?: any, [key: string]: any}) => <strong style={{color: '#1976d2'}} {...props} />,
        blockquote: ({node, ...props}: {node?: any, [key: string]: any}) => <Box sx={{borderLeft: '4px solid #1976d2', pl: 2, color: 'grey.700', fontStyle: 'italic', mb: 2, background: '#f9f9f9'}} {...props} />,
        code({node, inline, className, children, ...props}: any) {
          const match = /language-(\w+)/.exec(className || '')
          return !inline ? (
            <Box sx={{my: 2}}>
              <SyntaxHighlighter style={materialDark} language={match ? match[1] : undefined} PreTag="div">
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            </Box>
          ) : (
            <Box component="code" sx={{background: '#f5f5f5', px: 1, borderRadius: 1, fontSize: '0.95em'}} {...props}>
              {children}
            </Box>
          );
        },
        table: ({node, ...props}) => (
          <Box component="table" sx={{borderCollapse: 'collapse', width: '100%', my: 2, background: '#fff'}} {...props} />
        ),
        th: ({node, ...props}) => (
          <Box component="th" sx={{border: '1px solid #ccc', p: 1, background: '#f0f0f0', fontWeight: 700}} {...props} />
        ),
        td: ({node, ...props}) => (
          <Box component="td" sx={{border: '1px solid #ccc', p: 1}} {...props} />
        ),
        // Add more as needed
      }}
    >
      {md}
    </ReactMarkdown>
  );

  // Export handler
  const handleExport = async () => {
    setExportLoading(true);
    try {
      const res = await fetch('http://localhost:8000/export-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template,
          format: exportFormat,
          company_name: companyName,
          task_or_domain: taskDomain,
        }),
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `consulting_template.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setExportDialogOpen(false);
    } catch (e) {
      alert('Export failed.');
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      {/* Cool background design */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 0,
          background: `linear-gradient(135deg, #e0e7ff 0%, #f0fdfa 100%)`,
          overflow: 'hidden',
        }}
      >
        {/* Abstract shapes */}
        <Box sx={{
          position: 'absolute',
          top: '-100px',
          left: '-100px',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 60% 40%, #a5b4fc 0%, #818cf8 100%)',
          opacity: 0.25,
          filter: 'blur(8px)',
        }} />
        <Box sx={{
          position: 'absolute',
          bottom: '-120px',
          right: '-120px',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 40% 60%, #6ee7b7 0%, #34d399 100%)',
          opacity: 0.18,
          filter: 'blur(12px)',
        }} />
        <Box sx={{
          position: 'absolute',
          top: '30%',
          left: '60%',
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 50% 50%, #fcd34d 0%, #fbbf24 100%)',
          opacity: 0.12,
          filter: 'blur(16px)',
        }} />
      </Box>
      <Container maxWidth="md" sx={{ py: 6, position: 'relative', zIndex: 1 }}>
        <Paper elevation={4} sx={{ p: 4 }}>
          <Box display="flex" flexDirection="column" gap={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h4" fontWeight={700} gutterBottom>
                {companyName && taskDomain ? `${companyName} – ${taskDomain}` : 'Consulting Template'}
              </Typography>
              <FormControlLabel
                control={<Switch checked={darkMode} onChange={() => setDarkMode(v => !v)} />}
                label="Dark Mode"
              />
            </Box>
            {loading ? (
              <Box>
                <Skeleton variant="text" width="80%" height={40} />
                <Skeleton variant="rectangular" width="100%" height={200} sx={{ my: 2 }} />
                <CircularProgress sx={{ display: 'block', mx: 'auto', my: 2 }} />
              </Box>
            ) : error ? (
              <Alert severity="error">{error}</Alert>
            ) : (
              <Box sx={{ background: theme.palette.mode === 'dark' ? '#222' : '#f5f5f5', p: 3, borderRadius: 2, minHeight: 200 }}>
                {renderMarkdown(streamed || template)}
              </Box>
            )}
            <Box display="flex" gap={2}>
              {!loading && !refineLoading && template && (
                <Button variant="outlined" onClick={() => setExportDialogOpen(true)}>
                  Export
                </Button>
              )}
            </Box>
            <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)}>
              <DialogTitle>Export Template</DialogTitle>
              <DialogContent>
                <FormControl fullWidth>
                  <InputLabel id="export-format-label">Format</InputLabel>
                  <Select
                    labelId="export-format-label"
                    value={exportFormat}
                    label="Format"
                    onChange={e => setExportFormat(e.target.value as string)}
                  >
                    {exportFormats.map(opt => (
                      <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setExportDialogOpen(false)} disabled={exportLoading}>Cancel</Button>
                <Button onClick={handleExport} disabled={exportLoading} variant="contained">
                  {exportLoading ? 'Exporting...' : 'Export'}
                </Button>
              </DialogActions>
            </Dialog>
            <Box component="form" onSubmit={handleRefine} display="flex" flexDirection="column" gap={2} mt={4}>
              <Typography variant="h6">Refine or Add to Template</Typography>
              <FormControl fullWidth>
                <InputLabel id="refine-option-label">Refinement Option</InputLabel>
                <Select
                  labelId="refine-option-label"
                  value={refineOption}
                  label="Refinement Option"
                  onChange={e => setRefineOption(e.target.value as string)}
                >
                  {refinementOptions.map(opt => (
                    <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              {refineOption === 'Graph Visualization' ? (
                <FormControl fullWidth>
                  <InputLabel id="visualize-data-label">Visualize Data</InputLabel>
                  <Select
                    labelId="visualize-data-label"
                    value={visualizeData}
                    label="Visualize Data"
                    onChange={e => setvisualizeData(e.target.value as string)}
                    required
                  >
                    {graphOptions.map(opt => (
                      <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : (
              
              <TextField
                label="Describe your refinement or addition"
                value={refinePrompt}
                onChange={e => setRefinePrompt(e.target.value)}
                fullWidth
                required
              />
            )}
              <Button type="submit" variant="contained" disabled={refineLoading}>
                {refineLoading ? 'Refining...' : 'Refine Template'}
              </Button>
              {refineError && <Alert severity="error">{refineError}</Alert>}
            </Box>
          </Box>
        </Paper>
      </Container>
    </ThemeProvider>
  );
};

export default TemplatePage; 