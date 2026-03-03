/**
 * Form validation utilities
 */

const Validation = {
    /**
     * Validate required field
     * @param {string} value - Field value
     * @returns {object} Validation result
     */
    required(value) {
        const isValid = value && value.trim().length > 0;
        return {
            valid: isValid,
            message: isValid ? '' : 'Это поле обязательно для заполнения'
        };
    },

    /**
     * Validate email
     * @param {string} email - Email address
     * @returns {object} Validation result
     */
    email(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isValid = emailRegex.test(email);
        return {
            valid: isValid,
            message: isValid ? '' : 'Введите корректный email адрес'
        };
    },

    /**
     * Validate phone number
     * @param {string} phone - Phone number
     * @returns {object} Validation result
     */
    phone(phone) {
        // Russian phone format: +7 (XXX) XXX-XX-XX or variations
        const phoneRegex = /^\+?7?\s?\(?\d{3}\)?\s?\d{3}[-\s]?\d{2}[-\s]?\d{2}$/;
        const isValid = phoneRegex.test(phone);
        return {
            valid: isValid,
            message: isValid ? '' : 'Введите корректный номер телефона (например: +7 (999) 123-45-67)'
        };
    },

    /**
     * Validate minimum length
     * @param {string} value - Value to validate
     * @param {number} minLength - Minimum length
     * @returns {object} Validation result
     */
    minLength(value, minLength) {
        const isValid = value.length >= minLength;
        return {
            valid: isValid,
            message: isValid ? '' : `Минимальная длина: ${minLength} символов`
        };
    },

    /**
     * Validate maximum length
     * @param {string} value - Value to validate
     * @param {number} maxLength - Maximum length
     * @returns {object} Validation result
     */
    maxLength(value, maxLength) {
        const isValid = value.length <= maxLength;
        return {
            valid: isValid,
            message: isValid ? '' : `Максимальная длина: ${maxLength} символов`
        };
    },

    /**
     * Validate number
     * @param {string|number} value - Value to validate
     * @returns {object} Validation result
     */
    number(value) {
        const isValid = !isNaN(value) && isFinite(value);
        return {
            valid: isValid,
            message: isValid ? '' : 'Введите корректное число'
        };
    },

    /**
     * Validate positive number
     * @param {string|number} value - Value to validate
     * @returns {object} Validation result
     */
    positiveNumber(value) {
        const num = parseFloat(value);
        const isValid = !isNaN(num) && isFinite(num) && num > 0;
        return {
            valid: isValid,
            message: isValid ? '' : 'Введите положительное число'
        };
    },

    /**
     * Validate integer
     * @param {string|number} value - Value to validate
     * @returns {object} Validation result
     */
    integer(value) {
        const isValid = Number.isInteger(Number(value));
        return {
            valid: isValid,
            message: isValid ? '' : 'Введите целое число'
        };
    },

    /**
     * Validate date
     * @param {string} date - Date string
     * @returns {object} Validation result
     */
    date(date) {
        const dateObj = new Date(date);
        const isValid = dateObj instanceof Date && !isNaN(dateObj);
        return {
            valid: isValid,
            message: isValid ? '' : 'Введите корректную дату'
        };
    },

    /**
     * Validate future date
     * @param {string} date - Date string
     * @returns {object} Validation result
     */
    futureDate(date) {
        const dateObj = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const isValid = dateObj >= today;
        return {
            valid: isValid,
            message: isValid ? '' : 'Дата не может быть в прошлом'
        };
    },

    /**
     * Validate time format
     * @param {string} time - Time string in HH:MM format
     * @returns {object} Validation result
     */
    time(time) {
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        const isValid = timeRegex.test(time);
        return {
            valid: isValid,
            message: isValid ? '' : 'Введите корректное время (например: 14:30)'
        };
    },

    /**
     * Validate price
     * @param {string|number} price - Price value
     * @returns {object} Validation result
     */
    price(price) {
        const priceNum = parseFloat(price);
        const isValid = !isNaN(priceNum) && isFinite(priceNum) && priceNum >= 0;
        return {
            valid: isValid,
            message: isValid ? '' : 'Введите корректную цену'
        };
    },

    /**
     * Validate form fields
     * @param {object} fields - Object with field values and rules
     * @returns {object} Validation results
     */
    validateForm(fields) {
        const errors = {};
        let isValid = true;

        for (const [fieldName, fieldConfig] of Object.entries(fields)) {
            const { value, rules } = fieldConfig;
            const fieldErrors = [];

            for (const rule of rules) {
                let result;

                if (typeof rule === 'string') {
                    // Simple rule like 'required', 'email', etc.
                    result = this[rule](value);
                } else if (typeof rule === 'object') {
                    // Rule with parameters like { name: 'minLength', params: [3] }
                    result = this[rule.name](value, ...rule.params);
                } else if (typeof rule === 'function') {
                    // Custom validation function
                    result = rule(value);
                }

                if (!result.valid) {
                    fieldErrors.push(result.message);
                    isValid = false;
                }
            }

            if (fieldErrors.length > 0) {
                errors[fieldName] = fieldErrors;
            }
        }

        return {
            valid: isValid,
            errors
        };
    },

    /**
     * Display validation errors in form
     * @param {HTMLFormElement} form - Form element
     * @param {object} errors - Errors object from validateForm
     */
    displayErrors(form, errors) {
        // Clear previous errors
        const errorElements = form.querySelectorAll('.error-message');
        errorElements.forEach(el => el.remove());

        const inputsWithErrors = form.querySelectorAll('.border-red-500');
        inputsWithErrors.forEach(input => {
            input.classList.remove('border-red-500');
        });

        // Display new errors
        for (const [fieldName, fieldErrors] of Object.entries(errors)) {
            const field = form.querySelector(`[name="${fieldName}"]`);
            if (field) {
                field.classList.add('border-red-500');

                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-message text-red-500 text-sm mt-1';
                errorDiv.textContent = fieldErrors[0]; // Show first error

                field.parentElement.appendChild(errorDiv);
            }
        }
    },

    /**
     * Clear all validation errors in form
     * @param {HTMLFormElement} form - Form element
     */
    clearErrors(form) {
        const errorElements = form.querySelectorAll('.error-message');
        errorElements.forEach(el => el.remove());

        const inputsWithErrors = form.querySelectorAll('.border-red-500');
        inputsWithErrors.forEach(input => {
            input.classList.remove('border-red-500');
        });
    },

    /**
     * Sanitize HTML to prevent XSS
     * @param {string} html - HTML string
     * @returns {string} Sanitized string
     */
    sanitizeHTML(html) {
        const div = document.createElement('div');
        div.textContent = html;
        return div.innerHTML;
    },

    /**
     * Format phone number to standard format
     * @param {string} phone - Phone number
     * @returns {string} Formatted phone number
     */
    formatPhone(phone) {
        // Remove all non-digit characters
        const cleaned = phone.replace(/\D/g, '');

        // Format to +7 (XXX) XXX-XX-XX
        if (cleaned.length === 11 && cleaned[0] === '7') {
            return `+7 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 9)}-${cleaned.slice(9, 11)}`;
        } else if (cleaned.length === 10) {
            return `+7 (${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 8)}-${cleaned.slice(8, 10)}`;
        }

        return phone;
    }
};
