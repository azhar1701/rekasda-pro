import { Component, ErrorInfo, ReactNode } from 'react';
import { GlobalErrorFallback } from '@/components/common/GlobalErrorFallback';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    componentStack: string | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        componentStack: null,
    };

    public static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Simpan component stack untuk ditampilkan di detail teknis
        this.setState({ componentStack: errorInfo.componentStack ?? null });

        // Log ke console untuk debugging lokal
        console.error('[GlobalErrorBoundary] Uncaught error:', error);
        console.error('[GlobalErrorBoundary] Component stack:', errorInfo.componentStack);

        // --- Titipkan ke layanan monitoring (Sentry / LogRocket / custom) di sini ---
        // Contoh: Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
    }

    /** Reset boundary agar user bisa mencoba ulang tanpa full reload */
    private handleReset = () => {
        this.setState({ hasError: false, error: null, componentStack: null });
    };

    public render() {
        if (this.state.hasError && this.state.error) {
            return (
                <GlobalErrorFallback
                    error={this.state.error}
                    componentStack={this.state.componentStack}
                    resetErrorBoundary={this.handleReset}
                />
            );
        }

        return this.props.children;
    }
}
