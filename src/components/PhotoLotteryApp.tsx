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
  const [isCapturing, setIsCapturing] = useState(false);
  const [showUploadOptions, setShowUploadOptions] = useState(false);
  const [currentTab, setCurrentTab] = useState<'guided' | 'scale'>('scale');
  const [guidedStep, setGuidedStep] = useState(0);
  
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <header className="text-center mb-12 pt-8">
          <div className="mb-8">
            <h1 className="text-6xl font-light bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-4">
              {t('title')}
            </h1>
            <p className="text-lg text-gray-500 font-light">
              {t('subtitle')}
            </p>
          </div>

          <div className="flex justify-center items-center gap-8 mb-12">
            <button 
              onClick={() => setCurrentTab('guided')}
              className={`font-medium relative transition-colors ${
                currentTab === 'guided' 
                  ? 'text-gray-900' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Guided (Experimental)
              {currentTab === 'guided' && (
                <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gray-900 rounded-full"></div>
              )}
            </button>
            <button 
              onClick={() => setCurrentTab('scale')}
              className={`font-medium relative transition-colors ${
                currentTab === 'scale' 
                  ? 'text-gray-900' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Scale
              {currentTab === 'scale' && (
                <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gray-900 rounded-full"></div>
              )}
            </button>
            <button
              onClick={toggleLanguage}
              className="text-gray-400 hover:text-gray-600 transition-colors font-medium"
            >
              {i18n.language === 'zh' ? 'EN' : '中'}
            </button>
          </div>
        </header>

        <div className="max-w-md mx-auto">
          {currentTab === 'guided' ? (
            /* 引導模式 */
            <div className="bg-white rounded-3xl shadow-xl p-8 mb-6 relative overflow-hidden">
              <div className="absolute top-6 right-6 w-3 h-3 bg-gray-400 rounded-full"></div>
              
              {guidedStep === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-6">👋</div>
                  <h3 className="text-2xl font-light text-gray-900 mb-4">Welcome to Faceffle</h3>
                  <p className="text-gray-600 mb-8 leading-relaxed">
                    Let&apos;s walk through how to use this AI-powered face lottery system step by step.
                  </p>
                  <button
                    onClick={() => setGuidedStep(1)}
                    className="w-full px-6 py-4 bg-gray-900 text-white rounded-2xl hover:bg-gray-800 transition-all duration-200 font-medium"
                  >
                    Start Guide
                  </button>
                </div>
              )}
              
              {guidedStep === 1 && (
                <div className="text-center py-8">
                  <div className="text-5xl mb-6">📷</div>
                  <h3 className="text-xl font-medium text-gray-900 mb-4">Step 1: Add Your Photo</h3>
                  <p className="text-gray-600 mb-6">
                    First, you&apos;ll need a group photo. Click the area below to upload from your gallery or take a new photo.
                  </p>
                  
                  {isCapturing ? (
                    <div className="mb-6">
                      <video
                        ref={videoRef}
                        className="w-full h-48 bg-black rounded-2xl object-cover mb-4"
                        autoPlay
                        playsInline
                        muted
                      />
                      <div className="flex gap-3 justify-center">
                        <button
                          onClick={capturePhoto}
                          className="px-4 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all duration-200 text-sm font-medium"
                        >
                          Capture
                        </button>
                        <button
                          onClick={() => {
                            const stream = videoRef.current?.srcObject as MediaStream;
                            stream?.getTracks().forEach(track => track.stop());
                            setIsCapturing(false);
                          }}
                          className="px-4 py-2 bg-gray-100 text-gray-900 rounded-xl hover:bg-gray-200 transition-all duration-200 text-sm font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : selectedImage ? (
                    <div className="mb-6">
                      <div className="relative">
                        <img
                          src={selectedImage}
                          alt="Selected"
                          className="w-full h-48 object-cover rounded-2xl"
                        />
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedImage(null);
                            setDetectedFaces([]);
                            setWinners([]);
                          }}
                          className="absolute top-2 right-2 w-6 h-6 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center hover:bg-opacity-70 transition-all text-sm"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      onClick={() => setShowUploadOptions(true)}
                      className="w-full h-48 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 hover:border-gray-300 transition-all duration-200 mb-6"
                    >
                      <div className="text-4xl text-gray-300 mb-2">📷</div>
                      <p className="text-gray-500 font-medium">Click to add photo</p>
                    </div>
                  )}
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => setGuidedStep(0)}
                      className="flex-1 px-6 py-3 bg-gray-100 text-gray-900 rounded-2xl hover:bg-gray-200 transition-all duration-200 font-medium"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setGuidedStep(2)}
                      className="flex-1 px-6 py-3 bg-gray-900 text-white rounded-2xl hover:bg-gray-800 transition-all duration-200 font-medium"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
              
              {guidedStep === 2 && (
                <div className="text-center py-8">
                  <div className="text-5xl mb-6">🔍</div>
                  <h3 className="text-xl font-medium text-gray-900 mb-4">Step 2: Detect Faces</h3>
                  <p className="text-gray-600 mb-6">
                    Our AI will automatically find all the faces in your photo. The system works best with clear, well-lit photos.
                  </p>
                  <button
                    disabled
                    className="w-full px-6 py-4 bg-gray-300 text-gray-500 rounded-2xl font-medium mb-6 cursor-not-allowed"
                  >
                    Detect Faces (Upload photo first)
                  </button>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setGuidedStep(1)}
                      className="flex-1 px-6 py-3 bg-gray-100 text-gray-900 rounded-2xl hover:bg-gray-200 transition-all duration-200 font-medium"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setGuidedStep(3)}
                      className="flex-1 px-6 py-3 bg-gray-900 text-white rounded-2xl hover:bg-gray-800 transition-all duration-200 font-medium"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
              
              {guidedStep === 3 && (
                <div className="text-center py-8">
                  <div className="text-5xl mb-6">🎲</div>
                  <h3 className="text-xl font-medium text-gray-900 mb-4">Step 3: Run the Lottery</h3>
                  <p className="text-gray-600 mb-6">
                    Choose how many winners you want and start the lottery. The system will randomly select winners with a fun animation.
                  </p>
                  <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                    <label className="text-gray-600 font-medium text-sm mb-2 block">
                      Select Winners
                    </label>
                    <input
                      type="number"
                      value="1"
                      disabled
                      className="w-20 px-3 py-2 bg-gray-200 text-gray-500 border border-gray-200 rounded-xl text-center font-medium cursor-not-allowed"
                    />
                  </div>
                  <button
                    disabled
                    className="w-full px-6 py-4 bg-gray-300 text-gray-500 rounded-2xl font-medium mb-6 cursor-not-allowed"
                  >
                    Start Lottery (Detect faces first)
                  </button>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setGuidedStep(2)}
                      className="flex-1 px-6 py-3 bg-gray-100 text-gray-900 rounded-2xl hover:bg-gray-200 transition-all duration-200 font-medium"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setGuidedStep(4)}
                      className="flex-1 px-6 py-3 bg-gray-900 text-white rounded-2xl hover:bg-gray-800 transition-all duration-200 font-medium"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
              
              {guidedStep === 4 && (
                <div className="text-center py-8">
                  <div className="text-5xl mb-6">🎉</div>
                  <h3 className="text-xl font-medium text-gray-900 mb-4">Step 4: Download Results</h3>
                  <p className="text-gray-600 mb-8">
                    After the lottery, you can download the result image with winners highlighted. Ready to try it yourself?
                  </p>
                  <button
                    onClick={() => {
                      setCurrentTab('scale');
                      setGuidedStep(0);
                    }}
                    className="w-full px-6 py-4 bg-gray-900 text-white rounded-2xl hover:bg-gray-800 transition-all duration-200 font-medium mb-4"
                  >
                    Try Now
                  </button>
                  <button
                    onClick={() => setGuidedStep(0)}
                    className="w-full px-6 py-3 text-gray-600 rounded-2xl hover:bg-gray-50 transition-all duration-200 font-medium"
                  >
                    Restart Guide
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* 正常模式 */
            <div className="bg-white rounded-3xl shadow-xl p-8 mb-6 relative overflow-hidden">
            {/* 裝飾性元素 */}
            <div className="absolute top-6 right-6 w-3 h-3 bg-gray-400 rounded-full"></div>
            
            {/* 圖片區域 */}
            <div className="mb-8">
              {isCapturing ? (
                <div>
                  <video
                    ref={videoRef}
                    className="w-full h-64 bg-black rounded-2xl object-cover mb-4"
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
                  onClick={() => setShowUploadOptions(true)}
                  className="w-full h-64 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 hover:border-gray-300 transition-all duration-200"
                >
                  <div className="text-6xl text-gray-300 mb-4">📷</div>
                  <p className="text-gray-500 font-medium">Add Photo</p>
                  <p className="text-gray-400 text-sm mt-1">Click to select or capture</p>
                </div>
              ) : (
                <div className="relative">
                  <img
                    ref={imageRef}
                    src={selectedImage}
                    alt="Selected"
                    className="w-full rounded-2xl"
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
                    className="absolute top-2 right-2 w-8 h-8 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center hover:bg-opacity-70 transition-all"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
            
            {detectedFaces.length > 0 && (
              <div className="text-center mb-6">
                <div className="inline-block bg-gray-900 text-white px-6 py-3 rounded-2xl font-medium">
                  <span className="text-2xl font-light">{detectedFaces.length}</span>
                  <br />
                  <span className="text-sm opacity-90">{detectedFaces.length === 1 ? 'face' : 'faces'}</span>
                </div>
                <div className="mt-4">
                  <div className="text-4xl mb-2">😊</div>
                </div>
              </div>
            )}

            {selectedImage && detectedFaces.length === 0 && (
              <div className="text-center mb-6">
                <button
                  onClick={handleDetectFaces}
                  disabled={isProcessing || isAnimating || isModelsLoading}
                  className="w-full max-w-md px-6 py-4 bg-gray-900 text-white rounded-2xl hover:bg-gray-800 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <span className="animate-pulse">Detecting...</span>
                  ) : (
                    'Detect Faces'
                  )}
                </button>
              </div>
            )}

            {detectedFaces.length > 0 && (
              <div className="max-w-md mx-auto mb-6">
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="text-center mb-4">
                    <label className="text-gray-600 font-medium text-sm mb-2 block">
                      Select Winners
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={detectedFaces.length}
                      value={winnerCount}
                      onChange={(e) => setWinnerCount(Math.max(1, Math.min(detectedFaces.length, parseInt(e.target.value) || 1)))}
                      className="w-20 px-3 py-2 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-center font-medium"
                    />
                  </div>
                  
                  <button
                    onClick={handleStartLottery}
                    disabled={isAnimating}
                    className="w-full px-6 py-4 bg-gray-900 text-white rounded-2xl hover:bg-gray-800 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAnimating ? (
                      <span className="animate-pulse">Drawing...</span>
                    ) : (
                      'Start Lottery'
                    )}
                  </button>
                </div>
              </div>
            )}

            {winners.length > 0 && (
              <div className="text-center mb-6">
                <p className="text-gray-500 text-sm mb-4">Press spacebar or click to reset</p>
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center justify-center px-8 py-4 bg-gray-900 text-white rounded-2xl hover:bg-gray-800 transition-all duration-200 font-medium"
                >
                  <span className="mr-2">⚙️</span>
                  Download Result
                </button>
              </div>
            )}

            {isModelsLoading && (
              <div className="text-center mb-6">
                <div className="inline-flex items-center px-6 py-3 bg-gray-100 rounded-2xl">
                  <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin mr-3"></div>
                  <span className="text-gray-600 font-medium">Loading AI models...</span>
                </div>
              </div>
            )}
          </div>
          )}
          
          {/* 上傳選項彈窗 */}
          {showUploadOptions && (
            <div className="fixed inset-0 flex items-end justify-center z-50" style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(0, 0, 0, 0.05)' }} onClick={() => setShowUploadOptions(false)}>
              <div className="bg-white rounded-t-3xl w-full max-w-md p-6 pb-8 shadow-2xl animate-[slide-up_0.3s_ease-out]" onClick={(e) => e.stopPropagation()}>
                <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6"></div>
                <div className="space-y-3">
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
                    Upload from Gallery
                  </button>
                  
                  <button
                    onClick={() => {
                      startCamera();
                      setShowUploadOptions(false);
                    }}
                    className="w-full px-6 py-4 bg-gray-100 text-gray-900 rounded-2xl hover:bg-gray-200 transition-all duration-200 font-medium"
                  >
                    Take Photo
                  </button>
                  
                  <button
                    onClick={() => setShowUploadOptions(false)}
                    className="w-full px-6 py-4 text-gray-600 rounded-2xl hover:bg-gray-50 transition-all duration-200 font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />

        </div>
      </div>
    </div>
  );
}