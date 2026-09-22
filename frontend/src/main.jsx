/**
 * main.jsx — React Application Entry Point
 *
 * Bootstraps the React application by mounting the root <App /> component
 * into the #root DOM element defined in index.html.
 *
 * StrictMode enables additional runtime warnings and checks in development:
 *   - Detects unexpected side effects
 *   - Warns about deprecated API usage
 *   - Double-invokes lifecycle methods/renders to surface impure functions
 *
 * StrictMode has NO effect in production builds.
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'   // Global base styles (Tailwind directives or custom resets)
import App from './App.jsx'

// Mount the React tree into the #root element in index.html
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
