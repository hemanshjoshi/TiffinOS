import { useState, useEffect, useCallback, useRef } from 'react';
import { cacheManager } from '../utils/cacheManager';

interface UseCachedDataOptions {
  ttl?: number; // Time to live in ms (default 1 hour)
  version?: string | number; // Version for invalidation
  enabled?: boolean; // Whether to run the query
  backgroundRefresh?: boolean; // If true, fetches fresh data even if cache hits (SWR pattern)
}

interface UseCachedDataResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  isCached: boolean;
}

export function useCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: UseCachedDataOptions = {}
): UseCachedDataResult<T> {
  const { 
    ttl = 3600000, 
    version = 1, 
    enabled = true,
    backgroundRefresh = false 
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isCached, setIsCached] = useState<boolean>(false);
  
  // Ref to store fetcher to avoid infinite loop if user passes inline function
  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      let cachedData = null;
      
      // 1. Try to get from cache first (if not forcing refresh)
      if (!forceRefresh) {
        cachedData = await cacheManager.get<T>(key, version);
        if (cachedData) {
          setData(cachedData);
          setIsCached(true);
          setLoading(false);
          
          // If SWR is not enabled, we are done
          if (!backgroundRefresh) return;
        }
      }

      // 2. Fetch from API (if no cache, forced, or background refresh)
      const freshData = await fetcherRef.current();
      
      // 3. Update State
      setData(freshData);
      setIsCached(false); // It's fresh now

      // 4. Update Cache
      await cacheManager.set(key, freshData, ttl, version);

    } catch (err) {
      console.error('useCachedData error:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      // Fallback: If fetch fails but we have cache (even expired if we implemented that logic, but here cacheManager returns null if expired)
      // Actually cacheManager removes expired items. 
      // If we wanted robust offline support, we might want cacheManager to return expired items with a flag.
      // But for now, we rely on 'data' state which might already have cached data (from step 1).
      // If step 1 succeeded, 'data' is set. Step 2 fails -> 'error' set. 'data' remains. 
      // UI can show stale data + error indicator.
    } finally {
      setLoading(false);
    }
  }, [key, ttl, version, enabled, backgroundRefresh]); // Removed fetcher from deps

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { 
    data, 
    loading, 
    error, 
    refetch: () => fetchData(true), 
    isCached 
  };
}
