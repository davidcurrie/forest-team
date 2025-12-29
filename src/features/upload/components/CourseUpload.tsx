import { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import { FileUploader } from './FileUploader'

interface CourseUploadProps {
  onCourseSelect: (file: File) => void
}

export function CourseUpload({ onCourseSelect }: CourseUploadProps) {
  const [courseFile, setCourseFile] = useState<File | null>(null)

  const handleFileSelect = (file: File) => {
    setCourseFile(file)
    onCourseSelect(file)
  }

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Course Data
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Upload course data in IOF XML v3 format (exported from Condes or Purple Pen)
        </Typography>
      </Box>

      <FileUploader
        accept=".xml"
        onFileSelect={handleFileSelect}
        label="IOF XML File"
        description="Course data in IOF XML v3 standard format"
        maxSize={5}
        currentFile={courseFile}
      />

      <Alert severity="info" sx={{ mt: 2 }}>
        <AlertTitle>Export Instructions</AlertTitle>
        <List dense disablePadding>
          <ListItem disablePadding>
            <ListItemText
              primary={
                <Typography variant="body2">
                  <strong>Condes:</strong> File → Export → IOF XML v3
                </Typography>
              }
            />
          </ListItem>
          <ListItem disablePadding>
            <ListItemText
              primary={
                <Typography variant="body2">
                  <strong>Purple Pen:</strong> File → Export → IOF XML Course Data
                </Typography>
              }
            />
          </ListItem>
        </List>
      </Alert>
    </Box>
  )
}
