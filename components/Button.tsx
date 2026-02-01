import React from 'react';
import { Button as MuiButton, ButtonProps as MuiButtonProps } from '@mui/material';

interface ButtonProps extends Omit<MuiButtonProps, 'variant'> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  icon, 
  fullWidth = false, 
  ...props 
}) => {
  const getMuiVariant = () => {
    switch (variant) {
      case 'outline':
        return 'outlined';
      case 'secondary':
      case 'danger':
        return 'contained';
      default:
        return 'contained';
    }
  };

  const getColor = () => {
    switch (variant) {
      case 'secondary':
        return 'secondary';
      case 'danger':
        return 'error';
      default:
        return 'primary';
    }
  };

  return (
    <MuiButton 
      variant={getMuiVariant()}
      color={getColor()}
      fullWidth={fullWidth}
      startIcon={icon}
      sx={{
        borderRadius: 4,
        py: 1.5,
        px: 3,
        fontWeight: 700,
        textTransform: 'none',
        boxShadow: variant !== 'outline' ? 3 : 0,
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: variant !== 'outline' ? 6 : 2,
        },
        transition: 'all 0.2s ease-in-out',
      }}
      {...props}
    >
      {children}
    </MuiButton>
  );
};