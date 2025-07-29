import { motion } from 'framer-motion';
import { AnimatedContainer, StaggerContainer } from './index';

const StarRating = ({ rating, animated = true }) => {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasPartialStar = rating % 1 !== 0;
  const partialStarWidth = (rating % 1) * 100;

  // Create full stars
  for (let i = 0; i < fullStars; i++) {
    stars.push(
      <motion.div
        key={`full-${i}`}
        className="relative"
        initial={animated ? { scale: 0, rotate: -180 } : false}
        animate={animated ? { scale: 1, rotate: 0 } : false}
        transition={animated ? { delay: i * 0.1, duration: 0.5, ease: 'backOut' } : false}
      >
        <svg
          className="w-8 h-8 text-yellow-400 fill-current"
          viewBox="0 0 24 24"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      </motion.div>
    );
  }

  // Create partial star if needed
  if (hasPartialStar) {
    stars.push(
      <motion.div
        key="partial"
        className="relative"
        initial={animated ? { scale: 0, rotate: -180 } : false}
        animate={animated ? { scale: 1, rotate: 0 } : false}
        transition={animated ? { delay: fullStars * 0.1, duration: 0.5, ease: 'backOut' } : false}
      >
        <svg
          className="w-8 h-8 text-gray-300 fill-current"
          viewBox="0 0 24 24"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
        <div
          className="absolute top-0 left-0 overflow-hidden"
          style={{ width: `${partialStarWidth}%` }}
        >
          <svg
            className="w-8 h-8 text-yellow-400 fill-current"
            viewBox="0 0 24 24"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>
      </motion.div>
    );
  }

  // Create empty stars
  const emptyStars = 5 - Math.ceil(rating);
  for (let i = 0; i < emptyStars; i++) {
    stars.push(
      <motion.div
        key={`empty-${i}`}
        className="relative"
        initial={animated ? { scale: 0, rotate: -180 } : false}
        animate={animated ? { scale: 1, rotate: 0 } : false}
        transition={animated ? { delay: (fullStars + (hasPartialStar ? 1 : 0) + i) * 0.1, duration: 0.5, ease: 'backOut' } : false}
      >
        <svg
          className="w-8 h-8 text-gray-300 fill-current"
          viewBox="0 0 24 24"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      </motion.div>
    );
  }

  return (
    <div className="flex items-center justify-center space-x-1">
      {stars}
    </div>
  );
};

const ConfidenceScore = ({ confidence, animated = true }) => {
  const getConfidenceColor = (score) => {
    if (score >= 80) return {
      bg: 'bg-gradient-to-r from-green-100 to-emerald-100',
      text: 'text-green-700',
      border: 'border-green-200',
      icon: '🎯',
      ring: 'ring-green-500/20'
    };
    if (score >= 60) return {
      bg: 'bg-gradient-to-r from-yellow-100 to-orange-100',
      text: 'text-yellow-700',
      border: 'border-yellow-200',
      icon: '⚡',
      ring: 'ring-yellow-500/20'
    };
    return {
      bg: 'bg-gradient-to-r from-red-100 to-pink-100',
      text: 'text-red-700',
      border: 'border-red-200',
      icon: '⚠️',
      ring: 'ring-red-500/20'
    };
  };

  const getConfidenceLabel = (score) => {
    if (score >= 80) return 'High Confidence';
    if (score >= 60) return 'Medium Confidence';
    return 'Low Confidence';
  };

  const colors = getConfidenceColor(confidence);

  return (
    <AnimatedContainer
      variant={animated ? 'scale' : 'fadeIn'}
      delay={animated ? 0.8 : 0}
      className="text-center"
    >
      <motion.div 
        className={`inline-flex items-center px-6 py-3 rounded-2xl text-sm font-bold shadow-lg border-2 ${colors.bg} ${colors.text} ${colors.border} ${colors.ring} ring-4`}
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.2 }}
      >
        <span className="mr-2 text-base">{colors.icon}</span>
        <span className="mr-3">{getConfidenceLabel(confidence)}</span>
        <div className="flex items-center gap-1">
          <motion.span 
            className="text-lg font-black"
            initial={animated ? { scale: 0 } : false}
            animate={animated ? { scale: 1 } : false}
            transition={animated ? { delay: 1, duration: 0.3, ease: 'backOut' } : false}
          >
            {confidence}%
          </motion.span>
        </div>
      </motion.div>
    </AnimatedContainer>
  );
};

