/**
 * Error Boundary Test Component
 * 
 * Usage: Temporarily add to App.tsx to test error boundary
 * <ErrorBoundaryTest />
 */

import { useState } from 'react';

export const ErrorBoundaryTest = () => {
  const [shouldThrow, setShouldThrow] = useState(false);

  if (shouldThrow) {
    throw new Error('Test Error: GlobalErrorBoundary is working! This is a simulated crash.');
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999]">
      <button
        onClick={() => setShouldThrow(true)}
        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg shadow-lg transition-colors"
      >
        🧪 Test Error Boundary
      </button>
    </div>
  );
};
