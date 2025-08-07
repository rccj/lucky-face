'use client';

import { useRef, useEffect } from 'react';
import Image from 'next/image';
import { DetectedFace } from '@/lib/faceDetection';
import { useTranslation } from 'react-i18next';

interface LotteryFaceModalProps {
  isOpen: boolean;
  currentFaces: DetectedFace[];
  selectedImage: string | null;
  isAnimating: boolean;
  onClose?: () => void;
  onRestart?: () => void;
}

export default function LotteryFaceModal({ 
  isOpen, 
  currentFaces, 
  selectedImage, 
  isAnimating,
  onClose,
  onRestart
}: LotteryFaceModalProps) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // 鍵盤事件處理
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space' && !isAnimating && onRestart) {
        event.preventDefault();
        onRestart();
      } else if (event.code === 'Escape' && onClose) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isAnimating, onRestart, onClose]);

  // 從圖片中提取人臉區域並顯示在 canvas 上
  useEffect(() => {
    if (!isOpen || !selectedImage || !currentFaces.length || !canvasRef.current || !imageRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const image = imageRef.current;
    
    // 等待圖片載入
    const drawFace = () => {
      if (image.naturalWidth === 0 || image.naturalHeight === 0) return;

      // 設置 canvas 大小為正方形，適合顯示人臉
      const size = 300;
      canvas.width = size;
      canvas.height = size;

      // 清除畫布
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(0, 0, size, size);

      if (currentFaces.length > 0) {
        const face = currentFaces[0]; // 顯示第一個當前選中的人臉
        const box = face.box;

        // 計算人臉區域，並增加一些邊距
        const padding = Math.max(box.width, box.height) * 0.3; // 30% 邊距
        const sourceX = Math.max(0, box.x - padding);
        const sourceY = Math.max(0, box.y - padding);
        const sourceWidth = Math.min(box.width + padding * 2, image.naturalWidth - sourceX);
        const sourceHeight = Math.min(box.height + padding * 2, image.naturalHeight - sourceY);

        // 計算目標位置，保持比例並居中
        const aspectRatio = sourceWidth / sourceHeight;
        let destWidth, destHeight;

        if (aspectRatio > 1) {
          // 寬度較大
          destWidth = size * 0.9;
          destHeight = destWidth / aspectRatio;
        } else {
          // 高度較大或正方形
          destHeight = size * 0.9;
          destWidth = destHeight * aspectRatio;
        }

        const destX = (size - destWidth) / 2;
        const destY = (size - destHeight) / 2;

        // 繪製人臉區域
        ctx.drawImage(
          image,
          sourceX, sourceY, sourceWidth, sourceHeight,
          destX, destY, destWidth, destHeight
        );

        // 添加圓形遮罩效果
        ctx.globalCompositeOperation = 'destination-in';
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size * 0.45, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';

        // 添加圓形邊框，顏色與外面的人臉框同步
        ctx.strokeStyle = isAnimating ? '#dc2626' : '#16a34a'; // 選擇中：紅色，結果：綠色
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size * 0.45, 0, Math.PI * 2);
        ctx.stroke();
      }
    };

    if (image.complete) {
      drawFace();
    } else {
      image.onload = drawFace;
    }
  }, [isOpen, currentFaces, selectedImage, isAnimating]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center cursor-pointer"
      onClick={() => {
        if (onClose) {
          onClose();
        }
      }}
    >
      {/* 背景模糊 */}
      <div 
        className="absolute inset-0 backdrop-blur-md"
        style={{ backdropFilter: 'blur(12px)' }}
      />
      
      {/* 彈窗內容 */}
      <div 
        className="relative bg-white rounded-3xl shadow-2xl p-6 mx-4 max-w-sm w-full animate-[scale-in_0.3s_ease-out] cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          if (!isAnimating && onRestart) {
            onRestart();
          }
        }}
      >
        {/* 標題 */}
        <div className="text-center mb-4">
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            {isAnimating ? t('whoIsLucky') : t('thisLucky')}
          </h3>
        </div>

        {/* 人臉顯示區域 */}
        <div className="flex justify-center mb-4">
          <div className="relative">
            <canvas 
              ref={canvasRef}
              className={`rounded-full shadow-lg transition-all duration-300 ${
                isAnimating ? 'animate-pulse' : ''
              }`}
              style={{ 
                width: '300px', 
                height: '300px',
                filter: isAnimating ? 'brightness(1.1)' : 'none'
              }}
            />
            {isAnimating && (
              <div className="absolute inset-0 rounded-full border-4 border-red-600 border-dashed animate-spin opacity-50" />
            )}
          </div>
        </div>

        {/* 狀態指示器 - 固定高度避免彈跳 */}
        <div className="text-center h-20 flex flex-col justify-center">
          {isAnimating ? (
            <div className="flex items-center justify-center gap-2 text-red-600">
              <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            </div>
          ) : (
            <>
              <div className="text-green-600 font-medium mb-3">
                {t('ding')}
              </div>
              {/* 操作提示 - 固定空間 */}
              <div className="text-xs text-gray-500 space-y-1">
                <p>{t('clickPhotoReselect')}</p>
                <p>{t('clickBlankClose')}</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 隱藏的圖片元素用於繪製 */}
      {selectedImage && (
        <Image
          ref={imageRef}
          src={selectedImage}
          alt="Source image for face extraction"
          width={800}
          height={600}
          className="hidden"
          unoptimized
        />
      )}
    </div>
  );
}