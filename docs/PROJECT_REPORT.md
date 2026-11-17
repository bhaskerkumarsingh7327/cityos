# CITYOS: INTELLIGENT URBAN PROBLEM SOLVING PLATFORM
## Comprehensive Final Year Capstone Project Report

**Submitted in partial fulfillment of the requirements for the degree of**  
**Bachelor of Technology in Computer Science & Engineering**  

---

### Table of Contents
1. [Chapter 1: Abstract & Introduction](#chapter-1-abstract--introduction)
2. [Chapter 2: Problem Definition & Objectives](#chapter-2-problem-definition--objectives)
3. [Chapter 3: System Architecture & Data Flow](#chapter-3-system-architecture--data-flow)
4. [Chapter 4: Database Design & Spatial Indexing](#chapter-4-database-design--spatial-indexing)
5. [Chapter 5: Core Engineering Modules](#chapter-5-core-engineering-modules)
   - 5.1 Role-Based Access Control (RBAC) & Argon2id Security
   - 5.2 Deterministic Finite State Machine (FSM)
   - 5.3 Explainable Priority Scoring Engine ($0-100$)
   - 5.4 Dual-Phase Photographic Evidence Enforcement
   - 5.5 GIS Proximity Clustering & Duplicate Elimination
6. [Chapter 6: User Interface & Persona Portals](#chapter-6-user-interface--persona-portals)
7. [Chapter 7: Testing Strategy, Test Cases & Results](#chapter-7-testing-strategy-test-cases--results)
8. [Chapter 8: Conclusion & Future Scope](#chapter-8-conclusion--future-scope)

---

## Chapter 1: Abstract & Introduction

Modern urban centers face unprecedented challenges in maintaining municipal infrastructure such as roads, streetlighting, drainage networks, and solid waste collection. Conventional civic grievance redressal platforms function largely as static ticketing systems, suffering from:
- **Lack of Verification:** Field workers often mark complaints as "Resolved" without undertaking actual on-site repairs, leading to widespread citizen dissatisfaction.
- **Duplicate Overload:** Multiple citizens reporting the same pothole or broken pipe create redundant database records, overwhelming departmental resources.
- **Absence of Contextual Prioritization:** Complaints are often processed chronologically (FIFO) rather than by safety criticality or spatial density.

**CityOS** is an intelligent, full-stack municipal operations platform designed to solve these systemic deficiencies. Developed using modern engineering paradigms—TypeScript, Node.js, Express, React, and MongoDB Atlas—CityOS introduces:
1. **Mandatory Photographic Evidence Capture:** Enforces both arrival (Before-Photo) and completion (After-Photo) validation with automated UI locks.
2. **Citizen-Centric Closure Verification:** A bi-directional handshake where only the reporting citizen can formally close a ticket after inspecting visual proof.
3. **Geospatial Intelligence:** MongoDB `2dsphere` indexes powering a 75-meter automated duplicate detection radius and density hotspot maps.
4. **Explainable Priority Scoring:** A transparent mathematical formulation computing urgency from severity, safety hazard, and aging metrics.

---

## Chapter 2: Problem Definition & Objectives

### 2.1 Objectives
* **Eliminate Fraudulent Work Orders:** Architect a workflow where work orders cannot transition to `RESOLVED` without photographic evidence and verifiable resolution logs.
* **Streamline Civic Workflows:** Implement a mathematical state machine preventing illegal status transitions.
* **Geospatial De-duplication:** Automatically aggregate redundant neighborhood complaints into unified clusters.
* **Departmental Separation of Concerns:** Provide isolated portals for Citizens, Nodal Officers, Ground Technicians, and City Commissioners.

---

## Chapter 3: System Architecture & Data Flow

```
+-------------------------------------------------------------------------------+
|                                CLIENT TIER                                    |
|   +------------------+   +------------------+   +-------------------------+   |
|   |  Citizen Portal  |   |   Officer Desk   |   | Field Worker & Admin HQ |   |
|   +------------------+   +------------------+   +-------------------------+   |
|                      React 18 + Vite + Tailwind CSS                           |
+-------------------------------------------------------------------------------+
                                      │ HTTPS / REST / WebSockets
                                      ▼
+-------------------------------------------------------------------------------+
|                              APPLICATION TIER                                 |
|   +───────────────────────────────────────────────────────────────────────+   |
|   | Express.js REST Gateway (Node.js 20+ / TypeScript)                    |   |
|   | ├── Helmet & CORS Security Middleware                                 |   |
|   | ├── Argon2id & JWT Authentication Engine                              |   |
|   | ├── Zod Request Payload Validation                                    |   |
|   | ├── Incident Finite State Machine (FSM Guard)                         |   |
|   | ├── Explainable Priority Scoring Calculation                          |   |
|   | └── Socket.IO Event Broadcaster                                       |   |
|   +───────────────────────────────────────────────────────────────────────+   |
+-------------------------------------------------------------------------------+
                                      │ Mongoose ODM
                                      ▼
+-------------------------------------------------------------------------------+
|                                DATABASE TIER                                  |
|   +───────────────────────────────────────────────────────────────────────+   |
|   | MongoDB Atlas Cloud Cluster                                           |   |
|   | ├── 2dsphere Geospatial Index (WGS84 Coordinates)                     |   |
|   | ├── GeoJSON Point & Polygon Collections                               |   |
|   | ├── Multi-Phase Media Storage References                              |   |
|   | └── Aggregation Pipelines ($near, $geoWithin, $facet)                 |   |
|   +───────────────────────────────────────────────────────────────────────+   |
+-------------------------------------------------------------------------------+
```

---

## Chapter 4: Database Design & Spatial Indexing

The platform is backed by MongoDB Atlas, utilizing native GeoJSON objects and compound indexes for high performance:

### 4.1 GeoJSON Incident Schema
```typescript
interface IncidentDocument {
  incidentNumber: string;        // Unique identifier (INC-YYYYMM-XXXX)
  title: string;
  description: string;
  status: IncidentStatus;        // FSM status
  priority: IncidentPriority;    // CRITICAL | HIGH | MEDIUM | LOW
  priorityScore: number;         // 0 to 100
  location: {
    type: "Point";
    coordinates: [number, number]; // [Longitude, Latitude] WGS84
  };
  address: string;
  category: ObjectId;            // Reference to IncidentCategory
  department: ObjectId;          // Reference to Department
  reporter: ObjectId;            // Reference to User
  assignedWorker?: ObjectId;     // Reference to User (FIELD_WORKER)
  media: Array<{
    mediaId: string;
    url: string;
    phase: "initial" | "before" | "after";
    uploadedAt: Date;
  }>;
  resolution?: {
    resolvedAt: Date;
    resolutionNotes: string;
  };
  statusHistory: Array<{
    fromStatus: IncidentStatus;
    toStatus: IncidentStatus;
    changedBy: ObjectId;
    reason: string;
    timestamp: Date;
  }>;
}
```

### 4.2 Geospatial Compound Indexing
```typescript
// Fast spatial proximity querying via spherical geometry
incidentSchema.index({ location: "2dsphere" });

// Hotspot and category analytical indexing
incidentSchema.index({ status: 1, priority: -1, createdAt: -1 });
```

---

## Chapter 5: Core Engineering Modules

### 5.1 Deterministic Finite State Machine (FSM)
CityOS implements a strict state transition matrix. Any attempt to skip states (e.g., from `REPORTED` directly to `RESOLVED`) is blocked with an HTTP 400 exception:

| From Status | Permitted Target Statuses | Allowed Roles |
| :--- | :--- | :--- |
| `REPORTED` | `UNDER_REVIEW`, `VERIFIED`, `REJECTED` | `OFFICER`, `CITY_ADMIN` |
| `VERIFIED` | `ASSIGNED`, `REJECTED` | `OFFICER`, `CITY_ADMIN` |
| `ASSIGNED` | `IN_PROGRESS` | `FIELD_WORKER`, `OFFICER` |
| `IN_PROGRESS` | `RESOLVED` (Requires Photo + Notes) | `FIELD_WORKER` |
| `RESOLVED` | `CLOSED`, `REOPENED` | `CITIZEN`, `CITY_ADMIN` |
| `REOPENED` | `UNDER_REVIEW`, `ASSIGNED` | `OFFICER`, `CITY_ADMIN` |

### 5.2 Dual-Phase Photographic Evidence Enforcement
To eliminate fraudulent claims:
1. **Arrival Verification:** Before a technician can transition a work order to `IN_PROGRESS`, they must upload a photographic proof of the damaged site (`phase: "before"`).
2. **Completion Proof:** The submit button for `RESOLVED` is programmatically locked unless an After-Repair photo URL (`phase: "after"`) and at least 10 characters of detailed material notes are supplied.

```typescript
const completeWorkSchema = z.object({
  afterMediaUrl: z.string().url("Valid URL for after-repair photo proof is mandatory"),
  resolutionNotes: z.string().min(10, "Resolution notes must be at least 10 characters"),
});
```

### 5.3 Explainable Priority Scoring Engine
Priority is computed deterministically using the formula:
$$\text{Priority Score} = (\text{Severity} \times 0.40) + (\text{Public Safety} \times 0.30) + (\text{Repeat Multiplier} \times 0.15) + (\text{Aging Decay} \times 0.15)$$

Where:
- $\text{Severity}$ ($0-100$): Derived from category default and AI computer vision inspection.
- $\text{Public Safety}$ ($0-100$): Proximity to school zones, hospitals, or major arterial highways.
- $\text{Repeat Multiplier}$ ($0-100$): Density of similar complaints reported in the same 75m radius within 30 days.
- $\text{Aging Decay}$ ($0-100$): Dynamic escalation as elapsed time approaches the category's SLA limit.

---

## Chapter 6: User Interface & Persona Portals

The frontend provides four dedicated portals switchable via the top navigation bar:

1. **Citizen Portal:**
   - Real-time tracking of personal grievances.
   - Simplified "+ Report New Problem" form with automatic coordinate picking.
   - Resolution verification desk with side-by-side Before vs. After photo cards.
2. **Nodal Officer Desk:**
   - Incident queue with AI Computer Vision classification confidence (e.g., 94%).
   - One-click "1. Verify Report" and "2. Dispatch Field Worker" assignment controls.
3. **Field Worker Operations:**
   - Task list sorted by geographic proximity and urgency score.
   - Interactive evidence submission station with live image preview and validation counters.
4. **City Admin & Commissioner Headquarters:**
   - High-level KPIs: Total Complaints, Resolved, Active Work Orders, and SLA Compliance.
   - Interactive Recharts bar and distribution charts.
   - Spatial hotspot density monitors for proactive municipal planning.

---

## Chapter 7: Testing Strategy, Test Cases & Results

The system is validated through comprehensive automated test suites using Vitest:

| Test File | Modules Tested | Result |
| :--- | :--- | :--- |
| `incidentStateMachine.test.ts` | Validates all permitted transitions and illegal jumps | **4/4 Passed** |
| `priorityEngine.test.ts` | Verifies priority score calculation and boundary clamping | **3/3 Passed** |
| `password.test.ts` | Validates Argon2id hashing and verification security | **1/1 Passed** |
| `jwt.test.ts` | Verifies access/refresh token generation and verification | **2/2 Passed** |
| `health.routes.test.ts` | Validates API status, database check, and error handlers | **5/5 Passed** |
| `App.test.tsx` | Tests multi-portal rendering and field worker photo validation | **2/2 Passed** |
| **Total** | **Comprehensive Full-Stack Test Suite** | **17/17 Passed (100%)** |

---

## Chapter 8: Conclusion & Future Scope

### 8.1 Conclusion
CityOS successfully demonstrates how modern web engineering, spatial databases, and automated validation can transform municipal problem resolution. By mandating dual-phase photographic evidence and placing the final verification in the hands of the reporting citizen, the platform effectively eliminates ghost repairs and enhances civic accountability.

### 8.2 Future Scope
- **Edge Mobile Application:** Flutter/React Native application with offline sync for field technicians in low-connectivity areas.
- **Automated Drone Surveillance:** Integration with municipal camera feeds and drone surveys for automated pothole detection.
- **Multilingual Voice Bot:** Integration with Bhashini/Whisper API for vernacular voice complaint registration by non-tech-savvy citizens.

