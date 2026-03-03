/**
 * Easter Eggs and Special Effects
 * Adds fun hidden features to the application
 */

// Konami Code Easter Egg
class KonamiCode {
    constructor() {
        this.pattern = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
                       'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
                       'b', 'a'];
        this.current = 0;
        this.init();
    }

    init() {
        document.addEventListener('keydown', (e) => {
            const key = e.key;

            // Check if the key matches the pattern
            if (key === this.pattern[this.current]) {
                this.current++;

                if (this.current === this.pattern.length) {
                    this.activate();
                    this.current = 0;
                }
            } else {
                this.current = 0;
            }
        });
    }

    activate() {
        console.log('🎮 Konami Code Activated!');
        this.showSpecialEffects();
        this.showSecretMessage();
    }

    showSpecialEffects() {
        // Rainbow effect
        document.body.style.animation = 'rainbow 2s linear infinite';

        // Add rainbow animation if not exists
        if (!document.getElementById('konami-styles')) {
            const style = document.createElement('style');
            style.id = 'konami-styles';
            style.textContent = `
                @keyframes rainbow {
                    0% { filter: hue-rotate(0deg); }
                    100% { filter: hue-rotate(360deg); }
                }
                .matrix-rain {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                    z-index: 9999;
                }
            `;
            document.head.appendChild(style);
        }

        // Matrix rain effect
        this.createMatrixRain();

        // Stop after 10 seconds
        setTimeout(() => {
            document.body.style.animation = '';
            const canvas = document.querySelector('.matrix-rain');
            if (canvas) canvas.remove();
        }, 10000);
    }

    createMatrixRain() {
        const canvas = document.createElement('canvas');
        canvas.className = 'matrix-rain';
        document.body.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const characters = '01アイウエオカキクケコサシスセソタチツテト';
        const fontSize = 14;
        const columns = canvas.width / fontSize;
        const drops = Array(Math.floor(columns)).fill(1);

        function draw() {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = '#0f0';
            ctx.font = fontSize + 'px monospace';

            for (let i = 0; i < drops.length; i++) {
                const text = characters[Math.floor(Math.random() * characters.length)];
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);

                if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        }

        const interval = setInterval(draw, 33);
        setTimeout(() => clearInterval(interval), 10000);
    }

    showSecretMessage() {
        if (window.showToast) {
            window.showToast('🎮 Секретный код активирован! Вы нашли пасхалку!', 'success');
        }

        // Add special badge to localStorage
        const achievements = JSON.parse(localStorage.getItem('achievements') || '[]');
        if (!achievements.includes('konami')) {
            achievements.push('konami');
            localStorage.setItem('achievements', JSON.stringify(achievements));
        }
    }
}

// Holiday Greetings
class HolidayGreetings {
    constructor() {
        this.holidays = {
            '01-01': { name: 'Новый год', emoji: '🎄', message: 'С Новым Годом!' },
            '02-14': { name: 'День святого Валентина', emoji: '💝', message: 'С Днём всех влюблённых!' },
            '02-23': { name: 'День защитника Отечества', emoji: '🎖️', message: 'С 23 февраля!' },
            '03-08': { name: 'Международный женский день', emoji: '🌸', message: 'С 8 марта!' },
            '05-01': { name: 'День труда', emoji: '🛠️', message: 'С Праздником весны и труда!' },
            '05-09': { name: 'День Победы', emoji: '🎗️', message: 'С Днём Победы!' },
            '06-12': { name: 'День России', emoji: '🇷🇺', message: 'С Днём России!' },
            '09-01': { name: 'День знаний', emoji: '📚', message: 'С Днём знаний!' },
            '10-31': { name: 'Хэллоуин', emoji: '🎃', message: 'Счастливого Хэллоуина!' },
            '11-04': { name: 'День народного единства', emoji: '🤝', message: 'С Днём народного единства!' },
            '12-25': { name: 'Рождество', emoji: '🎄', message: 'Счастливого Рождества!' },
            '12-31': { name: 'Новый год', emoji: '🎊', message: 'С наступающим Новым Годом!' }
        };

        this.checkHoliday();
        this.applySeasonalTheme();
    }

    checkHoliday() {
        const today = new Date();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const dateKey = `${month}-${day}`;

        if (this.holidays[dateKey]) {
            this.showHolidayGreeting(this.holidays[dateKey]);
        }

        // Check if it's the system's birthday (project creation date)
        if (month === '12' && day === '01') {
            this.showBirthdayGreeting();
        }
    }

    showHolidayGreeting(holiday) {
        // Add holiday decoration to header
        const header = document.querySelector('header') || document.querySelector('nav');
        if (header) {
            const decoration = document.createElement('div');
            decoration.className = 'holiday-decoration';
            decoration.innerHTML = `
                <div class="text-center py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold">
                    ${holiday.emoji} ${holiday.message} ${holiday.emoji}
                </div>
            `;
            header.insertBefore(decoration, header.firstChild);
        }

        // Show toast notification
        if (window.showToast) {
            setTimeout(() => {
                window.showToast(`${holiday.emoji} ${holiday.message}`, 'success');
            }, 1000);
        }

        // Add festive confetti
        setTimeout(() => {
            this.launchConfetti();
        }, 500);
    }

