import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../App';

const TitleInput = () => {
  const { title, updateTitle, error } = useAppContext();
  const [localTitle, setLocalTitle] = useState(title || '');
  const [validationError, setValidationError] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Title validation constraints
  const MIN_TITLE_LENGTH = 1;
  const MAX_TITLE_LENGTH = 200;

  // Validate title
  const validateTitle = (titleValue) => {
    const trimmedTitle = titleValue.trim();
    
    if (!trimmedTitle) {
      return 'Product title is required';
    }

    if (trimmedTitle.length < MIN_TITLE_LENGTH) {
      return 'Product title cannot be empty';
    }

    if (trimmedTitle.length > MAX_TITLE_LENGTH) {
      return `Product title must be ${MAX_TITLE_LENGTH} characters or less`;
    }

    return null;
  };

  // Handle title change
  const handleTitleChange = (event) => {
    const newTitle = event.target.value;
    setLocalTitle(newTitle);

    // Clear validation error when user starts typing
    if (validationError) {
      setValidationError('');
    }

    // Validate and update global state
    const titleValidationError = validateTitle(newTitle);
    if (!titleValidationError) {
      updateTitle(newTitle.trim());
    } else {
      // Clear global title if invalid
      updateTitle('');
    }
  };

  // Handle blur event to show validation errors
  const handleBlur = () => {
    setIsFocused(false);
    const titleValidationError = validateTitle(localTitle);
    if (titleValidationError) {
      setValidationError(titleValidationError);
    }
  };

  // Handle focus event
  const handleFocus = () => {
    setIsFocused(true);
    setValidationError('');
  };

  // Sync local state with global state
  useEffect(() => {
    if (title !== localTitle.trim()) {
      setLocalTitle(title || '');
    }
  }, [title]);

  // Character count for user feedback
  const characterCount = localTitle.length;
  const isNearLimit = characterCount > MAX_TITLE_LENGTH * 0.8;
  const isOverLimit = characterCount > MAX_TITLE_LENGTH;

  return (
    <div className="space-y-2">
      {/* Title input field */}
      <div className="relative">
        <textarea
          value={localTitle}
          onChange={handleTitleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="e.g., 'Premium Wireless Bluetooth Headphones with Active Noise Cancellation and 30-Hour Battery Life'"
          className={`w-full px-4 py-4 border-2 rounded-xl resize-none transition-all duration-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-white/80 backdrop-blur-sm font-medium ${
            validationError || error
              ? 'border-red-300 bg-red-50/80 focus:border-red-500 focus:ring-red-500/20'
              : isFocused
              ? 'border-blue-400 bg-blue-50/30'
              : 'border-gray-200 hover:border-gray-300'
          } ${isOverLimit ? 'border-red-400' : ''}`}
          rows={4}
          maxLength={MAX_TITLE_LENGTH + 50} // Allow slight overflow for better UX
        />
        
        {/* Character count indicator */}
        <div className="absolute bottom-3 right-3">
          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
            isOverLimit
              ? 'bg-red-100/80 text-red-700 border border-red-200'
              : isNearLimit
              ? 'bg-yellow-100/80 text-yellow-700 border border-yellow-200'
              : 'bg-gray-100/80 text-gray-500 border border-gray-200'
          }`}>
            <span className="mr-1">
              {isOverLimit ? '⚠️' : isNearLimit ? '⚡' : '📝'}
            </span>
            {characterCount}/{MAX_TITLE_LENGTH}
          </div>
        </div>
      </div>

      {/* Validation error display */}
      <AnimatePresence>
        {(validationError || error) && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <svg
                  className="w-4 h-4 text-red-500 mt-0.5 mr-2 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-sm text-red-600">{validationError || error}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Helper text */}
      {!validationError && !error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-gray-500"
        >
          <p>
            Enter a descriptive title that highlights your product's key features and benefits.
            This helps the AI better understand your product for more accurate rating predictions.
          </p>
        </motion.div>
      )}

      {/* Success indicator when title is valid */}
      {localTitle.trim() && !validationError && !error && !isFocused && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center text-green-600 text-sm"
        >
          <svg
            className="w-4 h-4 mr-1"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          Title looks good!
        </motion.div>
      )}
    </div>
  );
};

export default TitleInput;