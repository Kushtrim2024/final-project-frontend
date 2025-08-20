// menu/services/api.js

const API_URL = "https://dein-backend.com/api/menu"; // deine Backend-URL

export async function getMenuItems() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("Fehler beim Laden der Menüs");
    const data = await res.json();
    return data;
  } catch (err) {
    console.error(err);
    return []; // leeres Array, falls Fehler
  }
}
