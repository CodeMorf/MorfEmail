export async function notifyDesktop(title: string, body: string): Promise<void> {
  const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

  if (isTauri) {
    try {
      const notifications = await import('@tauri-apps/plugin-notification');
      let granted = await notifications.isPermissionGranted();
      if (!granted) granted = (await notifications.requestPermission()) === 'granted';
      if (granted) {
        notifications.sendNotification({ title, body });
        return;
      }
    } catch (error) {
      console.warn('[MorfEmail] Notificación nativa no disponible.', error);
    }
  }

  if (typeof Notification === 'undefined') return;
  if (Notification.permission === 'granted') {
    new Notification(title, { body });
    return;
  }
  if (Notification.permission === 'default') {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') new Notification(title, { body });
  }
}
