/**
 * Main Application
 * Handles routing and page rendering
 */

const App = {
    currentPage: 'dashboard',
    appContainer: null,

    /**
     * Initialize the application
     */
    async init() {
        this.appContainer = document.getElementById('app');

        // Show loading state
        this.appContainer.innerHTML = '<div class="flex items-center justify-center py-20"><div class="text-center"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div><p class="text-gray-500">Загрузка данных...</p></div></div>';

        // Load data from server
        await Database.initDatabase();

        // Setup navigation
        Navigation.init();

        // Setup hash-based routing
        this.setupRouting();

        // Setup reset button
        this.setupResetButton();

        // Update current date display
        this.updateCurrentDate();
        setInterval(() => this.updateCurrentDate(), 60000); // Update every minute

        // Load initial page
        this.loadPage();
    },

    /**
     * Setup hash-based routing
     */
    setupRouting() {
        window.addEventListener('hashchange', () => {
            this.loadPage();
        });
    },

    /**
     * Get current route from hash
     */
    getCurrentRoute() {
        const hash = window.location.hash.slice(1) || 'dashboard';
        return hash;
    },

    /**
     * Load page based on current route
     */
    loadPage() {
        const route = this.getCurrentRoute();
        this.currentPage = route;

        // Update navigation active state
        Navigation.setActive(route);

        // Render page content
        this.renderPage(route);
    },

    /**
     * Render page content
     */
    renderPage(route) {
        let content = '';

        switch (route) {
            case 'dashboard':
                content = Dashboard.render();
                break;
            case 'appointments':
                content = Appointments.render();
                break;
            case 'clients':
                content = Clients.render();
                break;
            case 'employees':
                content = Employees.render();
                break;
            case 'services':
                content = Services.render();
                break;
            case 'reports':
                content = Reports.render();
                break;
            case 'inventory':
                content = Inventory.render();
                break;
            default:
                content = '<div class="text-center py-12"><h2 class="text-2xl text-gray-600">Страница не найдена</h2></div>';
        }

        this.appContainer.innerHTML = content;

        // Call afterRender if exists
        const pageComponents = {
            dashboard: Dashboard,
            appointments: Appointments,
            clients: Clients,
            employees: Employees,
            services: Services,
            reports: Reports,
            inventory: Inventory
        };

        if (pageComponents[route] && pageComponents[route].afterRender) {
            pageComponents[route].afterRender();
        }
    },

    /**
     * Update current date display
     */
    updateCurrentDate() {
        const dateElement = document.getElementById('current-date');
        if (dateElement) {
            dateElement.textContent = DateUtils.formatDate(new Date(), 'long');
        }
    },

    /**
     * Setup reset database button
     */
    setupResetButton() {
        const resetBtn = document.getElementById('reset-data-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (confirm('Вы уверены, что хотите сбросить все данные? Это действие нельзя отменить.')) {
                    Database.resetDatabase();
                    this.loadPage();
                    alert('База данных сброшена!');
                }
            });
        }
    },

    /**
     * Refresh current page
     */
    refresh() {
        this.loadPage();
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
