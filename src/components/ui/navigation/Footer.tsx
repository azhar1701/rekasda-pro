import React from 'react';
import { Mail, Phone, MapPin, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="hidden md:block bg-gradient-to-r from-[#0c3a66] via-[#0d4578] to-[#0c3a66] text-white mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Tentang */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-3 text-blue-200">Tentang RekaSDA Pro</h3>
            <p className="text-sm text-blue-100 leading-relaxed">
              Platform analisis hidrologi profesional yang mematuhi Standar Nasional Indonesia (SNI) untuk mendukung perencanaan infrastruktur sumber daya air.
            </p>
          </div>

          {/* Kontak */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-3 text-blue-200">Kontak</h3>
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
            <h3 className="text-sm font-bold uppercase tracking-wider mb-3 text-blue-200">Referensi</h3>
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
              <a 
                href="#" 
                className="flex items-center gap-2 text-sm text-blue-100 hover:text-white transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Dokumentasi SNI</span>
              </a>
              <a 
                href="#" 
                className="flex items-center gap-2 text-sm text-blue-100 hover:text-white transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Panduan Pengguna</span>
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-blue-200">
            <p>© {new Date().getFullYear()} RekaSDA Pro. Hak Cipta Dilindungi.</p>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-white transition-colors">Kebijakan Privasi</a>
              <span className="text-white/20">•</span>
              <a href="#" className="hover:text-white transition-colors">Syarat & Ketentuan</a>
              <span className="text-white/20">•</span>
              <span>v1.1.0</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
