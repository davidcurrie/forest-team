import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'

interface ValidationErrorsProps {
  errors: string[]
}

export function ValidationErrors({ errors }: ValidationErrorsProps) {
  if (errors.length === 0) return null

  return (
    <Alert severity="error">
      <AlertTitle>Validation Errors</AlertTitle>
      <List dense disablePadding>
        {errors.map((error, index) => (
          <ListItem key={index} disablePadding>
            <ListItemText
              primary={error}
              primaryTypographyProps={{ variant: 'body2' }}
            />
          </ListItem>
        ))}
      </List>
    </Alert>
  )
}
