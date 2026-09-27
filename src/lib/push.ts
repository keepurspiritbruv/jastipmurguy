import webpush from "web-push";

let configured = false;

function ensure() {
  if (configured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (publicKey && privateKey) {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT ?? "mailto:admin@example.com",
      publicKey,
      privateKey,
    );
  }
  configured = true;
}

export async function sendPush(
  subscription: string,
  payload: { title: string; body: string; url: string },
): Promise<boolean> {
  ensure();
  if (!process.env.VAPID_PRIVATE_KEY) return false;
  try {
    const sub = JSON.parse(subscription);
    await webpush.sendNotification(sub, JSON.stringify(payload), { TTL: 86400 });
    return true;
  } catch {
    return false;
  }
}
