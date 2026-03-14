import { ReactNode, useState } from 'react';
import { Menu, X, Droplets, BarChart3, Waves, Clock, Bot, Map } from 'lucide-react';
import { UserNav } from '@/components/auth/UserNav';

interface MainLayoutProps {
 children: ReactNode;
 title?: string;
}

const navigation = [
 { name: 'Analisis Banjir', href: '/flood', icon: Waves },
 { name: 'Analisis Saluran', href: '/channel', icon: BarChart3 },
 { name: 'Neraca Air', href: '/water-balance', icon: Droplets },
 { name: 'Peta Interaktif', href: '/map', icon: Map },
 { name: 'Riwayat', href: '/history', icon: Clock },
 { name: 'AI Konsultan', href: '/ai', icon: Bot },
];

export default function MainLayout({ children, title }: MainLayoutProps) {
 const [sidebarOpen, setSidebarOpen] = useState(false);

 return (
 <div className="min-h-screen">
 {/* Mobile sidebar backdrop */}
 {sidebarOpen && (
 <div
 className="fixed inset-0 bg-neutral-900/40 z-40 lg:hidden"
 onClick={() => setSidebarOpen(false)}
 />
 )}

 {/* Sidebar */}
 <aside
 className={`fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-slate-900 border-r border-slate-300 dark:border-slate-600 transform transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
 }`}
 >
 {/* Logo */}
 <div className="h-16 flex items-center justify-between px-6 border-b border-slate-300 dark:border-slate-600">
 <div className="flex items-center gap-2">
 <Droplets className="w-6 h-6 text-pupr-blue" />
 <span className="text-lg font-bold text-slate-900 dark:text-slate-100">RekaSDA Pro</span>
 </div>
 <button
 onClick={() => setSidebarOpen(false)}
 className="lg:hidden text-neutral-700 hover:text-neutral-900"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 {/* Navigation */}
 <nav className="p-4 space-y-1">
 {navigation.map((item) => (
 <a
 key={item.name}
 href={item.href}
 className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 rounded-sm hover:bg-slate-50 dark:bg-slate-800 hover:text-pupr-blue transition-all"
 >
 <item.icon className="w-5 h-5" />
 {item.name}
 </a>
 ))}
 </nav>
 </aside>

 {/* Main content */}
 <div className="lg:pl-64">
 {/* Header */}
 <header className="sticky top-0 z-30 h-16 bg-pupr-blue text-white border-b-4 border-pupr-yellow flex items-center justify-between px-6">
 <div className="flex items-center gap-4">
 <button
 onClick={() => setSidebarOpen(true)}
 className="lg:hidden text-white/80 hover:text-white"
 >
 <Menu className="w-6 h-6" />
 </button>
 {title && <h1 className="text-xl font-bold">{title}</h1>}
 </div>
 <div className="flex items-center gap-6">
 <div className="items-center gap-2 hidden md:flex">
 <span className="text-sm font-bold opacity-90">SNI Compliant</span>
 <div className="w-2 h-2 bg-success rounded-sm" />
 </div>
 <div className="h-8 w-px bg-white dark:bg-slate-900 hidden md:block" />
 <UserNav />
 </div>
 </header>

 {/* Page content */}
 <main className="p-6">
 <div className="max-w-7xl mx-auto">
 {children}
 </div>
 </main>
 </div>
 </div>
 );
}
