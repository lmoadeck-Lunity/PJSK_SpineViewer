import React, { Suspense, lazy } from 'react';

// Lazy load the WebView component
const WebView = lazy(() => import('../temp_webview.tsx'));

// Loading component for WebView
const WebViewLoading = () => (
  <div className="min-h-screen w-full flex items-center justify-center bg-[#264c65]">
    <div className="flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      <div className="text-white">Loading Interface...</div>
    </div>
  </div>
);

const LazyWebView = (props) => {
  return (
    <Suspense fallback={<WebViewLoading />}>
      <WebView {...props} />
    </Suspense>
  );
};

export default LazyWebView;
