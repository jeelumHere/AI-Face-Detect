import { useEffect, useRef, useState } from "react";
import * as faceapi from "@vladmandic/face-api";

export default function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const fileInputRef = useRef(null);

  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [mode, setMode] = useState("webcam"); // "webcam" | "image"
  const [status, setStatus] = useState("Loading models...");
  const [info, setInfo] = useState([]);
  const [imageSrc, setImageSrc] = useState(null);

  const streamRef = useRef(null);
  const intervalRef = useRef(null);

  // Load models once
  useEffect(() => {
    const load = async () => {
      const MODEL_URL = "/models";
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL),
      ]);
      setModelsLoaded(true);
      setStatus("Models loaded.");
    };
    load();
  }, []);

  // Start/stop webcam depending on mode
  useEffect(() => {
    if (!modelsLoaded) return;

    if (mode === "webcam") {
      startWebcam();
    } else {
      stopWebcam();
    }

    return () => stopWebcam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, modelsLoaded]);

  const startWebcam = async () => {
    setStatus("Starting camera...");
    const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
    streamRef.current = stream;
    if (videoRef.current) videoRef.current.srcObject = stream;
    setStatus("Running (webcam)");
  };

  const stopWebcam = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const handleVideoPlay = () => {
    intervalRef.current = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current) return;
      const displaySize = {
        width: videoRef.current.videoWidth,
        height: videoRef.current.videoHeight,
      };
      faceapi.matchDimensions(canvasRef.current, displaySize);

      const detections = await faceapi
        .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions()
        .withAgeAndGender();

      drawResults(detections, displaySize);
    }, 200);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImageSrc(url);
    setInfo([]);
  };

  const handleImageLoad = async () => {
    if (!imageRef.current || !canvasRef.current) return;
    setStatus("Detecting faces in image...");

    const displaySize = {
      width: imageRef.current.width,
      height: imageRef.current.height,
    };
    faceapi.matchDimensions(canvasRef.current, displaySize);

    const detections = await faceapi
      .detectAllFaces(imageRef.current, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions()
      .withAgeAndGender();

    drawResults(detections, displaySize);
    setStatus(
      detections.length
        ? `Found ${detections.length} face(s)`
        : "No faces detected"
    );
  };

  const drawResults = (detections, displaySize) => {
    const resized = faceapi.resizeResults(detections, displaySize);
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, displaySize.width, displaySize.height);

    faceapi.draw.drawDetections(canvasRef.current, resized);
    faceapi.draw.drawFaceLandmarks(canvasRef.current, resized);
    faceapi.draw.drawFaceExpressions(canvasRef.current, resized);

    setInfo(
      resized.map((d) => ({
        age: Math.round(d.age),
        gender: d.gender,
        emotion: Object.entries(d.expressions).sort((a, b) => b[1] - a[1])[0],
      }))
    );
  };

  const switchMode = (next) => {
    setInfo([]);
    setImageSrc(null);
    setMode(next);
  };

  return (
    <div style={{ fontFamily: "system-ui", padding: 24 }}>
      <h1>Real-Time Face Analysis</h1>
      <p>{status}</p>

      <div style={{ marginBottom: 16 }}>
        <button
          onClick={() => switchMode("webcam")}
          disabled={mode === "webcam"}
          style={{ marginRight: 8, padding: "8px 16px" }}
        >
          Webcam
        </button>
        <button
          onClick={() => switchMode("image")}
          disabled={mode === "image"}
          style={{ padding: "8px 16px" }}
        >
          Upload Image
        </button>
      </div>

      {mode === "image" && (
        <div style={{ marginBottom: 16 }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
          />
        </div>
      )}

      <div style={{ position: "relative", width: 720 }}>
        {mode === "webcam" ? (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            width="720"
            height="560"
            onPlay={handleVideoPlay}
            style={{ borderRadius: 8 }}
          />
        ) : (
          imageSrc && (
            <img
              ref={imageRef}
              src={imageSrc}
              onLoad={handleImageLoad}
              alt="uploaded"
              width="720"
              style={{ borderRadius: 8, display: "block" }}
            />
          )
        )}
        <canvas
          ref={canvasRef}
          style={{ position: "absolute", top: 0, left: 0 }}
        />
      </div>

      <div style={{ marginTop: 16 }}>
        {info.map((f, i) => (
          <div key={i}>
            Face {i + 1} — Age: {f.age}, Gender: {f.gender}, Emotion:{" "}
            {f.emotion[0]} ({(f.emotion[1] * 100).toFixed(1)}%)
          </div>
        ))}
      </div>
    </div>
  );
}