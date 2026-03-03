/**
 * Global Modal & Notification helpers
 * Provides showModal(), closeModal(), showNotification(), switchPage()
 */

// ── Modal ──────────────────────────────────────────────────────────

let _modalOverlay = null;

function _ensureModalContainer() {
    if (_modalOverlay) return;

    _modalOverlay = document.createElement('div');
    _modalOverlay.id = 'global-modal-overlay';
    _modalOverlay.className = 'fixed inset-0 z-[9998] hidden';
    _modalOverlay.innerHTML = `
        <div class="absolute inset-0 bg-black bg-opacity-50 transition-opacity" onclick="closeModal()"></div>
        <div class="flex items-center justify-center min-h-screen p-4">
            <div id="global-modal-box"
                 class="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto z-[9999] transform transition-all">
                <div class="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 id="global-modal-title" class="text-xl font-bold text-gray-900"></h2>
                    <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600 transition">
                        <i class="fas fa-times text-lg"></i>
                    </button>
                </div>
                <div id="global-modal-body" class="p-6"></div>
            </div>
        </div>
    `;
    document.body.appendChild(_modalOverlay);
}

/**
 * Show a modal dialog
 * @param {string} title - Modal title
 * @param {string} bodyHTML - Inner HTML for the modal body
 */
function showModal(title, bodyHTML) {
    _ensureModalContainer();

    document.getElementById('global-modal-title').textContent = title;
    document.getElementById('global-modal-body').innerHTML = bodyHTML;
    _modalOverlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

/**
 * Close the currently open modal
 */
function closeModal() {
    if (_modalOverlay) {
        _modalOverlay.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

// ── Notifications (delegates to Toast) ─────────────────────────────

/**
 * Show a notification (wrapper around Toast)
 * @param {string} type  - 'success' | 'error' | 'warning' | 'info'
 * @param {string} message
 */
function showNotification(type, message) {
    if (typeof Toast !== 'undefined' && Toast.show) {
        Toast.show(message, type);
    } else {
        // Minimal fallback
        alert(message);
    }
}

// ── Navigation helper ──────────────────────────────────────────────

/**
 * Navigate to a page by its route name
 * @param {string} pageName - e.g. 'inventory', 'dashboard', 'clients'
 */
function switchPage(pageName) {
    window.location.hash = '#' + pageName;
}
