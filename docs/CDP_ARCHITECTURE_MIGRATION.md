# CDP Architecture Migration - ForgeDeals

## Overview

Migration from Playwright's `launchPersistentContext()` to Chrome DevTools Protocol (CDP) architecture using `connectOverCDP()` for enhanced stability and real browser control.

## Architecture Change

### Before (Old Architecture)
```txt
Playwright launches temporary Chrome
↓
Creates ephemeral profile
↓
Manages browser lifecycle
↓
Conflicts with real Chrome sessions
```

### After (New Architecture)
```txt
Windows Chrome real (manual start)
↓
--remote-debugging-port=9222
↓
Playwright connects via CDP
↓
Controls existing browser
↓
Uses real authenticated sessions
```

## Key Benefits

- **Real Sessions**: Uses actual Windows Chrome with existing logins
- **No Profile Conflicts**: Eliminates Chrome profile management issues
- **Enhanced Stability**: CDP connection is more reliable than launching browsers
- **Session Persistence**: Maintains real authentication cookies
- **Natural Fingerprint**: Uses real browser fingerprint and extensions
- **Resource Efficiency**: Reuses existing browser instance

## Implementation Structure

### Core Modules (`src/modules/browser/`)

#### 1. ChromeConnector
- **Purpose**: CDP connection management
- **Key Features**:
  - Connect to `localhost:9222`
  - Auto-reconnection logic
  - Connection health monitoring
  - Tab management integration

```typescript
const connector = ChromeConnector.getInstance();
const connection = await connector.getConnection();
```

#### 2. BrowserHealth
- **Purpose**: System health monitoring
- **Key Features**:
  - Chrome process monitoring
  - CDP availability checks
  - Memory usage tracking
  - Automatic recovery attempts

```typescript
const health = BrowserHealth.getInstance();
await health.startMonitoring();
await health.waitForHealthy();
```

#### 3. SessionMonitor
- **Purpose**: Authentication session validation
- **Key Features**:
  - Facebook login validation
  - Loja do Mecânico login validation
  - Cookie counting and verification
  - Session expiry detection

```typescript
const monitor = SessionMonitor.getInstance();
await monitor.validateAllSessions();
```

#### 4. TabsManager
- **Purpose**: Intelligent tab management
- **Key Features**:
  - Tab reuse optimization
  - Automatic cleanup
  - Domain-based grouping
  - Focus management

```typescript
const tabs = TabsManager.getInstance();
const tab = await tabs.getOrCreateTab('https://example.com', true);
```

#### 5. CDPManager
- **Purpose**: Advanced CDP operations
- **Key Features**:
  - Direct WebSocket commands
  - Runtime evaluation
  - Screenshot capture
  - Memory/CPU monitoring

```typescript
const cdp = CDPManager.getInstance();
const screenshot = await cdp.getScreenshot(targetId);
```

#### 6. BrowserConfig
- **Purpose**: Centralized configuration
- **Key Features**:
  - CDP settings
  - Timeouts and limits
  - User agents and headers
  - Health check intervals

## Migration Steps

### 1. Chrome Setup
```bash
# Start Chrome with remote debugging
chrome.exe --remote-debugging-port=9222 --profile-directory="Profile 1"
```

### 2. Code Migration
```typescript
// OLD
const context = await chromium.launchPersistentContext(userDataDir, options);
const page = await context.newPage();

// NEW
const connector = ChromeConnector.getInstance();
const connection = await connector.getConnection();
const page = await connection.context.newPage();
```

### 3. Session Validation
```typescript
// Add session validation before operations
await sessionMonitor.validateAllSessions();
const status = sessionMonitor.getStatus();
if (!status.lojaMecanico.isLoggedIn) {
  await login();
}
```

## Usage Examples

### Basic Connection
```typescript
import { ChromeConnector, BrowserHealth } from '../modules/browser';

async function initializeBrowser() {
  const connector = ChromeConnector.getInstance();
  const health = BrowserHealth.getInstance();
  
  // Start health monitoring
  await health.startMonitoring();
  
  // Wait for healthy state
  await health.waitForHealthy();
  
  // Get connection
  const connection = await connector.getConnection();
  return connection;
}
```

