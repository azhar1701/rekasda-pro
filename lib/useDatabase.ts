import { useState, useEffect } from 'react'
import { databaseService, CalculationRecord } from '../services/databaseService'
import { CalculationResult, CalculationType } from '../types'

export const useDatabase = () => {
  const [loading, setLoading] = useState(false)
  const [calculations, setCalculations] = useState<CalculationRecord[]>([])

  const saveCalculation = async (result: CalculationResult) => {
    setLoading(true)
    try {
      const record = await databaseService.saveCalculation({
        site_name: result.inputs.site?.channelName || 'Unknown Site',
        calculation_type: result.type === CalculationType.MANNING ? 'manning' : 'rational',
        input_data: result.inputs,
        result_data: result.outputs
      })
      await loadCalculations()
      return record
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
      const data = await databaseService.getCalculations()
      setCalculations(data)
    } catch (error) {
      console.error('Error loading calculations:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteCalculation = async (id: string) => {
    setLoading(true)
    try {
      await databaseService.deleteCalculation(id)
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