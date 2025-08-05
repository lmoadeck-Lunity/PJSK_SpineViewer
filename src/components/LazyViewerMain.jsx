import React, { Suspense, lazy } from 'react';
import ErrorBoundary from './ErrorBoundary';

// Lazy load the ViewerMain component
const ViewerMain = lazy(() => import('../ViewerMain.jsx'));

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen w-full flex items-center justify-center bg-[#30336d]">
    <div className="flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      <div className="text-white text-lg">Loading Spine Viewer...</div>
    </div>
  </div>
);

const LazyViewerMain = React.forwardRef((props, ref) => {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingSpinner />}>
        <ViewerMain {...props} ref={ref} />
      </Suspense>
    </ErrorBoundary>
  );
});

LazyViewerMain.displayName = 'LazyViewerMain';

export default LazyViewerMain;
