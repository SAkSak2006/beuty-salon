<template>
  <div class="app" :style="themeStyles">
    <StepIndicator v-if="step <= 5" :current="step" :total="5" />

    <ServiceSelect
      v-if="step === 1"
      @select="onServiceSelect"
    />
    <MasterSelect
      v-if="step === 2"
      :service-id="booking.serviceId"
      @select="onMasterSelect"
      @back="step--"
    />
    <DateSelect
      v-if="step === 3"
      :employee-id="booking.employeeId"
      :service-id="booking.serviceId"
      @select="onDateSelect"
      @back="step--"
    />
    <TimeSelect
      v-if="step === 4"
      :employee-id="booking.employeeId"
      :service-id="booking.serviceId"
      :date="booking.date"
      @select="onTimeSelect"
      @back="step--"
    />
    <Confirmation
      v-if="step === 5"
      :booking="booking"
      :confirming="confirming"
      @confirm="onConfirm"
      @back="step--"
    />

    <!-- Success screen -->
    <div v-if="step === 6" class="success-screen">
      <div class="success-icon">✅</div>
      <h2 class="section-title" style="text-align:center">Вы записаны!</h2>
      <p class="hint" style="text-align:center;margin-bottom:24px">
        {{ booking.serviceName }} — {{ formatDate(booking.date) }} в {{ booking.time }}
      </p>
      <button class="btn" @click="closeMiniApp">Закрыть</button>
    </div>
  </div>
</template>

<script>
import { ref, computed, inject } from 'vue';
import StepIndicator from './components/StepIndicator.vue';
import ServiceSelect from './components/ServiceSelect.vue';
import MasterSelect from './components/MasterSelect.vue';
import DateSelect from './components/DateSelect.vue';
import TimeSelect from './components/TimeSelect.vue';
import Confirmation from './components/Confirmation.vue';

export default {
  components: { StepIndicator, ServiceSelect, MasterSelect, DateSelect, TimeSelect, Confirmation },
  setup() {
    const tg = inject('telegram');
    const apiBase = inject('apiBase');
    const step = ref(1);
    const confirming = ref(false);

    const booking = ref({
      serviceId: null,
      serviceName: '',
      servicePrice: 0,
      serviceDuration: 0,
      employeeId: null,
      employeeName: '',
      date: '',
      time: ''
    });

    const themeStyles = computed(() => {
      if (!tg) return {};
      return {
        '--bg-color': tg.themeParams?.bg_color || '#ffffff',
        '--text-color': tg.themeParams?.text_color || '#000000',
        '--hint-color': tg.themeParams?.hint_color || '#999999',
        '--link-color': tg.themeParams?.link_color || '#2481cc',
        '--button-color': tg.themeParams?.button_color || '#ec4899',
        '--button-text': tg.themeParams?.button_text_color || '#ffffff',
        '--secondary-bg': tg.themeParams?.secondary_bg_color || '#f5f5f5',
      };
    });

    function onServiceSelect(service) {
      booking.value.serviceId = service.id;
      booking.value.serviceName = service.name;
      booking.value.servicePrice = service.price;
      booking.value.serviceDuration = service.duration;
      step.value = 2;
    }

    function onMasterSelect(master) {
      booking.value.employeeId = master.id;
      booking.value.employeeName = master.name;
      step.value = 3;
    }

    function onDateSelect(date) {
      booking.value.date = date;
      step.value = 4;
    }

    function onTimeSelect(time) {
      booking.value.time = time;
      step.value = 5;
    }

    async function onConfirm() {
      if (confirming.value) return;
      confirming.value = true;

      try {
        const telegramId = tg?.initDataUnsafe?.user?.id;

        const res = await fetch(`${apiBase}/booking/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serviceId: booking.value.serviceId,
            employeeId: booking.value.employeeId,
            date: booking.value.date,
            time: booking.value.time,
            telegramId,
            clientName: tg?.initDataUnsafe?.user?.first_name || 'Клиент'
          })
        });

        const data = await res.json();

        if (res.ok) {
          // Send data back to bot via sendData (will trigger web_app_data event in bot)
          if (tg && tg.sendData) {
            try {
              tg.sendData(JSON.stringify({
                action: 'booking_created',
                appointment: {
                  id: data.id,
                  service: booking.value.serviceName,
                  master: booking.value.employeeName,
                  date: booking.value.date,
                  time: booking.value.time,
                  price: booking.value.servicePrice
                }
              }));
            } catch (e) {
              // sendData closes the app, so show success screen as fallback
              console.log('sendData sent, app closing...');
            }
          }

          // Show success screen (in case sendData doesn't close the app or not in Telegram)
          step.value = 6;
        } else {
          const errMsg = data.error || 'Ошибка при записи';
          if (tg) {
            tg.showAlert(errMsg);
          } else {
            alert(errMsg);
          }
        }
      } catch (err) {
        console.error('Booking error:', err);
        const errMsg = 'Произошла ошибка. Попробуйте позже.';
        if (tg) {
          tg.showAlert(errMsg);
        } else {
          alert(errMsg);
        }
      } finally {
        confirming.value = false;
      }
    }

    function formatDate(dateStr) {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    }

    function closeMiniApp() {
      if (tg) {
        tg.close();
      }
    }

    return {
      step, booking, confirming, themeStyles,
      onServiceSelect, onMasterSelect, onDateSelect, onTimeSelect, onConfirm,
      formatDate, closeMiniApp
    };
  }
};
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: var(--tg-theme-bg-color, #ffffff);
  color: var(--tg-theme-text-color, #000000);
}

.app {
  max-width: 100%;
  min-height: 100vh;
  padding: 16px;
  background: var(--bg-color, #ffffff);
  color: var(--text-color, #000000);
}

.btn {
  display: block;
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
  background: var(--button-color, #ec4899);
  color: var(--button-text, #ffffff);
}

.btn:active {
  opacity: 0.7;
}

.btn:disabled {
  opacity: 0.5;
  cursor: default;
}

.btn-secondary {
  background: var(--secondary-bg, #f5f5f5);
  color: var(--text-color, #000000);
}

.card {
  background: var(--secondary-bg, #f5f5f5);
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: transform 0.15s;
  border: 2px solid transparent;
}

.card:active {
  transform: scale(0.98);
}

.card.selected {
  border-color: var(--button-color, #ec4899);
}

.section-title {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 16px;
}

.hint {
  color: var(--hint-color, #999999);
  font-size: 13px;
}

.back-btn {
  background: none;
  border: none;
  color: var(--link-color, #2481cc);
  font-size: 15px;
  cursor: pointer;
  padding: 8px 0;
  margin-bottom: 12px;
}

.success-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}

.success-icon {
  font-size: 64px;
  margin-bottom: 16px;
}
</style>
