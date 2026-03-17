import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { AuthModal } from './AuthModal';
import { User, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

export const UserNav: React.FC = () => {
 const { user, profile, isAuthenticated, signOut, loading } = useAuth();
 const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

 if (loading) {
 return <div className="w-8 h-8 rounded-sm bg-neutral-100 animate-pulse" />;
 }

 if (!isAuthenticated) {
 return (
 <>
 <Button
 variant="outline"
 size="sm"
 onClick={() => setIsAuthModalOpen(true)}
 className="glass border-primary-100 text-primary-700 hover:bg-primary-50"
 >
 Masuk
 </Button>
 <AuthModal
 isOpen={isAuthModalOpen}
 onClose={() => setIsAuthModalOpen(false)}
 />
 </>
 );
 }

 const userRole = profile?.role || 'User';

 return (
 <div className="flex items-center gap-3">
 <div className="flex flex-col items-end hidden sm:flex">
 <span className="text-xs font-semibold text-neutral-900 truncate max-w-[120px]">
 {user?.email?.split('@')[0]}
 </span>
 <span className={cn(
 "text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-sm",
 userRole === 'admin' ? "bg-red-50 text-red-600" :
 userRole === 'engineer' ? "bg-pupr-blue/10 text-pupr-blue" : "bg-slate-100 text-slate-500"
 )}>
 {userRole}
 </span>
 </div>

 <div className="h-9 w-9 rounded-sm bg-primary-50 border border-primary-100 flex items-center justify-center text-primary-600 ">
 <User className="w-5 h-5" />
 </div>

 <button
 onClick={() => signOut()}
 className="p-2 text-neutral-400 hover:text-danger transition-colors"
 title="Keluar"
 >
 <LogOut className="w-5 h-5" />
 </button>
 </div>
 );
};
