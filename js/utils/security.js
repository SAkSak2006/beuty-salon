/**
 * Security utilities for data validation and sanitization
 */

// XSS Protection - HTML entity encoding
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
        '/': '&#x2F;'
    };
    return String(text).replace(/[&<>"'\/]/g, s => map[s]);
}

// Sanitize user input
function sanitizeInput(input, options = {}) {
    if (typeof input !== 'string') return input;

    let sanitized = input.trim();

    // Remove script tags
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Remove event handlers
    sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
    sanitized = sanitized.replace(/on\w+\s*=\s*[^\s>]*/gi, '');

    // Remove javascript: protocol
    sanitized = sanitized.replace(/javascript:/gi, '');

    // Remove data: protocol if not image
    if (!options.allowDataUri) {
        sanitized = sanitized.replace(/data:/gi, '');
    }

    // Escape HTML if needed
    if (options.escapeHtml) {
        sanitized = escapeHtml(sanitized);
    }

    return sanitized;
}

// Validation rules
const validators = {
    required: (value) => value !== null && value !== undefined && value !== '',

    email: (value) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value);
    },

    phone: (value) => {
        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        return phoneRegex.test(value) && value.replace(/\D/g, '').length >= 10;
    },

    minLength: (value, min) => String(value).length >= min,

    maxLength: (value, max) => String(value).length <= max,

    min: (value, min) => Number(value) >= min,

    max: (value, max) => Number(value) <= max,

    pattern: (value, pattern) => new RegExp(pattern).test(value),

    date: (value) => !isNaN(Date.parse(value)),

    number: (value) => !isNaN(Number(value)),

    integer: (value) => Number.isInteger(Number(value)),

    positive: (value) => Number(value) > 0,

    url: (value) => {
        try {
            new URL(value);
            return true;
        } catch {
            return false;
        }
    },

    alphanumeric: (value) => /^[a-zA-Z0-9]+$/.test(value),

    noSpecialChars: (value) => /^[a-zA-Zа-яА-ЯёЁ0-9\s]+$/.test(value)
};

// Form validator
class FormValidator {
    constructor(formId, rules) {
        this.form = document.getElementById(formId);
        this.rules = rules;
        this.errors = {};
    }

    validate() {
        this.errors = {};
        let isValid = true;

        Object.keys(this.rules).forEach(fieldName => {
            const field = this.form?.querySelector(`[name="${fieldName}"]`);
            if (!field) return;

            const fieldRules = this.rules[fieldName];
            const value = field.value;

            fieldRules.forEach(rule => {
                if (rule.validator === 'required' && !validators.required(value)) {
                    this.addError(fieldName, rule.message || 'Это поле обязательно');
                    isValid = false;
                } else if (rule.validator === 'email' && value && !validators.email(value)) {
                    this.addError(fieldName, rule.message || 'Неверный формат email');
                    isValid = false;
                } else if (rule.validator === 'phone' && value && !validators.phone(value)) {
                    this.addError(fieldName, rule.message || 'Неверный формат телефона');
                    isValid = false;
                } else if (rule.validator === 'minLength' && !validators.minLength(value, rule.value)) {
                    this.addError(fieldName, rule.message || `Минимум ${rule.value} символов`);
                    isValid = false;
                } else if (rule.validator === 'maxLength' && !validators.maxLength(value, rule.value)) {
                    this.addError(fieldName, rule.message || `Максимум ${rule.value} символов`);
                    isValid = false;
                }
            });
        });

        this.displayErrors();
        return isValid;
    }

    addError(field, message) {
        if (!this.errors[field]) {
            this.errors[field] = [];
        }
        this.errors[field].push(message);
    }

    displayErrors() {
        // Clear previous errors
        this.form?.querySelectorAll('.error-message').forEach(el => el.remove());
        this.form?.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));

        // Display new errors
        Object.keys(this.errors).forEach(fieldName => {
            const field = this.form?.querySelector(`[name="${fieldName}"]`);
            if (field) {
                field.classList.add('is-invalid');

                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-message text-red-600 text-sm mt-1';
                errorDiv.textContent = this.errors[fieldName][0];
                field.parentElement.appendChild(errorDiv);
            }
        });
    }

    clearErrors() {
        this.errors = {};
        this.form?.querySelectorAll('.error-message').forEach(el => el.remove());
        this.form?.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
    }
}

// Simple encryption for sensitive data (Base64 + simple cipher)
const encryption = {
    key: 'beautysalon_secret_key_2024',

    encrypt(text) {
        if (!text) return '';

        // Simple XOR cipher
        let result = '';
        for (let i = 0; i < text.length; i++) {
            result += String.fromCharCode(
                text.charCodeAt(i) ^ this.key.charCodeAt(i % this.key.length)
            );
        }

        // Base64 encode
        return btoa(result);
    },

    decrypt(encrypted) {
        if (!encrypted) return '';

        try {
            // Base64 decode
            const decoded = atob(encrypted);

            // XOR decipher
            let result = '';
            for (let i = 0; i < decoded.length; i++) {
                result += String.fromCharCode(
                    decoded.charCodeAt(i) ^ this.key.charCodeAt(i % this.key.length)
                );
            }

            return result;
        } catch (e) {
            console.error('Decryption failed:', e);
            return '';
        }
    }
};

