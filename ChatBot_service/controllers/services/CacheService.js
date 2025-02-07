class CacheService {
    static cache = new Map();
    static cacheTimeout = new Map();

    /**
     * Get value from cache
     * @param {string} key - Cache key
     * @returns {any} Cached value or null
     */
    static async get(key) {
        try {
            // Check if key exists and not expired
            if (this.cache.has(key)) {
                const timeout = this.cacheTimeout.get(key);
                if (timeout && timeout < Date.now()) {
                    // Cache expired, clean up
                    this.delete(key);
                    return null;
                }
                return this.cache.get(key);
            }
            return null;
        } catch (error) {
            console.error('Cache get error:', error);
            return null;
        }
    }

    /**
     * Set value in cache
     * @param {string} key - Cache key
     * @param {any} value - Value to cache
     * @param {number} ttl - Time to live in seconds
     * @returns {boolean} Success status
     */
    static async set(key, value, ttl = 3600) {
        try {
            this.cache.set(key, value);
            
            // Set expiration
            if (ttl > 0) {
                const expiryTime = Date.now() + (ttl * 1000);
                this.cacheTimeout.set(key, expiryTime);
            }
            
            return true;
        } catch (error) {
            console.error('Cache set error:', error);
            return false;
        }
    }

    /**
     * Delete value from cache
     * @param {string} key - Cache key
     * @returns {boolean} Success status
     */
    static async delete(key) {
        try {
            this.cache.delete(key);
            this.cacheTimeout.delete(key);
            return true;
        } catch (error) {
            console.error('Cache delete error:', error);
            return false;
        }
    }

    /**
     * Clear all cache
     * @returns {boolean} Success status
     */
    static async clear() {
        try {
            this.cache.clear();
            this.cacheTimeout.clear();
            return true;
        } catch (error) {
            console.error('Cache clear error:', error);
            return false;
        }
    }

    /**
     * Get multiple values from cache
     * @param {string[]} keys - Array of cache keys
     * @returns {any[]} Array of cached values
     */
    static async mget(keys) {
        try {
            return keys.map(key => this.cache.get(key) || null);
        } catch (error) {
            console.error('Cache mget error:', error);
            return keys.map(() => null);
        }
    }

    /**
     * Check if key exists in cache
     * @param {string} key - Cache key
     * @returns {boolean} Whether key exists and not expired
     */
    static async exists(key) {
        try {
            if (!this.cache.has(key)) {
                return false;
            }

            const timeout = this.cacheTimeout.get(key);
            if (timeout && timeout < Date.now()) {
                this.delete(key);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Cache exists error:', error);
            return false;
        }
    }

    /**
     * Get remaining TTL for a key in seconds
     * @param {string} key - Cache key
     * @returns {number} TTL in seconds or -1 if expired/non-existent
     */
    static async getTTL(key) {
        try {
            const timeout = this.cacheTimeout.get(key);
            if (!timeout) return -1;

            const ttl = Math.ceil((timeout - Date.now()) / 1000);
            return ttl > 0 ? ttl : -1;
        } catch (error) {
            console.error('Cache getTTL error:', error);
            return -1;
        }
    }
}

module.exports = CacheService;
