import React, { useState, useEffect } from 'react';
import { useBrowser, useBrowserHealth, useSessionMonitor, useTabsManager } from '../hooks/useBrowser';
import { BrowserConfig } from '../modules/browser/browserConfig';

interface BrowserDashboardProps {
  className?: string;
}

export const BrowserDashboard: React.FC<BrowserDashboardProps> = ({ className = '' }) => {
  const { status, actions, loading: browserLoading } = useBrowser();
  const healthStatus = useBrowserHealth();
  const { status: sessionStatus, validateSessions } = useSessionMonitor();
  const { tabsCount, refreshTabs, cleanupTabs, getTabsSummary } = useTabsManager();

  const [expandedSection, setExpandedSection] = useState<string>('overview');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        actions.updateStatus();
        refreshTabs();
      }, BrowserConfig.HEALTH_CHECK_INTERVAL);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, actions, refreshTabs]);

  const formatUptime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m ${seconds % 60}s`;
  };

  const formatMemory = (bytes: number): string => {
    if (bytes === 0) return '0 MB';
    const mb = Math.round(bytes / 1024 / 1024);
    return `${mb} MB`;
  };

  const getStatusColor = (condition: boolean): string => {
    return condition ? 'text-green-600' : 'text-red-600';
  };

  const getStatusIcon = (condition: boolean): string => {
    return condition ? '✅' : '❌';
  };

  return (
    <div className={`browser-dashboard p-6 bg-white rounded-lg shadow-lg ${className}`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">ForgeDeals Browser Control</h2>
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-600">Auto Refresh</span>
          </label>
          <button
            onClick={actions.updateStatus}
            disabled={browserLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {browserLoading ? 'Updating...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Overview Section */}
      <div className="mb-6">
        <div 
          className="flex justify-between items-center cursor-pointer p-3 bg-gray-50 rounded"
          onClick={() => setExpandedSection(expandedSection === 'overview' ? '' : 'overview')}
        >
          <h3 className="text-lg font-semibold">📊 Overview</h3>
          <span className="text-gray-500">{expandedSection === 'overview' ? '▼' : '▶'}</span>
        </div>
        
        {expandedSection === 'overview' && (
          <div className="p-4 bg-gray-50 rounded mt-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className={`text-2xl ${getStatusColor(status.isConnected)}`}>
                  {getStatusIcon(status.isConnected)}
                </div>
                <div className="text-sm text-gray-600">Chrome Connected</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl ${getStatusColor(status.isHealthy)}`}>
                  {getStatusIcon(status.isHealthy)}
                </div>
                <div className="text-sm text-gray-600">CDP Available</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl ${getStatusColor(status.sessionsValid)}`}>
                  {getStatusIcon(status.sessionsValid)}
                </div>
                <div className="text-sm text-gray-600">Sessions Valid</div>
              </div>
              <div className="text-center">
                <div className="text-2xl text-blue-600">{tabsCount}</div>
                <div className="text-sm text-gray-600">Open Tabs</div>
              </div>
            </div>
            
            {status.issues.length > 0 && (
              <div className="mt-4 p-3 bg-red-50 rounded">
                <h4 className="font-semibold text-red-800 mb-2">Issues:</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  {status.issues.map((issue, index) => (
                    <li key={index}>• {issue}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Connection Section */}
      <div className="mb-6">
        <div 
          className="flex justify-between items-center cursor-pointer p-3 bg-gray-50 rounded"
          onClick={() => setExpandedSection(expandedSection === 'connection' ? '' : 'connection')}
        >
          <h3 className="text-lg font-semibold">🔌 Connection</h3>
          <span className="text-gray-500">{expandedSection === 'connection' ? '▼' : '▶'}</span>
        </div>
        
        {expandedSection === 'connection' && (
          <div className="p-4 bg-gray-50 rounded mt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Status</h4>
                <div className="space-y-2 text-sm">
                  <div>Chrome: {getStatusIcon(status.isConnected)} {status.isConnected ? 'Connected' : 'Disconnected'}</div>
                  <div>CDP Port: {BrowserConfig.CDP_PORT}</div>
                  <div>Uptime: {formatUptime(status.uptime)}</div>
                  <div>Memory: {formatMemory(status.memoryUsage)}</div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Actions</h4>
                <div className="space-y-2">
                  <button
                    onClick={actions.connect}
                    disabled={status.isConnected}
                    className="w-full px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 text-sm"
                  >
                    Connect Chrome
                  </button>
                  <button
                    onClick={actions.disconnect}
                    disabled={!status.isConnected}
                    className="w-full px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 text-sm"
                  >
                    Disconnect
                  </button>
                  <button
                    onClick={actions.forceReconnect}
                    disabled={browserLoading}
                    className="w-full px-3 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50 text-sm"
                  >
                    Force Reconnect
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sessions Section */}
      <div className="mb-6">
        <div 
          className="flex justify-between items-center cursor-pointer p-3 bg-gray-50 rounded"
          onClick={() => setExpandedSection(expandedSection === 'sessions' ? '' : 'sessions')}
        >
          <h3 className="text-lg font-semibold">🔐 Sessions</h3>
          <span className="text-gray-500">{expandedSection === 'sessions' ? '▼' : '▶'}</span>
        </div>
        
        {expandedSection === 'sessions' && (
          <div className="p-4 bg-gray-50 rounded mt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Facebook</h4>
                <div className="space-y-1 text-sm">
                  <div className={getStatusColor(sessionStatus.facebook.isLoggedIn)}>
                    {getStatusIcon(sessionStatus.facebook.isLoggedIn)} {sessionStatus.facebook.isLoggedIn ? 'Logged In' : 'Not Logged'}
                  </div>
                  <div>Username: {sessionStatus.facebook.username || 'N/A'}</div>
                  <div>Cookies: {sessionStatus.facebook.cookiesCount}</div>
                  <div>Last Check: {new Date(sessionStatus.facebook.lastCheck).toLocaleTimeString()}</div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Loja do Mecânico</h4>
                <div className="space-y-1 text-sm">
                  <div className={getStatusColor(sessionStatus.lojaMecanico.isLoggedIn)}>
                    {getStatusIcon(sessionStatus.lojaMecanico.isLoggedIn)} {sessionStatus.lojaMecanico.isLoggedIn ? 'Logged In' : 'Not Logged'}
                  </div>
                  <div>Username: {sessionStatus.lojaMecanico.username || 'N/A'}</div>
                  <div>Cookies: {sessionStatus.lojaMecanico.cookiesCount}</div>
                  <div>Last Check: {new Date(sessionStatus.lojaMecanico.lastCheck).toLocaleTimeString()}</div>
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <button
                onClick={validateSessions}
                disabled={browserLoading}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                Validate Sessions
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabs Section */}
      <div className="mb-6">
        <div 
          className="flex justify-between items-center cursor-pointer p-3 bg-gray-50 rounded"
          onClick={() => setExpandedSection(expandedSection === 'tabs' ? '' : 'tabs')}
        >
          <h3 className="text-lg font-semibold">📑 Tabs Management</h3>
          <span className="text-gray-500">{expandedSection === 'tabs' ? '▼' : '▶'}</span>
        </div>
        
        {expandedSection === 'tabs' && (
          <div className="p-4 bg-gray-50 rounded mt-2">
            <div className="mb-4">
              <h4 className="font-semibold mb-2">Summary</h4>
              <div className="text-sm text-gray-600">{getTabsSummary()}</div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Actions</h4>
                <div className="space-y-2">
                  <button
                    onClick={refreshTabs}
                    disabled={browserLoading}
                    className="w-full px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 text-sm"
                  >
                    Refresh Tabs
                  </button>
                  <button
                    onClick={cleanupTabs}
                    disabled={browserLoading}
                    className="w-full px-3 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50 text-sm"
                  >
                    Cleanup Tabs
                  </button>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Quick Open</h4>
                <div className="space-y-2">
                  <button
                    onClick={() => actions.openTab('https://www.facebook.com')}
                    className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                  >
                    Open Facebook
                  </button>
                  <button
                    onClick={() => actions.openTab('https://www.lojadomecanico.com.br')}
                    className="w-full px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm"
                  >
                    Open Loja do Mecânico
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Health Section */}
      <div className="mb-6">
        <div 
          className="flex justify-between items-center cursor-pointer p-3 bg-gray-50 rounded"
          onClick={() => setExpandedSection(expandedSection === 'health' ? '' : 'health')}
        >
          <h3 className="text-lg font-semibold">🏥 Health Monitor</h3>
          <span className="text-gray-500">{expandedSection === 'health' ? '▼' : '▶'}</span>
        </div>
        
        {expandedSection === 'health' && (
          <div className="p-4 bg-gray-50 rounded mt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">System Health</h4>
                <div className="space-y-1 text-sm">
                  <div className={getStatusColor(healthStatus.isChromeRunning)}>
                    {getStatusIcon(healthStatus.isChromeRunning)} Chrome Process
                  </div>
                  <div className={getStatusColor(healthStatus.isCDPAvailable)}>
                    {getStatusIcon(healthStatus.isCDPAvailable)} CDP Protocol
                  </div>
                  <div className={getStatusColor(healthStatus.isConnected)}>
                    {getStatusIcon(healthStatus.isConnected)} Playwright Connection
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Metrics</h4>
                <div className="space-y-1 text-sm">
                  <div>Open Tabs: {healthStatus.tabsCount}</div>
                  <div>Memory Usage: {formatMemory(healthStatus.memoryUsage)}</div>
                  <div>Uptime: {formatUptime(healthStatus.uptime)}</div>
                  <div>Last Check: {new Date(healthStatus.lastCheck).toLocaleTimeString()}</div>
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <button
                onClick={actions.waitForHealthy}
                disabled={browserLoading}
                className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
              >
                Wait for Healthy
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Last Update */}
      <div className="text-center text-sm text-gray-500">
        Last updated: {new Date(status.lastCheck).toLocaleString()}
      </div>
    </div>
  );
};

export default BrowserDashboard;
