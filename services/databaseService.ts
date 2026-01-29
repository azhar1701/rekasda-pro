import { supabase } from '../lib/supabase'

export interface CalculationRecord {
  id?: string
  site_name: string
  calculation_type: 'manning' | 'rational'
  input_data: any
  result_data: any
  created_at?: string
}

export const databaseService = {
  async saveCalculation(data: Omit<CalculationRecord, 'id' | 'created_at'>) {
    const { data: result, error } = await supabase
      .from('calculations')
      .insert([data])
      .select()
    
    if (error) throw error
    return result[0]
  },

  async getCalculations() {
    const { data, error } = await supabase
      .from('calculations')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async deleteCalculation(id: string) {
    const { error } = await supabase
      .from('calculations')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}