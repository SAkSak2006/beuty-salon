import { createApp } from 'vue';
import App from './App.vue';

// Initialize Telegram Web App
const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
}

// API base URL: in dev uses Vite proxy (/api), in production uses env variable
const API_BASE = import.meta.env.VITE_API_URL || '/api';

const app = createApp(App);
app.provide('telegram', tg);
app.provide('apiBase', API_BASE);
app.mount('#app');
