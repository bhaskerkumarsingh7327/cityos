<p align="center">
  <img src="docs/logo.png" alt="CityOS Logo" width="160" height="160" style="border-radius: 28px;" />
</p>

<h1 align="center">CityOS — Intelligent Urban Problem Solving Platform</h1>

<p align="center">
  <em>A full-stack, AI-augmented, GIS-powered civic infrastructure problem reporting, prioritization, dispatch, and resolution platform.</em>
</p>

---

## 1. Project Overview

**CityOS** is an intelligent civic-tech software platform designed to manage and resolve real-world urban infrastructure challenges across municipalities and smart cities. Instead of treating municipal grievance management as a simple CRUD ticketing system, CityOS integrates:

- **Computer Vision (Deep Learning)**: Automatic classification and severity scoring of uploaded damage photos (potholes, garbage accumulation, streetlight outages, water pipeline bursts).
- **Geospatial Intelligence (GIS & MongoDB 2dsphere)**: WGS84 GeoJSON coordinate tracking, radius-based proximity searches (`$near`), ward boundary polygon spatial filtering (`$geoWithin`), and cluster density analysis.
- **Proximity-Based Duplicate Detection**: Prevents municipal departments from duplicating efforts when multiple citizens report the same damage within a 75-meter spatial radius.
- **Explainable Priority Recommendation Engine**: Multi-factor mathematical scoring model ($0-100$) evaluating severity, road safety hazards, repeat density, and unresolved aging.
- **Strict Lifecycle State Machine**: Controlled status progression ensuring no unauthorized transitions occur (`REPORTED` $\rightarrow$ `UNDER_REVIEW` $\rightarrow$ `VERIFIED` $\rightarrow$ `ASSIGNED` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `RESOLVED` $\rightarrow$ `CITIZEN_VERIFICATION` $\rightarrow$ `CLOSED`).
- **Role-Based Portals**: Dedicated workspaces for Citizens, Nodal Officers, Field Maintenance Technicians, and Municipal Commissioners.
- **Real-Time Communication**: Socket.IO event broadcasting for instant status transitions and dispatch alerts.

---

## 2. System Architecture

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        CITYOS FRONTEND (React 19)                      │
│       Citizen Portal  │  Officer Desk  │  Worker App  │  Admin KPI     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / WebSocket
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      CITYOS BACKEND (Express + Node.js)                │
│  - REST API Routing (/api/v1)              - Argon2 & JWT RBAC Auth    │
│  - Controlled State Machine                - Zod Input Validation      │
│  - Proximity Duplicate Detection           - Rate Limiter & Helmet     │
│  - Explainable Priority Engine             - Socket.IO Event Dispatch  │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │ Async Jobs
                    ▼                                ▼
       ┌────────────────────────┐      ┌───────────────────────────────┐
       │     MONGODB ATLAS      │      │     AI SERVICE (Python/FastAPI)│
       │ - 2dsphere Indexes     │      │ - YOLO & PyTorch Inference    │
       │ - GeoJSON Point/Polygon│      │ - Object Detection            │
       │ - Aggregation Pipeline │      │ - Severity Recommendation     │
       └────────────────────────┘      └───────────────────────────────┘
```

---

## 3. Technology Stack

### Frontend
- **Framework:** React 19, TypeScript, Vite
- **Styling & UI:** Tailwind CSS, Lucide React Icons
- **State & Server Cache:** TanStack Query (React Query), Zustand
- **Data Visualizations:** Recharts (Priority distribution & Department workload)
- **Validation:** Zod

### Backend
- **Runtime & Language:** Node.js (v20+), TypeScript
- **Web Framework:** Express.js (Modular Controllers, Routes, Middleware)
- **Database & ODM:** MongoDB 7+, Mongoose (Strict validation, compound & 2dsphere indexes)
- **Security:** Argon2id password hashing, JWT Access & Refresh Token rotation, Helmet, CORS
- **Real-Time:** Socket.IO
- **Validation:** Zod

### AI & Machine Learning Service
- **Framework:** Python 3.10+, FastAPI, Uvicorn
- **Computer Vision:** PyTorch, Ultralytics YOLO, OpenCV, Pillow

### DevOps & Infrastructure
- **Containerization:** Docker, Docker Compose
- **Testing:** Vitest, React Testing Library, Supertest

---

## 4. Key Platform Features

### A. Dedicated Role-Based Workspaces
1. **Citizen Portal (Nagrik):** GPS-pinned incident submission with photo upload, live status tracking, and satisfaction verification (Accept / Reopen).
2. **Nodal Officer Desk:** Department queue (PWD, Sanitation, Water, Electrical), AI confidence inspection, report verification, and ground technician dispatch.
3. **Field Operations Portal:** Worker task list, location navigation, *"Start Work"* (Before-photo evidence), and *"Submit Completed"* (After-photo evidence).
4. **Municipal Commissioner Command Center:** City-wide KPI cards, department workload distribution, and geospatial hotspot clustering.

### B. Mathematical Priority Scoring Formula
$$P_{\text{composite}} = (S_{\text{severity}} \times 0.40) + (S_{\text{safety}} \times 0.25) + (R_{\text{repeat}} \times 0.20) + (A_{\text{aging}} \times 0.15)$$
- **Score $\ge 80$:** `CRITICAL`
- **Score $60 - 79$:** `HIGH`
- **Score $35 - 59$:** `MEDIUM`
- **Score $< 35$:** `LOW`

---

## 5. Getting Started & Installation

### Prerequisites
- Node.js >= 20.0.0
- npm >= 10.0.0
- MongoDB Atlas account (or local MongoDB running on port 27017)

### 1. Repository Setup
```bash
git clone https://github.com/your-username/cityos.git
cd cityos
```

### 2. Backend Setup
```bash
cd backend
npm install

# Configure environment variables in backend/.env
# e.g., MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/cityos

# Populate initial departments, categories, users, and wards
npm run seed

# Start development server
npm run dev
```
Backend runs at `http://localhost:4000/api/v1`.

### 3. Frontend Setup
```bash
cd ../frontend
npm install

# Start Vite dev server
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 6. Running Tests

```bash
# Run Backend Unit & Integration Tests (15 tests)
npm --prefix backend run test

# Run Frontend Component Tests
npm --prefix frontend run test

# Type Checking & Production Build
npm --prefix backend run build
npm --prefix frontend run build
```

---

## 7. Pre-Configured Demo Accounts (Password: `Password@123`)

| Role | Email | Scope |
| :--- | :--- | :--- |
| **Super Admin** | `admin@cityos.local` | System configuration & global oversight |
| **City Commissioner** | `commissioner@cityos.local` | Executive city-wide analytics & hotspots |
| **PWD Nodal Officer** | `officer.pwd@cityos.local` | Road infrastructure verification & dispatch |
| **Field Technician** | `worker.pwd@cityos.local` | Ground work orders & before/after repair evidence |
| **Citizen** | `citizen@cityos.local` | Public grievance reporting & resolution feedback |

---

## 8. License

This project is released under the **MIT License**.
