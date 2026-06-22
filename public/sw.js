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

  const title = data.title || 'Luce';
  const body = data.body || '';

  const options = {
    body,
    icon: '/luce-icon.png',
    badge: '/luce-icon.png',
    tag: 'luce-notification',
    renotify: true,
    silent: false,
    requireInteraction: true,
    sound: '/sounds/luce-chime.mp3',
    data: {
      type: data.type,
      title,
      body,
      url: self.registration.scope,
    },
    actions: data.type === 'community'
      ? [{ action: 'open-tips', title: 'Share a tip' }]
      : [{ action: 'open-app', title: 'Open LA Streetlight' }],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const d = event.notification.data || {};
  const params = new URLSearchParams();
  if (d.title) params.set('notifTitle', d.title);
  if (d.body) params.set('notifBody', d.body);
  if (d.type) params.set('notifType', d.type);

  const basePath = event.action === 'open-tips' ? '/?tab=tips&' : '/?';
  const urlToOpen = basePath + params.toString();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          client.postMessage({
            kind: 'notification-click',
            title: d.title,
            body: d.body,
            type: d.type,
          });
          return client.focus();
        }
      }
      return clients.openWindow(urlToOpen);
    })
  );
});
