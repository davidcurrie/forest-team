import { useState } from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Collapse from '@mui/material/Collapse'
import Stack from '@mui/material/Stack'
import FormGroup from '@mui/material/FormGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import { Button } from '../../../shared/components/Button'
import { Course } from '../../../shared/types'

interface CourseSelectorProps {
  courses: Course[]
  onToggleCourse: (courseId: string) => void
  onToggleAll: (visible: boolean) => void
}

export function CourseSelector({ courses, onToggleCourse, onToggleAll }: CourseSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const allVisible = courses.every(c => c.visible)
  const someVisible = courses.some(c => c.visible)

  return (
    <Card
      sx={{
        position: 'absolute',
        left: 16,
        top: 16,
        maxWidth: 320,
        display: 'flex',
        flexDirection: 'column',
        pointerEvents: 'auto',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 1.5,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="subtitle2" fontWeight="semibold">
            Courses
          </Typography>
          <IconButton
            size="small"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
        <Collapse in={isExpanded}>
          <Stack direction="row" spacing={1}>
            <Button
              onClick={() => onToggleAll(true)}
              disabled={allVisible}
              size="sm"
              variant="primary"
            >
              Show All
            </Button>
            <Button
              onClick={() => onToggleAll(false)}
              disabled={!someVisible}
              size="sm"
              variant="secondary"
            >
              Hide All
            </Button>
          </Stack>
        </Collapse>
      </Box>

      {/* Course List */}
      <Collapse in={isExpanded}>
        <CardContent
          sx={{
            p: 0.5,
            maxHeight: 'calc(70vh - 100px)',
            overflowY: 'auto',
            '&:last-child': { pb: 0.5 },
          }}
        >
          {courses.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>
              No courses available
            </Typography>
          ) : (
            <FormGroup>
              {courses.map(course => (
                <FormControlLabel
                  key={course.id}
                  control={
                    <Checkbox
                      checked={course.visible}
                      onChange={() => onToggleCourse(course.id)}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 16,
                          height: 16,
                          bgcolor: course.color,
                          borderRadius: 0.5,
                          border: '1px solid rgba(0, 0, 0, 0.1)',
                          flexShrink: 0,
                        }}
                        aria-label={`Course color: ${course.color}`}
                      />
                      <Typography variant="body2">{course.name}</Typography>
                    </Box>
                  }
                  sx={{
                    py: 0.5,
                    px: 1,
                    mx: 0,
                    borderRadius: 1,
                    minHeight: 44,
                    '&:hover': {
                      bgcolor: 'grey.50',
                    },
                  }}
                />
              ))}
            </FormGroup>
          )}
        </CardContent>
      </Collapse>
    </Card>
  )
}
