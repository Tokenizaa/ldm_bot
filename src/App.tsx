import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { Dashboard } from './pages/Dashboard';
import { ProductList } from './pages/ProductList';
import { ProductDetails } from './pages/ProductDetails';
import { Automation } from './pages/Automation';
import { CrawlerEngine } from './pages/CrawlerEngine';
import { PlaywrightWorker } from './pages/PlaywrightWorker';
import { AffiliateWorker } from './pages/AffiliateWorker';

// Placeholder for other pages
const Placeholder = ({ title }: { title: string }) => (
  <div className="p-8">
    <h2 className="text-3xl font-bold text-white mb-4">{title}</h2>
    <div className="premium-card p-12 text-center border-dashed">
      <p className="text-gray-500 italic">Módulo em desenvolvimento técnico...</p>
    </div>
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex bg-bg min-h-screen selection:bg-accent/30 selection:text-accent">
        <Sidebar />
        
        <main className="flex-1 flex flex-col min-w-0">
          <Topbar />
          
          <div className="flex-1 overflow-hidden">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/produtos" element={<ProductList />} />
              <Route path="/produtos/:id" element={<ProductDetails />} />
              <Route path="/automacao" element={<Automation />} />
              <Route path="/crawler" element={<CrawlerEngine />} />
              <Route path="/worker-docs" element={<PlaywrightWorker />} />
              <Route path="/affiliate-engine" element={<AffiliateWorker />} />
              <Route path="/ofertas" element={<Placeholder title="Ofertas Ativas" />} />
              <Route path="/relatorios" element={<Placeholder title="Relatórios Analíticos" />} />
              <Route path="/configuracoes" element={<Placeholder title="Configurações do Sistema" />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}
