/**
 * Navigation component
 */

const Navigation = {
    /**
     * Initialize navigation
     */
    init() {
        this.setupNavLinks();
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
        // Just update active state
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
