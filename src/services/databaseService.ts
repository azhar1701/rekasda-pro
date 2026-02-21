import { supabase, isSupabaseEnabled } from '../lib/api/supabase'

export interface CalculationRecord {
  id?: string
  site_name: string
  calculation_type: 'manning' | 'rational'
  input_data: any
  result_data: any
  location?: any
  photo_url?: string
  notes?: string
  created_at?: string
  updated_at?: string
}

const sanitizeForLog = (data: any): string => {
  if (typeof data === 'string') {
    return data.replace(/[\r\n\t]/g, ' ').substring(0, 100);
  }
  return JSON.stringify(data).replace(/[\r\n\t]/g, ' ').substring(0, 100);
};

export const databaseService = {
  async saveCalculation(data: Omit<CalculationRecord, 'id' | 'created_at'>) {
    if (!isSupabaseEnabled()) {
      console.warn('Supabase not configured. Calculation not saved.')
      return { id: 'local-' + Date.now(), ...data, created_at: new Date().toISOString() }
    }

    try {
      // Clean and prepare data
      const cleanData = {
        site_name: data.site_name || 'Unknown Site',
        calculation_type: data.calculation_type,
        input_data: data.input_data || {},
        result_data: data.result_data || {},
        location: data.location || null,
        photo_url: data.photo_url || null,
        notes: data.notes || null
      }

      console.log('Attempting to save calculation:', sanitizeForLog(cleanData))

      const { data: result, error } = await supabase!
        .from('calculations')
        .insert([cleanData])
        .select()
      
      if (error) {
        console.error('Supabase save error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw new Error(`Database save failed: ${error.message}`)
      }
      
      if (!result || result.length === 0) {
        throw new Error('No data returned from insert operation')
      }
      
      console.log('Successfully saved to Supabase:', sanitizeForLog(result[0]))
      return result[0]
    } catch (error) {
      console.error('Save calculation error:', error)
      throw error
    }
  },

  async getCalculations() {
    if (!isSupabaseEnabled()) {
      console.warn('Supabase not configured. Returning empty array.')
      return []
    }

    const { data, error } = await supabase!
      .from('calculations')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async deleteCalculation(id: string) {
    if (!isSupabaseEnabled()) {
      console.warn('Supabase not configured. Cannot delete calculation.')
      return
    }

    const { error } = await supabase!
      .from('calculations')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  async testConnection() {
    if (!isSupabaseEnabled()) {
      return { connected: false, error: 'Supabase not configured' }
    }

    try {
      // Test basic connection
      const { data, error } = await supabase!
        .from('calculations')
        .select('id')
        .limit(1)
      
      if (error) {
        console.error('Supabase connection test failed:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        return { connected: false, error: `Connection failed: ${error.message}` }
      }
      
      console.log('Connection test successful, found records:', data?.length || 0)
      return { connected: true, error: null }
    } catch (error) {
      console.error('Supabase connection error:', error)
      return { connected: false, error: (error as Error).message }
    }
  }
}