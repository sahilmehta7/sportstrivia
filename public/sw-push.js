self.addEventListener("push", (event) => {
  if (!event.data) {
    return;
  }

  let payload;
  try {
    payload = event.data.json();
  } catch (error) {
    console.error("[sw-push] Failed to parse push payload", error);
    return;
  }

  const { title, body, icon, badge, url, tag, data } = payload;

  const options = {
    body,
    tag,
    data: {
      ...data,
      url,
    },
  };

  if (icon) {
    options.icon = icon;
  }

  if (badge) {
    options.badge = badge;
  }

  event.waitUntil(
    self.registration.showNotification(title || "Sports Trivia", {
      ...options,
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url;

  if (!targetUrl) {
    return;
  }

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) {
            const url = new URL(client.url);
            if (url.pathname === new URL(targetUrl, self.location.origin).pathname) {
              return client.focus();
            }
          }
        }

        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
        return undefined;
      })
  );
});
