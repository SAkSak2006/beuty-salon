/**
 * Main Application
 * Handles routing and page rendering with role-based access control
 */

const App = {
    currentPage: 'dashboard',
    appContainer: null,

    /**
     * Role-based page access matrix
     * master: dashboard, appointments (own), clients (read), services (read)
     * admin: everything except employees management (read ok, CUD blocked on server)
     * owner: full access
     */
    pageAccess: {
        dashboard:   ['master', 'admin', 'owner'],
        appointments:['master', 'admin', 'owner'],
        clients:     ['master', 'admin', 'owner'],
        employees:   ['admin', 'owner'],
        services:    ['master', 'admin', 'owner'],
        reports:     ['admin', 'owner'],
        inventory:   ['admin', 'owner'],
    },

    /**
     * Check if current user can access a page
     */
    canAccess(route) {
        const user = Auth.getUser();
        if (!user) return false;
        const allowed = this.pageAccess[route];
        if (!allowed) return false;
        return allowed.includes(user.role);
    },

    /**
     * Initialize the application
     */
    async init() {
        this.appContainer = document.getElementById('app');

        // Auth guard — redirect to login if not authenticated
        if (!Auth.guard()) return;

        // Show loading state
        this.appContainer.innerHTML = '<div class="flex items-center justify-center py-20"><div class="text-center"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div><p class="text-gray-500">Загрузка данных...</p></div></div>';

        // Load data from server
        await Database.initDatabase();

        // Setup navigation (with role-based visibility)
        Navigation.init();

        // Setup hash-based routing
        this.setupRouting();

        // Setup reset button (only for owner)
        this.setupResetButton();

        // Update current date display
        this.updateCurrentDate();
        setInterval(() => this.updateCurrentDate(), 60000);

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
     * Load page based on current route with role check
     */
    loadPage() {
        let route = this.getCurrentRoute();
        this.currentPage = route;

        // Role-based route guard: redirect to dashboard if not allowed
        if (!this.canAccess(route)) {
            route = 'dashboard';
            window.location.hash = '#dashboard';
            this.currentPage = route;
        }

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
     * Setup reset database button — only visible for owner
     */
    setupResetButton() {
        const resetBtn = document.getElementById('reset-data-btn');
        if (!resetBtn) return;

        const user = Auth.getUser();
        if (!user || user.role !== 'owner') {
            resetBtn.style.display = 'none';
            return;
        }

        resetBtn.addEventListener('click', () => {
            if (confirm('Вы уверены, что хотите сбросить все данные? Это действие нельзя отменить.')) {
                Database.resetDatabase();
                this.loadPage();
                alert('База данных сброшена!');
            }
        });
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
