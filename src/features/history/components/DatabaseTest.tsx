import { useState, useEffect } from 'react';
import { debugSupabase } from '@/lib/debugSupabase';

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
      // Run full diagnostic
      const diagnosticPassed = await debugSupabase.runFullDiagnostic();
      
      if (!diagnosticPassed) {
        setStatus('error');
        setMessage('Diagnostic failed - check console');
        return;
      }

      setStatus('success');
      setMessage('All tests passed');
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