import React, { useState, useEffect } from 'react';
import { TextField, InputAdornment, Box, Typography } from '@mui/material';
import { HelpTooltip } from './HelpTooltip';

interface InputGroupProps {
  label: string;
  unit?: string;
  error?: string;
  description?: string;
  helpText?: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  step?: string;
  type?: string;
}

export const InputGroup: React.FC<InputGroupProps> = ({ 
  label, 
  unit, 
  error, 
  description, 
  helpText, 
  value, 
  onChange, 
  placeholder,
  step = "any",
  type = "number",
  ...props 
}) => {
  const [localValue, setLocalValue] = useState<string>(value?.toString() ?? '');

  useEffect(() => {
    const currentNum = parseFloat(localValue);
    const incomingNum = typeof value === 'string' ? parseFloat(value) : (value as number);

    if (currentNum === incomingNum) return;
    if (isNaN(currentNum) && incomingNum === 0) return;

    setLocalValue(value?.toString() ?? '');
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
    if (onChange) onChange(e);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Typography variant="caption" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: 'text.secondary' }}>
          {label}
        </Typography>
        {helpText && <HelpTooltip content={helpText} />}
      </Box>
      
      <TextField
        fullWidth
        type={type}
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        error={!!error}
        helperText={error || description}
        inputProps={{ step }}
        InputProps={{
          endAdornment: unit ? (
            <InputAdornment position="end">
              <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', color: 'text.secondary' }}>
                {unit}
              </Typography>
            </InputAdornment>
          ) : undefined,
          sx: {
            fontFamily: 'monospace',
            fontWeight: 700,
            '& input': {
              textAlign: 'left',
            },
          },
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 4,
            backgroundColor: 'background.paper',
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: 'primary.light',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: 'primary.main',
              borderWidth: 2,
            },
          },
        }}
        {...props}
      />
    </Box>
  );
};