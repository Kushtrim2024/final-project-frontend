# 🎓 Final-Project - Liefrik

#### 💼 Dci_fbw_wd24_d07 (21 Juli 2025 - 22 September 2025)

##### ( 28. Juli bis zum 8. August 2025 im Urlaub )

---

<img src="/public/favicon.png" alt="Finalprojekt: Liefrik" width="20" /> **Liefrik** ist eine **Essensbestellplattform**, auf der Benutzer Restaurants online durchsuchen und Bestellungen aufgeben können.

---

💡 **Was ist Liefrik?**
Liefrik ist eine moderne Plattform, die Restaurants mit Kunden verbindet und eine einfache sowie schnelle Möglichkeit bietet, Essen online zu bestellen. Ziel ist es, sowohl den Nutzern ein nahtloses Bestellerlebnis zu bieten als auch Restaurants eine größere digitale Reichweite zu ermöglichen.

Der Name Liefrik ist inspiriert vom deutschen Wort „Lieferung“, das „Zustellung“ oder „Auslieferung“ bedeutet. Die Endung „-rik“ steht symbolisch für Schnelligkeit, Dynamik und digitale Effizienz – genau das, was die Plattform verkörpert.

---

##### ✅ Agile/Scrum-Konformität

Dieser Projektplan wurde nach der **Agile-Methodologie** erstellt, insbesondere basierend auf dem **Scrum-Rahmenwerk**.

---

