import { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import RadioGroup from '@mui/material/RadioGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import Radio from '@mui/material/Radio'
import Stack from '@mui/material/Stack'
import { FileUploader } from './FileUploader'

interface MapUploadProps {
  onMapSelect: (imageFile: File, worldFile?: File) => void
}

export function MapUpload({ onMapSelect }: MapUploadProps) {
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [worldFile, setWorldFile] = useState<File | null>(null)
  const [uploadType, setUploadType] = useState<'jpeg-jgw' | 'kmz'>('jpeg-jgw')

  const handleImageSelect = (file: File) => {
    setImageFile(file)
    if (worldFile) {
      onMapSelect(file, worldFile)
    } else if (uploadType === 'kmz') {
      onMapSelect(file)
    }
  }

  const handleWorldFileSelect = (file: File) => {
    setWorldFile(file)
    if (imageFile) {
      onMapSelect(imageFile, file)
    }
  }

  const handleKmzSelect = (file: File) => {
    setImageFile(file)
    onMapSelect(file)
  }

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Map File
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Upload a georeferenced map image in either JPEG + JGW or KMZ format
        </Typography>
      </Box>

      <RadioGroup
        value={uploadType}
        onChange={(e) => setUploadType(e.target.value as 'jpeg-jgw' | 'kmz')}
        sx={{ mb: 2 }}
      >
        <Stack direction="row" spacing={3}>
          <FormControlLabel
            value="jpeg-jgw"
            control={<Radio />}
            label="JPEG + World File (.jgw)"
          />
          <FormControlLabel
            value="kmz"
            control={<Radio />}
            label="Google Earth (.kmz)"
          />
        </Stack>
      </RadioGroup>

      {uploadType === 'jpeg-jgw' ? (
        <Stack spacing={2}>
          <FileUploader
            accept=".jpg,.jpeg"
            onFileSelect={handleImageSelect}
            label="Map Image (JPEG)"
            description="Upload the orienteering map image"
            maxSize={20}
            currentFile={imageFile}
          />
          <FileUploader
            accept=".jgw"
            onFileSelect={handleWorldFileSelect}
            label="World File (.jgw)"
            description="Upload the JPEG world file containing georeferencing data"
            maxSize={1}
            currentFile={worldFile}
          />
        </Stack>
      ) : (
        <FileUploader
          accept=".kmz"
          onFileSelect={handleKmzSelect}
          label="KMZ File"
          description="Upload a Google Earth KMZ file containing the map and georeferencing"
          maxSize={20}
          currentFile={imageFile}
        />
      )}
    </Box>
  )
}
