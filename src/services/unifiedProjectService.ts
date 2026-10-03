/**
 * =============================================================================
 * Layanan Penyimpanan Proyek & Riwayat Terpadu (Unified Project Storage Service)
 * RekasDA Pro — Platform Rekayasa Analisis SDA & Hidrologi (SNI Compliant)
 * =============================================================================
 * Menghubungkan penyimpanan paket proyek induk dan riwayat perhitungan snapshot
 * dalam satu sumber kebenaran (Single Source of Truth), mendukung dual-mode
 * sinkronisasi (Supabase Cloud + Local Offline Storage).
 */

import { supabase } from '@/lib/api/supabase';
import {
  type UnifiedProjectEntity,
  type UnifiedProjectMetadata,
  type UnifiedCalculationSnapshot,
} from '@/types/unifiedProject.types';

const LOCAL_STORAGE_PROJECTS_KEY = 'rekasda_unified_projects_v2';
const LOCAL_STORAGE_SNAPSHOTS_KEY = 'rekasda_unified_snapshots_v2';

/**
 * Menyimpan atau memperbarui proyek hidrologi terpadu (Cloud & Local)
 */
export async function saveUnifiedProject(project: UnifiedProjectEntity): Promise<UnifiedProjectEntity> {
  const now = new Date().toISOString();
  const metadata = {
    ...project.metadata,
    updatedAt: now,
  };

  const projectPayload = {
    id: metadata.id,
    project_code: metadata.projectCode,
    name: metadata.name,
    das_name: metadata.dasName,
    river_name: metadata.riverName || null,
    province: metadata.province || null,
    regency: metadata.regency || null,
    author: metadata.author,
    institution: metadata.institution,
    latitude: metadata.latitude || null,
    longitude: metadata.longitude || null,
    status: metadata.status || 'DRAFT',
    schema_version: metadata.schemaVersion || '2.0',
    master_data: project.masterData,
    analysis_results: project.analysisResults,
    summary_metrics: project.summaryMetrics || {},
    notes: metadata.notes || null,
    updated_at: now,
  };

  // 1. Simpan ke Supabase jika tersedia
  if (supabase) {
    try {
      const { error } = await supabase
        .from('hydrology_projects')
        .upsert(projectPayload, { onConflict: 'id' });

      if (error) {
        console.warn('Gagal upsert ke Supabase hydrology_projects (lanjut fallback lokal):', error.message);
      }
    } catch (err: any) {
      console.warn('Koneksi Supabase hydrology_projects gagal:', err?.message || err);
    }
  }

  // 2. Simpan ke Local Storage untuk persistensi offline
  try {
    const existingList = getLocalProjects();
    const index = existingList.findIndex((p) => p.metadata.id === metadata.id);
    const updatedEntity: UnifiedProjectEntity = {
      ...project,
      metadata,
    };

    if (index >= 0) {
      existingList[index] = updatedEntity;
    } else {
      existingList.unshift(updatedEntity);
    }

    setLocalProjects(existingList);
  } catch (err) {
    console.warn('Gagal menyimpan unified project ke localStorage:', err);
  }

  return { ...project, metadata };
}

/**
 * Mengambil daftar metadata proyek yang tersimpan
 */
export async function getUnifiedProjectList(): Promise<UnifiedProjectMetadata[]> {
  const projectsMap = new Map<string, UnifiedProjectMetadata>();

  // 1. Ambil dari Supabase jika tersedia
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('hydrology_projects')
        .select('id, project_code, name, das_name, river_name, province, regency, author, institution, latitude, longitude, status, schema_version, notes, created_at, updated_at')
        .order('updated_at', { ascending: false });

      if (!error && data) {
        data.forEach((row: any) => {
          projectsMap.set(row.id, {
            id: row.id,
            projectCode: row.project_code,
            name: row.name,
            dasName: row.das_name,
            riverName: row.river_name || undefined,
            province: row.province || undefined,
            regency: row.regency || undefined,
            author: row.author,
            institution: row.institution,
            latitude: row.latitude,
            longitude: row.longitude,
            status: row.status,
            schemaVersion: row.schema_version,
            notes: row.notes || undefined,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          });
        });
      }
    } catch (err) {
      console.warn('Gagal memuat daftar dari Supabase:', err);
    }
  }

  // 2. Gabungkan dengan data lokal (tanpa menimpa versi yang lebih baru)
  const localList = getLocalProjects();
  localList.forEach((p) => {
    if (!projectsMap.has(p.metadata.id)) {
      projectsMap.set(p.metadata.id, p.metadata);
    }
  });

  return Array.from(projectsMap.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

/**
 * Mengambil proyek utuh berdasarkan ID
 */
export async function getUnifiedProjectById(id: string): Promise<UnifiedProjectEntity | null> {
  // 1. Coba dari Supabase
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('hydrology_projects')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) {
        const snapshots = await getSnapshotsByProjectId(id);
        return {
          metadata: {
            id: data.id,
            projectCode: data.project_code,
            name: data.name,
            dasName: data.das_name,
            riverName: data.river_name || undefined,
            province: data.province || undefined,
            regency: data.regency || undefined,
            author: data.author,
            institution: data.institution,
            latitude: data.latitude,
            longitude: data.longitude,
            status: data.status,
            schemaVersion: data.schema_version,
            notes: data.notes || undefined,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          },
          masterData: data.master_data || {},
          analysisResults: data.analysis_results || {},
          summaryMetrics: data.summary_metrics || {},
          snapshots,
        };
      }
    } catch (err) {
      console.warn('Gagal mengambil proyek dari Supabase:', err);
    }
  }

  // 2. Fallback lokal
  const local = getLocalProjects().find((p) => p.metadata.id === id);
  if (local) {
    const localSnaps = getLocalSnapshots().filter((s) => s.projectId === id);
    return {
      ...local,
      snapshots: localSnaps.length > 0 ? localSnaps : (local.snapshots || []),
    };
  }

  return null;
}

