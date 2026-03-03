<template>
  <div>
    <h2 class="section-title">Выберите услугу</h2>

    <div v-if="loading" class="hint" style="text-align:center;padding:40px">
      Загрузка услуг...
    </div>

    <div v-else>
      <div v-for="category in categories" :key="category.id" style="margin-bottom:20px">
        <div class="hint" style="margin-bottom:8px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">
          {{ category.name }}
        </div>
        <div
          v-for="service in category.services"
          :key="service.id"
          class="card"
          @click="$emit('select', service)"
        >
          <div style="font-weight:600;margin-bottom:4px">{{ service.name }}</div>
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span class="hint">{{ formatDuration(service.duration) }}</span>
            <span style="font-weight:700;font-size:16px">{{ service.price }} ₽</span>
          </div>
          <div v-if="service.description" class="hint" style="margin-top:4px">
            {{ service.description }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, inject, onMounted } from 'vue';

export default {
  emits: ['select'],
  setup() {
    const apiBase = inject('apiBase');
    const categories = ref([]);
    const loading = ref(true);

    onMounted(async () => {
      try {
        const res = await fetch(`${apiBase}/booking/services`);
        categories.value = await res.json();
      } catch (err) {
        console.error('Failed to load services:', err);
      } finally {
        loading.value = false;
      }
    });

    function formatDuration(minutes) {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return h > 0 ? `${h}ч${m > 0 ? ` ${m}мин` : ''}` : `${m}мин`;
    }

    return { categories, loading, formatDuration };
  }
};
</script>
