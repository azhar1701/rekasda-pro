import { supabase, isSupabaseEnabled } from '../lib/supabase'

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

export const databaseService = {
  async saveCalculation(data: Omit<CalculationRecord, 'id' | 'created_at'>) {
    if (!isSupabaseEnabled()) {
      console.warn('Supabase not configured. Calculation not saved.')
      return { id: 'local-' + Date.now(), ...data, created_at: new Date().toISOString() }
    }

    console.log('Attempting to save calculation:', data)

    const { data: result, error } = await supabase!
      .from('calculations')
      .insert([data])
      .select()
    
    if (error) {
      console.error('Supabase save error:', error)
      throw error
    }
    
    console.log('Successfully saved to Supabase:', result)
    return result[0]
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
      const { error } = await supabase!
        .from('calculations')
        .select('id')
        .limit(1)
      
      if (error) {
        console.error('Supabase connection test failed:', error)
        return { connected: false, error: error.message }
      }
      
      return { connected: true, error: null }
    } catch (error) {
      console.error('Supabase connection error:', error)
      return { connected: false, error: (error as Error).message }
    }
  }
}