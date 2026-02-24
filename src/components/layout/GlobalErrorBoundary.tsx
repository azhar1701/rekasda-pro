import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    private handleReload = () => {
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 relative overflow-hidden p-6">
                    {/* Decorative background blobs */}
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-200/50 rounded-full blur-3xl -z-10 mix-blend-multiply" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-200/50 rounded-full blur-3xl -z-10 mix-blend-multiply" />

                    <div className="max-w-md w-full bg-white/70 backdrop-blur-xl border border-white/80 shadow-xl rounded-3xl p-8 text-center animate-in fade-in zoom-in-95 duration-500">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <AlertCircle className="w-10 h-10 text-red-500" />
                        </div>

                        <h1 className="text-2xl font-bold text-slate-800 mb-3 tracking-tight">Terjadi Kesalahan Kritis</h1>

                        <p className="text-slate-600 mb-8 leading-relaxed text-sm">
                            Maaf, aplikasi mengalami masalah saat mencoba merender data pada antarmuka ini. Silakan muat ulang halaman untuk memulihkan sesi Anda.
                        </p>

                        <div className="p-4 bg-slate-100/50 rounded-xl mb-8 text-left border border-slate-200/50 overflow-hidden">
                            <p className="text-xs font-mono text-slate-500 truncate" title={this.state.error?.message}>
                                <span className="font-semibold text-red-500">Error:</span> {this.state.error?.message || 'Unknown Error'}
                            </p>
                        </div>

                        <Button
                            onClick={this.handleReload}
                            className="w-full bg-slate-800 hover:bg-slate-900 text-white rounded-xl py-6 font-semibold shadow-lg shadow-slate-200 transition-all hover:scale-[1.02]"
                        >
                            <RefreshCcw className="w-4 h-4 mr-2" />
                            Muat Ulang Halaman
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
