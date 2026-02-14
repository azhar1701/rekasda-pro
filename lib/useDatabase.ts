import { useState, useEffect } from 'react'
import { apiService } from '../services/api.service'
import { CalculationRecord } from '../types/database.types'
import { CalculationResult, CalculationType } from '../types'
import { toast } from '../hooks/useToast'

export const useDatabase = () => {
  const [loading, setLoading] = useState(false)
  const [calculations, setCalculations] = useState<CalculationRecord[]>([])

  const saveCalculation = async (result: CalculationResult) => {
    setLoading(true)
    try {
      const response = await apiService.saveCalculation({
        site_name: result.inputs.site?.channelName || 'Unknown Site',
        calculation_type: result.type === CalculationType.MANNING ? 'manning' : 'rational',
        input_data: result.inputs,
        result_data: result.outputs,
        location: result.location || null,
        photo_url: result.photoUrl || null,
        notes: result.notes || null
      })
      
      if (response.error) {
        toast.error(response.error.message)
        throw new Error(response.error.message)
      }
      
      toast.success('Data berhasil disimpan')
      await loadCalculations()
      return response.data
    } catch (error) {
      console.error('Error saving calculation:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const loadCalculations = async () => {
    setLoading(true)
    try {
      const response = await apiService.getCalculations()
      if (response.error) {
        console.error('Error loading calculations:', response.error)
        setCalculations([])
        return
      }
      setCalculations(response.data || [])
    } catch (error) {
      console.error('Error loading calculations:', error)
      setCalculations([])
    } finally {
      setLoading(false)
    }
  }

  const deleteCalculation = async (id: string) => {
    setLoading(true)
    try {
      const response = await apiService.deleteCalculation(id)
      
      if (response.error) {
        toast.error(response.error.message)
        throw new Error(response.error.message)
      }
      
      toast.success('Data berhasil dihapus')
      await loadCalculations()
    } catch (error) {
      console.error('Error deleting calculation:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCalculations()
  }, [])

  return {
    calculations,
    saveCalculation,
    deleteCalculation,
    loadCalculations,
    loading
  }
}