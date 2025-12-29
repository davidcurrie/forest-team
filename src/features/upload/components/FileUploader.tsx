import { useCallback, useState } from 'react'
import FormControl from '@mui/material/FormControl'
import FormLabel from '@mui/material/FormLabel'
import FormHelperText from '@mui/material/FormHelperText'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'

interface FileUploaderProps {
  accept: string
  onFileSelect: (file: File) => void
  label: string
  description?: string
  maxSize?: number // in MB
  currentFile?: File | null
}

export function FileUploader({
  accept,
  onFileSelect,
  label,
  description,
  maxSize = 20,
  currentFile,
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) {
        onFileSelect(files[0])
      }
    },
    [onFileSelect]
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files && files.length > 0) {
        onFileSelect(files[0])
      }
    },
    [onFileSelect]
  )

  const inputId = `file-input-${label.replace(/\s+/g, '-').toLowerCase()}`

  return (
    <FormControl fullWidth sx={{ mt: 2 }}>
      <FormLabel>{label}</FormLabel>
      {description && <FormHelperText>{description}</FormHelperText>}

      <Paper
        variant="outlined"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        sx={{
          p: 3,
          mt: 1,
          textAlign: 'center',
          cursor: 'pointer',
          border: 2,
          borderStyle: 'dashed',
          borderColor: isDragging ? 'primary.main' : 'divider',
          bgcolor: isDragging ? 'action.hover' : 'background.paper',
          transition: 'all 0.2s',
          '&:hover': {
            borderColor: 'primary.light',
            bgcolor: 'action.hover',
          },
        }}
      >
        <input
          type="file"
          accept={accept}
          onChange={handleFileInput}
          style={{ display: 'none' }}
          id={inputId}
        />
        <label htmlFor={inputId} style={{ cursor: 'pointer' }}>
          <Stack alignItems="center" spacing={1}>
            <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
            <Typography variant="body2">
              {currentFile ? (
                <Box component="span" sx={{ fontWeight: 'medium', color: 'primary.main' }}>
                  {currentFile.name}
                </Box>
              ) : (
                <>
                  Drag and drop or{' '}
                  <Box component="span" sx={{ color: 'primary.main', fontWeight: 'medium' }}>
                    browse
                  </Box>
                </>
              )}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Maximum size: {maxSize}MB
            </Typography>
          </Stack>
        </label>
      </Paper>
    </FormControl>
  )
}
