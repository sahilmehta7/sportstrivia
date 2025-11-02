export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawDataString =
    typeof window === "undefined"
      ? Buffer.from(base64, "base64").toString("binary")
      : window.atob(base64);

  const outputArray = new Uint8Array(rawDataString.length);
  for (let i = 0; i < rawDataString.length; ++i) {
    outputArray[i] = rawDataString.charCodeAt(i);
  }

  return outputArray;
}
