import React from 'react';
import { Mail, Phone, MapPin, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
 return (
  <footer aria-label="Informasi kontak dan referensi" className="bg-pupr-blue text-white mt-auto border-t border-white/10">
  <div className="max-w-7xl mx-auto px-6 py-6 md:py-8">
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
 {/* Tentang */}
 <div>
 <h2 className="text-sm font-bold uppercase tracking-wider mb-3 text-blue-200">Tentang RekaSDA Pro</h2>
 <p className="text-sm text-blue-100 leading-relaxed">
 Platform analisis hidrologi profesional yang mematuhi Standar Nasional Indonesia (SNI) untuk mendukung perencanaan infrastruktur sumber daya air.
 </p>
 </div>

 {/* Kontak */}
 <div>
 <h2 className="text-sm font-bold uppercase tracking-wider mb-3 text-blue-200">Kontak</h2>
 <div className="space-y-2 text-sm text-blue-100">
 <div className="flex items-start gap-2">
 <Mail className="w-4 h-4 mt-0.5 shrink-0" />
 <span>support@rekasda.pro</span>
 </div>
 <div className="flex items-start gap-2">
 <Phone className="w-4 h-4 mt-0.5 shrink-0" />
 <span>+62 21 1234 5678</span>
 </div>
 <div className="flex items-start gap-2">
 <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
 <span>Jakarta, Indonesia</span>
 </div>
 </div>
 </div>

 {/* Tautan */}
 <div>
 <h2 className="text-sm font-bold uppercase tracking-wider mb-3 text-blue-200">Referensi</h2>
 <div className="space-y-2">
 <a
 href="https://bsn.go.id/"
 target="_blank"
 rel="noopener noreferrer"
 className="flex items-center gap-2 text-sm text-blue-100 hover:text-white transition-colors"
 >
 <ExternalLink className="w-3.5 h-3.5" />
 <span>Badan Standardisasi Nasional</span>
 </a>
 <span
 className="flex items-center gap-2 text-sm text-blue-100/50 cursor-not-allowed"
 aria-disabled="true"
 >
 <ExternalLink className="w-3.5 h-3.5" />
 <span>Dokumentasi SNI (Segera Hadir)</span>
 </span>
 <span
 className="flex items-center gap-2 text-sm text-blue-100/50 cursor-not-allowed"
 aria-disabled="true"
 >
 <ExternalLink className="w-3.5 h-3.5" />
 <span>Panduan Pengguna (Segera Hadir)</span>
 </span>
 </div>
 </div>
 </div>

 {/* Copyright */}
 <div className="mt-8 pt-6 border-t border-white/10">
 <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-blue-200">
 <p>© {new Date().getFullYear()} RekaSDA Pro. Hak Cipta Dilindungi.</p>
 <div className="flex items-center gap-4">
 <span className="text-blue-200/50 cursor-not-allowed" aria-disabled="true">Kebijakan Privasi</span>
 <span className="text-white/20">•</span>
 <span className="text-blue-200/50 cursor-not-allowed" aria-disabled="true">Syarat &amp; Ketentuan</span>
 <span className="text-white/20">•</span>
 <span>v1.1.0</span>
 </div>
 </div>
 </div>
 </div>
 </footer>
 );
};
