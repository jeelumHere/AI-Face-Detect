# Real-Time Face Analysis (React + face-api.js)

A browser-based AI application that performs real-time face detection, facial landmark tracking, emotion recognition, and age/gender estimation — entirely client-side, no backend or server-side inference required.

## Features

- **Live webcam detection** — real-time face tracking with bounding boxes and 68-point facial landmarks
- **Image upload mode** — run the same detection pipeline on a static uploaded photo
- **Emotion recognition** — classifies expression across 7 categories with confidence scores
- **Age & gender estimation** — regression/classification output per detected face
- **Fully client-side** — inference runs in-browser via TensorFlow.js (WebGL backend); no data leaves the device

## Tech Stack

- React (Vite)
- [`@vladmandic/face-api`](https://github.com/vladmandic/face-api) — maintained fork of face-api.js
- TensorFlow.js (WebGL backend)

## Models Used

| Model | Purpose |
|---|---|
| TinyFaceDetector | Lightweight CNN for real-time face bounding box detection |
| Face Landmark 68 | Regresses 68 facial keypoints (eyes, brows, nose, jaw, lips) |
| Face Expression Net | Classifies emotion across 7 categories (softmax output) |
| Age/Gender Net | Age regression + binary gender classification |

## Getting Started

### Prerequisites
- Node.js (v18+)

### Installation

```bash
git clone https://github.com/jeelumHere/<repo-name>.git
cd <repo-name>
npm install
```

### Download model weights

Model weights are not bundled in the npm package and must be added manually:

```bash
git clone --depth 1 https://github.com/vladmandic/face-api.git tmp-face
mkdir -p public/models
cp tmp-face/model/* public/models/
rm -rf tmp-face
```

(On Windows PowerShell, replace `rm -rf` with `Remove-Item tmp-face -Recurse -Force`.)

### Run locally

```bash
npm run dev
```

Open `http://localhost:5173`, allow camera access, and the app will begin detecting faces in real time. Switch to **Upload Image** mode to run detection on a static photo instead.

> Camera access requires `localhost` or HTTPS — no deployment needed for local demo/testing.

## Project Structure

```
├── public/
│   └── models/          # face-api.js model weights (not committed — see setup)
├── src/
│   └── App.jsx           # main app: webcam + image upload, detection loop, canvas overlay
└── README.md
```

## How It Works

1. Models load once on mount via `faceapi.nets.*.loadFromUri()`
2. In webcam mode, a `setInterval` loop runs detection every 200ms on the video stream
3. In image upload mode, detection runs once when the uploaded image loads
4. Detected face data (box, landmarks, expressions, age/gender) is resized to match display dimensions and drawn onto an absolutely-positioned `<canvas>` overlay
5. Per-face metadata (age, gender, top emotion + confidence) is rendered below the video/image

## Limitations

- Age estimation is approximate and reflects biases in the training dataset
- Emotion recognition detects facial *expression*, not actual emotional state
- Detection accuracy drops in poor lighting, side angles, or with small/distant faces
- TinyFaceDetector prioritizes speed over accuracy compared to larger detector models

## Credits

Built on [face-api.js](https://github.com/justadudewhohacks/face-api.js) by Vincent Mühler, using the actively maintained fork by [@vladmandic](https://github.com/vladmandic/face-api).

## License

MIT