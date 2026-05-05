import { useState, useEffect, useCallback } from 'react';
import { affiliateLinkService } from '../services/affiliateLinkService';
import { AffiliateLink, AffiliateLinkStats } from '../types';

export const useAffiliateLinks = () => {
  const [links, setLinks] = useState<AffiliateLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadLinks = async () => {
      try {
        setLoading(true);
        const data = await affiliateLinkService.getLinks();
        setLinks(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadLinks();
  }, []);

  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);
    affiliateLinkService.getLinks()
      .then(setLinks)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return {
    links,
    loading,
    error,
    refetch
  };
};

export const useAffiliateLinkStats = () => {
  const [stats, setStats] = useState<AffiliateLinkStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const data = await affiliateLinkService.getStats();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);
    affiliateLinkService.getStats()
      .then(setStats)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return {
    stats,
    loading,
    error,
    refetch
  };
};

export const useAffiliateLink = (id: string) => {
  const [link, setLink] = useState<AffiliateLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadLink = async () => {
      try {
        setLoading(true);
        const data = await affiliateLinkService.getLinkById(id);
        setLink(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadLink();
    }
  }, [id]);

  const updateLink = useCallback(async (updates: Partial<AffiliateLink>) => {
    try {
      if (!id) throw new Error('Link ID is required');
      const updated = await affiliateLinkService.updateLink(id, updates);
      setLink(updated);
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }
  }, [id]);

  const toggleMonitoring = useCallback(async (monitored: boolean) => {
    try {
      if (!id) throw new Error('Link ID is required');
      await affiliateLinkService.toggleMonitoring(id, monitored);
      if (link) {
        setLink({ ...link, monitored });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }
  }, [id, link]);

  return {
    link,
    loading,
    error,
    updateLink,
    toggleMonitoring
  };
};
