'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface TourStep {
  title: string;
  content: string;
  icon: string;
  animation?: string;
}

interface ProductTourProps {
  steps: TourStep[];
  isActive: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export default function ProductTour({ steps, isActive, onComplete, onSkip }: ProductTourProps) {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  
  // 每次重新開啟教學都從第一步開始
  useEffect(() => {
    if (isActive) {
      setCurrentStep(0);
    }
  }, [isActive]);
  
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };
  
  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  if (!isActive || currentStep >= steps.length) return null;
  
  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full mx-4 animate-[scale-in_0.3s_ease-out] overflow-hidden">
        {/* 頂部進度條 */}
        <div className="h-1 bg-gray-200">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <div className="p-8">
          {/* 步驟指示 */}
          <div className="flex items-center justify-between mb-6">
            <div className="text-sm text-gray-500 font-medium">
              {t('step')} {currentStep + 1} / {steps.length}
            </div>
            <button
              onClick={onSkip}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              {t('skipTutorial')}
            </button>
          </div>
          
          {/* 動畫圖示區域 */}
          <div className="text-center mb-6">
            <div className="relative">
              {currentStep === 0 && (
                <div className="space-y-4">
                  <div className="text-6xl animate-bounce">📷</div>
                  <div className="bg-gray-100 rounded-2xl p-4 mx-4">
                    <div className="w-full h-32 bg-gray-200 border-2 border-dashed border-gray-400 rounded-xl flex items-center justify-center animate-pulse">
                      <span className="text-gray-500">{t('selectPhoto')}</span>
                    </div>
                  </div>
                </div>
              )}
              
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="text-6xl animate-spin">🔍</div>
                  <div className="bg-gray-100 rounded-2xl p-4 mx-4">
                    <div className="relative w-full h-32 bg-blue-50 rounded-xl flex items-center justify-center">
                      <div className="absolute top-2 left-2 w-8 h-8 border-2 border-green-500 rounded animate-pulse"></div>
                      <div className="absolute top-4 right-4 w-6 h-6 border-2 border-green-500 rounded animate-pulse" style={{animationDelay: '0.5s'}}></div>
                      <div className="absolute bottom-3 left-6 w-7 h-7 border-2 border-green-500 rounded animate-pulse" style={{animationDelay: '1s'}}></div>
                      <span className="text-sm text-gray-600">{t('detecting')}</span>
                    </div>
                  </div>
                </div>
              )}
              
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="text-6xl animate-pulse">🎲</div>
                  <div className="bg-gray-100 rounded-2xl p-4 mx-4">
                    <div className="relative w-full h-32 bg-yellow-50 rounded-xl flex items-center justify-center">
                      <div className="absolute top-2 left-2 w-8 h-8 border-2 border-red-500 rounded animate-pulse bg-red-100"></div>
                      <div className="absolute top-4 right-4 w-6 h-6 border-2 border-green-500 rounded animate-pulse" style={{animationDelay: '0.3s'}}></div>
                      <div className="absolute bottom-3 left-6 w-7 h-7 border-2 border-red-500 rounded animate-pulse bg-red-100" style={{animationDelay: '0.6s'}}></div>
                      <span className="text-sm text-gray-600">{t('selecting')}</span>
                    </div>
                  </div>
                </div>
              )}
              
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="text-6xl animate-bounce">🎉</div>
                  <div className="bg-gray-100 rounded-2xl p-4 mx-4">
                    <div className="relative w-full h-32 bg-green-50 rounded-xl flex items-center justify-center">
                      <div className="absolute top-2 left-2 w-8 h-8 border-2 border-green-500 rounded bg-green-100"></div>
                      <div className="absolute bottom-3 right-4 w-6 h-6 border-2 border-green-500 rounded bg-green-100"></div>
                      <span className="text-sm text-green-600 font-semibold">{t('congratsTitle')}!</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* 內容 */}
          <div className="text-center mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
            <p className="text-gray-600 leading-relaxed">{step.content}</p>
          </div>
          
          {/* 導航按鈕 */}
          <div className="flex justify-between items-center">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="px-5 py-2.5 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {t('previous')}
            </button>
            
            <button
              onClick={handleNext}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all font-medium shadow-lg"
            >
              {currentStep === steps.length - 1 ? t('complete') : t('next')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}