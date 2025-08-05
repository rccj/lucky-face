'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      title: 'LuckyFace',
      subtitle: 'AI-Powered Group Photo Raffle',
      error: {
        noFaces: 'No faces detected in the photo',
        cameraAccess: 'Camera access denied',
        uploadFailed: 'Photo upload failed'
      }
    }
  },
  zh: {
    translation: {
      title: 'LuckyFace',
      subtitle: 'AI 智慧團體照抽獎',
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