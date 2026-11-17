# CityOS AI Service (FastAPI + PyTorch/YOLO)

The computer vision service for automated detection, classification, and severity scoring of reported urban problems.

## Setup & Running

```bash
cd ai-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
```

The service runs at `http://localhost:8000`.
- Health Check: `GET http://localhost:8000/health`
- Predict Endpoint: `POST http://localhost:8000/api/v1/predict`

