import React, { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      errorLocation: null
    };
  }

  static getDerivedStateFromError(error) {
    // Try to extract location information from the error
    let errorLocation = null;
    try {
      const stackLines = error.stack.split('\n');
      // Usually the second line has the file and line information
      if (stackLines.length > 1) {
        const match = stackLines[1].match(/at\s+(\S+)\s+\((.*):(\d+):(\d+)\)/);
        if (match) {
          errorLocation = {
            function: match[1],
            file: match[2],
            line: match[3],
            column: match[4]
          };
        }
      }
    } catch (e) {
      // Ignore parsing errors
    }
    
    return { 
      hasError: true,
      errorLocation
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-xl font-bold text-red-800 mb-2">Something went wrong</h2>
          <p className="mb-4 text-red-600">
            There was an error in the Member Permissions component.
          </p>
          
          {this.state.errorLocation && (
            <div className="mb-4 bg-white p-3 rounded border border-red-100">
              <p className="text-sm text-gray-700">
                <strong>Error location:</strong> {this.state.errorLocation.file} 
                at line {this.state.errorLocation.line}, column {this.state.errorLocation.column}
              </p>
            </div>
          )}
          
          <details className="mb-4 bg-white p-3 rounded border border-red-100">
            <summary className="cursor-pointer font-medium text-red-700">
              View error details
            </summary>
            <pre className="mt-2 text-xs whitespace-pre-wrap overflow-auto bg-gray-50 p-2 rounded">
              {this.state.error && this.state.error.toString()}
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </pre>
          </details>
          
          <div className="flex gap-2">
            <button 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </button>
            <button 
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              onClick={() => {
                // Try to reset some component state
                try {
                  // Clear local storage items that might be causing issues
                  localStorage.removeItem("selectedGroup");
                  localStorage.removeItem("editingGroup");
                  
                  // Then reload
                  window.location.reload();
                } catch (e) {
                  window.location.reload();
                }
              }}
            >
              Reset & Refresh
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;