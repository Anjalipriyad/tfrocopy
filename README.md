# Topological Financial Risk Optimizer (TFRO)

## Overview

The **Topological Financial Risk Optimizer (TFRO)** is a full‑stack analytical engine designed to detect catastrophic market drawdowns before they manifest in price movements. Leveraging advanced **Topological Data Analysis (TDA)**, TFRO identifies structural instabilities in high‑dimensional market data, providing early warnings for potential crashes.

## Features

- **Topological Signature Extraction** – Maps market momentum into high‑dimensional point clouds to detect instability patterns.
- **Manifold Dynamics Tracking** – Monitors the rate of change in topological features to filter noise and reduce false positives.
- **Adaptive Regime Mapping** – Dynamically adjusts to evolving market regimes for consistent sensitivity.
- **Ensemble Soft‑Voting Engine** – Combines multiple models for robust risk scoring.
- **Probabilistic Confidence Calibration** – Provides clear confidence percentages for each prediction.
- **Retail Advisory Layer** – Translates complex signals into actionable advice (stop‑loss, allocation limits).
- **Glassmorphism Dashboard** – Interactive React UI with 3‑D risk visualizations.

## Tech Stack

- **Backend:** Python 3.10+, FastAPI, scikit‑tda, NumPy, pandas
- **Frontend:** React, Vite, D3.js, Three.js, CSS (glassmorphism styling)
- **Deployment:** Docker, Nginx
- **Testing:** PyTest, Jest (frontend)

## Getting Started

### Prerequisites

- Python 3.10+ and `pip`
- Node.js (v18+) and `npm`
- Docker (optional, for containerized deployment)

### Installation

```bash
# Clone the repository
git clone https://github.com/Anjalipriyad/tfrocopy.git
cd tfrocopy

# Backend setup
python -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Frontend setup
cd frontend
npm install
```

### Development

#### Backend

```bash
# Run FastAPI server (default http://localhost:8000)
uvicorn main:app --reload
```

#### Frontend

```bash
npm run dev   # Starts Vite dev server at http://localhost:5173
```

### Building for Production

```bash
# Backend Docker image
docker build -t tfro-backend .

# Frontend static build
cd frontend
npm run build   # Outputs to ./dist
```

## Usage

1. **Start the backend** and ensure the API is reachable.
2. **Launch the frontend** to access the dashboard.
3. **Upload or fetch market data** via the UI.
4. **Run analysis** – the loading overlay indicates processing.
5. **Explore results** – interact with 3‑D risk surfaces and view confidence scores.

## Project Structure

```
.
├─ backend/               # FastAPI server and analysis engine
│   ├─ main.py
│   ├─ requirements.txt
│   └─ ...
├─ frontend/              # React dashboard
│   ├─ src/
│   │   ├─ components/
│   │   │   ├─ LoadingOverlay.jsx
│   │   │   └─ PortfolioBuilder.jsx
│   │   └─ App.jsx
│   ├─ index.css
│   ├─ vite.config.ts
│   └─ package.json
├─ Dockerfile
├─ README.md               # (this file)
└─ LICENSE
```

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/your-feature`).
3. Ensure code passes linting (`npm run lint` / `flake8`).
4. Open a pull request with a clear description of changes.

## License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

*Developed by the TFRO team.*
