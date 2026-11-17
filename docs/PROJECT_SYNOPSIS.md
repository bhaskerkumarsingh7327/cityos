# Project Synopsis: CityOS — Intelligent Urban Problem Solving Platform

**Project Title:** CityOS: Intelligent Urban Infrastructure Problem Detection, Spatial Dispatch & Civic Resolution Platform  
**Degree/Course:** Bachelor of Technology / Computer Science & Engineering (Final Year Project)  
**Academic Year:** 2026-2027  

---

## 1. Introduction
Rapid urbanization has severely stressed municipal governance infrastructures. Citizens frequently encounter road potholes, overflowing garbage bins, water pipeline bursts, and defunct streetlights. Traditional grievance mechanisms suffer from:
1. Lack of photographic verification leading to fraudulent work closures.
2. Absence of spatial intelligence resulting in duplicate complaints for the same geographic incident.
3. Static priority assignment without context of safety hazard or population density.
4. Information asymmetry between Citizens, Nodal Officers, and Ground Field Technicians.

**CityOS** is a comprehensive, full-stack, GIS-enabled municipal problem management platform designed to automate and enforce transparency in municipal operations.

---

## 2. Problem Statement
To design, develop, and deploy an automated municipal problem-solving platform that:
* Leverages MongoDB **2dsphere geospatial indexing** for real-time proximity clustering and hotspot detection within a 75-meter threshold.
* Enforces a **strictly validated finite-state machine** governing incident transitions (`REPORTED` → `UNDER_REVIEW` → `VERIFIED` → `ASSIGNED` → `IN_PROGRESS` → `RESOLVED` → `CLOSED`).
* Eliminates fraudulent resolutions through **mandatory dual-phase photographic evidence** (Before-Repair arrival photo and After-Repair completion photo) with minimum character-length resolution reports.
* Empowers citizens with a **bi-directional verification mechanism** to approve or reject technician work before final ticket closure.
* Provides role-based portals for four distinct civic personas: **Citizen**, **Nodal Officer (PWD/Sanitation/Water/Electrical)**, **Field Worker**, and **Municipal Commissioner**.

---

## 3. Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Recharts, TanStack Query v5, Zustand |
| **Backend** | Node.js (v20+), Express.js, TypeScript, Zod Schema Validation, Helmet, Morgan |
| **Database** | MongoDB Atlas (Cloud Cluster), Mongoose ODM, 2dsphere Geospatial Indexing, GeoJSON Points & Polygons |
| **Security & Auth** | Argon2id Password Hashing, JWT (Access & Refresh Token Rotation), Role-Based Access Control (RBAC) |
| **Spatial & Analytics** | WGS84 GeoJSON, MongoDB `$near` & `$geoWithin`, Aggregation Pipeline (`$group`, `$facet`) |
| **AI Integration** | Computer Vision Classification Service (FastAPI / PyTorch YOLOv8), Explainable Priority Scoring Algorithm |
| **Real-Time Dispatch** | Socket.IO WebSockets for live status transition and incident assignment events |

---

## 4. Key Functional Modules

### 4.1 Citizen Portal (Nagrik Desk)
* **Incident Submission:** Geo-tagged reporting with interactive map coordinates, category picker, and image attachment.
* **Spatial Duplicate Detection:** Automated radius search (75m) prevents database clutter by clustering identical complaints.
* **Resolution Verification Desk:** Side-by-side photographic comparison (Before vs. After) empowering citizens to "Accept & Close" or "Reject & Reopen".

### 4.2 Nodal Officer Desk (Departmental Triage)
* **Automated AI Inspection:** Computer vision confidence scores (e.g., 94% pothole detection) and severity recommendations.
* **Explainable Priority Engine:** Dynamic score ($0-100$) computed from severity, public safety risk, repeat report multiplier, and SLA decay.
* **Field Dispatch:** Direct assignment of verified work orders to specific ground technicians.

### 4.3 Field Worker Operations (Ground Technician Desk)
* **Arrival Verification:** Enforces upload of Before-Repair photo proof before status transitions to `IN_PROGRESS`.
* **Tamper-Proof Resolution Submission:** Strict form lock requiring After-Repair photo evidence and detailed material notes (min 10 characters). Rejects submissions without visual proof.

### 4.4 City Admin & Commissioner Headquarters
* **Executive KPIs:** Live metrics on Total Reports, Active Work Orders, Resolution Rates, and SLA compliance.
* **Spatial Hotspots:** Heatmap density clustering identifying high-risk geographic zones for preemptive civic maintenance.

---

## 5. System Architecture Diagram

```
[ Citizen Portal ]   [ Nodal Officer Desk ]   [ Field Worker Desk ]   [ City Admin HQ ]
        │                      │                        │                     │
        └──────────────────────┼────────────────────────┼─────────────────────┘
                               ▼
               [ REST API Gateway / Express + TS ]
                               │
            ┌──────────────────┼──────────────────┐
            ▼                  ▼                  ▼
    [ Zod Validation ]   [ RBAC & JWT ]   [ State Machine Guard ]
            │                  │                  │
            └──────────────────┼──────────────────┘
                               ▼
           [ MongoDB Atlas Cloud Database (2dsphere) ]
           ├── Users (Argon2id Hashed)
           ├── Incidents (GeoJSON Points & Multi-Phase Media)
           ├── Wards (GeoJSON Polygons)
           ├── Departments & Categories
           └── Audit Logs & Status History
```

---

## 6. Project Deliverables
1. Production-ready full-stack web application codebase (TypeScript Frontend + Backend).
2. Live cloud database hosted on MongoDB Atlas with 2dsphere spatial indexes and seed data.
3. Test suites (15 backend unit tests + 2 frontend integration tests, 100% passing).
4. Comprehensive Final Project Report & Academic Presentation.

