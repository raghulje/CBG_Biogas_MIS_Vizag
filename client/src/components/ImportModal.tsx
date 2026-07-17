import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  LinearProgress,
  Alert,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { misService } from '../services/misService';
import { tokens } from '../themes';

interface ImportModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ImportModal({ open, onClose, onSuccess }: ImportModalProps) {
  // Parent should own notifications; use onSuccess/onClose to communicate result.
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const [recordsImported, setRecordsImported] = useState(0);
  const [error, setError] = useState('');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        setSelectedFile(file);
        setError('');
        setSuccess(false);
      } else {
        setError('Please select a valid Excel file (.xlsx or .xls)');
        setSelectedFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    try {
      setUploading(true);
      setProgress(0);
      setError('');
      setSuccess(false);

      const data = await misService.importEntries(selectedFile);

      setSuccess(true);
      setRecordsImported(data?.results?.success ?? data?.recordsImported ?? 0);
      setSelectedFile(null);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to import Excel file. Please try again.';
      setError(msg);
      if (onSuccess) {
        // use onSuccess as an error callback isn't provided; parent can refresh or handle
      }
      // Do not show snackbar here; parent should display it via onSuccess/onError
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setSelectedFile(null);
      setError('');
      setSuccess(false);
      setProgress(0);
      setRecordsImported(0);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1.5 }}>
        Import Excel File
        <IconButton onClick={handleClose} disabled={uploading} size="small" aria-label="Close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ py: 1 }}>
          <Box
            sx={{
              border: `1px dashed ${tokens.primary.border}`,
              borderRadius: `${tokens.radius.input}px`,
              p: 4,
              textAlign: 'center',
              backgroundColor: tokens.primary.soft,
              mb: 2,
            }}
          >
            <CloudUploadIcon sx={{ fontSize: 40, color: tokens.primary.main, mb: 2 }} />
            <Typography variant="body1" sx={{ mb: 2, color: tokens.text.secondary }}>
              Select an Excel file to import MIS data
            </Typography>
            <Button variant="contained" component="label" disabled={uploading} sx={{ minWidth: 120 }}>
              Choose File
              <input type="file" hidden accept=".xlsx,.xls" onChange={handleFileSelect} />
            </Button>
          </Box>

          {selectedFile && (
            <Box
              sx={{
                p: 2,
                backgroundColor: tokens.primary.soft,
                borderRadius: `${tokens.radius.input}px`,
                border: `1px solid ${tokens.primary.border}`,
                mb: 2,
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Selected File:
              </Typography>
              <Typography variant="body2" sx={{ color: tokens.primary.main }}>
                {selectedFile.name}
              </Typography>
              <Typography variant="caption" sx={{ color: tokens.text.secondary }}>
                Size: {(selectedFile.size / 1024).toFixed(2)} KB
              </Typography>
            </Box>
          )}

          {uploading && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Uploading... {progress}%
              </Typography>
              <LinearProgress variant="determinate" value={progress} />
            </Box>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Import Successful!
              </Typography>
              <Typography variant="body2">
                {recordsImported} record(s) imported successfully.
              </Typography>
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ mt: 3 }}>
            <Typography variant="caption" sx={{ color: tokens.text.secondary, display: 'block', mb: 1 }}>
              <strong>Instructions:</strong>
            </Typography>
            <Typography variant="caption" sx={{ color: tokens.text.secondary, display: 'block' }}>
              • Only .xlsx and .xls files are supported
            </Typography>
            <Typography variant="caption" sx={{ color: tokens.text.secondary, display: 'block' }}>
              • Ensure the Excel file follows the correct format
            </Typography>
            <Typography variant="caption" sx={{ color: tokens.text.secondary, display: 'block' }}>
              • Maximum file size: 10 MB
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button variant="outlined" onClick={handleClose} disabled={uploading} sx={{ minWidth: 96 }}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleUpload} disabled={!selectedFile || uploading} sx={{ minWidth: 112 }}>
          {uploading ? 'Uploading...' : 'Upload'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
