import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { AuthModal } from './AuthModal';
import { User, LogOut } from 'lucide-react';

export const UserNav: React.FC = () => {
 const { user, isAuthenticated, signOut, loading } = useAuth();
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

 return (
 <div className="flex items-center gap-3">
 <div className="flex flex-col items-end hidden sm:flex">
 <span className="text-xs font-semibold text-neutral-900 truncate max-w-[120px]">
 {user?.email?.split('@')[0]}
 </span>
 <span className="text-[10px] text-neutral-500 uppercase tracking-wider">
 Engineer
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
