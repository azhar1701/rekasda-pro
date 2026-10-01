/**
 * =============================================================================
 * Actionable Suggestion Parser for AI Consultant
 * =============================================================================
 * Memindai respon AI untuk mendeteksi saran perubahan parameter teknis
 * dan menghasilkan tombol aksi 1-klik untuk pengguna.
 * =============================================================================
 */

import { ActionableSuggestion } from '../types/ai.types';

export function parseActionableSuggestions(
  content: string, 
  store: any
): ActionableSuggestion[] {
  const actions: ActionableSuggestion[] = [];
  const text = content.toLowerCase();

  // 1. Luas DAS
  const areaMatch = content.match(/(?:luas\s+das|luas\s+catchment)[\s:=]+(\d+(?:\.\d+)?)\s*(?:km²|km2)/i);
  if (areaMatch) {
    const val = areaMatch[1];
    actions.push({
      label: `Terapkan Luas DAS = ${val} km²`,
      description: `Perbarui parameter Luas DAS di workspace menjadi ${val} km²`,
      action: () => {
        store.setLuasDas(val);
      }
    });
  }

  // 2. Panjang Sungai
  const riverMatch = content.match(/(?:panjang\s+sungai|panjang\s+alur)[\s:=]+(\d+(?:\.\d+)?)\s*(?:km)/i);
  if (riverMatch) {
    const val = riverMatch[1];
    actions.push({
      label: `Terapkan Panjang Sungai = ${val} km`,
      description: `Perbarui panjang sungai utama menjadi ${val} km`,
      action: () => {
        store.setPanjangSungai(val);
      }
    });
  }

  // 3. Curah Hujan Rencana (R24)
  const rainMatch = content.match(/(?:curah\s+hujan\s+rencana|r24|r₂₄)[\s:=]+(\d+(?:\.\d+)?)\s*(?:mm)/i);
  if (rainMatch) {
    const val = rainMatch[1];
    actions.push({
      label: `Terapkan Hujan Rencana R₂₄ = ${val} mm`,
      description: `Perbarui curah hujan rencana 24 jam menjadi ${val} mm`,
      action: () => {
        store.setCurahHujanRencana(val);
      }
    });
  }

  // 4. Navigasi Cepat Modul jika AI menyarankan buka modul tertentu
  if (text.includes('modul saluran') || text.includes('ke modul saluran')) {
    actions.push({
      label: 'Buka Modul Saluran (Manning)',
      description: 'Menuju ke kalkulator hidraulika saluran terbuka',
      action: () => {
        window.dispatchEvent(new CustomEvent('navigateToTab', { detail: '/saluran' }));
      }
    });
  } else if (text.includes('modul banjir') || text.includes('ke modul banjir')) {
    actions.push({
      label: 'Buka Modul Analisis Banjir',
      description: 'Menuju ke pemodelan hidrograf debit banjir rencana',
      action: () => {
        window.dispatchEvent(new CustomEvent('navigateToTab', { detail: '/banjir' }));
      }
    });
  } else if (text.includes('modul neraca') || text.includes('ke modul neraca')) {
    actions.push({
      label: 'Buka Modul Neraca Air',
      description: 'Menuju ke evaluasi ketersediaan air bulanan F.J. Mock',
      action: () => {
        window.dispatchEvent(new CustomEvent('navigateToTab', { detail: '/neraca' }));
      }
    });
  } else if (text.includes('modul embung') || text.includes('ke modul embung')) {
    actions.push({
      label: 'Buka Modul Embung & Situ',
      description: 'Menuju ke perancangan kapasitas dan penelusuran banjir embung',
      action: () => {
        window.dispatchEvent(new CustomEvent('navigateToTab', { detail: '/embung' }));
      }
    });
  }

  return actions;
}