    showBirthdayGreeting() {
        const message = '🎂 День рождения BeautySalon! Системе исполнился год!';

        if (window.showToast) {
            window.showToast(message, 'success');
        }

        // Special birthday animation
        this.launchConfetti();

        // Play birthday animation
        setTimeout(() => this.launchConfetti(), 1000);
        setTimeout(() => this.launchConfetti(), 2000);
    }

    applySeasonalTheme() {
        const month = new Date().getMonth() + 1;

        // Winter theme (December, January, February)
        if (month === 12 || month === 1 || month === 2) {
            this.applyWinterTheme();
        }

        // Spring theme (March, April, May)
        else if (month >= 3 && month <= 5) {
            this.applySpringTheme();
        }

        // Autumn theme (September, October, November)
        else if (month >= 9 && month <= 11) {
            this.applyAutumnTheme();
        }
    }

    applyWinterTheme() {
        // Add snowflakes
        if (localStorage.getItem('seasonal_effects') !== 'false') {
            this.createSnowflakes();
        }
    }

    applySpringTheme() {
        // Lighter, fresher colors - subtle effect
        const style = document.createElement('style');
        style.id = 'spring-theme';
        style.textContent = `
            :root {
                --spring-accent: rgba(76, 175, 80, 0.1);
            }
        `;
        document.head.appendChild(style);
    }

    applyAutumnTheme() {
        // Warm autumn colors - subtle effect
        const style = document.createElement('style');
        style.id = 'autumn-theme';
        style.textContent = `
            :root {
                --autumn-accent: rgba(255, 152, 0, 0.1);
            }
        `;
        document.head.appendChild(style);
    }

    createSnowflakes() {
        const snowContainer = document.createElement('div');
        snowContainer.id = 'snowflakes';
        snowContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9999;
        `;
        document.body.appendChild(snowContainer);

        const snowflakeChars = ['❄', '❅', '❆'];

        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                const snowflake = document.createElement('div');
                snowflake.textContent = snowflakeChars[Math.floor(Math.random() * snowflakeChars.length)];
                snowflake.style.cssText = `
                    position: absolute;
                    top: -20px;
                    left: ${Math.random() * 100}%;
                    font-size: ${Math.random() * 20 + 10}px;
                    opacity: ${Math.random() * 0.5 + 0.3};
                    animation: snowfall ${Math.random() * 10 + 10}s linear infinite;
                    animation-delay: ${Math.random() * 5}s;
                `;
                snowContainer.appendChild(snowflake);
            }, i * 100);
        }

        // Add snowfall animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes snowfall {
                to {
                    transform: translateY(100vh) rotate(360deg);
                }
            }
        `;
        document.head.appendChild(style);
    }

    launchConfetti() {
        const count = 150;
        const colors = ['#ec4899', '#8b5cf6', '#f472b6', '#a78bfa', '#fb7185'];

        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.style.cssText = `
                    position: fixed;
                    width: ${Math.random() * 10 + 5}px;
                    height: ${Math.random() * 10 + 5}px;
                    background: ${colors[Math.floor(Math.random() * colors.length)]};
                    left: ${Math.random() * 100}%;
                    top: -10px;
                    opacity: 1;
                    transform: rotate(${Math.random() * 360}deg);
                    z-index: 9999;
                    pointer-events: none;
                    animation: confetti-fall ${Math.random() * 3 + 2}s linear forwards;
                `;
                document.body.appendChild(confetti);

                setTimeout(() => confetti.remove(), 5000);
            }, i * 10);
        }

        // Add confetti animation if not exists
        if (!document.getElementById('confetti-styles')) {
            const style = document.createElement('style');
            style.id = 'confetti-styles';
            style.textContent = `
                @keyframes confetti-fall {
                    to {
                        transform: translateY(100vh) rotate(720deg);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
}

// 100th Client Celebration
class MilestoneTracker {
    constructor() {
        this.checkMilestones();
    }

    checkMilestones() {
        // Check for 100th client
        if (window.beautyDB) {
            const db = window.beautyDB.getDatabase();
            const clientCount = db.clients.length;

            // Check if we just reached 100 clients
            const lastCount = parseInt(localStorage.getItem('lastClientCount') || '0');

            if (clientCount >= 100 && lastCount < 100) {
                this.celebrate100thClient();
            }

            // Update count
            localStorage.setItem('lastClientCount', clientCount.toString());

            // Check other milestones
            if (clientCount === 500 && lastCount < 500) {
                this.celebrateMilestone(500, '500 клиентов!');
            }
            if (clientCount === 1000 && lastCount < 1000) {
                this.celebrateMilestone(1000, '1000 клиентов!');
            }
        }
    }

    celebrate100thClient() {
        console.log('🎉 100th Client Milestone!');

        // Show celebration toast
        if (window.showToast) {
            window.showToast('🎊 Поздравляем! У вас 100-й клиент!', 'success');
        }

        // Launch massive confetti
        const holidaySystem = new HolidayGreetings();
        holidaySystem.launchConfetti();

        setTimeout(() => {
            holidaySystem.launchConfetti();
        }, 1000);

        setTimeout(() => {
            holidaySystem.launchConfetti();
        }, 2000);

        // Add achievement
        const achievements = JSON.parse(localStorage.getItem('achievements') || '[]');
        if (!achievements.includes('100_clients')) {
            achievements.push('100_clients');
            localStorage.setItem('achievements', JSON.stringify(achievements));
        }

        // Show special modal
        this.showMilestoneModal('🎊 Поздравляем!',
            'У вас уже 100 клиентов! Ваш салон красоты процветает!',
            '🎉');
    }

    celebrateMilestone(count, message) {
        if (window.showToast) {
            window.showToast(`🎉 ${message}`, 'success');
        }

        const holidaySystem = new HolidayGreetings();
        holidaySystem.launchConfetti();

        const achievements = JSON.parse(localStorage.getItem('achievements') || '[]');
        const achievementKey = `${count}_clients`;
        if (!achievements.includes(achievementKey)) {
            achievements.push(achievementKey);
            localStorage.setItem('achievements', JSON.stringify(achievements));
        }
    }

    showMilestoneModal(title, message, emoji) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-8 max-w-md text-center transform scale-0 transition-transform duration-300">
                <div class="text-6xl mb-4 animate-bounce">${emoji}</div>
                <h2 class="text-3xl font-bold text-pink-600 mb-4">${title}</h2>
                <p class="text-gray-600 mb-6">${message}</p>
                <button onclick="this.closest('.fixed').remove()"
                        class="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-pink-600 hover:to-purple-700 transition">
                    Спасибо! 🎉
                </button>
            </div>
        `;
        document.body.appendChild(modal);

        // Animate in
        setTimeout(() => {
            modal.querySelector('.bg-white').style.transform = 'scale(1)';
        }, 10);
    }
}

