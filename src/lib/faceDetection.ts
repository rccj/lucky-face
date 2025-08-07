import * as faceapi from 'face-api.js';
import { isMobile } from 'react-device-detect';

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
  
  // 使用 react-device-detect 檢測手機裝置
  
  // 手機版使用簡化的偵測方法，避免記憶體問題
  if (isMobile) {
    
    // 只使用最基本的偵測方法
    const detectionMethods = [
      // 方法 1: SSD MobileNet (較高信心度) - 原始圖像
      () => faceapi.detectAllFaces(
        imageElement,
        new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 })
      ),
      // 方法 2: Tiny Face Detector (較低資源使用) - 原始圖像
      () => faceapi.detectAllFaces(
        imageElement,
        new faceapi.TinyFaceDetectorOptions({
          inputSize: 416, // 較小的輸入尺寸
          scoreThreshold: 0.5
        })
      )
    ];
    
    let bestDetections: faceapi.FaceDetection[] = [];
    
    for (let i = 0; i < detectionMethods.length; i++) {
      try {
        const detections = await detectionMethods[i]();
        
        if (detections.length > bestDetections.length) {
          bestDetections = detections;
        }
        
        // 手機版如果找到人臉就提早結束，節省資源
        if (detections.length > 0) {
          break;
        }
      } catch (error) {
        console.warn(`Mobile: Detection method ${i + 1} failed:`, error);
        continue;
      }
    }
    
    // 手機版也需要去重處理
    const filteredDetections = removeDuplicateDetections(bestDetections);
    
    return filteredDetections.map((detection, index) => ({
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
  
  // 桌面版使用完整的偵測方法
  
  // 預處理圖像以提高偵測效果
  const preprocessedCanvas = preprocessImage(imageElement);
  
  // 嘗試多種偵測方法和參數，提高精準度
  const detectionMethods = [
    // 方法 1: SSD MobileNet (最高信心度) - 原始圖像
    () => faceapi.detectAllFaces(
      imageElement,
      new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 })
    ),
    // 方法 2: SSD MobileNet (中等信心度) - 原始圖像
    () => faceapi.detectAllFaces(
      imageElement,
      new faceapi.SsdMobilenetv1Options({ minConfidence: 0.4 })
    ),
    // 方法 3: SSD MobileNet (較低信心度) - 預處理圖像
    () => faceapi.detectAllFaces(
      preprocessedCanvas,
      new faceapi.SsdMobilenetv1Options({ minConfidence: 0.3 })
    ),
    // 方法 4: Tiny Face Detector (高精度設定) - 原始圖像
    () => faceapi.detectAllFaces(
      imageElement,
      new faceapi.TinyFaceDetectorOptions({
        inputSize: 608,
        scoreThreshold: 0.4
      })
    ),
    // 方法 5: Tiny Face Detector (標準設定) - 預處理圖像
    () => faceapi.detectAllFaces(
      preprocessedCanvas,
      new faceapi.TinyFaceDetectorOptions({
        inputSize: 512,
        scoreThreshold: 0.35
      })
    )
  ];

  let bestDetections: faceapi.FaceDetection[] = [];
  
  // 嘗試不同的偵測方法，選擇找到最多人臉的結果
  for (let i = 0; i < detectionMethods.length; i++) {
    try {
      const detections = await detectionMethods[i]();
      
      if (detections.length > bestDetections.length) {
        bestDetections = detections;
      }
      
      // 如果找到足夠多的人臉，可以提早結束
      if (detections.length >= 5) {
        break;
      }
    } catch (error) {
      console.warn(`Detection method ${i + 1} failed:`, error);
      continue;
    }
  }
  
  // 去除重複的人臉檢測（基於位置相似度）
  const filteredDetections = removeDuplicateDetections(bestDetections);
  
  return filteredDetections.map((detection, index) => ({
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

// 去除重複的人臉檢測
function removeDuplicateDetections(detections: faceapi.FaceDetection[]): faceapi.FaceDetection[] {
  const filtered: faceapi.FaceDetection[] = [];
  
  for (const detection of detections) {
    const isDuplicate = filtered.some(existing => {
      // 計算兩個檢測框的重疊度
      const overlap = calculateOverlap(detection.box, existing.box);
      // 如果重疊度超過50%，視為相同人臉
      return overlap > 0.5;
    });
    
    if (!isDuplicate) {
      filtered.push(detection);
    }
  }
  
  return filtered;
}

// 計算兩個矩形的重疊比例
function calculateOverlap(box1: faceapi.Box, box2: faceapi.Box): number {
  const x1 = Math.max(box1.x, box2.x);
  const y1 = Math.max(box1.y, box2.y);
  const x2 = Math.min(box1.x + box1.width, box2.x + box2.width);
  const y2 = Math.min(box1.y + box1.height, box2.y + box2.height);
  
  if (x2 <= x1 || y2 <= y1) return 0; // 沒有重疊
  
  const intersectionArea = (x2 - x1) * (y2 - y1);
  const box1Area = box1.width * box1.height;
  const box2Area = box2.width * box2.height;
  const unionArea = box1Area + box2Area - intersectionArea;
  
  return intersectionArea / unionArea; // IoU (Intersection over Union)
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
    
    // 檢測設備類型以調整樣式
    const isMobile = window.innerWidth < 768;
    const lineMultiplier = isMobile ? 2 : 1;
    
    // 綠色辨識人臉，紅色抽籤中獎
    if (isWinner) {
      // 中獎者：紅色強調邊框
      ctx.lineWidth = 4 * lineMultiplier;
      
      // 外層光暈
      ctx.strokeStyle = '#dc2626';
      ctx.shadowColor = '#dc2626';
      ctx.shadowBlur = 12 * lineMultiplier;
      ctx.setLineDash([]);
      ctx.strokeRect(
        face.box.x - 6,
        face.box.y - 6,
        face.box.width + 12,
        face.box.height + 12
      );
      
      // 主邊框
      ctx.strokeStyle = '#b91c1c';
      ctx.lineWidth = 3 * lineMultiplier;
      ctx.shadowBlur = 6 * lineMultiplier;
      ctx.strokeRect(
        face.box.x - 2,
        face.box.y - 2,
        face.box.width + 4,
        face.box.height + 4
      );
      
    } else {
      // 一般人臉：綠色邊框
      ctx.strokeStyle = '#16a34a';
      ctx.lineWidth = 3 * lineMultiplier;
      ctx.shadowColor = '#16a34a';
      ctx.shadowBlur = 6 * lineMultiplier;
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
    
    // 框框外圍右上角編號設計，手機版放大
    const baseNumberSize = isWinner ? 20 : 16;
    const numberSize = baseNumberSize * (isMobile ? 1.5 : 1);
    const numberX = face.box.x + face.box.width + (isMobile ? 12 : 8);
    const numberY = face.box.y - (isMobile ? 12 : 8);
    
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
    
  });
  
  // 重置繪圖狀態
  ctx.setLineDash([]);
  ctx.textAlign = 'start';
  ctx.textBaseline = 'alphabetic';
  ctx.shadowBlur = 0;
}