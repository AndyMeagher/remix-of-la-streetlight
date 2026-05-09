// Luce Push Notification Service Worker

self.addEventListener('push', (event) => {
  let data = { title: 'Luce', body: 'Hey, just checking in 💛', type: 'encouragement' };
  
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    // Use defaults
  }

  const options = {
    body: data.body,
    icon: '/luce-icon.png',
    badge: '/luce-icon.png',
    tag: 'luce-notification',
    renotify: true,
    silent: false,
    sound: '/sounds/luce-chime.mp3',
    data: {
      type: data.type,
      url: self.registration.scope,
    },
    actions: data.type === 'community'
      ? [{ action: 'open-tips', title: 'Share a tip' }]
      : [{ action: 'open-app', title: 'Open LA Streetlight' }],
  };

  event.waitUntil(self.registration.showNotification(data.title || 'Luce', options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.action === 'open-tips'
    ? '/?tab=tips'
    : '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(urlToOpen);
    })
  );
});