/**
 * Menghapus proyek beserta riwayatnya
 */
export async function deleteUnifiedProject(id: string): Promise<boolean> {
  if (supabase) {
    try {
      await supabase.from('hydrology_projects').delete().eq('id', id);
    } catch (err) {
      console.warn('Gagal menghapus proyek dari Supabase:', err);
    }
  }

  try {
    const localProjects = getLocalProjects().filter((p) => p.metadata.id !== id);
    setLocalProjects(localProjects);

    const localSnaps = getLocalSnapshots().filter((s) => s.projectId !== id);
    setLocalSnapshots(localSnaps);
    return true;
  } catch (err) {
    console.warn('Gagal menghapus proyek lokal:', err);
    return false;
  }
}

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Menyimpan rekaman snapshot perhitungan yang terhubung ke suatu proyek induk
 */
export async function saveCalculationSnapshot(
  projectId: string,
  snapshot: Omit<UnifiedCalculationSnapshot, 'id' | 'projectId' | 'createdAt'> & { id?: string }
): Promise<UnifiedCalculationSnapshot> {
  const fullSnapshot: UnifiedCalculationSnapshot = {
    id: snapshot.id || generateUUID(),
    projectId,
    moduleType: snapshot.moduleType,
    snapshotTitle: snapshot.snapshotTitle,
    scenarioName: snapshot.scenarioName || 'Kondisi Eksisting',
    inputParameters: snapshot.inputParameters,
    outputResults: snapshot.outputResults,
    location: snapshot.location || null,
    photoUrl: snapshot.photoUrl || null,
    notes: snapshot.notes || '',
    createdBy: snapshot.createdBy || 'Tenaga Ahli Hidrologi',
    createdAt: new Date().toISOString(),
  };

  // 1. Simpan ke Supabase jika tersedia
  if (supabase) {
    try {
      const payload = {
        id: fullSnapshot.id,
        project_id: fullSnapshot.projectId,
        module_type: fullSnapshot.moduleType,
        snapshot_title: fullSnapshot.snapshotTitle,
        scenario_name: fullSnapshot.scenarioName,
        input_parameters: fullSnapshot.inputParameters,
        output_results: fullSnapshot.outputResults,
        location: fullSnapshot.location,
        photo_url: fullSnapshot.photoUrl,
        notes: fullSnapshot.notes,
        created_by: fullSnapshot.createdBy,
        created_at: fullSnapshot.createdAt,
      };

      const { error } = await supabase
        .from('project_calculation_snapshots')
        .upsert(payload, { onConflict: 'id' });

      if (error) {
        console.warn('Supabase snapshot insert error:', error.message);
      }
    } catch (err) {
      console.warn('Supabase snapshot connect error:', err);
    }
  }

  // 2. Simpan ke local storage
  try {
    const list = getLocalSnapshots();
    const existingIdx = list.findIndex((s) => s.id === fullSnapshot.id);
    if (existingIdx >= 0) {
      list[existingIdx] = fullSnapshot;
    } else {
      list.unshift(fullSnapshot);
    }
    setLocalSnapshots(list);
  } catch (err) {
    console.warn('Gagal menyimpan snapshot ke localStorage:', err);
  }

  return fullSnapshot;
}

/**
 * Mengambil daftar seluruh snapshot kalkulasi untuk satu proyek tertentu
 */
