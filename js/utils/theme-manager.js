/**
 * Theme Manager - Light/Dark mode switcher
 */

class ThemeManager {
    constructor() {
        this.currentTheme = this.getSavedTheme() || 'light';
        this.init();
    }

    init() {
        this.applyTheme(this.currentTheme);
        this.createThemeSwitcher();
    }

    getSavedTheme() {
        return localStorage.getItem('beautysalon_theme');
    }

    saveTheme(theme) {
        localStorage.setItem('beautysalon_theme', theme);
    }

    applyTheme(theme) {
        this.currentTheme = theme;

        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            this.applyDarkStyles();
        } else {
            document.documentElement.classList.remove('dark');
            this.removeDarkStyles();
        }

        this.saveTheme(theme);
        this.updateThemeSwitcherIcon();
    }

    applyDarkStyles() {
        // Inject dark mode styles
        if (!document.getElementById('dark-theme-styles')) {
            const style = document.createElement('style');
            style.id = 'dark-theme-styles';
            style.textContent = `
                .dark body {
                    background: linear-gradient(to bottom right, #1a1a2e, #16213e) !important;
                    color: #e4e4e7;
                }

                .dark header,
                .dark nav,
                .dark footer {
                    background-color: #1f2937 !important;
                    border-color: #374151 !important;
                }

                .dark .bg-white {
                    background-color: #1f2937 !important;
                }

                .dark .text-gray-600,
                .dark .text-gray-700,
                .dark .text-gray-800,
                .dark .text-gray-900 {
                    color: #e4e4e7 !important;
                }

                .dark .text-gray-500 {
                    color: #9ca3af !important;
                }

                .dark .text-gray-400 {
                    color: #6b7280 !important;
                }

                .dark .border-gray-200,
                .dark .border-gray-300 {
                    border-color: #374151 !important;
                }

                .dark .bg-gray-50 {
                    background-color: #111827 !important;
                }

                .dark .bg-gray-100 {
                    background-color: #1f2937 !important;
                }

                .dark .bg-gray-200 {
                    background-color: #374151 !important;
                }

                .dark input,
                .dark select,
                .dark textarea {
                    background-color: #374151 !important;
                    border-color: #4b5563 !important;
                    color: #e4e4e7 !important;
                }

                .dark input:focus,
                .dark select:focus,
                .dark textarea:focus {
                    border-color: #ec4899 !important;
                    background-color: #1f2937 !important;
                }

                .dark table thead {
                    background-color: #374151 !important;
                    color: #e4e4e7 !important;
                }

                .dark table tbody tr {
                    border-color: #374151 !important;
                }

                .dark table tbody tr:hover {
                    background-color: #374151 !important;
                }

                .dark .shadow-md,
                .dark .shadow-lg,
                .dark .shadow-xl {
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2) !important;
                }

                .dark .modal-overlay,
                .dark [class*="fixed inset-0"] {
                    background-color: rgba(0, 0, 0, 0.85) !important;
                }

                .dark .nav-link {
                    color: #9ca3af !important;
                }

                .dark .nav-link:hover {
                    color: #ec4899 !important;
                    background-color: rgba(236, 72, 153, 0.1) !important;
                }

                .dark .nav-link.active {
                    color: #ec4899 !important;
                    border-bottom-color: #ec4899 !important;
                }

                /* Cards */
                .dark .dashboard-card,
                .dark .kpi-card,
                .dark .alert-card {
                    background-color: #1f2937 !important;
                    border-color: #374151 !important;
                }

                /* Gradient backgrounds (keep colorful) */
                .dark .bg-gradient-to-r,
                .dark .bg-gradient-to-br {
                    opacity: 0.95;
                }

                /* Charts */
                .dark canvas {
                    filter: brightness(0.9);
                }

                /* Scrollbars */
                .dark ::-webkit-scrollbar-track {
                    background: #1f2937;
                }

                .dark ::-webkit-scrollbar-thumb {
                    background: #4b5563;
                }

                .dark ::-webkit-scrollbar-thumb:hover {
                    background: #6b7280;
                }

                /* Skeleton screens */
                .dark .animate-pulse > div {
                    background-color: #374151 !important;
                }

                /* Badges */
                .dark .badge,
                .dark [class*="rounded-full"] {
                    opacity: 0.9;
                }
            `;
            document.head.appendChild(style);
        }
    }

    removeDarkStyles() {
        const styles = document.getElementById('dark-theme-styles');
        if (styles) {
            styles.remove();
        }
    }

    toggle() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
    }

    createThemeSwitcher() {
        const switcher = document.createElement('button');
        switcher.id = 'theme-switcher';
        switcher.className = 'fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all z-50 flex items-center justify-center';
        switcher.innerHTML = '<i class="fas fa-moon text-xl"></i>';
        switcher.onclick = () => this.toggle();

        document.body.appendChild(switcher);
    }

    updateThemeSwitcherIcon() {
        const switcher = document.getElementById('theme-switcher');
        if (switcher) {
            const icon = this.currentTheme === 'light' ? 'fa-moon' : 'fa-sun';
            switcher.innerHTML = `<i class="fas ${icon} text-xl"></i>`;
        }
    }
}

// Initialize theme manager
const themeManager = new ThemeManager();

// Export
window.themeManager = themeManager;
