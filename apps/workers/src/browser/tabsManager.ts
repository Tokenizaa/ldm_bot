import { BrowserConfig } from './browserConfig';
import ChromeConnector from './chromeConnector';

export interface TabInfo {
  id: string;
  title: string;
  url: string;
  type: 'page' | 'background' | 'service_worker' | 'other';
  isActive: boolean;
  lastActivity: Date;
  domain: string;
}

export class TabsManager {
  private static instance: TabsManager;
  private connector: ChromeConnector;
  private tabs: Map<string, TabInfo> = new Map();
  private lastCleanup: Date = new Date();

  private constructor() {
    this.connector = ChromeConnector.getInstance();
  }

  static getInstance(): TabsManager {
    if (!TabsManager.instance) {
      TabsManager.instance = new TabsManager();
    }
    return TabsManager.instance;
  }

  async refreshTabs(): Promise<TabInfo[]> {
    const rawTabs = await this.connector.getTabs();
    this.tabs.clear();

    for (const rawTab of rawTabs) {
      const tabInfo: TabInfo = {
        id: rawTab.id,
        title: rawTab.title || 'Sem título',
        url: rawTab.url || '',
        type: this.detectTabType(rawTab),
        isActive: rawTab.active || false,
        lastActivity: new Date(),
        domain: this.extractDomain(rawTab.url)
      };

      this.tabs.set(tabInfo.id, tabInfo);
    }

    return Array.from(this.tabs.values());
  }

  async closeTab(tabId: string): Promise<boolean> {
    try {
      await this.connector.closeTab(tabId);
      this.tabs.delete(tabId);
      return true;
    } catch {
      return false;
    }
  }

  async focusTab(tabId: string): Promise<boolean> {
    try {
      await this.connector.activateTab(tabId);

      this.tabs.forEach(tab => {
        tab.isActive = tab.id === tabId;
        if (tab.isActive) tab.lastActivity = new Date();
      });

      return true;
    } catch {
      return false;
    }
  }

  async findReusableTab(url: string, domain?: string): Promise<TabInfo | null> {
    await this.refreshTabs();
    const targetDomain = domain || this.extractDomain(url);

    const existingTab = Array.from(this.tabs.values()).find(tab =>
      tab.domain === targetDomain &&
      tab.type === 'page' &&
      !tab.url.includes('/login')
    );

    return existingTab || null;
  }

  async getOrCreateTab(url: string, preferReuse: boolean = true): Promise<TabInfo> {
    const domain = this.extractDomain(url);

    if (preferReuse) {
      const existingTab = await this.findReusableTab(url, domain);
      if (existingTab) {
        await this.focusTab(existingTab.id);
        return existingTab;
      }
    }

    // Create by opening new page via context; caller may do this with Playwright directly.
    // Here we just refresh and return a best-effort stub entry.
    await this.refreshTabs();
    return { id: 'new', title: 'New Tab', url, type: 'page', isActive: true, lastActivity: new Date(), domain };
  }

  async cleanupTabs(): Promise<number> {
    await this.refreshTabs();
    const tabsToClose: string[] = [];
    const now = new Date();

    this.tabs.forEach((tab, id) => {
      if (tab.type !== 'page') {
        tabsToClose.push(id);
        return;
      }

      const inactiveMinutes = (now.getTime() - tab.lastActivity.getTime()) / (1000 * 60);
      if (inactiveMinutes > 30 && !tab.isActive) tabsToClose.push(id);
      if (tab.url.includes('/login') && !tab.isActive) tabsToClose.push(id);
    });

    const pageTabs = Array.from(this.tabs.values()).filter(tab => tab.type === 'page');
    if (pageTabs.length > BrowserConfig.MAX_TABS) {
      const excessTabs = pageTabs
        .filter(tab => !tab.isActive)
        .sort((a, b) => a.lastActivity.getTime() - b.lastActivity.getTime())
        .slice(0, pageTabs.length - BrowserConfig.MAX_TABS);

      excessTabs.forEach(tab => {
        if (!tabsToClose.includes(tab.id)) tabsToClose.push(tab.id);
      });
    }

    let closedCount = 0;
    for (const tabId of tabsToClose) {
      if (await this.closeTab(tabId)) closedCount++;
    }

    this.lastCleanup = now;
    return closedCount;
  }

  async autoCleanupIfNeeded(): Promise<void> {
    const now = new Date();
    const minutesSinceCleanup = (now.getTime() - this.lastCleanup.getTime()) / (1000 * 60);
    const pageTabs = Array.from(this.tabs.values()).filter(tab => tab.type === 'page');

    if (pageTabs.length >= BrowserConfig.TAB_CLEANUP_THRESHOLD || minutesSinceCleanup > 60) {
      await this.cleanupTabs();
    }
  }

  private detectTabType(rawTab: any): 'page' | 'background' | 'service_worker' | 'other' {
    const url = rawTab.url || '';
    if (url.startsWith('chrome-extension://')) return url.includes('background') ? 'background' : 'other';
    if (url.includes('service-worker')) return 'service_worker';
    if (url.startsWith('http://') || url.startsWith('https://')) return 'page';
    return 'other';
  }

  private extractDomain(url: string): string {
    try {
      if (!url || url.startsWith('chrome://') || url.startsWith('chrome-extension://')) return 'chrome';
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return 'unknown';
    }
  }
}

export default TabsManager;

