# 🌆 Smart Waste Management System

A modern web application to report, track, and manage waste-related issues in a city.
This system connects **citizens, workers, and administrators** to ensure efficient waste management.

-----

## 🚀 Features

### 👤 Citizen

* Register & Login (Email / Google)
* Report waste issues with location 📍
* Track complaint status in real-time
* View complaint history

### 🛠 Worker

* View assigned complaints
* Navigate to location via Google Maps
* Mark complaint as completed ✅

### 🧑‍💼 Admin

* View all complaints
* Assign workers to complaints
* Mark complaints as **Done**
* Cancel invalid complaints ❌
* Filter complaints (Open / Assigned / Done / Cancelled)

---

## 🏗 Tech Stack

* **Frontend:** Next.js (App Router), React, Tailwind CSS
* **Backend:** Firebase (Firestore + Authentication)
* **Maps:** Google Maps API
* **UI:** Custom + ShadCN components

---


## 📂 Project Structure

```
app/
  ├── admin/           # Admin dashboard
  ├── worker/          # Worker dashboard
  ├── complaints/      # Citizen complaints
  ├── auth/            # Login & Register
  ├── page.tsx         # Landing page

components/
  ├── Navigation.tsx
  ├── ComplaintForm.tsx
  ├── UI components

lib/
  ├── firebase.ts
  ├── auth-context.tsx
  ├── firebase-service.ts
```

---

## 🔐 Authentication

* Firebase Email/Password Login
* Google Sign-In
* Role-based access:

  * `citizen`
  * `worker`
  * `admin`

---

## 🔄 Workflow

1. Citizen submits complaint
2. Admin assigns worker
3. Worker resolves issue
4. Admin marks as **Done**

---

## 🗺 Location Features

* Click on map to select location
* Reverse geocoding for address
* Open location in Google Maps

---

## 🎨 UI Highlights

* Premium glass UI (dark theme)
* Responsive design
* Smooth transitions & animations
* Role-based dashboards

---

## ⚙️ Setup Instructions

### 1️⃣ Clone the repository

```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
```

### 2️⃣ Install dependencies

```bash
npm install
```

### 3️⃣ Setup environment variables

Create `.env.local` file:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_maps_key
```

---

### 4️⃣ Run the project

```bash
npm run dev
```

---

## 📸 Screenshots (Optional)

* Landing Page
* Admin Dashboard
* Worker Dashboard
* Complaint Form

---

## 📌 Future Improvements

* Image upload for complaints 📸
* Notification system 🔔
* Heatmap of complaint zones 🗺
* AI-based issue detection 🤖

---

## 👨‍💻 Author

Developed by **Yeliz / Yash Doiphode**

---

## ⭐ Acknowledgement

This project is built as part of a practical / academic system to demonstrate real-world problem solving using modern web technologies.

---