const ExplanationText = ({ explanation, animated = true }) => {
  return (
    <AnimatedContainer
      variant={animated ? 'slideUp' : 'fadeIn'}
      delay={animated ? 1.0 : 0}
      className="relative"
    >
      {/* Speech bubble container */}
      <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100 shadow-lg">
        {/* Speech bubble arrow */}
        <div className="absolute -top-3 left-8 w-6 h-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-l border-t border-blue-100 transform rotate-45"></div>
        
        {/* AI Avatar */}
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-white text-lg">🤖</span>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-lg font-bold text-gray-800">
                AI Analysis
              </h3>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-500 font-medium">Live</span>
              </div>
            </div>
            
            <p className="text-gray-700 leading-relaxed font-medium">
              {explanation}
            </p>
            
            {/* Typing indicator animation */}
            <motion.div
              className="flex items-center gap-1 mt-3 opacity-60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              transition={{ delay: 0.5 }}
            >
              <span className="text-xs text-gray-500">Analysis complete</span>
              <motion.div
                className="flex space-x-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                <motion.div
                  className="w-1 h-1 bg-blue-400 rounded-full"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                />
                <motion.div
                  className="w-1 h-1 bg-blue-400 rounded-full"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                />
                <motion.div
                  className="w-1 h-1 bg-blue-400 rounded-full"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </AnimatedContainer>
  );
};

const ResultDisplay = ({ 
  rating, 
  confidence, 
  explanation, 
  animated = true,
  className = '' 
}) => {
  if (!rating && !confidence && !explanation) {
    return null;
  }

  return (
    <AnimatedContainer
      variant={animated ? 'slideUp' : 'fadeIn'}
      delay={animated ? 0.3 : 0}
      className={`space-y-6 ${className}`}
    >
      {/* Rating Section */}
      {rating && (
        <div className="text-center">
          <motion.div
            className="inline-flex items-center gap-3 mb-6"
            initial={animated ? { opacity: 0, y: -20 } : false}
            animate={animated ? { opacity: 1, y: 0 } : false}
            transition={animated ? { delay: 0.5, duration: 0.5 } : false}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white text-sm">⭐</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">
              Predicted Rating
            </h2>
          </motion.div>
          
          {/* Star rating with enhanced background */}
          <motion.div 
            className="relative mb-6"
            initial={animated ? { scale: 0.8, opacity: 0 } : false}
            animate={animated ? { scale: 1, opacity: 1 } : false}
            transition={animated ? { delay: 0.6, duration: 0.4 } : false}
          >
            <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl border border-yellow-200 shadow-lg">
              <StarRating rating={rating} animated={animated} />
            </div>
          </motion.div>
          
          {/* Rating score with enhanced styling */}
          <motion.div 
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-2xl shadow-xl"
            initial={animated ? { scale: 0 } : false}
            animate={animated ? { scale: 1 } : false}
            transition={animated ? { delay: 0.7, duration: 0.5, ease: 'backOut' } : false}
            whileHover={{ scale: 1.05 }}
          >
            <span className="text-3xl font-black">
              {rating.toFixed(1)}
            </span>
            <div className="text-gray-300">
              <div className="text-sm font-medium">out of</div>
              <div className="text-lg font-bold">5.0</div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Confidence Score */}
      {confidence && (
        <ConfidenceScore confidence={confidence} animated={animated} />
      )}

      {/* Explanation */}
      {explanation && (
        <ExplanationText explanation={explanation} animated={animated} />
      )}
    </AnimatedContainer>
  );
};

export default ResultDisplay;