// Secure storage wrapper
class SecureStorage {
    constructor(prefix = 'secure_') {
        this.prefix = prefix;
    }

    set(key, value, encrypt = false) {
        const fullKey = this.prefix + key;
        const data = {
            value: encrypt ? encryption.encrypt(JSON.stringify(value)) : value,
            encrypted: encrypt,
            timestamp: Date.now()
        };

        try {
            localStorage.setItem(fullKey, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Storage error:', e);
            return false;
        }
    }

    get(key) {
        const fullKey = this.prefix + key;

        try {
            const stored = localStorage.getItem(fullKey);
            if (!stored) return null;

            const data = JSON.parse(stored);

            if (data.encrypted) {
                return JSON.parse(encryption.decrypt(data.value));
            }

            return data.value;
        } catch (e) {
            console.error('Retrieval error:', e);
            return null;
        }
    }

    remove(key) {
        const fullKey = this.prefix + key;
        localStorage.removeItem(fullKey);
    }

    clear() {
        Object.keys(localStorage)
            .filter(key => key.startsWith(this.prefix))
            .forEach(key => localStorage.removeItem(key));
    }
}

// CSRF Token generator
function generateCSRFToken() {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

// Rate limiter
class RateLimiter {
    constructor(maxAttempts = 5, windowMs = 60000) {
        this.maxAttempts = maxAttempts;
        this.windowMs = windowMs;
        this.attempts = new Map();
    }

    checkLimit(identifier) {
        const now = Date.now();
        const userAttempts = this.attempts.get(identifier) || [];

        // Clean old attempts
        const recentAttempts = userAttempts.filter(timestamp => now - timestamp < this.windowMs);

        if (recentAttempts.length >= this.maxAttempts) {
            return false; // Rate limit exceeded
        }

        recentAttempts.push(now);
        this.attempts.set(identifier, recentAttempts);

        return true; // Within limit
    }

    reset(identifier) {
        this.attempts.delete(identifier);
    }

    clear() {
        this.attempts.clear();
    }
}

// Content Security Policy helper
const csp = {
    allowedDomains: [
        'cdn.tailwindcss.com',
        'cdnjs.cloudflare.com',
        'cdn.jsdelivr.net'
    ],

    isAllowedDomain(url) {
        try {
            const urlObj = new URL(url);
            return this.allowedDomains.some(domain => urlObj.hostname.includes(domain));
        } catch {
            return false;
        }
    },

    sanitizeUrl(url) {
        if (this.isAllowedDomain(url)) {
            return url;
        }
        return '';
    }
};

// Input sanitization presets
const sanitizationPresets = {
    text: (input) => sanitizeInput(input, { escapeHtml: true }),

    name: (input) => sanitizeInput(input, { escapeHtml: true }).replace(/[^a-zA-Zа-яА-ЯёЁ\s\-]/g, ''),

    email: (input) => sanitizeInput(input).toLowerCase().trim(),

    phone: (input) => sanitizeInput(input).replace(/[^\d\+\-\(\)\s]/g, ''),

    number: (input) => parseFloat(sanitizeInput(input).replace(/[^\d\.\-]/g, '')) || 0,

    integer: (input) => parseInt(sanitizeInput(input).replace(/[^\d\-]/g, '')) || 0,

    date: (input) => {
        const sanitized = sanitizeInput(input);
        return new Date(sanitized).toISOString().split('T')[0];
    },

    url: (input) => {
        const sanitized = sanitizeInput(input);
        return csp.sanitizeUrl(sanitized);
    }
};

// Security audit log
class SecurityAuditLog {
    constructor() {
        this.logs = [];
        this.maxLogs = 1000;
    }

    log(event, details = {}) {
        this.logs.push({
            timestamp: new Date().toISOString(),
            event,
            details,
            userAgent: navigator.userAgent
        });

        // Keep only last maxLogs entries
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }

        // Save to localStorage
        try {
            localStorage.setItem('security_audit_log', JSON.stringify(this.logs));
        } catch (e) {
            console.error('Failed to save audit log:', e);
        }
    }

    getLogs(filter = {}) {
        let filtered = this.logs;

        if (filter.event) {
            filtered = filtered.filter(log => log.event === filter.event);
        }

        if (filter.since) {
            filtered = filtered.filter(log => new Date(log.timestamp) >= filter.since);
        }

        return filtered;
    }

    clear() {
        this.logs = [];
        localStorage.removeItem('security_audit_log');
    }
}

const auditLog = new SecurityAuditLog();

// Export security utilities
window.securityUtils = {
    escapeHtml,
    sanitizeInput,
    validators,
    FormValidator,
    encryption,
    SecureStorage,
    generateCSRFToken,
    RateLimiter,
    csp,
    sanitizationPresets,
    auditLog
};
