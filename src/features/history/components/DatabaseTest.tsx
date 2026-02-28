import { useState, useEffect, useCallback } from 'react';
import { apiService } from '@/services/api.service';

export const useDatabaseStatus = () => {
  const [status, setStatus] = useState<'testing' | 'success' | 'error' | 'warning'>('testing');
  const [message, setMessage] = useState<string>('Connecting...');

  const testDatabase = useCallback(async () => {
    setStatus('testing');
    setMessage('Connecting to Server...');
    
    try {
      // Implement a manual timeout wrapper since Supabase client can sometimes hang indefinitely 
      // if the endpoint is completely unreachable (e.g. strict firewall or offline).
      const timeoutPromise = new Promise<{ status: string, error?: any }>((_, reject) => {
        setTimeout(() => reject(new Error('Connection timed out after 10 seconds')), 10000);
      });

      // Race between the actual API test and the 10-second timeout
      const response = await Promise.race([
        apiService.testConnection(),
        timeoutPromise
      ]) as any;
      
      if (response.status === 'error') {
        setStatus('error');
        
        // Provide more granular and helpful error messages
        const errorCode = response.error?.code;
        if (errorCode === 'NO_CONFIG') {
          setMessage('Offline Mode (No Config)');
          setStatus('warning'); // Not necessarily an error if they want to run locally
        } else if (errorCode === 'NETWORK_ERROR' || response.error?.message?.includes('fetch')) {
          setMessage('Network Unreachable');
        } else if (errorCode === 'DATABASE_ERROR') {
          setMessage('Database Service Down');
        } else {
          setMessage(`Error: ${response.error?.message || 'Connection failed'}`);
        }
        return;
      }

      setStatus('success');
      setMessage('Connected (Online)');
    } catch (error) {
      console.error('Database connection test error:', error);
      setStatus('error');
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('timed out')) {
        setMessage('Connection Timed Out');
      } else if (errorMessage.toLowerCase().includes('fetch') || errorMessage.includes('Failed to fetch')) {
        setMessage('Network Error');
      } else {
        setMessage('Connection Failed');
      }
    }
  }, []);

  useEffect(() => {
    testDatabase();

    // Auto-retry every 60 seconds if not connected
    const interval = setInterval(() => {
      setStatus((currentStatus) => {
        if (currentStatus !== 'success' && currentStatus !== 'warning') {
          testDatabase();
        }
        return currentStatus;
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [testDatabase]);

  const getStatusColor = () => {
    switch (status) {
      case 'success': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      case 'testing': return 'bg-blue-500';
      default: return 'bg-slate-500';
    }
  };

  return { status, message, getStatusColor, retry: testDatabase };
};
