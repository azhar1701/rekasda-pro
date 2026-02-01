import { supabase, isSupabaseEnabled } from '../lib/supabase'

export const debugSupabase = {
  async checkEnvironment() {
    console.log('=== Supabase Environment Check ===')
    console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Missing')
    console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Missing')
    console.log('Supabase enabled:', isSupabaseEnabled())
    
    if (!isSupabaseEnabled()) {
      console.error('Supabase is not properly configured!')
      return false
    }
    return true
  },

  async testBasicConnection() {
    console.log('=== Testing Basic Connection ===')
    
    if (!isSupabaseEnabled()) {
      console.error('Supabase not enabled')
      return false
    }

    try {
      const { data, error, status, statusText } = await supabase!
        .from('calculations')
        .select('count', { count: 'exact', head: true })

      console.log('Response status:', status, statusText)
      console.log('Error:', error)
      console.log('Count:', data)

      if (error) {
        console.error('Connection test failed:', error)
        return false
      }

      console.log('✅ Basic connection successful')
      return true
    } catch (err) {
      console.error('Connection test exception:', err)
      return false
    }
  },

  async testInsertPermissions() {
    console.log('=== Testing Insert Permissions ===')
    
    if (!isSupabaseEnabled()) {
      console.error('Supabase not enabled')
      return false
    }

    const testData = {
      site_name: 'Debug Test',
      calculation_type: 'manning' as const,
      input_data: { debug: true },
      result_data: { test: 'permissions' }
    }

    try {
      const { data, error } = await supabase!
        .from('calculations')
        .insert([testData])
        .select()

      if (error) {
        console.error('Insert test failed:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        return false
      }

      console.log('✅ Insert test successful:', data)
      
      // Clean up
      if (data && data[0]?.id) {
        await supabase!
          .from('calculations')
          .delete()
          .eq('id', data[0].id)
        console.log('✅ Cleanup successful')
      }

      return true
    } catch (err) {
      console.error('Insert test exception:', err)
      return false
    }
  },

  async runFullDiagnostic() {
    console.log('🔍 Running full Supabase diagnostic...')
    
    const envCheck = await this.checkEnvironment()
    if (!envCheck) return false

    const connectionCheck = await this.testBasicConnection()
    if (!connectionCheck) return false

    const permissionCheck = await this.testInsertPermissions()
    if (!permissionCheck) return false

    console.log('✅ All diagnostic tests passed!')
    return true
  }
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).debugSupabase = debugSupabase
}