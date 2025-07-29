import React, { useState } from 'react';
import ResultDisplay from './ResultDisplay';

// Demo component to showcase ResultDisplay functionality
const ResultDisplayDemo = () => {
  const [showResult, setShowResult] = useState(false);

  const sampleResults = [
    {
      rating: 4.2,
      confidence: 85,
      explanation: 'This product has excellent visual appeal with high-quality imagery and compelling title that suggests premium quality. The clean presentation and professional styling contribute to a positive first impression.'
    },
    {
      rating: 3.1,
      confidence: 62,
      explanation: 'The product shows moderate appeal. While the image quality is decent, the title could be more descriptive and engaging. Consider improving the visual presentation and adding more compelling product details.'
    },
    {
      rating: 4.8,
      confidence: 92,
      explanation: 'Outstanding product presentation! The high-quality image showcases the product beautifully, and the title is both informative and appealing. This combination creates strong customer confidence and purchase intent.'
    },
    {
      rating: 2.3,
      confidence: 45,
      explanation: 'The product presentation needs improvement. The image quality appears low and the title lacks compelling details. Consider retaking the product photo with better lighting and writing a more descriptive, benefit-focused title.'
    }
  ];

  const [currentResult, setCurrentResult] = useState(0);

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          ResultDisplay Component Demo
        </h1>
        <p className="text-gray-600 mb-6">
          This demo showcases the ResultDisplay component with different rating scenarios.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 justify-center mb-6">
        <button
          onClick={() => setShowResult(!showResult)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          {showResult ? 'Hide Result' : 'Show Result'}
        </button>
        
        {showResult && (
          <>
            {sampleResults.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentResult(index)}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  currentResult === index
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Sample {index + 1}
              </button>
            ))}
          </>
        )}
      </div>

      {showResult && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <ResultDisplay
            {...sampleResults[currentResult]}
            animated={true}
            key={currentResult} // Force re-render for animations
          />
        </div>
      )}

      {!showResult && (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-500">
            Click "Show Result" to see the ResultDisplay component in action
          </p>
        </div>
      )}

      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">Component Features:</h3>
        <ul className="text-blue-700 space-y-1 text-sm">
          <li>• Star rating visualization with decimal precision (1-5 scale)</li>
          <li>• Confidence score display with color-coded labels</li>
          <li>• Detailed explanation text with proper formatting</li>
          <li>• Smooth animations for result reveal</li>
          <li>• Responsive design for mobile and desktop</li>
          <li>• Accessibility-compliant with proper heading structure</li>
        </ul>
      </div>
    </div>
  );
};

export default ResultDisplayDemo;