### Crawler Integration
```typescript
export class LojaDoMecanicoCrawler {
  private connector = ChromeConnector.getInstance();
  private sessionMonitor = SessionMonitor.getInstance();
  private tabsManager = TabsManager.getInstance();
  
  async initialize() {
    // Connect to existing Chrome
    const connection = await this.connector.getConnection();
    
    // Validate sessions
    await this.sessionMonitor.validateAllSessions();
    
    // Get or reuse tab
    const tab = await this.tabsManager.getOrCreateTab(
      'https://www.lojadomecanico.com.br',
      true
    );
    
    this.page = await connection.context.newPage();
  }
}
```

### React Integration
```typescript
import { useBrowser } from '../hooks/useBrowser';

function BrowserControl() {
  const { status, actions } = useBrowser();
  
  return (
    <div>
      <div>Status: {status.isConnected ? 'Connected' : 'Disconnected'}</div>
      <button onClick={actions.connect}>Connect</button>
      <button onClick={actions.validateSessions}>Validate Sessions</button>
    </div>
  );
}
```

## Dashboard Features

The `BrowserDashboard` component provides:

- **Connection Status**: Real-time CDP connection monitoring
- **Health Monitoring**: Chrome process and resource tracking
- **Session Validation**: Facebook and Loja do Mecânico login status
- **Tabs Management**: View and control browser tabs
- **System Metrics**: Memory usage, uptime, tab counts

## Configuration

### Environment Setup
```typescript
// BrowserConfig settings
export const BrowserConfig = {
  CDP_URL: 'http://localhost:9222',
  CONNECTION_TIMEOUT: 10000,
  PAGE_LOAD_TIMEOUT: 30000,
  HEALTH_CHECK_INTERVAL: 5000,
  MAX_TABS: 10,
  // ... more settings
};
```

### Chrome Profile Recommendation
- Use **Profile 1** for Facebook automation
- Use **Profile 2** for Loja do Mecânico
- Keep profiles separate to avoid conflicts

## Troubleshooting

### Common Issues

1. **Chrome not responding on port 9222**
   - Ensure Chrome started with `--remote-debugging-port=9222`
   - Check if another process is using the port

2. **Session validation failing**
   - Verify manual login in Chrome first
   - Check cookie permissions
   - Ensure correct profile is being used

3. **Tab management issues**
   - Reduce tab count with cleanup
   - Check for zombie tabs
   - Verify domain matching logic

### Debug Commands
```typescript
// Check connection
await connector.getConnection();

// Validate health
await health.performHealthCheck();

// List tabs
const tabs = await tabsManager.refreshTabs();

// Check sessions
await sessionMonitor.validateAllSessions();
```

## Performance Considerations

- **Memory**: Monitor Chrome memory usage with health checks
- **Tabs**: Implement automatic cleanup to prevent tab explosion
- **Connections**: Reuse connections instead of creating new ones
- **Sessions**: Cache session status to avoid repeated validation

## Security Notes

- CDP exposes browser internals - secure the debugging port
- Use profile isolation for different automation tasks
- Monitor for unauthorized CDP connections
- Validate session states before sensitive operations

## Future Enhancements

- **Multi-browser Support**: Firefox, Edge CDP connections
- **Remote Debugging**: Connect to remote Chrome instances
- **Session Backup**: Export/import session states
- **Advanced Metrics**: Performance profiling and optimization

## Migration Checklist

- [ ] Start Chrome with remote debugging enabled
- [ ] Update all crawler implementations
- [ ] Replace `launchPersistentContext` calls
- [ ] Add session validation
- [ ] Implement tab management
- [ ] Add health monitoring
- [ ] Create dashboard integration
- [ ] Test all automation flows
- [ ] Update documentation
- [ ] Train team on new architecture

This migration establishes a robust foundation for browser automation with enhanced stability and real-world session management.
