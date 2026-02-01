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
    setMessage('Testing connection...');
    
    try {
      if (!isSupabaseEnabled()) {
        setStatus('error');
        setMessage('Supabase not configured');
        return;
      }

      // Test connection first
      const connectionTest = await databaseService.testConnection();
      if (!connectionTest.connected) {
        setStatus('error');
        setMessage(`Connection failed: ${connectionTest.error}`);
        return;
      }

      setMessage('Testing save operation...');
      
      // Test save operation
      const testData = {
        site_name: 'Database Test',
        calculation_type: 'manning' as const,
        input_data: { 
          test: true,
          timestamp: new Date().toISOString()
        },
        result_data: { 
          discharge: 1.5,
          test_result: 'success'
        }
      };

      const saved = await databaseService.saveCalculation(testData);
      
      if (!saved || !saved.id) {
        setStatus('error');
        setMessage('Save operation returned no data');
        return;
      }

      // Clean up test data
      try {
        await databaseService.deleteCalculation(saved.id);
      } catch (deleteError) {
        console.warn('Failed to clean up test data:', deleteError);
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