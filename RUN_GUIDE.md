# 🚀 How to Run the Project

You need **2 terminals** running at the same time:

---

## Terminal 1 — ML API Server (Python)

Open a terminal and run these commands ONE BY ONE:

```powershell
cd "c:\field project bmc\waste-collection-heatmap\ml"
```

```powershell
pip install -r requirements.txt
```

```powershell
python model.py
```

> You should see: `✅ Model trained and saved to model.pkl`

```powershell
uvicorn api:app --reload
```

> You should see: `Uvicorn running on http://127.0.0.1:8000`

✅ **Leave this terminal open.** The AI server is now running.

Test it: open browser → `http://127.0.0.1:8000`

---

## Terminal 2 — Next.js App

Open a **NEW terminal** (do not close the first one) and run:

```powershell
cd "c:\field project bmc\waste-collection-heatmap"
```

```powershell
npm run dev
```

> You should see: `▲ Next.js 16.1.6` and `Local: http://localhost:3000`

✅ **Leave this terminal open.** Your app is now running.

Open browser → `http://localhost:3000`

---

## 🧪 How to Test the AI Fake Detection

1. Log in as a **citizen** and submit a complaint.
2. Log in as **admin** → assign that complaint to a **worker**.
3. Log in as **worker** → click **"Mark as Fake"** on that complaint.
4. Log back in as **admin** → click **"🤖 Analyze Risk"** on the same complaint.
5. You will see a **red risk badge** like `🤖 85% Fake Risk`.
6. If the risk is high, a **"🚫 Blacklist User"** button appears. Click it to permanently block the user.
7. Next time that user tries to log in, they will get: `🚫 Your account has been blacklisted...`

---

## ⚠️ Common Issues

| Problem | Fix |
|---------|-----|
| `Port 3000 is in use` | It auto-switches to 3001, just open `http://localhost:3001` |
| `pnpm not found` | Use `npm` instead: `npm run dev`, `npm run build` |
| `pip not found` | Use `py -m pip install -r requirements.txt` |
| `AI API error` | Make sure Terminal 1 (uvicorn) is still running |

---

## 🔧 Useful Commands

```powershell
# Build for production (test if there are errors)
npm run build

# Restart everything fresh
Remove-Item -Path ".next\dev\lock" -Force
npm run dev
```

