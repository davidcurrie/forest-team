import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg'
  message?: string
}

export function Loading({ size = 'md', message }: LoadingProps) {
  // Map custom sizes to pixel values
  const getSize = () => {
    if (size === 'sm') return 16
    if (size === 'lg') return 48
    return 32
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1.5,
      }}
    >
      <CircularProgress size={getSize()} />
      {message && (
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      )}
    </Box>
  )
}
