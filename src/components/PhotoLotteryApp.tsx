'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { isMobile } from 'react-device-detect';
import Image from 'next/image';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { DetectedFace, detectFaces, loadFaceApiModels, drawFaceBoxes } from '@/lib/faceDetection';
import { animateWinnerSelection } from '@/lib/lottery';
import ProductTour from './ProductTour';
import Header from './Header';
import FaceAdjuster from './FaceAdjuster';
import LotteryFaceModal from './LotteryFaceModal';
import { Toaster } from './ui/sonner';

export default function PhotoLotteryApp() {
  const { t } = useTranslation();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [detectedFaces, setDetectedFaces] = useState<DetectedFace[]>([]);
  const [winners, setWinners] = useState<DetectedFace[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [winnerCount, setWinnerCount] = useState(1);
  const [currentAnimatingFaces, setCurrentAnimatingFaces] = useState<DetectedFace[]>([]);
  const [showLotteryModal, setShowLotteryModal] = useState(false);
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
      title: t('uploadPhotoTitle'),
      content: t('uploadPhotoDesc'),
      icon: '📷',
      animation: 'animate-pulse'
    },
    {
      title: t('detectFaceTitle'),
      content: t('detectFaceDesc'),
      icon: '🔍',
      animation: 'animate-spin'
    },
    {
      title: t('randomSelectTitle'),
      content: t('randomSelectDesc'),
      icon: '🎲',
      animation: 'animate-pulse'
    },
    {
      title: t('congratsTitle'),
      content: t('congratsDesc'),
      icon: '🎉',
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
        // 模型載入失敗也不應該影響頁面，繼續使用手動調整功能
      } finally {
        // 確保無論成功或失敗都會重置載入狀態
        setIsModelsLoading(false);
      }
    };
    
    // 檢查是否首次使用，啟動產品導覽
    const hasSeenTour = localStorage.getItem('luckyface-tour-completed');
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
      alert(t('error.cameraAccess'));
      setIsCapturing(false); // 如果失敗，重置狀態
    }
  }, [t]);

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

  const updateCanvasSize = useCallback(() => {
    if (canvasRef.current && imageRef.current) {
      const canvas = canvasRef.current;
      const image = imageRef.current;
      
      // 設置 canvas 的實際尺寸為圖片的自然尺寸
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      
      // 設置 canvas 的顯示尺寸為圖片的顯示尺寸
      canvas.style.width = `${image.clientWidth}px`;
      canvas.style.height = `${image.clientHeight}px`;
    }
  }, []);

  const handleDetectFaces = useCallback(async () => {
    if (!selectedImage || !imageRef.current) return;
    
    setIsProcessing(true);
    
    // 確保UI先更新loading狀態，再執行heavy computation
    await new Promise(resolve => setTimeout(resolve, 50));
    
    try {
      const faces = await detectFaces(imageRef.current);
      
      setDetectedFaces(faces);
      
      if (canvasRef.current && imageRef.current) {
        updateCanvasSize();
        drawFaceBoxes(canvasRef.current, faces);
      }
      
      // 手機版主動觸發垃圾回收
      if (isMobile && typeof window !== 'undefined' && 'gc' in window) {
        try {
          (window as typeof window & { gc(): void }).gc();
        } catch {
          // 忽略垃圾回收錯誤
        }
      }
      
      // 先完成 UI 更新，再決定是否開啟手動調整
      setIsProcessing(false);
      
      if (faces.length === 0) {
        // 沒有辨識到人臉，立即開啟手動調整模式
        setShowFaceAdjuster(true);
      }
    } catch (error) {
      console.error('Face detection failed:', error);
      // 設置空的人臉陣列，確保 UI 正常顯示
      setDetectedFaces([]);
      
      // 先完成 UI 更新
      setIsProcessing(false);
      
      // 如果是真的錯誤，也嘗試打開手動調整
      setShowFaceAdjuster(true);
    }
  }, [selectedImage, updateCanvasSize]);

  const handleStartLottery = useCallback(() => {
    if (detectedFaces.length < 2) {
      return;
    }
    
    setIsAnimating(true);
    setWinners([]);
    setShowLotteryModal(true); // 顯示抽獎彈窗
    setCurrentAnimatingFaces([]); // 清空當前動畫人臉
    
    animateWinnerSelection(
      detectedFaces,
      (currentFaces) => {
        // 更新當前動畫中的人臉，供彈窗顯示
        setCurrentAnimatingFaces(currentFaces);
        
        if (canvasRef.current) {
          updateCanvasSize();
          drawFaceBoxes(canvasRef.current, detectedFaces, currentFaces);
        }
      },
      (finalWinners) => {
        setWinners(finalWinners);
        setCurrentAnimatingFaces(finalWinners); // 最終顯示獲勝者
        setIsAnimating(false);
        
        if (canvasRef.current) {
          updateCanvasSize();
          drawFaceBoxes(canvasRef.current, detectedFaces, finalWinners);
        }
        
        // 移除自動關閉，讓用戶手動控制
      },
      winnerCount
    );
  }, [detectedFaces, winnerCount, updateCanvasSize]);


  // 開啟人臉調整彈窗時初始化
  const handleOpenFaceAdjuster = useCallback(() => {
    setShowFaceAdjuster(true);
  }, []);

  return (
    <>
      <Header onStartTour={() => setIsTourActive(true)} />
      
       <main className={`bg-gray-50 min-h-screen pt-16 ${isMobile ? 'mobile-full-height' : ''}`}>
        <section className="max-w-6xl mx-auto p-6">
          {/* 簡潔介紹 */}
          <section className="text-center mb-8">
            <h1 className="sr-only">{t('a11y.mainHeading')}</h1>
            <p className="text-lg text-gray-600 font-light">
              {t('subtitle')}
            </p>
          </section>
          <section className="max-w-2xl mx-auto">
            {/* 主功能區域 */}
            <article className="bg-white rounded-3xl shadow-xl p-8 relative overflow-hidden" role="application" aria-label={t('a11y.appLabel')}>
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
                  className={`w-full ${isMobile ? 'h-64' : 'h-80 max-w-2xl mx-auto'} border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all duration-200 ${
                    isModelsLoading 
                      ? 'bg-gray-100 border-gray-300 cursor-not-allowed opacity-50' 
                      : 'bg-gray-50 border-gray-200 cursor-pointer hover:bg-gray-100 hover:border-gray-300'
                  }`}
                >
                  <div className={`text-6xl mb-4 ${isModelsLoading ? 'text-gray-400' : 'text-gray-300'}`}>📷</div>
                  {!isModelsLoading && (
                    <>
                      <p className="text-gray-500 font-medium">{t('selectPhoto')}</p>
                      <p className="text-gray-400 font-medium text-sm mt-2">{t('selectPhotoDesc')}</p>
                    </>
                  )}
                  {isModelsLoading && (
                    <div className="flex flex-col items-center">
                      <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mb-2"></div>
                      <p className="text-gray-400 font-medium text-sm">{t('error.loadingAI')}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative">
                  <Image
                    ref={imageRef}
                    src={selectedImage}
                    alt={t('a11y.uploadedImageAlt')}
                    width={800}
                    height={600}
                    className={`w-full rounded-2xl transition-all duration-300 ${isProcessing ? 'opacity-60' : ''} ${isMobile ? 'max-h-96' : 'max-h-[600px]'} object-contain`}
                    onLoad={() => {
                      updateCanvasSize();
                    }}
                    priority
                    unoptimized
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
                  aria-label={isProcessing ? t('detecting') : t('detectFaces')}
                  aria-describedby="detect-description"
                >
                  {isProcessing ? t('detecting') : t('detectFaces')}
                </button>
                <div id="detect-description" className="sr-only">
                  {t('a11y.detectButtonDescription')}
                </div>
              </div>
            )}

            {detectedFaces.length > 0 && (
              <div className={`text-center ${isMobile ? 'mb-4' : 'mb-6'}`}>
                {isMobile ? (
                  // 手機版：垂直排列
                  <>
                    {/* 調整按鈕 */}
                    <div className="mb-3">
                      <button
                        onClick={handleOpenFaceAdjuster}
                        className="px-4 py-2 text-sm bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                      >
                        ✏️ {t('adjust')}
                      </button>
                    </div>
                    
                    {/* Winners 控制區 */}
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <label className="text-gray-600 font-medium text-sm">
                        {t('luckyPerson')}:
                      </label>
                      <div
                        className="w-16 px-3 py-2 text-sm bg-gray-50 text-gray-900 text-center font-medium"
                        data-tour="winner-count"
                      >
                        {winnerCount}
                      </div>
                      <span className="text-gray-500 text-sm">/ {detectedFaces.length}</span>
                    </div>
                  </>
                ) : (
                  // 桌面版：水平排列
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <button
                      onClick={handleOpenFaceAdjuster}
                      className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      ✏️ {t('adjust')}
                    </button>
                    
                    <label className="text-gray-600 font-medium">
                      {t('luckyPerson')}:
                    </label>
                    <div
                      className="w-16 px-3 py-2 bg-gray-50 text-gray-900 text-center font-medium"
                      data-tour="winner-count"
                    >
                      {winnerCount}
                    </div>
                    <span className="text-gray-500">/ {detectedFaces.length}</span>
                  </div>
                )}
                
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleStartLottery();
                  }}
                  disabled={isAnimating || detectedFaces.length < 2}
                  className={`${isMobile ? 'px-6 py-3 text-sm' : 'px-8 py-4'} bg-gray-900 text-white rounded-2xl hover:bg-gray-800 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed`}
                  data-tour="lottery-button"
                  aria-label={isAnimating ? t('selecting') : t('selectLucky')}
                  aria-describedby="lottery-description"
                >
                  {isAnimating ? (
                    <span className="animate-pulse">{t('selecting')}</span>
                  ) : (
                    t('selectLucky')
                  )}
                </button>
                <div id="lottery-description" className="sr-only">
                  {t('a11y.lotteryButtonDescription')}
                </div>
              </div>
            )}
            </article>
          </section>
          
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
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{t('choosePhoto')}</h3>
                      <p className="text-gray-600">{t('choosePhotoDesc')}</p>
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
                    {t('choosePhoto')}
                  </button>
                  
                  <button
                    onClick={() => {
                      startCamera();
                      setShowUploadOptions(false);
                    }}
                    className="w-full px-6 py-4 bg-gray-100 text-gray-900 rounded-2xl hover:bg-gray-200 transition-all duration-200 font-medium"
                  >
                    {t('takePhoto')}
                  </button>
                  
                  <button
                    onClick={() => setShowUploadOptions(false)}
                    className="w-full px-6 py-4 text-gray-600 rounded-2xl hover:bg-gray-50 transition-all duration-200 font-medium"
                  >
                    {t('cancel')}
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
                updateCanvasSize();
                drawFaceBoxes(canvasRef.current, adjustedFaces, winners);
              }
            }}
          />

          {/* 抽獎時的放大臉部彈窗 */}
          <LotteryFaceModal
            isOpen={showLotteryModal}
            currentFaces={currentAnimatingFaces}
            selectedImage={selectedImage}
            isAnimating={isAnimating}
            onClose={() => setShowLotteryModal(false)}
            onRestart={handleStartLottery}
          />
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            multiple={false}
          />
        </section>
      </main>
      
      {/* ProductTour */}
      <ProductTour
        steps={tourSteps}
        isActive={isTourActive}
        onComplete={() => {
          localStorage.setItem('luckyface-tour-completed', 'true');
          setIsTourActive(false);
        }}
        onSkip={() => {
          localStorage.setItem('luckyface-tour-completed', 'true');
          setIsTourActive(false);
        }}
      />
      
      <Toaster 
        position="top-center"
        toastOptions={{
          style: {
            zIndex: 9999,
          },
        }}
      />
    </>
  );
}