export async function getSnapshotsByProjectId(projectId: string): Promise<UnifiedCalculationSnapshot[]> {
  const snapsMap = new Map<string, UnifiedCalculationSnapshot>();

  // 1. Ambil dari Supabase jika tersedia
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('project_calculation_snapshots')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        data.forEach((row: any) => {
          snapsMap.set(row.id, {
            id: row.id,
            projectId: row.project_id,
            moduleType: row.module_type,
            snapshotTitle: row.snapshot_title,
            scenarioName: row.scenario_name,
            inputParameters: row.input_parameters,
            outputResults: row.output_results,
            location: row.location,
            photoUrl: row.photo_url,
            notes: row.notes,
            createdBy: row.created_by,
            createdAt: row.created_at,
          });
        });
      }
    } catch (err) {
      console.warn('Gagal mengambil snapshots dari Supabase:', err);
    }
  }

  // 2. Gabungkan dengan data lokal
  const localSnaps = getLocalSnapshots().filter((s) => s.projectId === projectId);
  localSnaps.forEach((s) => {
    if (!snapsMap.has(s.id)) {
      snapsMap.set(s.id, s);
    }
  });

  return Array.from(snapsMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Mengambil seluruh snapshot kalkulasi di seluruh proyek
 */
export async function getAllUnifiedSnapshots(): Promise<UnifiedCalculationSnapshot[]> {
  const snapsMap = new Map<string, UnifiedCalculationSnapshot>();

  // 1. Ambil dari Supabase jika tersedia
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('project_calculation_snapshots')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        data.forEach((row: any) => {
          snapsMap.set(row.id, {
            id: row.id,
            projectId: row.project_id,
            moduleType: row.module_type,
            snapshotTitle: row.snapshot_title,
            scenarioName: row.scenario_name,
            inputParameters: row.input_parameters,
            outputResults: row.output_results,
            location: row.location,
            photoUrl: row.photo_url,
            notes: row.notes,
            createdBy: row.created_by,
            createdAt: row.created_at,
          });
        });
      }
    } catch (err) {
      console.warn('Gagal mengambil semua snapshots dari Supabase:', err);
    }
  }

  // 2. Gabungkan dari local storage
  getLocalSnapshots().forEach((s) => {
    if (!snapsMap.has(s.id)) {
      snapsMap.set(s.id, s);
    }
  });

  return Array.from(snapsMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Menghapus snapshot perhitungan berdasarkan ID (Cloud & Local)
 */
export async function deleteCalculationSnapshot(snapshotId: string): Promise<boolean> {
  if (supabase) {
    try {
      await supabase.from('project_calculation_snapshots').delete().eq('id', snapshotId);
    } catch (err) {
      console.warn('Gagal menghapus snapshot dari Supabase:', err);
    }
  }

  try {
    const list = getLocalSnapshots().filter((s) => s.id !== snapshotId);
    setLocalSnapshots(list);
    return true;
  } catch (err) {
    console.warn('Gagal menghapus snapshot dari localStorage:', err);
    return false;
  }
}

// In-memory fallback untuk environment testing / non-browser
let inMemoryProjects: UnifiedProjectEntity[] = [];
let inMemorySnapshots: UnifiedCalculationSnapshot[] = [];

function hasLocalStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function getLocalProjects(): UnifiedProjectEntity[] {
  if (hasLocalStorage()) {
    try {
      const raw = window.localStorage.getItem(LOCAL_STORAGE_PROJECTS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return inMemoryProjects;
    }
  }
  return inMemoryProjects;
}

function setLocalProjects(projects: UnifiedProjectEntity[]): void {
  inMemoryProjects = projects;
  if (hasLocalStorage()) {
    try {
      window.localStorage.setItem(LOCAL_STORAGE_PROJECTS_KEY, JSON.stringify(projects));
    } catch (e) {
      console.warn('Gagal menyimpan ke localStorage:', e);
    }
  }
}

function getLocalSnapshots(): UnifiedCalculationSnapshot[] {
  if (hasLocalStorage()) {
    try {
      const raw = window.localStorage.getItem(LOCAL_STORAGE_SNAPSHOTS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return inMemorySnapshots;
    }
  }
  return inMemorySnapshots;
}

function setLocalSnapshots(snapshots: UnifiedCalculationSnapshot[]): void {
  inMemorySnapshots = snapshots;
  if (hasLocalStorage()) {
    try {
      window.localStorage.setItem(LOCAL_STORAGE_SNAPSHOTS_KEY, JSON.stringify(snapshots));
    } catch (e) {
      console.warn('Gagal menyimpan snapshot ke localStorage:', e);
    }
  }
}

export function clearUnifiedProjectStorage(): void {
  inMemoryProjects = [];
  inMemorySnapshots = [];
  if (hasLocalStorage()) {
    try {
      window.localStorage.removeItem(LOCAL_STORAGE_PROJECTS_KEY);
      window.localStorage.removeItem(LOCAL_STORAGE_SNAPSHOTS_KEY);
    } catch {}
  }
}