// Achievement System
class AchievementSystem {
    constructor() {
        this.achievements = {
            'konami': { name: 'Мастер кода', description: 'Активировал Konami Code', icon: '🎮' },
            '100_clients': { name: 'Популярный салон', description: '100 клиентов', icon: '🎊' },
            '500_clients': { name: 'Известный салон', description: '500 клиентов', icon: '⭐' },
            '1000_clients': { name: 'Легендарный салон', description: '1000 клиентов', icon: '👑' },
            'first_week': { name: 'Активный пользователь', description: 'Использование в течение недели', icon: '📅' },
            'power_user': { name: 'Опытный пользователь', description: 'Использовал все горячие клавиши', icon: '⌨️' }
        };
    }

    getUnlockedAchievements() {
        return JSON.parse(localStorage.getItem('achievements') || '[]');
    }

    showAchievements() {
        const unlocked = this.getUnlockedAchievements();
        const totalAchievements = Object.keys(this.achievements).length;

        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold text-gray-800">
                        🏆 Достижения (${unlocked.length}/${totalAchievements})
                    </h2>
                    <button onclick="this.closest('.fixed').remove()"
                            class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                <div class="grid gap-4">
                    ${Object.entries(this.achievements).map(([key, achievement]) => {
                        const isUnlocked = unlocked.includes(key);
                        return `
                            <div class="p-4 rounded-lg border-2 ${isUnlocked ? 'border-pink-500 bg-pink-50' : 'border-gray-200 bg-gray-50 opacity-50'}">
                                <div class="flex items-center gap-4">
                                    <div class="text-4xl ${isUnlocked ? '' : 'grayscale'}">${achievement.icon}</div>
                                    <div class="flex-1">
                                        <h3 class="font-bold text-lg ${isUnlocked ? 'text-pink-600' : 'text-gray-500'}">
                                            ${achievement.name}
                                        </h3>
                                        <p class="text-sm text-gray-600">${achievement.description}</p>
                                    </div>
                                    ${isUnlocked ? '<i class="fas fa-check-circle text-green-500 text-2xl"></i>' : '<i class="fas fa-lock text-gray-400 text-2xl"></i>'}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
}

// Initialize all Easter Eggs
function initEasterEggs() {
    console.log('🥚 Initializing Easter Eggs...');

    // Konami Code
    new KonamiCode();

    // Holiday Greetings
    new HolidayGreetings();

    // Milestone Tracker
    const milestoneTracker = new MilestoneTracker();

    // Achievement System
    window.achievementSystem = new AchievementSystem();

    // Check milestones when clients change
    if (window.beautyDB) {
        const originalAddClient = window.beautyDB.addClient;
        if (originalAddClient) {
            window.beautyDB.addClient = function(...args) {
                const result = originalAddClient.apply(this, args);
                milestoneTracker.checkMilestones();
                return result;
            };
        }
    }

    console.log('✨ Easter Eggs Ready!');
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEasterEggs);
} else {
    initEasterEggs();
}
