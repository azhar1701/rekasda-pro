import { useState, useEffect } from 'react';
import { databaseService } from '../services/databaseService';
import { isSupabaseEnabled } from '../lib/supabase';

export const useDatabaseStatus = () => {
  const [status, setStatus] = useState<'testing' | 'success' | 'error'>('testing');
  const [message, setMessage] = useState<string>('Testing...');

  useEffect(() => {
    testDatabase();
  }, []);

  const testDatabase = async () => {
    setStatus('testing');
    setMessage('Testing...');
    
    try {
      if (!isSupabaseEnabled()) {
        setStatus('error');
        setMessage('Not configured');
        return;
      }

      const connectionTest = await databaseService.testConnection();
      if (!connectionTest.connected) {
        setStatus('error');
        setMessage('Connection failed');
        return;
      }

      const testData = {
        site_name: 'Test',
        calculation_type: 'manning' as const,
        input_data: { test: true },
        result_data: { discharge: 1.5 }
      };

      const saved = await databaseService.saveCalculation(testData);
      if (saved.id) {
        await databaseService.deleteCalculation(saved.id);
      }
      
      setStatus('success');
      setMessage('Connected');
    } catch (error) {
      setStatus('error');
      setMessage('Save failed');
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