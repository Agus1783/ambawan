import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/style.css';
// import App from './MockupApp.tsx';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
