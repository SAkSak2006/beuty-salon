/**
 * Date utilities for formatting and manipulating dates
 */

const DateUtils = {
    /**
     * Format date to readable string
     * @param {Date|string} date - Date object or ISO string
     * @param {string} format - Format type: 'short', 'long', 'time', 'datetime'
     * @returns {string} Formatted date string
     */
    formatDate(date, format = 'short') {
        const d = typeof date === 'string' ? new Date(date) : date;

        const options = {
            short: { year: 'numeric', month: '2-digit', day: '2-digit' },
            long: { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' },
            time: { hour: '2-digit', minute: '2-digit' },
            datetime: { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }
        };

        return d.toLocaleDateString('ru-RU', options[format] || options.short);
    },

    /**
     * Format time
     * @param {string} time - Time string in HH:MM format
     * @returns {string} Formatted time
     */
    formatTime(time) {
        return time;
    },

    /**
     * Get current date in YYYY-MM-DD format
     * @returns {string} Current date
     */
    getCurrentDate() {
        return new Date().toISOString().split('T')[0];
    },

    /**
     * Get current time in HH:MM format
     * @returns {string} Current time
     */
    getCurrentTime() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    },

    /**
     * Add days to date
     * @param {Date|string} date - Starting date
     * @param {number} days - Number of days to add
     * @returns {string} New date in YYYY-MM-DD format
     */
    addDays(date, days) {
        const d = typeof date === 'string' ? new Date(date) : new Date(date);
        d.setDate(d.getDate() + days);
        return d.toISOString().split('T')[0];
    },

    /**
     * Get day of week
     * @param {Date|string} date - Date
     * @returns {number} Day of week (0 = Sunday, 6 = Saturday)
     */
    getDayOfWeek(date) {
        const d = typeof date === 'string' ? new Date(date) : date;
        return d.getDay();
    },

    /**
     * Get day name
     * @param {number} dayOfWeek - Day of week (0-6)
     * @returns {string} Day name in Russian
     */
    getDayName(dayOfWeek) {
        const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
        return days[dayOfWeek];
    },

    /**
     * Get month name
     * @param {number} month - Month number (0-11)
     * @returns {string} Month name in Russian
     */
    getMonthName(month) {
        const months = [
            'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
            'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
        ];
        return months[month];
    },

    /**
     * Check if date is today
     * @param {Date|string} date - Date to check
     * @returns {boolean} True if date is today
     */
    isToday(date) {
        const d = typeof date === 'string' ? new Date(date) : date;
        const today = new Date();
        return d.toDateString() === today.toDateString();
    },

    /**
     * Check if date is in the past
     * @param {Date|string} date - Date to check
     * @returns {boolean} True if date is in the past
     */
    isPast(date) {
        const d = typeof date === 'string' ? new Date(date) : date;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return d < today;
    },

    /**
     * Check if date is in the future
     * @param {Date|string} date - Date to check
     * @returns {boolean} True if date is in the future
     */
    isFuture(date) {
        const d = typeof date === 'string' ? new Date(date) : date;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return d > today;
    },

    /**
     * Get difference in days between two dates
     * @param {Date|string} date1 - First date
     * @param {Date|string} date2 - Second date
     * @returns {number} Difference in days
     */
    getDaysDifference(date1, date2) {
        const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
        const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
        const diffTime = Math.abs(d2 - d1);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    },

    /**
     * Get start of week
     * @param {Date|string} date - Date
     * @returns {string} Start of week in YYYY-MM-DD format
     */
    getStartOfWeek(date) {
        const d = typeof date === 'string' ? new Date(date) : new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
        const monday = new Date(d.setDate(diff));
        return monday.toISOString().split('T')[0];
    },

    /**
     * Get end of week
     * @param {Date|string} date - Date
     * @returns {string} End of week in YYYY-MM-DD format
     */
    getEndOfWeek(date) {
        const startOfWeek = this.getStartOfWeek(date);
        return this.addDays(startOfWeek, 6);
    },

    /**
     * Get start of month
     * @param {Date|string} date - Date
     * @returns {string} Start of month in YYYY-MM-DD format
     */
    getStartOfMonth(date) {
        const d = typeof date === 'string' ? new Date(date) : new Date(date);
        return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
    },

    /**
     * Get end of month
     * @param {Date|string} date - Date
     * @returns {string} End of month in YYYY-MM-DD format
     */
    getEndOfMonth(date) {
        const d = typeof date === 'string' ? new Date(date) : new Date(date);
        return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
    },

    /**
     * Parse time string and add duration in minutes
     * @param {string} time - Time in HH:MM format
     * @param {number} duration - Duration in minutes
     * @returns {string} New time in HH:MM format
     */
    addMinutesToTime(time, duration) {
        const [hours, minutes] = time.split(':').map(Number);
        const totalMinutes = hours * 60 + minutes + duration;
        const newHours = Math.floor(totalMinutes / 60) % 24;
        const newMinutes = totalMinutes % 60;
        return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
    },

    /**
     * Compare two times
     * @param {string} time1 - First time in HH:MM format
     * @param {string} time2 - Second time in HH:MM format
     * @returns {number} -1 if time1 < time2, 0 if equal, 1 if time1 > time2
     */
    compareTimes(time1, time2) {
        const [h1, m1] = time1.split(':').map(Number);
        const [h2, m2] = time2.split(':').map(Number);
        const total1 = h1 * 60 + m1;
        const total2 = h2 * 60 + m2;

        if (total1 < total2) return -1;
        if (total1 > total2) return 1;
        return 0;
    }
};
