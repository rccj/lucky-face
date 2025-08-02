import * as faceapi from 'face-api.js';

export interface DetectedFace {
  id: string;
  box: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  detection: faceapi.FaceDetection;
}

let modelsLoaded = false;

export async function loadFaceApiModels(): Promise<void> {
  if (modelsLoaded) return;
  
  const modelUrl = '/models';
  
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl),
    faceapi.nets.ssdMobilenetv1.loadFromUri(modelUrl),
  ]);
  
  modelsLoaded = true;
}

function preprocessImage(imageElement: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  canvas.width = imageElement.naturalWidth;
  canvas.height = imageElement.naturalHeight;
  
  // 繪製原始圖像
  ctx.drawImage(imageElement, 0, 0);
  
  // 增強對比度和亮度
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    // 增強對比度 (1.2倍) 和亮度 (+20)
    data[i] = Math.min(255, Math.max(0, data[i] * 1.2 + 20));     // Red
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] * 1.2 + 20)); // Green
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] * 1.2 + 20)); // Blue
  }
  
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

export async function detectFaces(imageElement: HTMLImageElement): Promise<DetectedFace[]> {
  if (!modelsLoaded) {
    await loadFaceApiModels();
  }
  
  console.log(`Starting face detection on image: ${imageElement.naturalWidth}x${imageElement.naturalHeight}`);
  
  // 預處理圖像以提高偵測效果
  const preprocessedCanvas = preprocessImage(imageElement);
  
  // 嘗試多種偵測方法和參數
  const detectionMethods = [
    // 方法 1: SSD MobileNet (更準確，適合群體照片) - 原始圖像
    () => faceapi.detectAllFaces(
      imageElement,
      new faceapi.SsdMobilenetv1Options({ minConfidence: 0.2 })
    ),
    // 方法 2: SSD MobileNet - 預處理圖像
    () => faceapi.detectAllFaces(
      preprocessedCanvas,
      new faceapi.SsdMobilenetv1Options({ minConfidence: 0.2 })
    ),
    // 方法 3: Tiny Face Detector (更快速，較低閾值) - 原始圖像
    () => faceapi.detectAllFaces(
      imageElement,
      new faceapi.TinyFaceDetectorOptions({
        inputSize: 512,
        scoreThreshold: 0.2
      })
    ),
    // 方法 4: Tiny Face Detector - 預處理圖像
    () => faceapi.detectAllFaces(
      preprocessedCanvas,
      new faceapi.TinyFaceDetectorOptions({
        inputSize: 416,
        scoreThreshold: 0.3
      })
    ),
    // 方法 5: Tiny Face Detector (預設參數)
    () => faceapi.detectAllFaces(
      imageElement,
      new faceapi.TinyFaceDetectorOptions()
    )
  ];

  let bestDetections: faceapi.FaceDetection[] = [];
  
  // 嘗試不同的偵測方法，選擇找到最多人臉的結果
  for (let i = 0; i < detectionMethods.length; i++) {
    try {
      console.log(`Trying detection method ${i + 1}...`);
      const detections = await detectionMethods[i]();
      console.log(`Detection method ${i + 1} found ${detections.length} faces`);
      
      if (detections.length > bestDetections.length) {
        bestDetections = detections;
        console.log(`New best result: ${detections.length} faces`);
      }
      
      // 如果找到足夠多的人臉，可以提早結束
      if (detections.length >= 5) {
        console.log(`Found ${detections.length} faces, stopping early`);
        break;
      }
    } catch (error) {
      console.warn(`Detection method ${i + 1} failed:`, error);
      continue;
    }
  }
  
  console.log(`Final detection result: ${bestDetections.length} faces found`);
  
  return bestDetections.map((detection, index) => ({
    id: `face-${index}`,
    box: {
      x: detection.box.x,
      y: detection.box.y,
      width: detection.box.width,
      height: detection.box.height,
    },
    detection,
  }));
}

export function drawFaceBoxes(
  canvas: HTMLCanvasElement,
  faces: DetectedFace[],
  winners: DetectedFace[] = []
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  faces.forEach((face, index) => {
    const isWinner = winners.some(w => w.id === face.id);
    const centerX = face.box.x + face.box.width / 2;
    const centerY = face.box.y + face.box.height / 2;
    
    // 綠色辨識人臉，紅色抽籤中獎
    if (isWinner) {
      // 中獎者：紅色強調邊框
      ctx.lineWidth = 4;
      
      // 外層光暈
      ctx.strokeStyle = '#dc2626';
      ctx.shadowColor = '#dc2626';
      ctx.shadowBlur = 8;
      ctx.setLineDash([]);
      ctx.strokeRect(
        face.box.x - 4,
        face.box.y - 4,
        face.box.width + 8,
        face.box.height + 8
      );
      
      // 主邊框
      ctx.strokeStyle = '#b91c1c';
      ctx.lineWidth = 3;
      ctx.shadowBlur = 4;
      ctx.strokeRect(
        face.box.x - 1,
        face.box.y - 1,
        face.box.width + 2,
        face.box.height + 2
      );
      
    } else {
      // 一般人臉：綠色邊框
      ctx.strokeStyle = '#16a34a';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#16a34a';
      ctx.shadowBlur = 4;
      ctx.setLineDash([]);
      ctx.strokeRect(
        face.box.x,
        face.box.y,
        face.box.width,
        face.box.height
      );
    }
    
    // 重置陰影
    ctx.shadowBlur = 0;
    
    // 框框外圍右上角編號設計
    const numberSize = isWinner ? 20 : 16;
    const numberX = face.box.x + face.box.width + 8;
    const numberY = face.box.y - 8;
    
    // 編號背景框
    ctx.fillStyle = isWinner ? '#b91c1c' : '#16a34a';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 2;
    
    const textWidth = ctx.measureText((index + 1).toString()).width + 8;
    const backgroundWidth = Math.max(numberSize + 4, textWidth);
    const backgroundHeight = numberSize + 4;
    
    ctx.fillRect(
      numberX - backgroundWidth / 2,
      numberY - backgroundHeight / 2,
      backgroundWidth,
      backgroundHeight
    );
    
    // 編號文字
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = '#ffffff';
    ctx.font = `600 ${numberSize}px -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      (index + 1).toString(),
      numberX,
      numberY
    );
    
    if (isWinner) {
      // 簡潔慶祝效果
      // 星星圖標
      ctx.font = '24px Arial';
      ctx.fillStyle = '#b91c1c';
      ctx.shadowColor = '#dc2626';
      ctx.shadowBlur = 4;
      ctx.fillText('⭐', centerX, face.box.y - 20);
      
      // 勝利文字
      ctx.shadowBlur = 0;
      ctx.font = `600 ${Math.max(14, face.box.width / 8)}px -apple-system, BlinkMacSystemFont, sans-serif`;
      ctx.fillStyle = '#b91c1c';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      
      const winnerText = 'WINNER';
      // 文字陰影增強可讀性
      ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
      ctx.shadowBlur = 2;
      ctx.shadowOffsetY = 1;
      
      ctx.strokeText(winnerText, centerX, face.box.y + face.box.height + 30);
      ctx.fillText(winnerText, centerX, face.box.y + face.box.height + 30);
      
      // 重置陰影
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
    }
  });
  
  // 重置繪圖狀態
  ctx.setLineDash([]);
  ctx.textAlign = 'start';
  ctx.textBaseline = 'alphabetic';
  ctx.shadowBlur = 0;
}