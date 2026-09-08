import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { Dashboard } from './pages/Dashboard';
import { FacebookControlCenter } from './pages/FacebookControlCenter';
import { Analytics } from './pages/Analytics';
import { OllamaCenter } from './pages/OllamaCenter';
import { ContentPlanner } from './pages/ContentPlanner';
import { ProductList } from './pages/ProductList';
import { Settings } from './pages/Settings';
import { ConfigProvider } from './context/ConfigContext';

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
    <ConfigProvider>
      <BrowserRouter>
        <div className="flex bg-bg min-h-screen selection:bg-accent/30 selection:text-accent">
          <Sidebar />
          
          <main className="flex-1 flex flex-col min-w-0">
            <Topbar />
            
            <div className="flex-1 overflow-hidden">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/facebook" element={<FacebookControlCenter />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/ollama" element={<OllamaCenter />} />
                <Route path="/planner" element={<ContentPlanner />} />
                <Route path="/products" element={<ProductList />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </main>
        </div>
      </BrowserRouter>
    </ConfigProvider>
  );
}
