import React, { useState, createContext, useContext } from 'react';
// import AnimatedContainer from './components/animations/AnimatedContainer';
import { ImageInput, TitleInput, PredictionButton } from './components';
// import { ResultDisplay } from './components';

// Global state context for the application
const AppContext = createContext();

// Custom hook to use the app context
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

// Result Display Container component
const ResultDisplayContainer = () => {
  const { prediction, isLoading, error } = useAppContext();

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-gray-600 font-medium">Analyzing your product...</p>
        <p className="text-sm text-gray-500 text-center max-w-md">
          Our AI is processing your image and title to generate a rating prediction
        </p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Prediction Failed
          </h3>
          <p className="text-red-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">
            Please try again or check your inputs
          </p>
        </div>
      </div>
    );
  }

  // Results state
  if (prediction) {
    return (
      <div className="text-center space-y-4">
        <div className="text-3xl font-bold text-gray-800">
          {prediction.rating.toFixed(1)} / 5.0
        </div>
        <div className="text-sm text-green-600">
          Confidence: {prediction.confidence}%
        </div>
        <div className="bg-gray-50 rounded-lg p-4 text-left">
          <p className="text-gray-600">{prediction.explanation}</p>
        </div>
      </div>
    );
  }

  // Empty state
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Ready for Analysis
        </h3>
        <p className="text-gray-500 max-w-md">
          Upload a product image and enter a title, then click "Get Rating Prediction" to see how customers might rate your product.
        </p>
      </div>
    </div>
  );
};

// App state provider component
const AppProvider = ({ children }) => {
  // Global state for the application
  const [appState, setAppState] = useState({
    image: null,
    imagePreview: null,
    title: '',
    prediction: null,
    isLoading: false,
    error: null,
  });

  // Update functions for different parts of the state
  const updateImage = (image, preview) => {
    setAppState(prev => ({
      ...prev,
      image,
      imagePreview: preview,
      error: null,
    }));
  };

  const updateTitle = (title) => {
    setAppState(prev => ({
      ...prev,
      title,
      error: null,
    }));
  };

  const updatePrediction = (prediction) => {
    setAppState(prev => ({
      ...prev,
      prediction,
      isLoading: false,
      error: null,
    }));
  };

  const setLoading = (isLoading) => {
    setAppState(prev => ({
      ...prev,
      isLoading,
      error: null,
    }));
  };

  const setError = (error) => {
    setAppState(prev => ({
      ...prev,
      error,
      isLoading: false,
    }));
  };

  const resetState = () => {
    setAppState({
      image: null,
      imagePreview: null,
      title: '',
      prediction: null,
      isLoading: false,
      error: null,
    });
  };

  const contextValue = {
    ...appState,
    updateImage,
    updateTitle,
    updatePrediction,
    setLoading,
    setError,
    resetState,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

function App() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-40">
          <div className="w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat'
          }}></div>
        </div>
        
        {/* Responsive container with proper spacing and layout */}
        <div className="relative container mx-auto px-4 py-8 sm:py-12 lg:py-16">
          <div className="max-w-6xl mx-auto">
            {/* Hero section */}
            <div className="text-center mb-12 sm:mb-16">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-6 shadow-lg">
                  <span className="text-3xl">📷</span>
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-4">
                  SnapRate
                </h1>
                <div className="flex items-center justify-center gap-2 mb-6">
                  <span className="text-yellow-400 text-xl">⭐</span>
                  <p className="text-xl sm:text-2xl font-semibold text-gray-700">
                    AI-powered product rating estimator
                  </p>
                  <span className="text-yellow-400 text-xl">⭐</span>
                </div>
              </div>
              
              <div className="max-w-3xl mx-auto">
                <p className="text-lg sm:text-xl text-gray-600 mb-4 leading-relaxed">
                  Get instant predictions on how customers might rate your product based on its image and title
                </p>
                <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>AI-powered analysis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Instant results</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Mobile-friendly</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main content area - responsive grid layout */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 lg:gap-12">
              {/* Input section */}
              <div className="space-y-8">
                <div className="card">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm">📝</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Product Information
                    </h2>
                  </div>
                  
                  {/* Image Input Component */}
                  <div className="mb-8">
                    <label className="block text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <span className="text-lg">📷</span>
                      Product Image
                    </label>
                    <ImageInput />
                  </div>

                  {/* Title Input Component */}
                  <div className="mb-8">
                    <label className="block text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <span className="text-lg">✏️</span>
                      Product Title
                    </label>
                    <TitleInput />
                  </div>

                  {/* Prediction Button Component */}
                  <div>
                    <PredictionButton />
                  </div>
                </div>
              </div>

              {/* Results section */}
              <div className="space-y-8">
                <div className="card min-h-[400px] flex flex-col">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm">⭐</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Rating Prediction
                    </h2>
                  </div>
                  
                  {/* Result Display Component */}
                  <div className="flex-1 flex items-center justify-center">
                    <ResultDisplayContainer />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer section */}
            <div className="text-center mt-16 pt-12">
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-8 border border-gray-100 shadow-lg">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <span className="text-2xl">🚀</span>
                  <h3 className="text-xl font-bold text-gray-800">Ready to optimize your products?</h3>
                </div>
                <p className="text-gray-600 mb-4 max-w-2xl mx-auto">
                  SnapRate uses advanced AI to analyze your product images and titles, giving you insights into how customers might perceive and rate your products before you list them.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🎯</span>
                    <span>Accurate predictions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⚡</span>
                    <span>Instant results</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🔒</span>
                    <span>Secure & private</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📱</span>
                    <span>Mobile-friendly</span>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-xs text-gray-400">
                    Built with ❤️ using React, FastAPI, and AI • © 2024 SnapRate
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppProvider>
  );
}

export default App;