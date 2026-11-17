# CityOS: Top Viva Voce Questions & Answers Guide
### Final Year Project Viva Preparation (CSE / IT)

---

### Q1: What is CityOS, and what core problem does it solve?
**Answer:**  
CityOS is a full-stack, GIS-enabled municipal operations and grievance redressal platform. It eliminates the primary failure mode of existing municipal systems—fraudulent work closures (where field workers claim a problem is fixed without doing the work)—by enforcing **mandatory dual-phase photographic evidence** (Before-Photo and After-Photo) and a **citizen-verified closure handshake**. It also uses **MongoDB 2dsphere indexing** to automatically detect duplicate complaints within 75 meters.

---

### Q2: Why did you choose MongoDB instead of relational databases like MySQL or PostgreSQL?
**Answer:**  
1. **Native GeoJSON & 2dsphere Indexing:** MongoDB natively indexes GeoJSON Point and Polygon objects with spherical geometry calculations (`$near`, `$geoWithin`, and `$geoNear` aggregation pipelines), which is ideal for real-time proximity clustering and hotspot detection.
2. **Schema Flexibility for Multi-Phase Media & Audit Trails:** Each incident stores an array of media objects (`initial`, `before`, `after`) and an embedded array of `statusHistory` audit logs with timestamps and user references. A document model provides zero-join reads for incident inspection desks.
3. **High-Performance Aggregations:** MongoDB Atlas provides powerful aggregation pipelines (`$facet`, `$group`, `$project`) to compute complex city-wide KPIs and ward-level distributions in a single round-trip.

---

### Q3: How does the Duplicate Detection algorithm work?
**Answer:**  
When a citizen reports an issue, CityOS runs the `detectDuplicateIncident` service:
1. It queries MongoDB using `$near` with a `2dsphere` index centered on the complaint's coordinates $[lng, lat]$.
2. It sets a maximum spherical distance of **75 meters** (`$maxDistance: 75`).
3. It filters for active incidents (`status` $\notin$ `["CLOSED", "REJECTED", "CANCELLED"]`) of the **same category**.
4. If a matching record exists, the new report is automatically linked as a sub-ticket (`duplicateClusterId`), incrementing the parent ticket's urgency score rather than cluttering the database with duplicate work orders.

---

### Q4: Explain the Explainable Priority Scoring formula.
**Answer:**  
Instead of arbitrary priorities, CityOS computes a deterministic score between $0$ and $100$:
$$\text{Score} = (\text{Severity} \times 0.40) + (\text{Public Safety} \times 0.30) + (\text{Repeat Factor} \times 0.15) + (\text{Aging Decay} \times 0.15)$$
- **Severity ($0-100$):** Inherent damage severity (e.g., critical water burst vs. minor pothole) confirmed by AI confidence.
- **Public Safety ($0-100$):** Proximity to critical zones like schools, hospitals, or intersections.
- **Repeat Factor ($0-100$):** How many citizens have reported issues in the same 75m area within 30 days.
- **Aging Decay ($0-100$):** Time elapsed relative to the category's SLA limit (e.g., 24h for potholes, 12h for water leaks).

---

### Q5: How do you prevent a field worker from submitting work without real photos?
**Answer:**  
Through a strict two-layer validation architecture:
1. **Backend Validation:** The `POST /api/v1/workers/tasks/:id/complete` endpoint runs a Zod schema requiring `afterMediaUrl` (valid URL) and `resolutionNotes` (minimum 10 characters). Missing fields return HTTP 400 Bad Request.
2. **Frontend UI Enforcement:** In the Field Worker portal, the submit button is programmatically locked (`disabled`, `cursor-not-allowed`) until an After-Photo is uploaded, previewed, and resolution notes satisfy the length requirement.
3. **Citizen Verification:** Even after submission, the ticket status is `RESOLVED`—not `CLOSED`. It goes to the citizen who submitted it, who views the Before vs. After photo comparison and must click "Accept & Close" for the ticket to permanently close.

---

### Q6: Why Argon2id instead of bcrypt or MD5 for password hashing?
**Answer:**  
Argon2id won the Password Hashing Competition (PHC) and is recommended by OWASP. Unlike bcrypt, which is vulnerable to GPU-accelerated brute-force attacks, Argon2id is memory-hard and time-hard, providing hybrid resistance against both side-channel attacks and GPU/ASIC hardware cracking.

---

### Q7: How does the State Machine prevent illegal status transitions?
**Answer:**  
The `incidentStateMachine.ts` module defines a transition matrix mapping every valid `IncidentStatus` to its allowed target statuses and authorized roles. If an API request attempts to jump from `REPORTED` directly to `RESOLVED`, the state machine throws an `ApiError.badRequest("Illegal status transition")`, preventing database tampering.

---

### Q8: What are the 4 portals in your project?
**Answer:**  
1. **Citizen Portal:** Report issues with geo-coordinates, track complaints, review Before/After photos to accept/reject resolutions.
2. **Nodal Officer Desk:** Inspect incoming complaints, verify AI computer vision findings, and assign work orders to field technicians.
3. **Field Worker Desk:** View assigned work orders, upload arrival photos to start work, and submit completion with mandatory After-photos and notes.
4. **City Admin Desk:** High-level executive dashboard showing city-wide KPIs, department workload distributions, and spatial hotspots.

---

### Q9: How does real-time synchronization work in CityOS?
**Answer:**  
CityOS integrates Socket.IO. When an incident is created, assigned, or resolved, the backend emits WebSocket events (`incident.created`, `incident.status_changed`, `incident.assigned`, `incident.resolved`). Connected clients listen to these events to refresh their queues in real time without manual page reloading.

---

### Q10: How did you test the system?
**Answer:**  
We implemented automated unit and integration tests using **Vitest**:
- 15 backend tests covering State Machine transitions, Priority Engine scoring, Argon2id hashing, JWT rotation, and Health endpoints.
- 2 frontend tests verifying component rendering and strict photo proof validation.
- All 17 automated tests pass with 100% success rate.

