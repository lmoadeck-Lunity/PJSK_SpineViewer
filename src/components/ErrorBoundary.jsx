import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#30336d]">
          <div className="bg-[#254c64] rounded-lg p-8 max-w-md mx-4">
            <div className="text-red-400 text-xl font-bold mb-4">
              ⚠️ Something went wrong
            </div>
            <div className="text-white text-sm mb-4">
              An error occurred while loading the Spine Viewer. Please refresh the page to try again.
            </div>
            {this.state.error && (
              <div className="text-red-300 text-xs bg-red-900/20 p-3 rounded mb-4">
                <strong>Error:</strong> {this.state.error.toString()}
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="w-full py-2 px-4 bg-[#218964] hover:bg-[#1a6b4f] text-white rounded transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
