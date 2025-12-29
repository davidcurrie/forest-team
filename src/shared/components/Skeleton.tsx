import MuiSkeleton from '@mui/material/Skeleton'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import { SxProps, Theme } from '@mui/material/styles'

interface SkeletonProps {
  className?: string
  width?: string | number
  height?: string | number
  variant?: 'text' | 'circular' | 'rectangular'
  sx?: SxProps<Theme>
}

/**
 * Skeleton loading placeholder
 * Provides visual feedback while content is loading
 */
export function Skeleton({
  width,
  height,
  variant = 'rectangular',
  className,
  sx
}: SkeletonProps) {
  return (
    <MuiSkeleton
      variant={variant}
      width={width}
      height={height}
      className={className}
      sx={sx}
      aria-label="Loading..."
      role="status"
    />
  )
}

/**
 * Skeleton card for loading event cards
 */
export function SkeletonEventCard() {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="60%" height={32} sx={{ mb: 0.5 }} />
            <Skeleton variant="text" width="40%" height={24} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="30%" height={24} />
          </Box>
          <Stack spacing={1} sx={{ minWidth: 120 }}>
            <Skeleton variant="rectangular" height={36} />
            <Skeleton variant="rectangular" height={36} />
            <Skeleton variant="rectangular" height={36} />
          </Stack>
        </Box>
      </CardContent>
    </Card>
  )
}
