import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { AuthModal } from './AuthModal';
import { User, LogOut } from 'lucide-react';

export const UserNav: React.FC = () => {
    const { user, isAuthenticated, signOut, loading } = useAuth();
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    if (loading) {
        return <div className="w-8 h-8 rounded-full bg-neutral-100 animate-pulse" />;
    }

    if (!isAuthenticated) {
        return (
            <>
                <Button
                    variant="outline"
                    size="default"
                    onClick={() => setIsAuthModalOpen(true)}
                    className="border-slate-300 text-slate-700 hover:bg-slate-50 min-h-[44px] px-4 rounded-sm"
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

            <div className="h-10 w-10 rounded-full bg-primary-50 border border-primary-100 flex items-center justify-center text-primary-600">
                <User className="w-5 h-5" />
            </div>

            <button
                onClick={() => signOut()}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-neutral-400 hover:text-danger transition-colors rounded-sm"
                title="Keluar"
            >
                <LogOut className="w-5 h-5" />
            </button>
        </div>
    );
};
