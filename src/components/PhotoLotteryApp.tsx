'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DetectedFace, detectFaces, loadFaceApiModels, drawFaceBoxes } from '@/lib/faceDetection';
import { animateWinnerSelection } from '@/lib/lottery';

export default function PhotoLotteryApp() {
  const { t, i18n } = useTranslation();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [detectedFaces, setDetectedFaces] = useState<DetectedFace[]>([]);
  const [winners, setWinners] = useState<DetectedFace[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [winnerCount, setWinnerCount] = useState(1);
  const [isModelsLoading, setIsModelsLoading] = useState(false);
  
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    const initModels = async () => {
      setIsModelsLoading(true);
      try {
        await loadFaceApiModels();
      } catch (error) {
        console.error('Failed to load face detection models:', error);
      }
      setIsModelsLoading(false);
    };
    
    initModels();
  }, []);

  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        setDetectedFaces([]);
        setWinners([]);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      setIsCapturing(true);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error('Camera access denied:', error);
      alert(t('error.cameraAccess'));
      setIsCapturing(false);
    }
  }, [t]);

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg');
        setSelectedImage(imageData);
        setDetectedFaces([]);
        setWinners([]);
        
        // Stop camera
        const stream = video.srcObject as MediaStream;
        stream?.getTracks().forEach(track => track.stop());
        setIsCapturing(false);
      }
    }
  }, []);

  const handleDetectFaces = useCallback(async () => {
    if (!selectedImage || !imageRef.current) return;
    
    setIsProcessing(true);
    try {
      const faces = await detectFaces(imageRef.current);
      setDetectedFaces(faces);
      
      if (canvasRef.current && imageRef.current) {
        const canvas = canvasRef.current;
        canvas.width = imageRef.current.naturalWidth;
        canvas.height = imageRef.current.naturalHeight;
        drawFaceBoxes(canvas, faces);
      }
      
      if (faces.length === 0) {
        alert(t('error.noFaces'));
      }
    } catch (error) {
      console.error('Face detection failed:', error);
      alert(t('error.uploadFailed'));
    }
    setIsProcessing(false);
  }, [selectedImage, t]);

  const handleStartLottery = useCallback(() => {
    if (detectedFaces.length === 0) return;
    
    setIsAnimating(true);
    setWinners([]);
    
    animateWinnerSelection(
      detectedFaces,
      (currentFaces) => {
        if (canvasRef.current) {
          drawFaceBoxes(canvasRef.current, detectedFaces, currentFaces);
        }
      },
      (finalWinners) => {
        setWinners(finalWinners);
        setIsAnimating(false);
        if (canvasRef.current) {
          drawFaceBoxes(canvasRef.current, detectedFaces, finalWinners);
        }
      },
      winnerCount
    );
  }, [detectedFaces, winnerCount]);

  const handleDownload = useCallback(() => {
    if (!canvasRef.current || !imageRef.current) return;
    
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;
    
    tempCanvas.width = imageRef.current.naturalWidth;
    tempCanvas.height = imageRef.current.naturalHeight;
    
    tempCtx.drawImage(imageRef.current, 0, 0);
    drawFaceBoxes(tempCanvas, detectedFaces, winners);
    
    const link = document.createElement('a');
    link.download = 'lottery-result.jpg';
    link.href = tempCanvas.toDataURL('image/jpeg');
    link.click();
  }, [detectedFaces, winners]);

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'zh' ? 'en' : 'zh');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          {/* Faceffle Logo */}
          <div className="flex items-center justify-center mb-4">
            <div className="text-6xl mr-3">🎯</div>
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {t('title')}
              </h1>
              <p className="text-lg text-gray-600 mt-1">
                {t('subtitle')}
              </p>
            </div>
          </div>
          
          <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
            {t('welcomeMessage')}
          </p>
          
          <div className="flex justify-center gap-4 mb-6">
            <button
              onClick={toggleLanguage}
              className="px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm border"
            >
              {i18n.language === 'zh' ? '🌍 English' : '🌏 中文'}
            </button>
          </div>
          
          {/* How to Use Section */}
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 mb-6 text-left max-w-2xl mx-auto">
            <h3 className="font-semibold text-gray-800 mb-3 text-center">{t('howToUse')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
              <div>{t('step1')}</div>
              <div>{t('step2')}</div>
              <div>{t('step3')}</div>
              <div>{t('step4')}</div>
            </div>
          </div>
        </header>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">{t('uploadOrCapture')}</h2>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 font-semibold shadow-lg disabled:opacity-50"
              disabled={isProcessing || isAnimating}
            >
              📁 {t('uploadPhoto')}
            </button>
            
            <button
              onClick={isCapturing ? capturePhoto : startCamera}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-300 font-semibold shadow-lg disabled:opacity-50"
              disabled={isProcessing || isAnimating}
            >
              {isCapturing ? '📸 拍攝' : `📷 ${t('capturePhoto')}`}
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />

          {isCapturing && (
            <div className="mb-6">
              <video
                ref={videoRef}
                className="w-full max-w-md mx-auto rounded-lg"
                autoPlay
                playsInline
                muted
              />
            </div>
          )}

          {selectedImage && (
            <div className="relative mb-6">
              <img
                ref={imageRef}
                src={selectedImage}
                alt="Selected"
                className="w-full max-w-2xl mx-auto rounded-lg shadow-md"
                onLoad={() => {
                  if (canvasRef.current && imageRef.current) {
                    canvasRef.current.width = imageRef.current.naturalWidth;
                    canvasRef.current.height = imageRef.current.naturalHeight;
                  }
                }}
              />
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-1/2 transform -translate-x-1/2 pointer-events-none rounded-lg"
                style={{
                  width: imageRef.current?.clientWidth || 'auto',
                  height: imageRef.current?.clientHeight || 'auto',
                }}
              />
            </div>
          )}

          {selectedImage && (
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
              <button
                onClick={handleDetectFaces}
                disabled={isProcessing || isAnimating || isModelsLoading}
                className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 font-semibold shadow-lg disabled:opacity-50"
              >
                🔍 {isProcessing ? t('processing') : t('detectFaces')}
              </button>

              {detectedFaces.length > 0 && (
                <>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">
                      {t('selectWinners', { count: winnerCount })}:
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={detectedFaces.length}
                      value={winnerCount}
                      onChange={(e) => setWinnerCount(Math.max(1, Math.min(detectedFaces.length, parseInt(e.target.value) || 1)))}
                      className="w-16 px-2 py-1 border rounded"
                    />
                  </div>

                  <button
                    onClick={handleStartLottery}
                    disabled={isAnimating}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 disabled:opacity-50 font-semibold shadow-lg"
                  >
                    {isAnimating ? t('processing') : t('startRaffle')} 🎲
                  </button>
                </>
              )}

              {winners.length > 0 && (
                <button
                  onClick={handleDownload}
                  className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all duration-300 font-semibold shadow-lg"
                >
                  💾 {t('downloadResult')}
                </button>
              )}
            </div>
          )}

          {detectedFaces.length > 0 && (
            <div className="mt-4 text-center text-gray-600">
              {t('facesDetected', { count: detectedFaces.length })}
            </div>
          )}

          {isModelsLoading && (
            <div className="text-center text-gray-500 mt-4">
              正在載入 AI 模型...
            </div>
          )}

          {/* 調試資訊 */}
          {selectedImage && (
            <div className="mt-4 p-3 bg-gray-100 rounded-lg text-sm">
              <h3 className="font-semibold mb-2">偵測資訊：</h3>
              <p>• 圖片尺寸：{imageRef.current?.naturalWidth} x {imageRef.current?.naturalHeight}</p>
              <p>• 偵測到的人臉數量：{detectedFaces.length}</p>
              {detectedFaces.length > 0 && (
                <p>• 人臉位置：{detectedFaces.map((face, i) => 
                  `#${i+1}(${Math.round(face.box.x)},${Math.round(face.box.y)})`
                ).join(', ')}</p>
              )}
              <p className="text-gray-600 mt-2">
                💡 提示：如果偵測不准確，請確保照片清晰且人臉可見。開啟瀏覽器開發者工具的 Console 可看到詳細偵測過程。
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}