import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  darkMode?: boolean;
  screenName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidUpdate(prevProps: Props) {
    if (this.state.hasError && prevProps.screenName !== this.props.screenName) {
      this.setState({ hasError: false, error: null });
    }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[ErrorBoundary] ${this.props.screenName ?? 'Screen'} crashed:`, error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const dm = this.props.darkMode ?? false;
      return (
        <div className={`flex-1 flex flex-col items-center justify-center p-8 ${dm ? 'bg-[#0b0e14]' : 'bg-gray-50'}`}>
          <div className={`max-w-md text-center space-y-4 p-8 rounded-3xl border ${dm ? 'bg-[#12161f] border-[#1e2430]' : 'bg-white border-gray-200'}`}>
            <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center ${dm ? 'bg-red-500/10' : 'bg-red-50'}`}>
              <AlertTriangle className="text-red-500" size={28} />
            </div>
            <h2 className={`text-xl font-extrabold ${dm ? 'text-white' : 'text-gray-900'}`}>
              Something went wrong
            </h2>
            <p className={`text-sm ${dm ? 'text-gray-400' : 'text-gray-500'}`}>
              {this.props.screenName ? `The ${this.props.screenName} screen` : 'This screen'} encountered an error.
            </p>
            {this.state.error && (
              <pre className={`text-[10px] text-left overflow-auto max-h-24 p-3 rounded-xl ${dm ? 'bg-[#0b0e14] text-red-400' : 'bg-gray-50 text-red-600'}`}>
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#009688] text-white rounded-xl font-bold text-sm hover:bg-[#00796b] transition-all"
            >
              <RefreshCw size={14} />
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
