'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { isMobile } from 'react-device-detect';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { DetectedFace, detectFaces, loadFaceApiModels, drawFaceBoxes } from '@/lib/faceDetection';
import { animateWinnerSelection } from '@/lib/lottery';
import ProductTour from './ProductTour';
import Header from './Header';
import FaceAdjuster from './FaceAdjuster';

export default function PhotoLotteryApp() {
  const { t } = useTranslation();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [detectedFaces, setDetectedFaces] = useState<DetectedFace[]>([]);
  const [winners, setWinners] = useState<DetectedFace[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [winnerCount, setWinnerCount] = useState(1);
  const [isModelsLoading, setIsModelsLoading] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  
  // 動態調整 video 比例
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isCapturing) return;

    const handleLoadedMetadata = () => {
      const aspectRatio = video.videoWidth / video.videoHeight;
      video.style.aspectRatio = aspectRatio.toString();
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    
    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [isCapturing]);
  const [showUploadOptions, setShowUploadOptions] = useState(false);
  const [isTourActive, setIsTourActive] = useState(false);
  const [showFaceAdjuster, setShowFaceAdjuster] = useState(false);
  
  // 彈窗模態行為 - 禁用背景滾動
  useEffect(() => {
    const hasAnyModalOpen = showFaceAdjuster || showUploadOptions;
    
    if (hasAnyModalOpen) {
      // 開啟任何彈窗時禁用背景滾動
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      // 所有彈窗關閉時恢復背景滾動
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    
    // 清理函數，確保組件卸載時恢復滾動
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [showFaceAdjuster, showUploadOptions]);
  
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // 定義產品導覽步驟
  const tourSteps = [
    {
      title: '上傳照片',
      content: '點擊這裡上傳團體照片，AI 會自動辨識所有人臉',
      icon: '📷',
      animation: 'animate-pulse'
    },
    {
      title: '偵測人臉',
      content: '讓 AI 幫你找出照片中的每一張臉',
      icon: '🔍',
      animation: 'animate-spin'
    },
    {
      title: '設定人數',
      content: '選擇要抽出幾位幸運兒',
      icon: '🎯',
      animation: 'animate-bounce'
    },
    {
      title: '開始抽籤',
      content: '緊張刺激的時刻到了！',
      icon: '🎲',
      animation: 'animate-pulse'
    },
    {
      title: '下載結果',
      content: '保存你的抽獎結果',
      icon: '💾',
      animation: 'animate-bounce'
    },
  ];

  useEffect(() => {
    const initModels = async () => {
      setIsModelsLoading(true);
      try {
        await loadFaceApiModels();
      } catch (error) {
        console.error('Failed to load face detection models:', error);
        // 模型載入失敗也不應該影響頁面，只是禁用檢測功能
        alert('AI 模型載入失敗，請重新整理頁面或檢查網路連線');
      } finally {
        // 確保無論成功或失敗都會重置載入狀態
        setIsModelsLoading(false);
      }
    };
    
    // 檢查是否首次使用，啟動產品導覽
    const hasSeenTour = localStorage.getItem('faceffle-tour-completed');
    if (!hasSeenTour) {
      setIsTourActive(true);
    }
    
    // 修復手機視窗高度
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);
    
    initModels();
    
    return () => {
      window.removeEventListener('resize', setVH);
      window.removeEventListener('orientationchange', setVH);
    };
  }, []);

  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        setDetectedFaces([]);
        setWinners([]);
        // 重置 input 值，讓用戶可以重新選擇同一個文件
        if (event.target) {
          event.target.value = '';
        }
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      setIsCapturing(true); // 先設定狀態，讓UI更新
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // 優先使用後鏡頭
          width: { ideal: 1280 },
          height: { ideal: 960 },
          aspectRatio: { ideal: 4/3 }
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play(); // 確保影片開始播放
      }
    } catch (error) {
      console.error('Failed to start camera:', error);
      alert('無法啟動相機，請檢查權限設定');
      setIsCapturing(false); // 如果失敗，重置狀態
    }
  }, []);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    
    if (video.videoWidth === 0 || video.videoHeight === 0) return;
    
    // 創建臨時 canvas 來拍照
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // 翻轉 canvas 以恢復正常方向（因為預覽是鏡像的）
      ctx.scale(-1, 1);
      ctx.drawImage(video, -video.videoWidth, 0);
      
      const imageData = canvas.toDataURL('image/jpeg');
      
      setSelectedImage(imageData);
      setDetectedFaces([]);
      setWinners([]);
      
      // Stop camera
      const stream = video.srcObject as MediaStream;
      stream?.getTracks().forEach(track => track.stop());
      setIsCapturing(false);
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

  // 開啟人臉調整彈窗時初始化
  const handleOpenFaceAdjuster = useCallback(() => {
    setShowFaceAdjuster(true);
  }, []);

  return (
    <>
      <Header onStartTour={() => setIsTourActive(true)} />
      
      <div className={`bg-gray-50 pt-16 ${isMobile ? 'mobile-full-height' : ''}`} style={{ minHeight: isMobile ? 'calc(var(--vh, 1vh) * 100 - 4rem)' : 'calc(100vh - 4rem)' }}>
        <div className="max-w-6xl mx-auto p-6">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-6xl font-light bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-4">
              {t('title')}
            </h1>
            <p className="text-base md:text-lg text-gray-500 font-light">
              {t('subtitle')}
            </p>
          </div>
          <div className="max-w-2xl mx-auto">
            {/* 主功能區域 */}
            <div className="bg-white rounded-3xl shadow-xl p-8 relative overflow-hidden">
            {/* 裝飾性元素 */}
            <div className="absolute top-6 right-6 w-3 h-3 bg-gray-400 rounded-full"></div>
            
            {/* 圖片區域 */}
            <div className="mb-8" data-tour="photo-area">
              {isCapturing ? (
                <div>
                  <video
                    ref={videoRef}
                    className="w-full bg-black rounded-2xl mb-4"
                    style={{ transform: 'scaleX(-1)' }}
                    autoPlay
                    playsInline
                    muted
                  />
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={capturePhoto}
                      className="px-6 py-3 bg-gray-900 text-white rounded-2xl hover:bg-gray-800 transition-all duration-200 font-medium"
                    >
                      Capture
                    </button>
                    <button
                      onClick={() => {
                        const stream = videoRef.current?.srcObject as MediaStream;
                        stream?.getTracks().forEach(track => track.stop());
                        setIsCapturing(false);
                      }}
                      className="px-6 py-3 bg-gray-100 text-gray-900 rounded-2xl hover:bg-gray-200 transition-all duration-200 font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : !selectedImage ? (
                <div 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    if (isModelsLoading) return; // AI 模型載入中時禁用
                    
                    if (isMobile) {
                      // 手機直接呼叫相片選擇
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                        fileInputRef.current.click();
                      }
                    } else {
                      // 桌面版顯示選項
                      setShowUploadOptions(true);
                    }
                  }}
                  className={`w-full h-64 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all duration-200 ${
                    isModelsLoading 
                      ? 'bg-gray-100 border-gray-300 cursor-not-allowed opacity-50' 
                      : 'bg-gray-50 border-gray-200 cursor-pointer hover:bg-gray-100 hover:border-gray-300'
                  }`}
                >
                  <div className={`text-6xl mb-4 ${isModelsLoading ? 'text-gray-400' : 'text-gray-300'}`}>📷</div>
                  {!isModelsLoading && (
                    <>
                      <p className="text-gray-500 font-medium">Add Photo</p>
                      <p className="text-gray-400 text-sm mt-1">Click to select or capture</p>
                    </>
                  )}
                  {isModelsLoading && (
                    <div className="flex flex-col items-center">
                      <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mb-2"></div>
                      <p className="text-gray-400 font-medium text-sm">Loading AI...</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative">
                  <img
                    ref={imageRef}
                    src={selectedImage}
                    alt="Selected"
                    className={`w-full rounded-2xl transition-all duration-300 ${isProcessing ? 'opacity-60' : ''}`}
                    onLoad={() => {
                      if (canvasRef.current && imageRef.current) {
                        canvasRef.current.width = imageRef.current.naturalWidth;
                        canvasRef.current.height = imageRef.current.naturalHeight;
                      }
                    }}
                  />
                  <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 pointer-events-none rounded-2xl"
                    style={{
                      width: imageRef.current?.clientWidth || 'auto',
                      height: imageRef.current?.clientHeight || 'auto',
                    }}
                  />
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedImage(null);
                      setDetectedFaces([]);
                      setWinners([]);
                    }}
                    className="absolute top-3 right-3 w-10 h-10 bg-white bg-opacity-90 backdrop-blur-sm text-gray-700 rounded-full flex items-center justify-center hover:bg-opacity-100 hover:text-gray-900 transition-all duration-200 shadow-lg border border-gray-200"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
            

            {selectedImage && detectedFaces.length === 0 && (
              <div className="text-center mb-6">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDetectFaces();
                  }}
                  disabled={isProcessing || isAnimating || isModelsLoading}
                  className="w-full max-w-md px-6 py-4 bg-gray-900 text-white rounded-2xl hover:bg-gray-800 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  data-tour="detect-button"
                >
                  {isProcessing ? 'Detecting...' : 'Detect Faces'}
                </button>
              </div>
            )}

            {detectedFaces.length > 0 && (
              <div className="text-center mb-6">
                {/* 手動調整人臉框按鈕 */}
                <div className="mb-4">
                  <button
                    onClick={handleOpenFaceAdjuster}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                  >
                    ✏️ 手動調整人臉框
                  </button>
                </div>
                
                <div className="flex items-center justify-center gap-4 mb-4">
                  <label className="text-gray-600 font-medium">
                    Winners:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={detectedFaces.length}
                    value={winnerCount}
                    onChange={(e) => setWinnerCount(Math.max(1, Math.min(detectedFaces.length, parseInt(e.target.value) || 1)))}
                    className="w-16 px-3 py-2 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-center font-medium"
                    data-tour="winner-count"
                  />
                  <span className="text-gray-500">/ {detectedFaces.length}</span>
                </div>
                
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleStartLottery();
                  }}
                  disabled={isAnimating}
                  className="px-8 py-4 bg-gray-900 text-white rounded-2xl hover:bg-gray-800 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  data-tour="lottery-button"
                >
                  {isAnimating ? (
                    <span className="animate-pulse">Drawing...</span>
                  ) : (
                    'Start Lottery'
                  )}
                </button>
              </div>
            )}

            {winners.length > 0 && (
              <div className="text-center mb-6">
                <p className="text-gray-500 text-sm mb-4">Press spacebar or click to reset</p>
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center justify-center px-8 py-4 bg-gray-900 text-white rounded-2xl hover:bg-gray-800 transition-all duration-200 font-medium"
                  data-tour="download-button"
                >
                  <span className="mr-2">⚙️</span>
                  Download Result
                </button>
              </div>
            )}

          </div>
          
          {/* 上傳選項彈窗 */}
          {showUploadOptions && (
            <div className={`fixed inset-0 z-50 flex justify-center transition-all duration-300 ${
              isMobile ? 'items-end' : 'items-center'
            }`} style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(0, 0, 0, 0.05)' }} onClick={() => setShowUploadOptions(false)}>
              <div className={`bg-white shadow-2xl transition-all duration-300 ${
                isMobile 
                  ? 'rounded-t-3xl w-full max-w-md p-6 pb-8 animate-[slide-up_0.3s_ease-out]'
                  : 'rounded-3xl w-full max-w-sm mx-4 animate-[scale-in_0.3s_ease-out] p-8'
              }`} onClick={(e) => e.stopPropagation()}>
                {isMobile && <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6"></div>}
                
                <div className={`${isMobile ? 'space-y-3' : 'space-y-4'}`}>
                  {!isMobile && (
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">選擇照片方式</h3>
                      <p className="text-gray-600">請選擇您想要的照片來源</p>
                    </div>
                  )}
                  
                  <button
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                      fileInputRef.current?.click();
                      setShowUploadOptions(false);
                    }}
                    className="w-full px-6 py-4 bg-gray-900 text-white rounded-2xl hover:bg-gray-800 transition-all duration-200 font-medium"
                  >
                    選擇照片
                  </button>
                  
                  <button
                    onClick={() => {
                      startCamera();
                      setShowUploadOptions(false);
                    }}
                    className="w-full px-6 py-4 bg-gray-100 text-gray-900 rounded-2xl hover:bg-gray-200 transition-all duration-200 font-medium"
                  >
                    拍照
                  </button>
                  
                  <button
                    onClick={() => setShowUploadOptions(false)}
                    className="w-full px-6 py-4 text-gray-600 rounded-2xl hover:bg-gray-50 transition-all duration-200 font-medium"
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 手動調整人臉框彈窗 */}
          <FaceAdjuster
            isOpen={showFaceAdjuster}
            onClose={() => setShowFaceAdjuster(false)}
            selectedImage={selectedImage}
            faces={detectedFaces}
            onSave={(adjustedFaces) => {
              setDetectedFaces(adjustedFaces);
              // 重新繪製人臉框
              if (canvasRef.current && imageRef.current) {
                drawFaceBoxes(canvasRef.current, adjustedFaces, winners);
              }
            }}
          />
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            multiple={false}
          />

          </div>
        </div>
      </div>
      
      {/* ProductTour */}
      <ProductTour
        steps={tourSteps}
        isActive={isTourActive}
        onComplete={() => {
          localStorage.setItem('faceffle-tour-completed', 'true');
          setIsTourActive(false);
        }}
        onSkip={() => {
          localStorage.setItem('faceffle-tour-completed', 'true');
          setIsTourActive(false);
        }}
      />
    </>
  );
}