import { useState, useEffect, useCallback, useRef } from 'react'
import { databaseService, CalculationRecord } from '../services/databaseService'
import { CalculationResult, CalculationType } from '../types'
import { OfflineStorage } from '../services/offlineStorage'

interface CacheEntry {
  data: CalculationRecord[];
  timestamp: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000;

export const useDatabase = () => {
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [calculations, setCalculations] = useState<CalculationRecord[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const cacheRef = useRef<CacheEntry | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      syncOfflineData()
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      abortControllerRef.current?.abort()
    }
  }, [])

  const retryOperation = async (operation: () => Promise<any>, attempts = RETRY_ATTEMPTS): Promise<any> => {
    for (let i = 0; i < attempts; i++) {
      try {
        return await operation()
      } catch (error) {
        if (i === attempts - 1) throw error
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (i + 1)))
      }
    }
  }

  const loadOfflineData = useCallback(() => {
    try {
      const offlineData = OfflineStorage.getCalculations()
      const dbFormat = offlineData.map(calc => ({
        id: calc.id,
        site_name: calc.inputs.site?.channelName || 'Unknown Site',
        calculation_type: calc.type.toLowerCase(),
        input_data: calc.inputs,
        result_data: calc.outputs,
        created_at: calc.date
      }))
      setCalculations(dbFormat)
    } catch (err) {
      console.error('Error loading offline data:', err)
    }
  }, [])

  const saveCalculation = async (result: CalculationResult) => {
    // Always save offline first
    OfflineStorage.saveCalculation(result)
    
    if (!isOnline) {
      OfflineStorage.addToSyncQueue(result)
      loadOfflineData()
      return
    }

    setLoading(true)
    try {
      const record = await retryOperation(async () => {
        return await databaseService.saveCalculation({
          site_name: result.inputs.site?.channelName || 'Unknown Site',
          calculation_type: result.type === CalculationType.MANNING ? 'manning' : 'rational',
          input_data: {
            ...result.inputs,
            notes: result.notes,
            location: result.location,
            photoUrl: result.photoUrl
          },
          result_data: result.outputs
        })
      })
      
      cacheRef.current = null // Invalidate cache
      await loadCalculations()
      return record
    } catch (error) {
      console.error('Error saving calculation:', error)
      OfflineStorage.addToSyncQueue(result)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const loadCalculations = async (useCache = true) => {
    // Check cache first
    if (useCache && cacheRef.current) {
      const { data, timestamp } = cacheRef.current
      if (Date.now() - timestamp < CACHE_DURATION) {
        setCalculations(data)
        return
      }
    }

    if (!isOnline) {
      loadOfflineData()
      return
    }

    setLoading(true)
    
    // Create new abort controller for this request
    const currentController = new AbortController()
    abortControllerRef.current?.abort() // Cancel previous request
    abortControllerRef.current = currentController
    
    try {
      setError(null)
      const data = await retryOperation(async () => {
        // Check if this request was cancelled
        if (currentController.signal.aborted) {
          throw new Error('Request cancelled')
        }
        return await databaseService.getCalculations()
      })
      
      // Only update if this is still the current request
      if (!currentController.signal.aborted) {
        setCalculations(data)
        
        // Update cache
        cacheRef.current = {
          data,
          timestamp: Date.now()
        }
        
        // Sync with offline storage
        data.forEach(calc => {
          const result: CalculationResult = {
            id: calc.id || `calc-${Date.now()}`,
            type: calc.calculation_type === 'manning' ? CalculationType.MANNING : CalculationType.RATIONAL,
            date: calc.created_at || new Date().toISOString(),
            inputs: calc.input_data,
            outputs: calc.result_data,
            location: calc.input_data?.location,
            notes: calc.input_data?.notes || '',
            photoUrl: calc.input_data?.photoUrl
          }
          OfflineStorage.saveCalculation(result)
        })
      }
    } catch (error) {
      if (!currentController.signal.aborted) {
        console.error('Error loading calculations:', error)
        setError(error instanceof Error ? error.message : 'Unknown error')
        loadOfflineData() // Fallback to offline
      }
    } finally {
      if (!currentController.signal.aborted) {
        setLoading(false)
      }
    }
  }

  const deleteCalculation = async (id: string) => {
    if (!isOnline) {
      throw new Error('Delete operation requires online connection')
    }

    setLoading(true)
    try {
      await retryOperation(async () => {
        return await databaseService.deleteCalculation(id)
      })
      
      cacheRef.current = null // Invalidate cache
      await loadCalculations(false)
    } catch (error) {
      console.error('Error deleting calculation:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const syncOfflineData = async () => {
    if (!isOnline) return
    
    try {
      setSyncing(true)
      const syncQueue = OfflineStorage.getSyncQueue()
      
      for (const calculation of syncQueue) {
        await saveCalculation(calculation)
      }
      
      OfflineStorage.clearSyncQueue()
      await loadCalculations(false)
    } catch (err) {
      console.error('Error syncing offline data:', err)
    } finally {
      setSyncing(false)
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
    syncOfflineData,
    loading,
    syncing,
    error,
    isOnline,
    refetch: () => loadCalculations(false),
    clearCache: () => { cacheRef.current = null },
    cacheAge: cacheRef.current ? Date.now() - cacheRef.current.timestamp : null
  }
}