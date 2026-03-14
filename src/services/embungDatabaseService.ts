/**
 * =============================================================================
 * Embung Database Service — Supabase CRUD for Embung Projects
 * =============================================================================
 * Mirrors the existing databaseService.ts pattern.
 * =============================================================================
 */

import { supabase, isSupabaseEnabled } from '@/lib/api/supabase';

export interface EmbungProjectRecord {
 id?: string;
 project_name: string;
 analysis_type: 'capacity' | 'routing' | 'water_balance' | 'sedimentation';
 input_data: Record<string, unknown>;
 result_data: Record<string, unknown>;
 curve_data?: Record<string, unknown> | null;
 location?: Record<string, unknown> | null;
 notes?: string | null;
 created_at?: string;
 updated_at?: string;
}

export const embungDatabaseService = {
 async saveProject(data: Omit<EmbungProjectRecord, 'id' | 'created_at' | 'updated_at'>) {
 if (!isSupabaseEnabled()) {
 console.warn('Supabase not configured. Embung project not saved.');
 return { id: 'local-' + Date.now(), ...data, created_at: new Date().toISOString() };
 }

 const { data: result, error } = await supabase!
 .from('embung_projects')
 .insert([{
 project_name: data.project_name || 'Proyek Embung',
 analysis_type: data.analysis_type,
 input_data: data.input_data || {},
 result_data: data.result_data || {},
 curve_data: data.curve_data || null,
 location: data.location || null,
 notes: data.notes || null,
 }])
 .select();

 if (error) throw new Error(`Database save failed: ${error.message}`);
 if (!result || result.length === 0) throw new Error('No data returned from insert');
 return result[0];
 },

 async getProjects() {
 if (!isSupabaseEnabled()) return [];

 const { data, error } = await supabase!
 .from('embung_projects')
 .select('*')
 .order('created_at', { ascending: false });

 if (error) throw error;
 return data || [];
 },

 async deleteProject(id: string) {
 if (!isSupabaseEnabled()) return;

 const { error } = await supabase!
 .from('embung_projects')
 .delete()
 .eq('id', id);

 if (error) throw error;
 },
};
