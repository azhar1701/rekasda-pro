import { supabase, isSupabaseEnabled } from '@/lib/api/supabase';
import { ApiResponse } from '@/types/api.types';
import { CalculationRecord, isValidCalculationRecord } from '@/types/database.types';

class ApiService {
 private async handleResponse<T>(
 promiseFactory: (signal: AbortSignal) => Promise<any>,
 validator?: (data: any) => boolean,
 timeoutMs: number = 15000
 ): Promise<ApiResponse<T>> {
 const controller = new AbortController();
 const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

 try {
 const response = await promiseFactory(controller.signal);
 clearTimeout(timeoutId);

 const { data, error } = response;

 if (error) {
 console.error('[ApiService] Database error:', error);
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

 if (validator && data && !validator(data)) {
 console.warn('[ApiService] Validation failed for data:', data);
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
 clearTimeout(timeoutId);
 const isTimeout = err instanceof Error && (err.name === 'AbortError' || err.message === 'Request timeout');
 console.error(`[ApiService] ${isTimeout ? 'Timeout' : 'Network'} error:`, err);

 return {
 data: null,
 error: {
 code: isTimeout ? 'TIMEOUT_ERROR' : 'NETWORK_ERROR',
 message: err instanceof Error ? err.message : 'Unknown error occurred'
 },
 status: 'error',
 timestamp: new Date().toISOString()
 };
 }
 }

 async invokeFunction<T>(functionName: string, payload: any): Promise<ApiResponse<T>> {
 if (!isSupabaseEnabled()) {
 return {
 data: null,
 error: { code: 'NO_CONFIG', message: 'Supabase not configured' },
 status: 'error',
 timestamp: new Date().toISOString()
 };
 }

 return this.handleResponse<T>(
 (signal) => supabase!.functions.invoke(functionName, {
 body: payload,
 signal
 })
 );
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

 // Get current user for RLS association
 const { data: { user } } = await supabase!.auth.getUser();

 // Prepare PostGIS point if location is available
 let geo_location = null;
 if (data.location) {
 geo_location = `POINT(${data.location.longitude} ${data.location.latitude})`;
 }

 const cleanData = {
 site_name: data.site_name || 'Unknown Site',
 calculation_type: data.calculation_type,
 input_data: data.input_data || {},
 result_data: data.result_data || {},
 location: data.location || null,
 geo_location, // Added for PostGIS
 photo_url: data.photo_url || null,
 notes: data.notes || null,
 user_id: user?.id || null // Associate with user if logged in
 };

 return this.handleResponse<CalculationRecord>(
 (signal) => (supabase!.from('calculations').insert([cleanData]).select().single() as any).abortSignal(signal),
 isValidCalculationRecord
 );
 }

 async findNearbyCalculations(
 lat: number,
 lng: number,
 radiusMeters: number = 5000
 ): Promise<ApiResponse<CalculationRecord[]>> {
 if (!isSupabaseEnabled()) return { data: [], error: null, status: 'success', timestamp: new Date().toISOString() };

 return this.handleResponse<CalculationRecord[]>(
 (signal) => (supabase!.rpc('find_nearby_calculations', {
 lat,
 lng,
 radius_meters: radiusMeters
 }) as any).abortSignal(signal)
 );
 }

 async searchDocuments(
 queryEmbedding: number[],
 matchThreshold: number = 0.5,
 matchCount: number = 5
 ): Promise<ApiResponse<any[]>> {
 if (!isSupabaseEnabled()) return { data: [], error: null, status: 'success', timestamp: new Date().toISOString() };

 return this.handleResponse<any[]>(
 (signal) => (supabase!.rpc('match_documents', {
 query_embedding: queryEmbedding,
 match_threshold: matchThreshold,
 match_count: matchCount
 }) as any).abortSignal(signal)
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
 (signal) => (supabase!.from('calculations').select('*').order('created_at', { ascending: false }) as any).abortSignal(signal)
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
 (signal) => (supabase!.from('calculations').delete().eq('id', id) as any).abortSignal(signal)
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
 (signal) => (supabase!.from('calculations').select('id').limit(1) as any).abortSignal(signal)
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
