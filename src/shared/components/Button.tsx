import { ReactNode } from 'react'
import MuiButton, { ButtonProps as MuiButtonProps } from '@mui/material/Button'

interface ButtonProps extends Omit<MuiButtonProps, 'variant' | 'size'> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  ...props
}: ButtonProps) {
  // Map custom variants to MUI variants
  const getMuiVariant = () => {
    if (variant === 'secondary') return 'outlined'
    return 'contained'
  }

  // Map custom variants to MUI colors
  const getMuiColor = () => {
    if (variant === 'danger') return 'error'
    return 'primary'
  }

  // Map custom sizes to MUI sizes
  const getMuiSize = (): 'small' | 'medium' | 'large' => {
    if (size === 'sm') return 'small'
    if (size === 'lg') return 'large'
    return 'medium'
  }

  return (
    <MuiButton
      variant={getMuiVariant()}
      color={getMuiColor()}
      size={getMuiSize()}
      {...props}
    >
      {children}
    </MuiButton>
  )
}
