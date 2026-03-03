/**
 * Performance optimization utilities
 */

// Debounce function - delays execution until after wait time has elapsed
function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle function - limits execution to once per wait period
function throttle(func, wait = 300) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, wait);
        }
    };
}

// Simple cache implementation
class SimpleCache {
    constructor(maxSize = 100, ttl = 5 * 60 * 1000) {
        this.cache = new Map();
        this.maxSize = maxSize;
        this.ttl = ttl; // Time to live in milliseconds
    }

    set(key, value) {
        if (this.cache.size >= this.maxSize) {
            // Remove oldest entry
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }

        this.cache.set(key, {
            value,
            timestamp: Date.now()
        });
    }

    get(key) {
        const item = this.cache.get(key);

        if (!item) return null;

        // Check if expired
        if (Date.now() - item.timestamp > this.ttl) {
            this.cache.delete(key);
            return null;
        }

        return item.value;
    }

    clear() {
        this.cache.clear();
    }

    has(key) {
        return this.cache.has(key) && this.get(key) !== null;
    }
}

// Global cache instance
const globalCache = new SimpleCache();

// Lazy image loading
function lazyLoadImages() {
    const images = document.querySelectorAll('img[data-src]');

    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                observer.unobserve(img);
            }
        });
    });

    images.forEach(img => imageObserver.observe(img));
}

// Virtual scrolling for large lists
class VirtualScroller {
    constructor(container, items, renderItem, itemHeight = 50) {
        this.container = container;
        this.items = items;
        this.renderItem = renderItem;
        this.itemHeight = itemHeight;
        this.visibleItems = Math.ceil(container.clientHeight / itemHeight) + 2;
        this.scrollTop = 0;

        this.init();
    }

    init() {
        this.container.innerHTML = `
            <div class="virtual-scroll-spacer" style="height: ${this.items.length * this.itemHeight}px"></div>
            <div class="virtual-scroll-content"></div>
        `;

        this.content = this.container.querySelector('.virtual-scroll-content');

        this.container.addEventListener('scroll', throttle(() => {
            this.scrollTop = this.container.scrollTop;
            this.render();
        }, 50));

        this.render();
    }

    render() {
        const startIndex = Math.floor(this.scrollTop / this.itemHeight);
        const endIndex = Math.min(startIndex + this.visibleItems, this.items.length);

        const visibleItems = this.items.slice(startIndex, endIndex);

        this.content.style.transform = `translateY(${startIndex * this.itemHeight}px)`;
        this.content.innerHTML = visibleItems.map(item => this.renderItem(item)).join('');
    }

    update(items) {
        this.items = items;
        const spacer = this.container.querySelector('.virtual-scroll-spacer');
        if (spacer) {
            spacer.style.height = `${this.items.length * this.itemHeight}px`;
        }
        this.render();
    }
}

// Request Animation Frame throttle
function rafThrottle(callback) {
    let requestId = null;

    return function(...args) {
        if (requestId === null) {
            requestId = requestAnimationFrame(() => {
                requestId = null;
                callback.apply(this, args);
            });
        }
    };
}

// Batch DOM operations
function batchDOMUpdates(updates) {
    requestAnimationFrame(() => {
        updates.forEach(update => update());
    });
}

// Memoization for expensive computations
function memoize(fn) {
    const cache = new Map();

    return function(...args) {
        const key = JSON.stringify(args);

        if (cache.has(key)) {
            return cache.get(key);
        }

        const result = fn.apply(this, args);
        cache.set(key, result);
        return result;
    };
}

// Performance monitoring
class PerformanceMonitor {
    constructor() {
        this.marks = new Map();
        this.measures = [];
    }

    mark(name) {
        performance.mark(name);
        this.marks.set(name, performance.now());
    }

    measure(name, startMark, endMark) {
        try {
            performance.measure(name, startMark, endMark);
            const measure = performance.getEntriesByName(name, 'measure')[0];
            this.measures.push({
                name,
                duration: measure.duration,
                timestamp: Date.now()
            });
            return measure.duration;
        } catch (e) {
            console.warn('Performance measure failed:', e);
            return 0;
        }
    }

    getReport() {
        return {
            marks: Array.from(this.marks.entries()),
            measures: this.measures,
            navigation: performance.getEntriesByType('navigation')[0],
            resources: performance.getEntriesByType('resource')
        };
    }

    clear() {
        performance.clearMarks();
        performance.clearMeasures();
        this.marks.clear();
        this.measures = [];
    }
}

const perfMonitor = new PerformanceMonitor();

// Auto-save with debounce
function createAutoSaver(saveFunction, delay = 2000) {
    const debouncedSave = debounce(saveFunction, delay);

    return {
        save: debouncedSave,
        saveNow: saveFunction
    };
}

// Image compression before storage
async function compressImage(file, maxWidth = 800, maxHeight = 600, quality = 0.8) {
    return new Promise((resolve) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const img = new Image();

            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height *= maxWidth / width;
                    width = maxWidth;
                }

                if (height > maxHeight) {
                    width *= maxHeight / height;
                    height = maxHeight;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    resolve(blob);
                }, 'image/jpeg', quality);
            };

            img.src = e.target.result;
        };

        reader.readAsDataURL(file);
    });
}

// Preload critical resources
function preloadResources(resources) {
    resources.forEach(resource => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = resource.type || 'script';
        link.href = resource.url;
        document.head.appendChild(link);
    });
}

// LocalStorage quota management
class StorageManager {
    constructor() {
        this.storageKey = 'beautysalon_';
    }

    getUsage() {
        let total = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                total += localStorage[key].length + key.length;
            }
        }
        return {
            used: total,
            usedMB: (total / 1024 / 1024).toFixed(2),
            available: 5 * 1024 * 1024, // ~5MB typical limit
            percentage: ((total / (5 * 1024 * 1024)) * 100).toFixed(2)
        };
    }

    cleanup() {
        // Remove old temporary data
        for (let key in localStorage) {
            if (key.startsWith(this.storageKey + 'temp_')) {
                const data = JSON.parse(localStorage[key]);
                if (data.expires && Date.now() > data.expires) {
                    localStorage.removeItem(key);
                }
            }
        }
    }

    compress(data) {
        // Simple compression by removing whitespace
        return JSON.stringify(data);
    }

    decompress(data) {
        return JSON.parse(data);
    }
}

const storageManager = new StorageManager();

// Export utilities
window.performanceUtils = {
    debounce,
    throttle,
    rafThrottle,
    globalCache,
    SimpleCache,
    VirtualScroller,
    batchDOMUpdates,
    memoize,
    perfMonitor,
    createAutoSaver,
    compressImage,
    preloadResources,
    lazyLoadImages,
    storageManager
};
