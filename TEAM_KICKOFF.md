# ByteFrost Team Kickoff — Sprint 1 (Aug 26–31, 2026)

## 📢 Welcome to ByteFrost!

We're building an **AI-powered direct farm-to-market supply-chain platform** for SIH 2026 (Problem Statement 26033). This is our Sprint 1 kickoff.

---

## 🚀 Quick Start

### 1. Clone the Repo
```bash
git clone https://github.com/stfusubhra/ByteFrost.git
cd ByteFrost
```

### 2. Set Up Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
```

### 3. Start Services (Docker required)
```bash
# Make sure Docker Desktop is running
docker-compose up -d  # PostgreSQL + Redis
```

### 4. Run Migrations
```bash
cd backend
alembic upgrade head
```

### 5. Start Dev Server
```bash
uvicorn app.main:app --reload --port 8000
```

### 6. Frontend Setup
```bash
cd frontend
npm install
npm run dev  # Runs on localhost:3000
```

---

## 📋 Your Sprint 1 Tasks

Check your assigned tasks in Notion: [ByteFrost Tasks Board](https://www.notion.so/78baea4a9e764c1c8040e8c7a7113b3f)

### Assignments Summary

| Member | Tasks | Deadline |
|--------|-------|----------|
| **Aradhya** | Data Pipeline: Mandi Price Data Collection | **Aug 27** ⚠️ CRITICAL (unblocks Agni) |
| **Moupriya** | Auth Pages (Login/Register), User Profile UI | Aug 28 |
| **Ankit** | Logistics Data Model, OR-Tools VRP | Aug 29, Sep 1 |
| **Agni** | Price Prediction, Demand Forecasting, Matching Algorithm | Blocked on Aradhya |
| **Rajika** | E2E Test Plan, SIH Presentation Deck | Aug 29, Sep 5 |
| **Subhra** | API Integration Layer, Order Processing Logic | Aug 28, Aug 30 |

---

## 🎯 Sprint Goal

**15% → 40% progress** by Aug 31. Focus on:
- ✅ Backend API (all 15 endpoints working)
- 🎨 Frontend auth + basic UI
- 🧠 AI/ML models (stubs → real implementations)
- 🚛 Logistics foundation

---

## 📡 Communication

- **Daily standups**: 9:00 PM IST on Discord
- **Blockers**: Ping @stfusubhra immediately
- **Code reviews**: PRs to `develop` branch

---

## 🔗 Important Links

- **Repo**: https://github.com/stfusubhra/ByteFrost
- **Notion Workspace**: [ByteFrost](https://www.notion.so/workspace)
- **Problem Statement**: SIH 2026 - 26033
- **API Docs**: http://localhost:8000/docs (when server is running)

---

## ⚠️ Critical Notes

1. **Aradhya**: Your mandi price data is the **linchpin** for Agni's ML models. Please complete by Aug 27.
2. **Agni**: Start with synthetic data for prototyping. Plug into real data when available.
3. **Everyone**: Check the [Architecture Doc](docs/architecture.md) before coding.
4. **API Field Names**: Use `crop_name` (not `produce_name`), `items[]` for orders.

---

## 💡 Need Help?

- **Backend/API**: @stfusubhra
- **Frontend/UI**: @moupriya2803
- **AI/ML**: @AGNI-911-69
- **Logistics**: @Ankyytt284
- **Testing/Docs**: @rajikapramanick (once GitHub invite sent)

Let's build something amazing! 🚀
