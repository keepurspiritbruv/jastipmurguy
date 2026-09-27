self.addEventListener("push", (event) => {
  let data = { title: "JastipMurGuy", body: "Ada update pesanan.", url: "/" };
  try {
    const parsed = event.data.json();
    if (parsed && typeof parsed === "object") data = { ...data, ...parsed };
  } catch {
    // non-JSON payload; use defaults
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icon.svg",
      badge: "/icon.svg",
      data: { url: data.url },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ("focus" in client) {
          return client.navigate(url).then((c) => c.focus());
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    }),
  );
});
