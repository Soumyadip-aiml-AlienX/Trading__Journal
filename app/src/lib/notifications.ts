import prisma from '@/lib/prisma';

export async function sendNotification(message: string) {
  try {
    const settings = await prisma.settings.findFirst();
    if (!settings) return;

    // Discord Webhook notification
    if (settings.discordWebhook) {
      await fetch(settings.discordWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: message }),
      });
    }

    // Telegram Bot notification
    if (settings.telegramToken && settings.telegramChatId) {
      const url = `https://api.telegram.org/bot${settings.telegramToken}/sendMessage`;
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: settings.telegramChatId,
          text: message,
        }),
      });
    }
  } catch (err) {
    console.error('Failed to send notification:', err);
  }
}
