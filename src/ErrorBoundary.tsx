import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', color: 'white', backgroundColor: '#1e1e1e', height: '100vh', overflow: 'auto' }}>
          <h2>Something went wrong in the React App.</h2>
          <details style={{ whiteSpace: 'pre-wrap', marginTop: '1rem' }}>
            <summary>Click for error details</summary>
            <br />
            <strong style={{ color: '#ff6b6b' }}>{this.state.error && this.state.error.toString()}</strong>
            <br /><br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
          <button 
            onClick={() => window.location.reload()} 
            style={{ marginTop: '2rem', padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Reload App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
