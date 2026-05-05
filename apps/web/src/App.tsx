import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

// Transitional: reuse the existing UI pages while we purge Node-only imports from them.
import { Dashboard } from '../../../src/pages/Dashboard';
import { ProductList } from '../../../src/pages/ProductList';
import { ProductDetails } from '../../../src/pages/ProductDetails';
import { AffiliateLinkManager } from '../../../src/pages/AffiliateLinkManager';
import { Sidebar } from '../../../src/components/Sidebar';
import { Topbar } from '../../../src/components/Topbar';

const Placeholder = ({ title }: { title: string }) => (
  <div className="p-8">
    <h2 className="text-3xl font-bold text-white mb-4">{title}</h2>
    <div className="premium-card p-12 text-center border-dashed">
      <p className="text-gray-500 italic">Módulo migrando para API/Workers...</p>
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
              <Route path="/affiliate-manager" element={<AffiliateLinkManager />} />
              <Route path="/crawler" element={<Placeholder title="Crawler Engine" />} />
              <Route path="/social-control-center" element={<Placeholder title="Social Control Center" />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}

