/**
 * Authentication module for CRM frontend
 * Handles JWT tokens, user session, role checks
 */
const Auth = {
    /**
     * Get current user from localStorage
     */
    getUser() {
        try {
            const user = localStorage.getItem('user');
            return user ? JSON.parse(user) : null;
        } catch {
            return null;
        }
    },

    /**
     * Get access token
     */
    getToken() {
        return localStorage.getItem('accessToken');
    },

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!this.getToken() && !!this.getUser();
    },

    /**
     * Check if user has specific role
     */
    hasRole(...roles) {
        const user = this.getUser();
        return user && roles.includes(user.role);
    },

    /**
     * Logout — clear tokens and redirect to login
     */
    logout() {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login.html';
    },

    /**
     * Refresh access token using refresh token
     */
    async refreshToken() {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
            this.logout();
            return null;
        }

        try {
            const response = await fetch('http://localhost:3000/api/auth/refresh', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken })
            });

            if (!response.ok) {
                this.logout();
                return null;
            }

            const data = await response.json();
            localStorage.setItem('accessToken', data.accessToken);
            return data.accessToken;
        } catch {
            this.logout();
            return null;
        }
    },

    /**
     * Auth guard — redirect to login if not authenticated
     */
    guard() {
        if (!this.isAuthenticated()) {
            window.location.href = '/login.html';
            return false;
        }
        return true;
    }
};
