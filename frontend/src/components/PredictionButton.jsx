import { motion } from 'framer-motion';
import { useAppContext } from '../App';
import { predictRating, ApiError } from '../utils/apiClient';

const PredictionButton = () => {
  const { 
    image, 
    title, 
    isLoading, 
    setLoading, 
    updatePrediction, 
    setError 
  } = useAppContext();

  // Check if both image and title are valid for submission
  const isDisabled = !image || !title.trim() || isLoading;

  // Handle prediction request
  const handlePrediction = async () => {
    if (isDisabled) return;

    try {
      setLoading(true);

      // Call the API with the image and title
      const response = await predictRating({
        title: title.trim(),
        imageFile: image
      });

      // Update the prediction state with the response
      updatePrediction(response);

    } catch (error) {
      console.error('Prediction error:', error);
      
      // Handle different types of errors
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError('Failed to generate prediction. Please try again.');
      }
    }
  };

  return (
    <div className="space-y-3">
      {/* Main prediction button */}
      <motion.button
        type="button"
        onClick={handlePrediction}
        disabled={isDisabled}
        className={`relative w-full py-5 px-8 rounded-2xl font-bold text-lg transition-all duration-300 overflow-hidden ${
          isDisabled
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed border-2 border-gray-200'
            : 'bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 shadow-2xl hover:shadow-3xl border-2 border-transparent'
        }`}
        whileHover={!isDisabled ? { 
          scale: 1.02,
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
        } : {}}
        whileTap={!isDisabled ? { scale: 0.98 } : {}}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Animated background gradient */}
        {!isDisabled && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-500 to-indigo-500 opacity-0"
            whileHover={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
        )}
        
        {/* Button content */}
        <div className="relative flex items-center justify-center space-x-3">
          {isLoading ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
              />
              <span>Analyzing Product...</span>
            </>
          ) : (
            <>
              <motion.div
                whileHover={{ rotate: 15, scale: 1.1 }}
                transition={{ duration: 0.2 }}
              >
                <svg
                  className="w-7 h-7"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </motion.div>
              <span>Get Rating Prediction</span>
              <motion.div
                className="flex space-x-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <motion.div
                  className="w-1 h-1 bg-white rounded-full"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                />
                <motion.div
                  className="w-1 h-1 bg-white rounded-full"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                />
                <motion.div
                  className="w-1 h-1 bg-white rounded-full"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                />
              </motion.div>
            </>
          )}
        </div>
        
        {/* Shine effect */}
        {!isDisabled && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
            initial={{ x: "-100%" }}
            whileHover={{ x: "100%" }}
            transition={{ duration: 0.6 }}
          />
        )}
      </motion.button>

      {/* Status indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center"
      >
        {isLoading ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-blue-600 font-medium"
          >
            <div className="flex items-center justify-center space-x-2">
              <div className="flex space-x-1">
                <motion.div
                  className="w-2 h-2 bg-blue-600 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                />
                <motion.div
                  className="w-2 h-2 bg-blue-600 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                />
                <motion.div
                  className="w-2 h-2 bg-blue-600 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                />
              </div>
              <span>Processing your product data</span>
            </div>
          </motion.div>
        ) : !image || !title.trim() ? (
          <div className="text-sm text-gray-500">
            {!image && !title.trim() 
              ? 'Please add an image and title to get started'
              : !image 
              ? 'Please add a product image'
              : 'Please add a product title'
            }
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-sm text-green-600 font-medium flex items-center justify-center space-x-1"
          >
            <svg
              className="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>Ready to analyze your product</span>
          </motion.div>
        )}
      </motion.div>

      {/* Helper text */}
      {!isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-xs text-gray-500 text-center max-w-md mx-auto"
        >
          Our AI will analyze your product image and title to predict how customers might rate it on a scale of 1-5 stars.
        </motion.div>
      )}
    </div>
  );
};

export default PredictionButton;