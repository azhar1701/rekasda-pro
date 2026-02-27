import { Component, ErrorInfo, ReactNode } from 'react';
import { GlobalErrorFallback } from '@/components/common/GlobalErrorFallback';

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
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError && this.state.error) {
            return <GlobalErrorFallback error={this.state.error} />;
        }

        return this.props.children;
    }
}
