import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";

let detectorPromise: Promise<FaceDetector> | null = null;

const getDetector = () => {
  if (!detectorPromise) {
    detectorPromise = (async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm"
      );
      return await FaceDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
          delegate: "GPU",
        },
        runningMode: "IMAGE",
      });
    })().catch((err) => {
      detectorPromise = null;
      throw err;
    });
  }
  return detectorPromise;
};

export interface FaceDetectionResult {
  faceCount: number;
  confidence: number;
}

export async function detectFacesInFile(file: File): Promise<FaceDetectionResult> {
  if (!file.type.startsWith("image/")) {
    return { faceCount: 0, confidence: 0 };
  }
  const detector = await getDetector();
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("Could not load image"));
      i.src = url;
    });
    const result = detector.detect(img);
    const detections = result.detections || [];
    const confidence = detections.reduce(
      (max, d) => Math.max(max, d.categories?.[0]?.score ?? 0),
      0
    );
    return { faceCount: detections.length, confidence };
  } finally {
    URL.revokeObjectURL(url);
  }
}
