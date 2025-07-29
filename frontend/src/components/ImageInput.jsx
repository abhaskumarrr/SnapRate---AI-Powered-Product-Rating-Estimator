import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../App';

const ImageInput = () => {
  const { imagePreview, updateImage, error } = useAppContext();
  const [inputMethod, setInputMethod] = useState('upload'); // 'upload', 'camera', 'url'
  const [imageUrl, setImageUrl] = useState('');
  const [validationError, setValidationError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Supported image formats
  const SUPPORTED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  // Validate image file
  const validateImage = (file) => {
    if (!file) {
      return 'Please select an image file';
    }

    if (!SUPPORTED_FORMATS.includes(file.type)) {
      return 'Please upload a valid image file (JPEG, PNG, or WebP)';
    }

    if (file.size > MAX_FILE_SIZE) {
      return 'Image file size must be less than 10MB';
    }

    return null;
  };

  // Handle file selection (upload or camera)
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const validationError = validateImage(file);
    if (validationError) {
      setValidationError(validationError);
      return;
    }

    setValidationError('');
    setIsLoading(true);

    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      updateImage(file, e.target.result);
      setIsLoading(false);
    };
    reader.onerror = () => {
      setValidationError('Failed to read the image file');
      setIsLoading(false);
    };
    reader.readAsDataURL(file);
  };

  // Handle URL input
  const handleUrlSubmit = async () => {
    if (!imageUrl.trim()) {
      setValidationError('Please enter a valid image URL');
      return;
    }

    setValidationError('');
    setIsLoading(true);

    try {
      // Create a temporary image to validate the URL
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        // Create a canvas to convert the image to a blob
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            // Create a File object from the blob
            const file = new File([blob], 'image-from-url.jpg', { type: 'image/jpeg' });
            const validationError = validateImage(file);
            
            if (validationError) {
              setValidationError(validationError);
              setIsLoading(false);
              return;
            }
            
            updateImage(file, imageUrl);
            setIsLoading(false);
          } else {
            setValidationError('Failed to process the image from URL');
            setIsLoading(false);
          }
        }, 'image/jpeg', 0.9);
      };
      
      img.onerror = () => {
        setValidationError('Failed to load image from URL. Please check the URL and try again.');
        setIsLoading(false);
      };
      
      img.src = imageUrl;
    } catch (error) {
      setValidationError('Invalid image URL');
      setIsLoading(false);
    }
  };

  // Clear image
  const clearImage = () => {
    updateImage(null, null);
    setImageUrl('');
    setValidationError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  return (
    <div className="space-y-4">
      {/* Input method selector */}
      <div className="flex flex-wrap gap-3 mb-6 p-1 bg-gray-100 rounded-xl">
        <button
          type="button"
          onClick={() => setInputMethod('upload')}
          className={`flex-1 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
            inputMethod === 'upload'
              ? 'bg-white text-blue-600 shadow-md transform scale-105'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          Upload File
        </button>
        <button
          type="button"
          onClick={() => setInputMethod('camera')}
          className={`flex-1 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
            inputMethod === 'camera'
              ? 'bg-white text-blue-600 shadow-md transform scale-105'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Take Photo
        </button>
        <button
          type="button"
          onClick={() => setInputMethod('url')}
          className={`flex-1 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
            inputMethod === 'url'
              ? 'bg-white text-blue-600 shadow-md transform scale-105'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          Image URL
        </button>
      </div>

      {/* Input interface based on selected method */}
      <AnimatePresence mode="wait">
        {inputMethod === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div
              className="border-2 border-dashed border-blue-200 rounded-xl p-10 text-center hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-200 cursor-pointer group bg-gradient-to-br from-blue-50/30 to-indigo-50/30"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <svg
                    className="h-8 w-8 text-white"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div className="text-gray-700">
                  <p className="text-xl font-semibold mb-1">Click to upload an image</p>
                  <p className="text-sm text-gray-500">or drag and drop your file here</p>
                </div>
                <div className="inline-flex items-center px-4 py-2 bg-white/80 rounded-full text-xs text-gray-600 border border-gray-200">
                  <span className="mr-2">📁</span>
                  PNG, JPG, WebP up to 10MB
                </div>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </motion.div>
        )}

        {inputMethod === 'camera' && (
          <motion.div
            key="camera"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div
              className="border-2 border-dashed border-green-200 rounded-xl p-10 text-center hover:border-green-300 hover:bg-green-50/50 transition-all duration-200 cursor-pointer group bg-gradient-to-br from-green-50/30 to-emerald-50/30"
              onClick={() => cameraInputRef.current?.click()}
            >
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <svg
                    className="h-8 w-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <div className="text-gray-700">
                  <p className="text-xl font-semibold mb-1">Take a photo</p>
                  <p className="text-sm text-gray-500">Use your device camera to capture</p>
                </div>
                <div className="inline-flex items-center px-4 py-2 bg-white/80 rounded-full text-xs text-gray-600 border border-gray-200">
                  <span className="mr-2">📱</span>
                  Mobile camera access required
                </div>
              </div>
            </div>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
          </motion.div>
        )}

        {inputMethod === 'url' && (
          <motion.div
            key="url"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="bg-gradient-to-br from-purple-50/30 to-pink-50/30 border-2 border-dashed border-purple-200 rounded-xl p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Load from URL</h3>
                  <p className="text-sm text-gray-500">Paste a direct link to your image</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/product-image.jpg"
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                  onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                />
                <button
                  type="button"
                  onClick={handleUrlSubmit}
                  disabled={!imageUrl.trim() || isLoading}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Loading...
                    </div>
                  ) : (
                    'Load Image'
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading state */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center py-4"
        >
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Processing image...</span>
        </motion.div>
      )}

      {/* Error display */}
      {(validationError || error) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-red-50 border border-red-200 rounded-lg"
        >
          <p className="text-sm text-red-600">{validationError || error}</p>
        </motion.div>
      )}

      {/* Image preview */}
      {imagePreview && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: "backOut" }}
          className="relative mt-6"
        >
          <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl overflow-hidden shadow-lg border border-gray-200/50">
            <img
              src={imagePreview}
              alt="Product preview"
              className="w-full h-64 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
            
            {/* Success indicator */}
            <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-gray-700">Image loaded</span>
            </div>
          </div>
          
          {/* Remove button */}
          <button
            type="button"
            onClick={clearImage}
            className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-110 flex items-center justify-center"
            title="Remove image"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default ImageInput;