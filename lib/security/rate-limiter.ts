/**
 * Rate limiting and security measures for customer-facing APIs
 */

interface RateLimitRule {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  keyGenerator?: (request: any) => string
  onLimitReached?: (request: any) => void
}

interface RateLimitEntry {
  count: number
  resetTime: number
  firstRequest: number
}

interface SecurityConfig {
  enableRateLimit: boolean
  enableIPBlocking: boolean
  enableUserAgentValidation: boolean
  maxRequestSize: number
  allowedOrigins: string[]
}

export class RateLimiter {
  private static store: Map<string, RateLimitEntry> = new Map()
  private static blockedIPs: Set<string> = new Set()
  private static suspiciousIPs: Map<string, { count: number; lastSeen: number }> = new Map()

  /**
   * Default rate limit rules for different endpoint types
   */
  static readonly RULES = {
    // Authentication endpoints - stricter limits
    AUTH: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5, // 5 attempts per 15 minutes
      keyGenerator: (req: any) => `auth:${this.getClientIP(req)}`
    },
    
    // Customer browsing - generous limits
    BROWSE: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 100, // 100 requests per minute
      keyGenerator: (req: any) => `browse:${this.getClientIP(req)}`
    },
    
    // Order operations - moderate limits
    ORDER: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10, // 10 orders per minute
      keyGenerator: (req: any) => `order:${this.getUserId(req) || this.getClientIP(req)}`
    },
    
    // Cart operations - moderate limits
    CART: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 30, // 30 cart operations per minute
      keyGenerator: (req: any) => `cart:${this.getUserId(req) || this.getClientIP(req)}`
    },
    
    // General API - standard limits
    API: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 60, // 60 requests per minute
      keyGenerator: (req: any) => `api:${this.getClientIP(req)}`
    }
  } as const

  /**
   * Check if request should be rate limited
   */
  static checkRateLimit(request: any, rule: RateLimitRule): {
    allowed: boolean
    remaining: number
    resetTime: number
    retryAfter?: number
  } {
    const key = rule.keyGenerator ? rule.keyGenerator(request) : this.getClientIP(request)
    const now = Date.now()
    
    // Check if IP is blocked
    if (this.blockedIPs.has(this.getClientIP(request))) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: now + rule.windowMs,
        retryAfter: Math.ceil(rule.windowMs / 1000)
      }
    }

    let entry = this.store.get(key)
    
    // Create new entry if doesn't exist or window has expired
    if (!entry || now > entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + rule.windowMs,
        firstRequest: now
      }
    }

    // Increment counter
    entry.count++
    this.store.set(key, entry)

    const remaining = Math.max(0, rule.maxRequests - entry.count)
    const allowed = entry.count <= rule.maxRequests

    // Track suspicious activity
    if (!allowed) {
      this.trackSuspiciousActivity(this.getClientIP(request))
      
      if (rule.onLimitReached) {
        rule.onLimitReached(request)
      }
    }

    return {
      allowed,
      remaining,
      resetTime: entry.resetTime,
      retryAfter: allowed ? undefined : Math.ceil((entry.resetTime - now) / 1000)
    }
  }

  /**
   * Middleware factory for rate limiting
   */
  static createMiddleware(rule: RateLimitRule) {
    return (request: any, response?: any) => {
      const result = this.checkRateLimit(request, rule)
      
      if (!result.allowed) {
        const error = new Error('Rate limit exceeded')
        ;(error as any).status = 429
        ;(error as any).retryAfter = result.retryAfter
        ;(error as any).resetTime = result.resetTime
        throw error
      }
      
      return result
    }
  }

  /**
   * Block IP address
   */
  static blockIP(ip: string, duration?: number) {
    this.blockedIPs.add(ip)
    
    if (duration) {
      setTimeout(() => {
        this.blockedIPs.delete(ip)
      }, duration)
    }
  }

  /**
   * Unblock IP address
   */
  static unblockIP(ip: string) {
    this.blockedIPs.delete(ip)
    this.suspiciousIPs.delete(ip)
  }

  /**
   * Get blocked IPs
   */
  static getBlockedIPs(): string[] {
    return Array.from(this.blockedIPs)
  }

  /**
   * Get suspicious IPs
   */
  static getSuspiciousIPs(): Array<{ ip: string; count: number; lastSeen: number }> {
    return Array.from(this.suspiciousIPs.entries()).map(([ip, data]) => ({
      ip,
      ...data
    }))
  }

  /**
   * Clear rate limit data (for testing)
   */
  static clear() {
    this.store.clear()
    this.blockedIPs.clear()
    this.suspiciousIPs.clear()
  }

  /**
   * Cleanup expired entries
   */
  static cleanup() {
    const now = Date.now()
    let cleaned = 0
    
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key)
        cleaned++
      }
    }
    
    // Cleanup old suspicious IPs (older than 1 hour)
    for (const [ip, data] of this.suspiciousIPs.entries()) {
      if (now - data.lastSeen > 3600000) {
        this.suspiciousIPs.delete(ip)
      }
    }
    
    return cleaned
  }

  private static getClientIP(request: any): string {
    return request.headers?.get('x-forwarded-for')?.split(',')[0] ||
           request.headers?.get('x-real-ip') ||
           request.ip ||
           'unknown'
  }

  private static getUserId(request: any): string | null {
    return (request as any).userId || null
  }

  private static trackSuspiciousActivity(ip: string) {
    const existing = this.suspiciousIPs.get(ip)
    const now = Date.now()
    
    if (existing) {
      existing.count++
      existing.lastSeen = now
      
      // Auto-block after 10 violations in 1 hour
      if (existing.count >= 10 && now - existing.lastSeen < 3600000) {
        this.blockIP(ip, 3600000) // Block for 1 hour
        console.warn(`Auto-blocked IP ${ip} for excessive rate limit violations`)
      }
    } else {
      this.suspiciousIPs.set(ip, { count: 1, lastSeen: now })
    }
  }
}

