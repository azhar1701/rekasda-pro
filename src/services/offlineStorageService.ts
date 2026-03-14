/**
 * Offline Storage Service - Production Grade
 * =========================================
 * 
 * Sederhana wrapper untuk IndexedDB untuk menyimpan data hidrologi
 * secara lokal saat pengguna berada dalam mode offline.
 */

const DB_NAME = 'rekasda_offline_db';
const DB_VERSION = 1;
const STORE_NAME = 'pending_calculations';

export interface PendingCalculation {
  id?: number;
  type: string;
  data: any;
  timestamp: number;
}

class OfflineStorageService {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onerror = (event) => {
        console.error('IndexedDB error:', event);
        reject('Failed to open IndexedDB');
      };
    });
  }

  async saveCalculation(type: string, data: any): Promise<number> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const entry: PendingCalculation = {
        type,
        data,
        timestamp: Date.now()
      };

      const request = store.add(entry);
      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject('Failed to save to local DB');
    });
  }

  async getAllPending(): Promise<PendingCalculation[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject('Failed to fetch from local DB');
    });
  }

  async clearCalculation(id: number): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject('Failed to delete from local DB');
    });
  }
}

export const offlineStorage = new OfflineStorageService();
