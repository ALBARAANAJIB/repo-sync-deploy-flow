
/**
 * Simple API manager for handling secure operations
 */
class SecureApiManager {
  private static instance: SecureApiManager;
  private cache = new Map<string, any>();
  private rateLimits = new Map<string, number[]>();

  private constructor() {}

  static getInstance(): SecureApiManager {
    if (!SecureApiManager.instance) {
      SecureApiManager.instance = new SecureApiManager();
    }
    return SecureApiManager.instance;
  }

  /**
   * Simple input sanitization
   */
  sanitizeInput(input: string): string {
    if (typeof input !== 'string') return '';
    return input.trim().replace(/[<>]/g, '');
  }

  /**
   * Basic YouTube URL validation
   */
  validateYouTubeUrl(url: string): boolean {
    const youtubePattern = /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)/;
    return youtubePattern.test(url);
  }

  /**
   * Simple rate limiting
   */
  checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const requests = this.rateLimits.get(key) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < windowMs);
    
    if (validRequests.length >= maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.rateLimits.set(key, validRequests);
    return true;
  }

  /**
   * Simple caching
   */
  getCachedData(key: string): any {
    return this.cache.get(key);
  }

  setCachedData(key: string, data: any): void {
    this.cache.set(key, data);
    // Auto-expire after 5 minutes
    setTimeout(() => this.cache.delete(key), 5 * 60 * 1000);
  }
}

export default SecureApiManager;
