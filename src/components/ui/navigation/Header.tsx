import React from 'react';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { useAuth } from '@/hooks/useAuth';
import { Shield, User, HardDrive, Settings, LogOut } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/DropdownMenu';

interface HeaderProps {
  appName: string;
  appSubtitle?: string;
  statusBadge?: {
    label: string;
    color: string;
    isLoading?: boolean;
  };
  version?: string;
}

export const Header: React.FC<HeaderProps> = ({
  statusBadge,
  version,
}) => {
  const { user, profile, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-[60] bg-[#0c3a66] text-white border-b border-pupr-yellow/40 h-16 shadow-none">
      <div className="w-full px-4 md:px-6 h-full">
        <div className="flex justify-between items-center h-full">
          {/* Left: Logo & Context */}
          <div className="flex items-center gap-6">
            <BrandLogo size="sm" showText={true} />
            <div className="hidden lg:flex items-center gap-2 pl-6 border-l border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#f2c114] opacity-80">
                Engineering Workstation
              </span>
            </div>
          </div>

          {/* Right: Status, User & Version */}
          <div className="flex items-center gap-4">
            {/* Database Status */}
            {statusBadge && (
              <div className="hidden md:flex items-center gap-2.5 px-3 py-1 bg-white/5 border border-white/10 rounded-none h-8">
                <HardDrive className="w-3.5 h-3.5 text-white/50" />
                <div
                  className={`w-2 h-2 rounded-none ${statusBadge.color} ${
                    statusBadge.isLoading ? 'animate-pulse' : ''
                  }`}
                />
                <span className="text-[11px] font-bold text-white/90 tabular-nums">
                  {statusBadge.label}
                </span>
              </div>
            )}

            {/* Profile Dropdown */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-3 px-2 py-1 hover:bg-white/10 transition-colors border border-transparent hover:border-white/10 h-8">
                  <div className="flex flex-col items-end hidden sm:flex">
                    <span className="text-[11px] font-bold leading-tight truncate max-w-[150px]">
                      {user.email?.split('@')[0]}
                    </span>
                    <span className="text-[9px] font-bold text-[#f2c114] uppercase tracking-wider leading-none">
                      {profile?.role || 'User'}
                    </span>
                  </div>
                  <div className="w-7 h-7 bg-white/10 border border-white/20 flex items-center justify-center rounded-none overflow-hidden">
                    <User className="w-4 h-4 text-white/70" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-none border border-slate-200 dark:border-slate-800 shadow-none mt-2">
                  <DropdownMenuLabel className="text-xs font-bold text-slate-500">
                    Akun Pengguna
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800" />
                  <div className="px-2 py-1.5 flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {user.email}
                    </span>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Role: {profile?.role || 'Guest'}
                    </span>
                  </div>
                  <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800" />
                  <DropdownMenuItem className="text-xs focus:bg-slate-50 dark:focus:bg-slate-800 cursor-pointer">
                    <Settings className="w-3.5 h-3.5 mr-2" />
                    Pengaturan
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => signOut()}
                    className="text-xs text-red-600 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-900/20 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 mr-2" />
                    Keluar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="w-7 h-7 bg-white/5 border border-white/10 flex items-center justify-center rounded-none opacity-50">
                <User className="w-4 h-4 text-white/50" />
              </div>
            )}

            {/* Version */}
            {version && (
              <div className="hidden sm:block border-l border-white/10 pl-4">
                <span className="text-[10px] font-black tabular-nums tracking-tighter text-white/40">
                  V{version}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
