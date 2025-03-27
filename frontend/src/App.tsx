import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Button,
  TextField,
  Typography,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer
} from 'recharts';

const App: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [nRows, setNRows] = useState<number>(5);
  const [prompt, setPrompt] = useState<string>('');
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [viewData, setViewData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [aiAnswer, setAiAnswer] = useState<string>(''); // For AI's text explanation
  const [graphData, setGraphData] = useState<any[]>([]); // For parsed graph data

  // Fetch list of uploaded files from the backend
  const fetchUploadedFiles = async () => {
    try {
      const response = await fetch('http://localhost:5000/files');
      if (response.ok) {
        const files = await response.json();
        setUploadedFiles(files);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch files');
      }
    } catch (err) {
      setError('Error fetching files');
      console.error('Error fetching files:', err);
    }
  };

  useEffect(() => {
    fetchUploadedFiles();
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
      setError(null);
    }
  };

  const handleSheetChange = (event: SelectChangeEvent<string>) => {
    setSelectedSheet(event.target.value);
    setError(null);
  };

  const handleNRowsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNRows(Number(event.target.value));
  };

  const handlePromptChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPrompt(event.target.value);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('http://localhost:5000/upload', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        await fetchUploadedFiles();
        setSelectedFile(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Upload failed');
      }
    } catch (err) {
      setError('Error uploading file');
      console.error('Error uploading file:', err);
    }
  };

  const handleViewSheet = async () => {
    if (!selectedSheet) {
      setError('Please select a file first');
      return;
    }
    setError(null);

    try {
      const response = await fetch(
        `http://localhost:5000/view?fileName=${encodeURIComponent(selectedSheet)}&n=${nRows}`
      );

      if (response.ok) {
        const data = await response.json();
        console.log('Data returned:', data);

        if (Array.isArray(data) && data.length > 0) {
          // Gather all keys from all rows
          const allKeys = new Set<string>();
          data.forEach((row: any) => {
            Object.keys(row).forEach((key) => allKeys.add(key));
          });

          setColumns(Array.from(allKeys));
          setViewData(data);
        } else {
          setError('No data found in the file');
          setViewData([]);
          setColumns([]);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch view data');
        setViewData([]);
        setColumns([]);
      }
    } catch (err) {
      setError('Error fetching view data');
      console.error('Error fetching view data:', err);
      setViewData([]);
      setColumns([]);
    }
  };

  // Send user prompt and selected file to the AI and process the composite JSON response
  const handleAskQuestion = async () => {
    setError(null);
    if (!selectedSheet) {
      setError('Please select a file first, then ask your question');
      return;
    }
    if (!prompt.trim()) {
      setError('Prompt cannot be empty');
      return;
    }
  
    try {
      const response = await fetch('http://localhost:5000/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          fileName: selectedSheet
        })
      });
  
      if (response.ok) {
        const data = await response.json();
        console.log('AI Response:', data.answer);
        try {
          // Parse the composite JSON answer
          const parsedResponse = JSON.parse(data.answer);
          setAiAnswer(parsedResponse.text);
          setGraphData(parsedResponse.graphData);
        } catch (err) {
          setError('AI response is not valid JSON.');
          console.error('Error parsing AI response:', err);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to ask AI');
      }
    } catch (err) {
      setError('Error calling AI');
      console.error('Error calling AI:', err);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      {/* Error Alert */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Typography variant="h4" gutterBottom>
        AI Powered CSV/Excel App
      </Typography>

      {/* File Upload Section */}
      <Box sx={{ my: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button variant="contained" component="label">
            Upload XLS/CSV File
            <input
              type="file"
              accept=".csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              hidden
              onChange={handleFileChange}
            />
          </Button>
          <Button variant="outlined" onClick={handleUpload} disabled={!selectedFile}>
            Submit Upload
          </Button>
        </Box>
        {selectedFile && (
          <Typography variant="body1" sx={{ mt: 1 }}>
            Selected File: {selectedFile.name}
          </Typography>
        )}
      </Box>

      {/* File View Section */}
      <Box sx={{ my: 2 }}>
        <Typography variant="h6" gutterBottom>
          View File/Sheet
        </Typography>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="sheet-select-label">Select File</InputLabel>
          <Select
            labelId="sheet-select-label"
            value={selectedSheet}
            label="Select File"
            onChange={handleSheetChange}
          >
            {uploadedFiles.length > 0 ? (
              uploadedFiles.map((file, index) => (
                <MenuItem key={index} value={file}>
                  {file}
                </MenuItem>
              ))
            ) : (
              <MenuItem value="">
                <em>No files uploaded yet</em>
              </MenuItem>
            )}
          </Select>
        </FormControl>
        <TextField
          type="number"
          label="Number of Rows (N)"
          value={nRows}
          onChange={handleNRowsChange}
          fullWidth
          sx={{ mb: 2 }}
          inputProps={{ min: 1, max: 100 }}
        />
        <Button variant="contained" onClick={handleViewSheet} disabled={!selectedSheet}>
          View Data
        </Button>
      </Box>

      {/* Data Display Section */}
      {viewData.length > 0 && (
        <Box sx={{ mt: 4, width: '100%', overflowX: 'auto' }}>
          <Typography variant="h6" gutterBottom>
            Top {nRows} rows from {selectedSheet}:
          </Typography>
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="data table">
              <TableHead>
                <TableRow>
                  {columns.map((col) => (
                    <TableCell key={col} sx={{ fontWeight: 'bold' }}>
                      {col}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {viewData.map((row, rowIndex) => (
                  <TableRow key={rowIndex} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    {columns.map((col) => (
                      <TableCell key={col}>
                        {row[col] !== undefined && row[col] !== null ? String(row[col]) : 'Empty'}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Prompt Section */}
      <Box sx={{ my: 2 }}>
        <Typography variant="h6" gutterBottom>
          Ask a Question / Prompt
        </Typography>
        <TextField
          label="Your Question"
          value={prompt}
          onChange={handlePromptChange}
          multiline
          rows={4}
          fullWidth
          variant="outlined"
          sx={{ mb: 2 }}
        />
        <Button variant="contained" onClick={handleAskQuestion}>
          Submit Question
        </Button>
      </Box>

      {/* AI Response Display */}
      {aiAnswer && (
        <Box sx={{ my: 2 }}>
          <Typography variant="h6" gutterBottom>
            AI Response:
          </Typography>
          <Typography variant="body1">{aiAnswer}</Typography>
        </Box>
      )}

      {/* Graph Display Section */}
      {graphData.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Generated Graph:
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={graphData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="x" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="y" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      )}
    </Container>
  );
};

export default App;
