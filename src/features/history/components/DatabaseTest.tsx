import { useState, useEffect } from 'react';
import { apiService } from '@/services/api.service';

export const useDatabaseStatus = () => {
  const [status, setStatus] = useState<'testing' | 'success' | 'error'>('testing');
  const [message, setMessage] = useState<string>('Testing...');

  useEffect(() => {
    testDatabase();
  }, []);

  const testDatabase = async () => {
    setStatus('testing');
    setMessage('Running diagnostics...');
    
    try {
      const response = await apiService.testConnection();
      
      if (response.status === 'error') {
        setStatus('error');
        setMessage('Connection failed');
        return;
      }

      setStatus('success');
      setMessage('Connected');
    } catch (error) {
      console.error('Database test error:', error);
      setStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setMessage(`Test failed: ${errorMessage}`);
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-yellow-500';
    }
  };

  return { status, message, getStatusColor };
};