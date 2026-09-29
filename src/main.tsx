import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { getCatalog } from './services/productService';
import './index.css';

// Começa a buscar cardápio e configurações da loja antes da primeira renderização.
void getCatalog();

const root = document.getElementById('root');
if (!root) throw new Error('Elemento #root não encontrado no index.html');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
