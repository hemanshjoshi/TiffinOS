import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'maakhana_cache_';

interface CacheItem<T> {
  value: T;
  timestamp: number;
  expiry: number; // TTL in ms
  version: string | number;
}

export class CacheManager {
  private static instance: CacheManager;

  private constructor() {}

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  /**
   * Set item in cache
   * @param key Unique key
   * @param value Data to store
   * @param ttl Time to live in milliseconds (default: 1 hour)
   * @param version Cache version for invalidation (default: 1)
   */
  async set<T>(key: string, value: T, ttl: number = 3600000, version: string | number = 1): Promise<void> {
    try {
      const item: CacheItem<T> = {
        value,
        timestamp: Date.now(),
        expiry: Date.now() + ttl,
        version,
      };
      await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(item));
    } catch (error) {
      console.error('CacheManager set error:', error);
    }
  }

  /**
   * Get item from cache
   * @param key Unique key
   * @param version Expected version (optional)
   * @returns Cached value or null if expired/invalid version
   */
  async get<T>(key: string, version?: string | number): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(CACHE_PREFIX + key);
      if (jsonValue != null) {
        const item: CacheItem<T> = JSON.parse(jsonValue);
        
        // Check Expiry
        if (Date.now() > item.expiry) {
          await this.remove(key); // Auto-cleanup
          return null;
        }

        // Check Version
        if (version !== undefined && item.version !== version) {
          await this.remove(key); // Auto-cleanup
          return null;
        }

        return item.value;
      }
    } catch (error) {
      console.error('CacheManager get error:', error);
    }
    return null;
  }

  /**
   * Remove specific item
   */
  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(CACHE_PREFIX + key);
    } catch (error) {
      console.error('CacheManager remove error:', error);
    }
  }

  /**
   * Clear entire cache (for logout or major updates)
   */
  async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const appKeys = keys.filter((k) => k.startsWith(CACHE_PREFIX));
      await AsyncStorage.multiRemove(appKeys);
    } catch (error) {
      console.error('CacheManager clear error:', error);
    }
  }

  /**
   * Invalidate cache by prefix (e.g., 'menu_')
   */
  async invalidate(prefix: string): Promise<void> {
    try {
        const keys = await AsyncStorage.getAllKeys();
        const itemsToRemove = keys.filter(k => k.startsWith(CACHE_PREFIX + prefix));
        await AsyncStorage.multiRemove(itemsToRemove);
    } catch (error) {
        console.error('CacheManager invalidate error:', error);
    }
  }
}

export const cacheManager = CacheManager.getInstance();
