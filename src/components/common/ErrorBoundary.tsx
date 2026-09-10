import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Supervisory Console Uncaught UI Exception:', error, errorInfo);
    this.setState({ errorInfo });
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 my-8 max-w-2xl mx-auto rounded-2xl bg-zinc-950 border border-red-900/60 shadow-2xl text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-xl bg-red-950/80 border border-red-800 flex items-center justify-center text-red-400">
            <AlertOctagon className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <h2 className="text-base font-bold text-zinc-100">
              {this.props.fallbackTitle || 'Component Rendering Interrupted'}
            </h2>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              A data rendering variance occurred in this module. The supervisory engine prevented a blank screen crash and preserved your operational session.
            </p>
          </div>

          {this.state.error && (
            <div className="text-left bg-zinc-900 border border-zinc-800 rounded-lg p-3 font-mono text-[11px] text-red-300/90 overflow-x-auto max-h-36">
              {this.state.error.message}
            </div>
          )}

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={this.handleReset}
              className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-semibold text-zinc-200 flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Component</span>
            </button>
            <button
              onClick={() => {
                this.handleReset();
                window.location.hash = '';
                window.location.reload();
              }}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Reload Supervisory Console</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
