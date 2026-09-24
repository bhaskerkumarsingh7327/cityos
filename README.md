# CityOS — Intelligent Urban Problem Solving Platform

CityOS is a production-oriented platform for reporting, classifying, prioritizing, and resolving
urban infrastructure problems (potholes, damaged roads, streetlights, garbage, water leakage,
drainage, traffic signals, etc.) using AI, GIS, and real-time systems.

> **Status:** Phase 1 — Foundation (in progress)

## Monorepo 
cityos/
├── frontend/         # React 19 + TypeScript + Vite + Tailwind
├── backend/          # Node.js + TypeScript + Express (REST API + Socket.IO)
├── ai-service/        # Python + FastAPI + PyTorch/YOLO (Phase 7)
├── workers/            # BullMQ background workers (Phase 8)
├── infrastructure/     # Docker, deployment, infra-as-code
├── docs/                # Architecture & API documentation
├── scripts/             # Dev/setup scripts
├── docker-compose.yml
├── .env.example
└── README.md

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui, MapLibre GL JS, TanStack Query, Zustand
- **Backend:** Node.js, TypeScript, Express, Socket.IO, Zod
- **Database:** PostgreSQL + PostGIS
- **AI Service:** Python, FastAPI, PyTorch, YOLO, OpenCV (Phase 7)
- **Queue:** Redis + BullMQ (Phase 8)
- **Storage:** MinIO (dev) / S3-compatible (prod)
- **DevOps:** Docker, Docker Compose, GitHub Actions

## Development Phases

This project follows a strict phase-by-phase implementation plan. Only Phase 1 (Foundation) is
implemented so far.

## Implementation Rules

- Do not change the core architecture or tech stack without explicit justification.
- No fake AI results, no fake statistics.
- Mock data must be clearly labeled as mock.
- Security, validation, logging, and testing are mandatory, not optional.

## License

Proprietary — internal project.