- [Kushtrim Bilali - Scrum Master (Backend Entwickler Rolle - C)](https://github.com/Kushtrim2024)

- [Randy Born - Scrum Developer (Frontend -UI/Testing Rolle - A)](https://github.com/RandyBorn)

- [Melissa Kebi - Scrum Developer (Frontend -UI/Testing Rolle - B)](https://github.com/MelissaKebi)

- [Cihan Ünal - Product Owner (Full Stack - Deployment & DB Rolle - D)](https://github.com/CihanUnall)

---

- [Final Project Frontend](https://github.com/Kushtrim2024/final-project-frontend)

- [Final Project Backend](https://github.com/Kushtrim2024/final-project-backend)

---

<img src="/public/logo.png" alt="Finalprojekt: Liefrik" width="160" />

<h1><span style="color:#FF8C00">" Taste That Speaks Volumes. "</span></h1>

---

## 🧩 Projektüberblick - Scrum

**Rollen im System:**

- 🧑‍🔧 **Scrum Master:** C (Backend)
- 👨‍💻 **Development Team:** A, B, C, D
- 🧑 **Kunde:** Restaurant durchsuchen, bestellen
- 🧑‍🍳 **Restaurantbesitzer:** eigenes Restaurant & Bestellungen verwalten
- 🛠️ **Admin:** alle Restaurants, Speisen & Benutzer verwalten

---

## 🗂️ Sprint Plan (4 Sprint x 5 Tage)

Am Ende jedes Sprints:
✅ Sprint-Review
✅ Sprint-Retrospektive
📌 Daily Scrum (15 Min.)

---

## 🧑‍🤝‍🧑 Team-Zuweisung

| Person | Rolle                                    | Fokus                                              |
| ------ | ---------------------------------------- | -------------------------------------------------- |
| **A**  | Frontend Kunde                           | Home, Restaurant-Ansicht, Warenkorb, Bestellung    |
| **B**  | Frontend Auth + Owner + Testing          | Login/Register, Besitzer-Dashboard,Postman,        |
| **C**  | Backend Entwickler                       | REST-API, Auth, Bestellungen, Rollen-Management    |
| **D**  | Datenbank + Deployment + Admin + Backend | MongoDB, Live Deployment, Admin-Bereich, Testdaten |

---

## 🗓️ 20-Tage-Zeitplan mit Aufgaben nach Person

### 🟩 **Woche 1 – Setup & Restaurantanzeige (Tag 1–5)**

| Tag | A (Frontend Kunde)                        | B (Frontend Auth)                  | C (Backend/API)                          | D (DB/Test/Deploy)                  |
| --- | ----------------------------------------- | ---------------------------------- | ---------------------------------------- | ----------------------------------- |
| 1   | React-Projekt starten, Routing einrichten | Login-/Register-Seiten bauen (UI)  | Express + MongoDB Setup, Hello World API | MongoDB Atlas einrichten, Sample-DB |
| 2   | Startseite mit Restaurant-Grid            | Auth-Konzept planen (JWT)          | Models: Restaurant, MenuItem, User       | Datenmodell-Review                  |
| 3   | Restaurant-Detailseite                    | Axios + Routing für Login/Register | Routen: GET /restaurants + /\:id         | Seed-Script Restaurants/Menus       |
| 4   | Restaurant-Bilder + UI-Details            | User Register/Login mit JWT        | POST /register + /login + bcrypt         | Postman-Tests: User/Register/Login  |
| 5   | Erste Daten anzeigen (via Axios)          | Benutzerrolle erkennen + speichern | JWT Middleware & Role Checking           | Kurze README + DB-Export sichern    |

🔧 **Ziel Woche 1:**
Frontend zeigt Restaurants, Auth funktioniert, User kann sich registrieren & einloggen.

---

### 🟨 **Woche 2 – Warenkorb + Besitzer-Setup (Tag 6–10)**

| Tag | A                              | B                                     | C                               | D                                            |
| --- | ------------------------------ | ------------------------------------- | ------------------------------- | -------------------------------------------- |
| 6   | Warenkorb-Komponente erstellen | Dashboard für Besitzer bauen (UI)     | POST /orders, Order Model       | Beispiel-Owner-User in DB                    |
| 7   | Cart speichern (Context API)   | Seite: Menü bearbeiten (UI)           | Owner-Routen: GET/POST/PUT Menü | Menü-Routen auf Owner-Restaurant beschränken |
| 8   | Checkout-Seite                 | Bestellungen anzeigen (nur für Owner) | Order by restaurantId           | Tests: Bestellungen vom Owner laden          |
| 9   | Warenkorb abschicken           | Profilseite Besitzer bauen            | PUT /owner/restaurant           | Test-Owner-Restaurant verbinden              |
| 10  | Button: "Jetzt bestellen"      | Button: Menü speichern                | Auth Middleware finalisieren    | Test aller Owner-Funktionen (Postman)        |

🍔 **Ziel Woche 2:**
Warenkorb, Checkout + Besitzer-Dashboard mit Menü-Verwaltung funktioniert.

---

### 🟦 **Woche 3 – Admin-Bereich + Bestellung (Tag 11–15)**

| Tag | A                                     | B                                       | C                              | D                              |
| --- | ------------------------------------- | --------------------------------------- | ------------------------------ | ------------------------------ |
| 11  | Bestellhistorie (Kunde)               | Admin Dashboard (UI)                    | Admin-Routen: All restaurants  | Beispiel-Admin in DB           |
| 12  | Statusanzeige Bestellung              | Admin: Restaurant hinzufügen (UI)       | POST/PUT/DELETE Restaurant     | Test Admin-Funktionen          |
| 13  | Kundenansicht: "Bestellung empfangen" | Admin: Userverwaltung (UI)              | GET all users, DELETE user     | Admin-Zugriff absichern        |
| 14  | UX verbessern: Loading, Errors        | Besitzer: Bestellstatus ändern (Fertig) | PUT /order/status              | Testing aller Rollen-APIs      |
| 15  | UI Review & Cleanup                   | UI Review Admin/Owner                   | Code Refactor + Error-Handling | Seed + Dump aller Daten fertig |

🛠️ **Ziel Woche 3:**
Admin & Owner können Restaurants verwalten. Bestellungen vollständig.

---

### 🟪 **Woche 4 – Styling, Tests & Deployment (Tag 16–20)**

| Tag | A                              | B                            | C                             | D                                    |
| --- | ------------------------------ | ---------------------------- | ----------------------------- | ------------------------------------ |
| 16  | Styling: Kunde (Tailwind/SCSS) | Styling: Owner + Admin UI    | Tests mit Jest (optional)     | Deploy: MongoDB + Backend auf Render |
| 17  | Mobile-Optimierung             | Responsiveness prüfen        | 404/Error Pages einbauen      | Frontend auf Vercel deployen         |
| 18  | Code-Review & Refactoring      | Bugfixes                     | API Clean-Up                  | CI/CD oder Deployment-Skript         |
| 19  | Präsentation vorbereiten       | Screenshots, Video aufnehmen | Review Code + API-Doc         | README.md finalisieren               |
| 20  | Pitch / Live-Demo              | Projekt zusammen vorstellen  | Technische Fragen beantworten | Livesystem testen und zeigen         |

🚀 **Ziel Woche 4:**
Live-Deployment, responsive Design, gute Doku, Vorbereitung für Präsentation oder Abgabe.

---

## 📌 Projektabschluss

Am Ende habt ihr:

- [x] Auth mit Rollen funktioniert
- [x] Kunden können bestellen
- [x] Besitzer verwalten Menü & Bestellungen
- [x] Admin verwaltet User & Restaurants
- [x] UI responsive & gestylt
- [x] Live-Deployment & saubere Doku

---
