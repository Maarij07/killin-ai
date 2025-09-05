'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class StripeErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Stripe Error Boundary caught an error:', error, errorInfo);

    // Handle specific Stripe errors
    if (error.message.includes('./en') || error.message.includes('module')) {
      console.warn('Stripe localization module error - this is typically safe to ignore');
    }
  }

  public render() {
    if (this.state.hasError) {
      // Don't show error UI for localization errors
      if (this.state.error?.message.includes('./en') || this.state.error?.message.includes('Cannot find module')) {
        return this.props.children;
      }

      return this.props.fallback || (
        <div className="p-4 text-center">
          <p className="text-red-600">Something went wrong with the payment system.</p>
          <button
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded"
            onClick={() => this.setState({ hasError: false })}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default StripeErrorBoundary;
