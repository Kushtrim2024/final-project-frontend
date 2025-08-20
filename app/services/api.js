const BASE_URL = "https://api.npoint.io/9fe81dfe08adc427844e";

export async function getOrders() {
  const res = await fetch(BASE_URL);
  if (!res.ok) throw new Error("Fehler beim Laden der Bestellungen");
  return res.json();
}
