require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { Bot, Keyboard, InlineKeyboard } = require('grammy');
const fetch = require('node-fetch');

const BOT_TOKEN = process.env.BOT_TOKEN;
const API_URL = process.env.API_URL || 'http://localhost:3000/api';
const MINI_APP_URL = process.env.MINI_APP_URL || 'https://your-mini-app-url.com';

if (!BOT_TOKEN || BOT_TOKEN === 'YOUR_BOT_TOKEN_HERE') {
  console.error('BOT_TOKEN not set in .env file!');
  console.log('1. Go to @BotFather in Telegram');
  console.log('2. Create a new bot with /newbot');
  console.log('3. Copy the token to .env file as BOT_TOKEN=...');
  process.exit(1);
}

const bot = new Bot(BOT_TOKEN);

// ==================== API HELPERS ====================

async function apiCall(endpoint) {
  try {
    const res = await fetch(`${API_URL}${endpoint}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('API call error:', err.message);
    return null;
  }
}

async function apiPost(endpoint, body) {
  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return await res.json();
  } catch (err) {
    console.error('API POST error:', err.message);
    return null;
  }
}

async function apiDelete(endpoint) {
  try {
    const res = await fetch(`${API_URL}${endpoint}`, { method: 'DELETE' });
    return await res.json();
  } catch (err) {
    console.error('API DELETE error:', err.message);
    return null;
  }
}

// ==================== TELEGRAM USER ====================

async function saveTelegramUser(ctx) {
  const user = ctx.from;
  try {
    await apiPost('/booking/telegram-user', {
      telegramId: user.id,
      firstName: user.first_name,
      lastName: user.last_name || '',
      username: user.username || ''
    });
  } catch (err) {
    console.error('Save user error:', err.message);
  }
}

// ==================== KEYBOARDS ====================

function getMainKeyboard() {
  return new Keyboard()
    .text('📋 Записаться').text('📅 Мои записи')
    .row()
    .text('💇 Услуги и цены').text('ℹ️ О салоне')
    .row()
    .requestContact('📱 Отправить номер телефона')
    .resized();
}

function getMainKeyboardWithoutPhone() {
  return new Keyboard()
    .text('📋 Записаться').text('📅 Мои записи')
    .row()
    .text('💇 Услуги и цены').text('ℹ️ О салоне')
    .resized();
}

// ==================== COMMAND HANDLERS ====================

// /start
bot.command('start', async (ctx) => {
  await saveTelegramUser(ctx);

  await ctx.reply(
    `Добро пожаловать в *салон красоты Мелисса*! 💇‍♀️\n\n` +
    `Я помогу вам записаться на процедуру, посмотреть услуги и цены, а также управлять вашими записями.\n\n` +
    `Для привязки номера телефона нажмите кнопку "📱 Отправить номер телефона".\n\n` +
    `Выберите действие из меню ниже:`,
    {
      parse_mode: 'Markdown',
      reply_markup: getMainKeyboard()
    }
  );
});

// /help
bot.command('help', async (ctx) => {
  await ctx.reply(
    `*Доступные команды:*\n\n` +
    `📋 *Записаться* — забронировать визит\n` +
    `📅 *Мои записи* — просмотр и отмена записей\n` +
    `💇 *Услуги и цены* — каталог услуг\n` +
    `ℹ️ *О салоне* — контакты и часы работы\n` +
    `📱 *Отправить номер* — привязать телефон к профилю`,
    { parse_mode: 'Markdown', reply_markup: getMainKeyboard() }
  );
});

// ==================== CONTACT HANDLER ====================

bot.on('message:contact', async (ctx) => {
  const contact = ctx.message.contact;

  // Only process if user shares their own contact
  if (contact.user_id !== ctx.from.id) {
    return ctx.reply('Пожалуйста, отправьте свой собственный контакт.');
  }

  const phone = contact.phone_number;

  const result = await apiPost('/booking/telegram-user', {
    telegramId: ctx.from.id,
    firstName: ctx.from.first_name,
    lastName: ctx.from.last_name || '',
    username: ctx.from.username || '',
    phone: phone
  });

  if (result && result.success) {
    await ctx.reply(
      `✅ Номер телефона *${phone}* привязан к вашему профилю!\n\n` +
      `Теперь ваши записи будут автоматически связаны с вашим аккаунтом.`,
      { parse_mode: 'Markdown', reply_markup: getMainKeyboardWithoutPhone() }
    );
  } else {
    await ctx.reply('Не удалось сохранить номер телефона. Попробуйте позже.');
  }
});

// ==================== WEB APP DATA HANDLER ====================

// When Mini App sends booking result back to bot
bot.on('message:web_app_data', async (ctx) => {
  try {
    const data = JSON.parse(ctx.message.web_app_data.data);

    if (data.action === 'booking_created' && data.appointment) {
      const apt = data.appointment;
      const date = new Date(apt.date).toLocaleDateString('ru-RU', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });

      await ctx.reply(
        `✅ *Запись подтверждена!*\n\n` +
        `💇 Услуга: ${apt.service}\n` +
        `👩‍🎨 Мастер: ${apt.master}\n` +
        `📆 Дата: ${date}\n` +
        `🕐 Время: ${apt.time}\n` +
        `💰 Стоимость: ${apt.price} ₽\n\n` +
        `Мы ждём вас! Для просмотра или отмены записи нажмите "📅 Мои записи".`,
        { parse_mode: 'Markdown', reply_markup: getMainKeyboardWithoutPhone() }
      );
    }
  } catch (err) {
    console.error('webAppData parse error:', err.message);
    await ctx.reply('Запись создана! Проверьте раздел "📅 Мои записи".',
      { reply_markup: getMainKeyboardWithoutPhone() }
    );
  }
});

// ==================== TEXT HANDLERS ====================

// "Записаться"
bot.hears('📋 Записаться', async (ctx) => {
  const keyboard = new InlineKeyboard()
    .webApp('🗓 Открыть бронирование', MINI_APP_URL);

  await ctx.reply(
    '📋 *Запись на процедуру*\n\nНажмите кнопку ниже, чтобы выбрать услугу, мастера и удобное время:',
    { parse_mode: 'Markdown', reply_markup: keyboard }
  );
});

// "Мои записи"
bot.hears('📅 Мои записи', async (ctx) => {
  const telegramId = ctx.from.id;
  const appointments = await apiCall(`/booking/my?telegramId=${telegramId}`);

  if (!appointments || appointments.length === 0) {
    return ctx.reply(
      'У вас пока нет предстоящих записей.\n\n📋 Нажмите "Записаться" для бронирования!',
      { reply_markup: getMainKeyboardWithoutPhone() }
    );
  }

  await ctx.reply(`📅 *Ваши записи (${appointments.length}):*`, { parse_mode: 'Markdown' });

  for (const apt of appointments) {
    const date = new Date(apt.date).toLocaleDateString('ru-RU', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    const keyboard = new InlineKeyboard()
      .text('❌ Отменить запись', `cancel_${apt.id}`);

    await ctx.reply(
      `💇 *${apt.serviceName || 'Услуга'}*\n` +
      `👩‍🎨 Мастер: ${apt.employeeName || 'Не указан'}\n` +
      `📆 ${date}\n` +
      `🕐 Время: ${apt.time}\n` +
      `💰 ${apt.price} ₽`,
      { parse_mode: 'Markdown', reply_markup: keyboard }
    );
  }
});

// "Услуги и цены"
bot.hears('💇 Услуги и цены', async (ctx) => {
  const categories = await apiCall('/booking/services');

  if (!categories || categories.length === 0) {
    return ctx.reply('Список услуг пока пуст. Попробуйте позже.');
  }

  const keyboard = new InlineKeyboard();
  categories.forEach((cat, i) => {
    keyboard.text(cat.name, `category_${cat.id}`);
    if (i % 2 === 1) keyboard.row();
  });

  await ctx.reply('💇 *Выберите категорию услуг:*', {
    parse_mode: 'Markdown',
    reply_markup: keyboard
  });
});

// "О салоне"
bot.hears('ℹ️ О салоне', async (ctx) => {
  await ctx.reply(
    `🏪 *салон красоты Мелисса*\n\n` +
    `📍 Адрес: г. Мегион, ул. Примерная, д. 1\n` +
    `📞 Телефон: +7 (999) 123-45-67\n` +
    `🕐 Режим работы:\n` +
    `    Пн-Пт: 09:00 — 20:00\n` +
    `    Сб: 10:00 — 18:00\n` +
    `    Вс: выходной\n\n` +
    `💬 Для записи нажмите "Записаться" в меню`,
    { parse_mode: 'Markdown' }
  );
});

// ==================== CALLBACK QUERY HANDLERS ====================

// Category selection — show services in category
bot.callbackQuery(/^category_(\d+)$/, async (ctx) => {
  const categoryId = parseInt(ctx.match[1]);
  const categories = await apiCall('/booking/services');
  const category = categories?.find(c => c.id === categoryId);

  if (!category || category.services.length === 0) {
    return ctx.answerCallbackQuery({ text: 'Услуги не найдены' });
  }

  let text = `💇 *${category.name}*\n\n`;
  category.services.forEach(service => {
    const hours = Math.floor(service.duration / 60);
    const mins = service.duration % 60;
    const durationStr = hours > 0
      ? `${hours}ч${mins > 0 ? ` ${mins}мин` : ''}`
      : `${mins}мин`;

    text += `✂️ *${service.name}*\n`;
    text += `   💰 ${service.price} ₽ • ⏱ ${durationStr}\n`;
    if (service.description) text += `   📝 ${service.description}\n`;
    text += '\n';
  });

  // Add "Записаться" button below services
  const keyboard = new InlineKeyboard()
    .webApp('📋 Записаться на услугу', MINI_APP_URL)
    .row()
    .text('◀️ Назад к категориям', 'back_categories');

  await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: keyboard });
  await ctx.answerCallbackQuery();
});

// Back to categories
bot.callbackQuery('back_categories', async (ctx) => {
  const categories = await apiCall('/booking/services');

  if (!categories || categories.length === 0) {
    return ctx.answerCallbackQuery({ text: 'Категории не найдены' });
  }

  const keyboard = new InlineKeyboard();
  categories.forEach((cat, i) => {
    keyboard.text(cat.name, `category_${cat.id}`);
    if (i % 2 === 1) keyboard.row();
  });

  await ctx.editMessageText('💇 *Выберите категорию услуг:*', {
    parse_mode: 'Markdown',
    reply_markup: keyboard
  });
  await ctx.answerCallbackQuery();
});

// Cancel appointment — with confirmation
bot.callbackQuery(/^cancel_(\d+)$/, async (ctx) => {
  const appointmentId = parseInt(ctx.match[1]);

  const keyboard = new InlineKeyboard()
    .text('✅ Да, отменить', `confirm_cancel_${appointmentId}`)
    .text('❌ Нет', `keep_${appointmentId}`);

  await ctx.editMessageText(
    '⚠️ *Вы уверены, что хотите отменить эту запись?*',
    { parse_mode: 'Markdown', reply_markup: keyboard }
  );
  await ctx.answerCallbackQuery();
});

// Confirm cancellation
bot.callbackQuery(/^confirm_cancel_(\d+)$/, async (ctx) => {
  const appointmentId = parseInt(ctx.match[1]);
  const result = await apiDelete(`/booking/${appointmentId}?telegramId=${ctx.from.id}`);

  if (result && result.success) {
    await ctx.editMessageText('✅ Запись успешно отменена.');
  } else {
    await ctx.editMessageText('❌ Не удалось отменить запись. Попробуйте позже.');
  }
  await ctx.answerCallbackQuery();
});

// Keep appointment (cancel the cancellation)
bot.callbackQuery(/^keep_(\d+)$/, async (ctx) => {
  await ctx.editMessageText('👍 Запись сохранена. Мы ждём вас!');
  await ctx.answerCallbackQuery();
});

// ==================== ERROR HANDLING ====================

bot.catch((err) => {
  const ctx = err.ctx;
  console.error(`Error while handling update ${ctx.update.update_id}:`);
  const e = err.error;

  if (e.message && e.message.includes('message is not modified')) {
    // Ignore "message not modified" errors (user clicked same button)
    return;
  }

  console.error('Bot error:', e);

  // Try to notify user about error
  ctx.reply('Произошла ошибка. Попробуйте позже или нажмите /start').catch(() => {});
});

// ==================== START BOT ====================

console.log('Starting Telegram bot...');
bot.start({
  onStart: (botInfo) => {
    console.log(`Bot @${botInfo.username} started successfully!`);
    console.log(`API URL: ${API_URL}`);
    console.log(`Mini App URL: ${MINI_APP_URL}`);
  }
});
