import React, { useState } from 'react';
import { supabase } from '@/lib/api/supabase';
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
 DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/useToast';

interface AuthModalProps {
 isOpen: boolean;
 onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
 const [loading, setLoading] = useState(false);
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');

 const handleAuth = async (type: 'login' | 'signup') => {
 setLoading(true);
 try {
 if (type === 'signup') {
 const { error } = await supabase!.auth.signUp({
 email,
 password,
 });
 if (error) throw error;
 toast.success('Pendaftaran berhasil! Silakan periksa email Anda.');
 } else {
 const { error } = await supabase!.auth.signInWithPassword({
 email,
 password,
 });
 if (error) throw error;
 toast.success('Berhasil masuk');
 onClose();
 }
 } catch (error: any) {
 toast.error(error.message || 'Terjadi kesalahan sistem');
 } finally {
 setLoading(false);
 }
 };

 return (
 <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
 <DialogContent className="sm:max-w-[400px] glass-card border-white/20">
 <DialogHeader>
 <DialogTitle className="text-2xl font-bold text-neutral-900">Selamat Datang</DialogTitle>
 <DialogDescription>
 Akses data teknis Anda kapan saja, di mana saja.
 </DialogDescription>
 </DialogHeader>

 <Tabs defaultValue="login" className="w-full mt-4">
 <TabsList className="grid w-full grid-cols-2 bg-neutral-100/50">
 <TabsTrigger value="login">Masuk</TabsTrigger>
 <TabsTrigger value="signup">Daftar</TabsTrigger>
 </TabsList>

 <TabsContent value="login" className="space-y-4 mt-6">
 <div className="space-y-2">
 <Label htmlFor="email">Email</Label>
 <Input
 id="email"
 type="email"
 placeholder="reka@engineer.com"
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 className="glass-input"
 />
 </div>
 <div className="space-y-2">
 <Label htmlFor="password">Kata Sandi</Label>
 <Input
 id="password"
 type="password"
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 className="glass-input"
 />
 </div>
 <Button
 className="w-full h-11 bg-primary-600 hover:bg-primary-700 text-white shadow-primary-600/20"
 onClick={() => handleAuth('login')}
 disabled={loading}
 >
 {loading ? 'Memproses...' : 'Masuk ke Akun'}
 </Button>
 </TabsContent>

 <TabsContent value="signup" className="space-y-4 mt-6">
 <div className="space-y-2">
 <Label htmlFor="signup-email">Email</Label>
 <Input
 id="signup-email"
 type="email"
 placeholder="reka@engineer.com"
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 className="glass-input"
 />
 </div>
 <div className="space-y-2">
 <Label htmlFor="signup-password">Kata Sandi</Label>
 <Input
 id="signup-password"
 type="password"
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 className="glass-input"
 />
 </div>
 <Button
 className="w-full h-11 bg-primary-600 hover:bg-primary-700 text-white shadow-primary-600/20"
 onClick={() => handleAuth('signup')}
 disabled={loading}
 >
 {loading ? 'Memproses...' : 'Buat Akun Baru'}
 </Button>
 </TabsContent>
 </Tabs>
 </DialogContent>
 </Dialog>
 );
};
