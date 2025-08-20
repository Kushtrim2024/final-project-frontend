export async function getOrders() {
  try {
    const res = await fetch("DEIN_BACKEND_URL/orders"); // z. B. npoint oder Express API
    if (!res.ok) throw new Error("Fehler beim Abrufen der Bestellungen");
    const data = await res.json();
    return data;
  } catch (error) {
    console.error(error);
    return [];
  }
}
