
# TaskFlow247 — Documentation

## Live Demo
- **GitHub Repository:** https://github.com/pavansingh888/todo-nextjs  
- **Live App:** https://taskflow247.vercel.app/

---

# Overview

TaskFlow247 is a modern, fast, and secure task‑management web app built with **Next.js 14**, **React Query**, **Zustand**, and **DummyJSON Auth APIs**.  
It includes features like authentication, todos CRUD, inactivity auto‑logout, dark/light theme, and user‑configurable session settings.

---

# Features

### ✅ Authentication (DummyJSON)
- Login using DummyJSON user credentials  
- HttpOnly cookie‑based authentication  
- Auto session validation via `/auth/me`  
- Global protected routing

### ✅ Task Management
- Add, edit, delete, complete tasks  
- Local fallback for tasks when DummyJSON cannot persist data  
- Smooth UI updates using React Query caching  
- Animations (Framer Motion)

### ✅ Inactivity Auto‑Logout
- Displays a 60‑second warning modal  
- Configurable timeout (1–240 minutes)  
- “Stay signed in” option disables auto‑logout entirely  
- Works across Dashboard & Profile pages

### ✅ Theming & UI  
- Dark/light theme support (Tailwind + next-themes)  
- Reusable global header  
- Elegant landing page  
- Accessible tooltips & toasts (Sonner)

### ✅ Deployment  
- Optimized for Vercel deployment  
- Uses environment‑ready Next.js structure

---

# Assumptions (Due to DummyJSON Limitations)

DummyJSON does not persist:
- Newly created todos  
- Updated todo content  
- User preferences

So we implemented:

### ✔ Local state fallback  
After a successful API response, todos are saved locally so they persist for the user session.

### ✔ User preference storage  
Timeout duration & “stay signed in” preference are stored in **localStorage** via Zustand.

### ✔ Server API only for authentication  
- DummyJSON login works  
- `/auth/me` confirms session  
- Logout is simulated by clearing cookies & state on the client

---

# How to Run Locally

## 1️⃣ Clone the repository
```bash
git clone https://github.com/pavansingh888/todo-nextjs
cd todo-nextjs
```

## 2️⃣ Install dependencies
```bash
npm install
```

## 3️⃣ Start the dev server
```bash
npm run dev
```

App runs at:  
👉 http://localhost:3000

---

# Approach Summary

Our approach was to create a production‑like system **even though the APIs were mock APIs** (DummyJSON).  
We focused on:

### 🔹 Realistic architecture
- API proxies using `/api/*` routes  
- HttpOnly cookies for auth  
- Reusable layout & header

### 🔹 Smooth UX
- Animations, skeleton loaders, polished modals  
- Auto‑logout with countdown  
- Clean dashboard with filters & stats

### 🔹 Local fallback logic
To overcome DummyJSON limitations, we store todos and preferences locally while **maintaining server API structure** — making it easy to replace with a real backend later.

---

# Challenges & Solutions

### 1️⃣ **CORS & Credentials Handling**
**Problem:** DummyJSON login blocked by CORS when using cookies  
**Fix:**  
- Server‑side route `/api/auth/login`  
- Forward cookies from DummyJSON response  
- Client uses `withCredentials: true`

---

### 2️⃣ **DummyJSON not persisting created/edited todos**
**Solution:**  
- Implemented `_isClientOnly` flag  
- Stored tasks in React Query cache  
- Updated UI instantly via optimistic updates

---

### 3️⃣ **Inactivity modal not working across all pages**
**Fix:**  
- `InactivityModal` placed in `RootLayout`  
- `useInactivity()` called in ProtectedClient  
- Emits global `resetIdle` events to keep behavior consistent

---

### 4️⃣ **Theme not applying to pages**
**Solution:**  
- Wrapped app in `<ThemeProvider>`  
- Updated landing, login, and all components to follow theme classes

---

# Technical Reference / Architecture

### Folder Structure
```
/app
  /api/auth
  /dashboard
  /profile
/components
  Header.tsx
  LayoutWrapper.tsx
  InactivityModal.tsx
/hooks
  useAuth.ts
  useTasks.ts
/lib
  axios.ts
  constants.ts
  useInactivity.ts
/stores
  authStore.ts
  uiStore.ts
```

### Key Technologies

| Tech | Purpose |
|------|---------|
| **Next.js 14** | Routing, server actions, API routes |
| **React Query** | Data fetching, caching, optimistic UI |
| **Zustand** | State for auth & UI preferences |
| **DummyJSON** | Mock authentication & todos API |
| **TailwindCSS** | Theming + responsive UI |
| **Sonner** | Toast notifications |
| **Framer Motion** | Animations |
| **next-themes** | Dark/light mode |
| **Axios** | API calls |

---

# Why These Technologies?

### ⚡ Next.js  
Server and client flexibility + ideal for Vercel deployment.

### ⚡ React Query  
Best-in-class caching & mutation handling.

### ⚡ Zustand  
Lightweight, scalable alternative to Redux.

### ⚡ DummyJSON  
Perfect for demoing authentication workflows.

### ⚡ Tailwind  
Allowed us to rapidly style and support dark theme easily.

---

# Conclusion

TaskFlow247 is architected like a real production task app, with clean UI, secure authentication patterns, and modern UX enhancements — ready to be extended with a real backend anytime.

---

