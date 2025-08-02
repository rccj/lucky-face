'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      title: 'Faceffle',
      subtitle: 'AI-Powered Group Photo Raffle',
      uploadOrCapture: 'Upload or Capture Photo',
      uploadPhoto: 'Upload Photo',
      capturePhoto: 'Take Photo',
      detectFaces: 'Detect Faces',
      startRaffle: 'Start Raffle',
      downloadResult: 'Download Result',
      facesDetected: 'Faces Detected: {{count}}',
      selectWinners: 'Select {{count}} Winner(s)',
      processing: 'Processing...',
      welcomeMessage: 'Upload a group photo and let AI randomly select the winners!',
      howToUse: 'How to Use',
      step1: '1. Upload or take a group photo',
      step2: '2. Click "Detect Faces" to find all faces',
      step3: '3. Set the number of winners',
      step4: '4. Click "Start Raffle" for the magic moment!',
      error: {
        noFaces: 'No faces detected in the photo',
        cameraAccess: 'Camera access denied',
        uploadFailed: 'Photo upload failed'
      }
    }
  },
  zh: {
    translation: {
      title: 'Faceffle',
      subtitle: 'AI 智慧團體照抽獎',
      uploadOrCapture: '上傳或拍攝照片',
      uploadPhoto: '上傳照片',
      capturePhoto: '拍攝照片',
      detectFaces: '偵測人臉',
      startRaffle: '開始抽獎',
      downloadResult: '下載結果',
      facesDetected: '偵測到 {{count}} 個人臉',
      selectWinners: '選擇 {{count}} 位中獎者',
      processing: '處理中...',
      welcomeMessage: '上傳團體照片，讓 AI 隨機選出幸運得主！',
      howToUse: '使用方法',
      step1: '1. 上傳或拍攝團體照片',
      step2: '2. 點擊「偵測人臉」找出所有人臉',
      step3: '3. 設定中獎人數',
      step4: '4. 點擊「開始抽獎」見證奇蹟時刻！',
      error: {
        noFaces: '照片中未偵測到人臉',
        cameraAccess: '無法存取相機',
        uploadFailed: '照片上傳失敗'
      }
    }
  }
};

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      fallbackLng: 'zh',
      debug: false,
      interpolation: {
        escapeValue: false
      },
      detection: {
        order: ['localStorage', 'navigator'],
        caches: ['localStorage']
      }
    });
}

export default i18n;