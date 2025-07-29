# Components Documentation

## App Container Component

The App Container component is the main component that provides:

### Features

1. **Global State Management**
   - Uses React Context to manage application state
   - Provides state for image, title, prediction, loading, and error states
   - Includes helper functions to update state

2. **Responsive Layout**
   - Mobile-first design with responsive breakpoints
   - Grid layout that adapts from single column on mobile to two columns on desktop
   - Proper spacing and padding for different screen sizes

3. **Component Structure**
   - Header section with app title and description
   - Input section for product information (left column on desktop)
   - Results section for rating prediction (right column on desktop)
   - Footer section with additional information

### State Management

The app context provides the following state and functions:

#### State Properties
- `image`: The uploaded image file
- `imagePreview`: Preview URL for the image
- `title`: Product title text
- `prediction`: AI prediction result
- `isLoading`: Loading state for API calls
- `error`: Error message if any

#### State Functions
- `updateImage(image, preview)`: Update image and preview
- `updateTitle(title)`: Update product title
- `updatePrediction(prediction)`: Update prediction result
- `setLoading(isLoading)`: Set loading state
- `setError(error)`: Set error message
- `resetState()`: Reset all state to initial values

### Usage

```jsx
import { useAppContext } from '../App';

function MyComponent() {
  const { image, title, updateImage, updateTitle } = useAppContext();
  
  // Use state and functions as needed
  return <div>...</div>;
}
```

### Responsive Breakpoints

- Mobile: Default (single column layout)
- Desktop: `lg:` prefix (two column layout)
- Spacing: Responsive padding and margins using Tailwind classes

### Testing

The component includes comprehensive tests for:
- Rendering of all sections
- Context provider functionality
- Responsive layout classes
- Error handling for context usage outside provider