/**
 * Security validator for requests
 */
export class SecurityValidator {
  private static config: SecurityConfig = {
    enableRateLimit: true,
    enableIPBlocking: true,
    enableUserAgentValidation: true,
    maxRequestSize: 10 * 1024 * 1024, // 10MB
    allowedOrigins: [
      'http://localhost:3000',
      'https://xianfeast.com',
      'https://*.xianfeast.com'
    ]
  }

  /**
   * Validate request security
   */
  static validateRequest(request: any): {
    valid: boolean
    errors: string[]
    warnings: string[]
  } {
    const errors: string[] = []
    const warnings: string[] = []

    // Check IP blocking
    if (this.config.enableIPBlocking) {
      const ip = this.getClientIP(request)
      if (RateLimiter.getBlockedIPs().includes(ip)) {
        errors.push('IP address is blocked')
      }
    }

    // Validate User-Agent
    if (this.config.enableUserAgentValidation) {
      const userAgent = request.headers?.get('user-agent')
      if (!userAgent || this.isSuspiciousUserAgent(userAgent)) {
        warnings.push('Suspicious or missing User-Agent')
      }
    }

    // Check request size
    const contentLength = parseInt(request.headers?.get('content-length') || '0')
    if (contentLength > this.config.maxRequestSize) {
      errors.push('Request size exceeds limit')
    }

    // Validate Origin for CORS
    const origin = request.headers?.get('origin')
    if (origin && !this.isAllowedOrigin(origin)) {
      warnings.push('Request from non-whitelisted origin')
    }

    // Check for common attack patterns
    const url = request.url || ''
    if (this.containsAttackPatterns(url)) {
      errors.push('Request contains suspicious patterns')
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Update security configuration
   */
  static updateConfig(newConfig: Partial<SecurityConfig>) {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * Get current security configuration
   */
  static getConfig(): SecurityConfig {
    return { ...this.config }
  }

  private static getClientIP(request: any): string {
    return request.headers?.get('x-forwarded-for')?.split(',')[0] ||
           request.headers?.get('x-real-ip') ||
           request.ip ||
           'unknown'
  }

  private static isSuspiciousUserAgent(userAgent: string): boolean {
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
      /^$/
    ]

    return suspiciousPatterns.some(pattern => pattern.test(userAgent))
  }

  private static isAllowedOrigin(origin: string): boolean {
    return this.config.allowedOrigins.some(allowed => {
      if (allowed.includes('*')) {
        const pattern = allowed.replace(/\*/g, '.*')
        return new RegExp(`^${pattern}$`).test(origin)
      }
      return allowed === origin
    })
  }

  private static containsAttackPatterns(url: string): boolean {
    const attackPatterns = [
      /\.\./,  // Directory traversal
      /<script/i,  // XSS
      /union.*select/i,  // SQL injection
      /javascript:/i,  // JavaScript injection
      /data:/i,  // Data URI
      /vbscript:/i,  // VBScript
      /onload=/i,  // Event handlers
      /onerror=/i
    ]

    return attackPatterns.some(pattern => pattern.test(url))
  }
}

/**
 * Request sanitizer
 */
export class RequestSanitizer {
  /**
   * Sanitize request body
   */
  static sanitizeBody(body: any): any {
    if (typeof body !== 'object' || body === null) {
      return body
    }

    if (Array.isArray(body)) {
      return body.map(item => this.sanitizeBody(item))
    }

    const sanitized: any = {}
    
    for (const [key, value] of Object.entries(body)) {
      // Skip dangerous keys
      if (this.isDangerousKey(key)) {
        continue
      }

      // Sanitize string values
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeString(value)
      } else if (typeof value === 'object') {
        sanitized[key] = this.sanitizeBody(value)
      } else {
        sanitized[key] = value
      }
    }

    return sanitized
  }

  /**
   * Sanitize string input
   */
  static sanitizeString(input: string): string {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .replace(/data:/gi, '') // Remove data: protocol
      .trim()
  }

  private static isDangerousKey(key: string): boolean {
    const dangerousKeys = [
      '__proto__',
      'constructor',
      'prototype',
      'eval',
      'function',
      'script'
    ]

    return dangerousKeys.includes(key.toLowerCase())
  }
}

/**
 * Combined security middleware
 */
export function withSecurity(options: {
  rateLimit?: RateLimitRule
  validateRequest?: boolean
  sanitizeBody?: boolean
} = {}) {
  return function securityMiddleware(request: any) {
    const results = {
      rateLimit: null as any,
      validation: null as any,
      sanitizedBody: null as any
    }

    // Apply rate limiting
    if (options.rateLimit) {
      results.rateLimit = RateLimiter.checkRateLimit(request, options.rateLimit)
      if (!results.rateLimit.allowed) {
        const error = new Error('Rate limit exceeded')
        ;(error as any).status = 429
        ;(error as any).retryAfter = results.rateLimit.retryAfter
        throw error
      }
    }

    // Validate request
    if (options.validateRequest !== false) {
      results.validation = SecurityValidator.validateRequest(request)
      if (!results.validation.valid) {
        const error = new Error(`Security validation failed: ${results.validation.errors.join(', ')}`)
        ;(error as any).status = 400
        throw error
      }
    }

    // Sanitize body
    if (options.sanitizeBody && request.body) {
      results.sanitizedBody = RequestSanitizer.sanitizeBody(request.body)
      request.body = results.sanitizedBody
    }

    return results
  }
}