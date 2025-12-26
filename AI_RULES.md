# AI Development Rules

## Tech Stack

- **Frontend Framework**: React with TypeScript
- **Routing**: React Router for navigation
- **Styling**: Tailwind CSS for utility-first styling
- **UI Components**: shadcn/ui library (built on Radix UI primitives)
- **Icons**: lucide-react icon library
- **State Management**: React built-in hooks (useState, useContext, useReducer)
- **HTTP Client**: fetch API or axios for data fetching
- **Build Tool**: Vite for fast development and building
- **Package Management**: npm
- **Code Quality**: ESLint and Prettier for linting and formatting

## Library Usage Rules

### UI Components
- **Primary Choice**: Use components from shadcn/ui whenever possible
- **Custom Components**: Create new components in src/components/ when shadcn/ui doesn't have what you need
- **Styling**: Always use Tailwind CSS classes for styling instead of plain CSS

### Icons
- **Only Library**: Use lucide-react for all icons
- **Import Method**: Import individual icons directly (e.g., `import { Heart } from 'lucide-react'`)

### State Management
- **Local State**: Use React's useState and useReducer hooks
- **Global State**: Use React Context API with useReducer for complex state
- **External Libraries**: Avoid Redux, MobX, or other third-party state management libraries

### Data Fetching
- **Simple Requests**: Use the native fetch API
- **Complex Requests**: Use axios if additional features are needed
- **Data Fetching Hooks**: Use React Query (TanStack Query) only if specifically requested

### Routing
- **Only Library**: Use React Router for all routing needs
- **Route Organization**: Keep routes in src/App.tsx
- **Pages**: Place page components in src/pages/

### Forms
- **Form Handling**: Use React Hook Form for complex forms
- **Validation**: Use Zod for schema validation with React Hook Form

### Date Handling
- **Date Library**: Use date-fns for date manipulation
- **Date Formatting**: Use date-fns instead of native Date methods

### Charts and Data Visualization
- **Charting Library**: Use Recharts for data visualization
- **Complex Visualizations**: Consider Chart.js only when Recharts is insufficient

### Animations
- **Simple Animations**: Use CSS transitions and Tailwind classes
- **Complex Animations**: Use Framer Motion when CSS animations are insufficient

### HTTP Interceptors
- **Interceptors**: Use axios interceptors if using axios
- **Authentication**: Implement auth headers in the data fetching layer

### Testing
- **Unit Testing**: Use Jest with React Testing Library
- **E2E Testing**: Use Cypress for end-to-end tests
- **Mocking**: Use Mock Service Worker (MSW) for API mocking

### Code Splitting
- **Dynamic Imports**: Use React.lazy and Suspense for code splitting
- **Bundle Analysis**: Use bundle analyzer tools to monitor bundle size

## Component Development Rules

- **File Structure**: Each component must be in its own file
- **Component Location**: Place components in src/components/
- **Page Components**: Place page components in src/pages/
- **Component Size**: Keep components under 100 lines of code when possible
- **Reusability**: Create reusable components for common UI patterns
- **Props**: Define clear prop interfaces for TypeScript components
- **Accessibility**: Ensure all components follow accessibility best practices

## File Naming Conventions

- **Component Files**: Use PascalCase (e.g., Button.tsx)
- **Page Files**: Use PascalCase (e.g., Dashboard.tsx)
- **Utility Files**: Use camelCase (e.g., formatDate.ts)
- **Hook Files**: Prefix with use (e.g., useAuth.ts)

## Code Quality Standards

- **Type Safety**: Use TypeScript for all components and utilities
- **Error Handling**: Implement proper error boundaries for UI errors
- **Performance**: Optimize components with React.memo, useCallback, and useMemo when needed
- **Responsive Design**: Ensure all components work on mobile, tablet, and desktop
- **Code Comments**: Add comments for complex logic or business rules