import { supabase, isSupabaseEnabled } from '@/lib/api/supabase';
import { ApiResponse } from '@/types/api.types';
import { CalculationRecord, isValidCalculationRecord } from '@/types/database.types';

class ApiService {
  private async handleResponse<T>(
    promise: Promise<any>,
    validator?: (data: any) => boolean
  ): Promise<ApiResponse<T>> {
    try {
      const result = await promise;
      const { data, error } = result;

      if (error) {
        return {
          data: null,
          error: {
            code: error.code || 'DATABASE_ERROR',
            message: error.message || 'Database operation failed',
            details: error.details
          },
          status: 'error',
          timestamp: new Date().toISOString()
        };
      }

      // Runtime validation if validator provided
      if (validator && data && !validator(data)) {
        return {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Data validation failed'
          },
          status: 'error',
          timestamp: new Date().toISOString()
        };
      }

      return {
        data,
        error: null,
        status: 'success',
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      return {
        data: null,
        error: {
          code: 'NETWORK_ERROR',
          message: err instanceof Error ? err.message : 'Unknown error occurred'
        },
        status: 'error',
        timestamp: new Date().toISOString()
      };
    }
  }

  async saveCalculation(
    data: Omit<CalculationRecord, 'id' | 'created_at'>
  ): Promise<ApiResponse<CalculationRecord>> {
    if (!isSupabaseEnabled()) {
      return {
        data: {
          id: 'local-' + Date.now(),
          ...data,
          created_at: new Date().toISOString()
        } as CalculationRecord,
        error: null,
        status: 'success',
        timestamp: new Date().toISOString()
      };
    }

    const cleanData = {
      site_name: data.site_name || 'Unknown Site',
      calculation_type: data.calculation_type,
      input_data: data.input_data || {},
      result_data: data.result_data || {},
      location: data.location || null,
      photo_url: data.photo_url || null,
      notes: data.notes || null
    };

    return this.handleResponse<CalculationRecord>(
      supabase!.from('calculations').insert([cleanData]).select().single() as any,
      isValidCalculationRecord
    );
  }

  async getCalculations(): Promise<ApiResponse<CalculationRecord[]>> {
    if (!isSupabaseEnabled()) {
      return {
        data: [],
        error: {
          code: 'NO_CONNECTION',
          message: 'Supabase not configured'
        },
        status: 'error',
        timestamp: new Date().toISOString()
      };
    }

    return this.handleResponse<CalculationRecord[]>(
      supabase!.from('calculations').select('*').order('created_at', { ascending: false }) as any
    );
  }

  async deleteCalculation(id: string): Promise<ApiResponse<void>> {
    if (!isSupabaseEnabled()) {
      return {
        data: null,
        error: {
          code: 'NO_CONNECTION',
          message: 'Supabase not configured'
        },
        status: 'error',
        timestamp: new Date().toISOString()
      };
    }

    return this.handleResponse<void>(
      supabase!.from('calculations').delete().eq('id', id) as any
    );
  }

  async testConnection(): Promise<ApiResponse<{ connected: boolean }>> {
    if (!isSupabaseEnabled()) {
      return {
        data: { connected: false },
        error: {
          code: 'NO_CONFIG',
          message: 'Supabase not configured'
        },
        status: 'error',
        timestamp: new Date().toISOString()
      };
    }

    const response = await this.handleResponse<any>(
      supabase!.from('calculations').select('id').limit(1) as any
    );

    return {
      data: { connected: response.status === 'success' },
      error: response.error,
      status: response.status,
      timestamp: response.timestamp
    };
  }
}

export const apiService = new ApiService();
