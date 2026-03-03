/**
 * Navigation component with role-based access control
 *
 * Role matrix:
 *   master: dashboard, appointments, clients, services
 *   admin:  dashboard, appointments, clients, services, reports, inventory  (no employees)
 *   owner:  all pages
 */

const Navigation = {
    /**
     * Pages each role can see in navigation
     */
    rolePages: {
        master: ['dashboard', 'appointments', 'clients', 'services'],
        admin:  ['dashboard', 'appointments', 'clients', 'services', 'reports', 'inventory'],
        owner:  ['dashboard', 'appointments', 'clients', 'employees', 'services', 'reports', 'inventory'],
    },

    /**
     * Initialize navigation
     */
    init() {
        this.setupNavLinks();
        this.applyRoleRestrictions();
        this.setupUserInfo();
    },

    /**
     * Setup navigation links click handlers
     */
    setupNavLinks() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                this.handleNavClick(e);
            });
        });
    },

    /**
     * Handle navigation link click
     */
    handleNavClick(e) {
        // Hash change will trigger route change automatically
    },

    /**
     * Hide nav items based on user role
     */
    applyRoleRestrictions() {
        const user = Auth.getUser();
        if (!user) return;

        const allowedPages = this.rolePages[user.role] || [];

        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            const href = link.getAttribute('href').slice(1); // remove #
            if (!allowedPages.includes(href)) {
                link.closest('li').style.display = 'none';
            }
        });
    },

    /**
     * Show current user info and logout button in header
     */
    setupUserInfo() {
        const user = Auth.getUser();
        if (!user) return;

        const headerRight = document.querySelector('.flex.items-center.space-x-4');
        if (!headerRight) return;

        const roleLabels = {
            owner: 'Владелец',
            admin: 'Администратор',
            master: 'Мастер'
        };

        const roleColors = {
            owner: 'bg-red-100 text-red-700',
            admin: 'bg-blue-100 text-blue-700',
            master: 'bg-green-100 text-green-700'
        };

        const userInfo = document.createElement('div');
        userInfo.className = 'flex items-center space-x-3';
        userInfo.innerHTML = `
            <span class="text-sm text-gray-600">
                <i class="fas fa-user-circle mr-1"></i>
                ${user.employeeName || user.username}
                <span class="text-xs ${roleColors[user.role] || 'bg-gray-100 text-gray-700'} px-2 py-0.5 rounded-full ml-1">
                    ${roleLabels[user.role] || user.role}
                </span>
            </span>
            <button id="logout-btn" class="text-sm px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition" title="Выйти">
                <i class="fas fa-sign-out-alt"></i>
            </button>
        `;
        headerRight.appendChild(userInfo);

        document.getElementById('logout-btn').addEventListener('click', () => {
            if (confirm('Выйти из системы?')) {
                Auth.logout();
            }
        });
    },

    /**
     * Set active navigation link
     * @param {string} route - Current route
     */
    setActive(route) {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            const href = link.getAttribute('href').slice(1);
            if (href === route) {
                link.classList.add('text-primary', 'border-primary');
                link.classList.remove('text-gray-600', 'border-transparent');
            } else {
                link.classList.remove('text-primary', 'border-primary');
                link.classList.add('text-gray-600', 'border-transparent');
            }
        });
    }
};
