import React, { Component, ReactNode } from 'react';
import { GlobalErrorFallback } from './GlobalErrorFallback';

interface Props {
 children: ReactNode;
 fallback?: ReactNode;
}

interface State {
 hasError: boolean;
 error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
 constructor(props: Props) {
 super(props);
 this.state = { hasError: false };
 }

 static getDerivedStateFromError(error: Error): State {
 return { hasError: true, error };
 }

 componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
 console.error('Error caught by boundary:', error, errorInfo);
 }

 render() {
 if (this.state.hasError && this.state.error) {
 return this.props.fallback || <GlobalErrorFallback error={this.state.error} />;
 }

 return this.props.children;
 }
}