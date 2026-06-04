import prisma from '@/lib/prisma';

export async function sendNotification(message: string, userId?: string) {
  try {
    if (!userId) {
      console.warn('sendNotification: No userId provided for setting lookup');
      return;
    }
    const settings = await prisma.settings.findUnique({
      where: { userId }
    });
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
