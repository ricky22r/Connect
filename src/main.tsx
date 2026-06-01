import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './dark.css';

// Disable React.StrictMode in production to prevent double-mounting
const RootComponent = process.env.NODE_ENV === 'production' ? App : (
  <StrictMode>
    <App />
  </StrictMode>
);

createRoot(document.getElementById('root')!).render(RootComponent);
