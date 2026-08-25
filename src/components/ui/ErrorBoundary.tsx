import React, { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RotateCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[#080808] text-[#F7F5F0] flex items-center justify-center p-6 select-none font-sans">
          <div className="max-w-md w-full text-center bg-[#111111] border border-[#222222] p-8 rounded-sm shadow-2xl space-y-6">
            <div className="w-14 h-14 rounded-full bg-[#1C1515] border border-[#333333] flex items-center justify-center mx-auto text-[#FF6B6B]">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#FF6B6B]">
                System Notice
              </span>
              <h2 className="font-serif text-2xl text-[#F7F5F0]">Something went wrong</h2>
              <p className="text-xs text-[#888888] leading-relaxed">
                An unexpected interface issue occurred. Your data and bookings remain safe.
              </p>
              {this.state.error?.message && (
                <div className="mt-3 p-3 bg-[#161616] border border-[#262626] rounded-sm text-left">
                  <p className="text-[11px] font-mono text-[#A0A0A0] break-words">
                    {this.state.error.message}
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#C9A86A] hover:bg-[#B89758] text-[#0B0B0B] text-xs font-mono uppercase tracking-wider font-semibold rounded-sm transition-colors"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Reload App</span>
              </button>
              <a
                href="/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#181818] hover:bg-[#222222] text-[#D0D0D0] text-xs font-mono uppercase tracking-wider border border-[#333333] rounded-sm transition-colors"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
