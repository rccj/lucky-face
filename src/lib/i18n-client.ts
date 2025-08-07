'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      title: 'LuckyFace',
      subtitle: 'Upload photos, randomly select Lucky Face',
      
      // Main interface
      selectPhoto: 'Select Photo',
      detectFaces: 'Detect Faces',
      detecting: 'Detecting...',
      selectLucky: 'Who is Lucky Face',
      selecting: 'Selecting...',
      luckyPerson: 'Lucky Face',
      luckyPersons: 'Lucky Face',
      
      // Upload options
      choosePhoto: 'Choose Photo',
      takePhoto: 'Take Photo',
      capture: 'Capture',
      cancel: 'Cancel',
      
      // Face adjuster
      adjustFaces: '✏️ Adjust Face Boxes',
      dragToAdjust: 'Drag to adjust position and size',
      noFacesDetected: 'No faces detected',
      manuallyMarkLucky: 'Please manually mark each Lucky Face',
      addFace: '➕ Add',
      deleteFace: '➖ Delete',
      save: 'Save',
      
      // Lottery modal
      whoIsLucky: '🎲 Who is Lucky Face...',
      thisLucky: '🎉 Get the Lucky Face',
      ding: '✨ Ding Ding',
      clickPhotoReselect: '💡 Click photo to reselect',
      clickBlankClose: '💡 Click blank area or press ESC to close',
      
      // Tutorial
      step: 'Step',
      skipTutorial: 'Skip Tutorial',
      uploadPhotoTitle: 'Upload Photo',
      uploadPhotoDesc: 'Click the area above to select photos or use camera to shoot',
      detectFaceTitle: 'Detect Faces',
      detectFaceDesc: 'AI will automatically detect all faces in the photo and mark them',
      randomSelectTitle: 'Random Selection',
      randomSelectDesc: 'Set the number of Lucky Face and click the button to start random selection',
      congratsTitle: 'Congratulations Lucky Face',
      congratsDesc: 'Congratulations! View the selected Lucky Face, can reselect',
      previous: 'Previous',
      next: 'Next',
      complete: 'Complete',
      
      // Common
      close: 'Close',
      adjust: 'Adjust',
      loading: 'Loading...',
      tutorial: 'Tutorial',
      watchTutorial: 'Watch Tutorial',
      
      // Error messages
      error: {
        noFaces: 'No faces detected in the photo',
        cameraAccess: 'Unable to access camera, please check permissions',
        uploadFailed: 'Photo upload failed',
        loadingAI: 'Loading AI...'
      }
    }
  },
  zh: {
    translation: {
      title: 'LuckyFace',
      subtitle: '上傳照片，隨機選出幸運兒',
      
      // Main interface
      selectPhoto: '選擇照片',
      detectFaces: '偵測人臉',
      detecting: '偵測中...',
      selectLucky: '誰是幸運兒',
      selecting: '選擇中...',
      luckyPerson: '幸運兒',
      luckyPersons: '幸運兒',
      
      // Upload options
      choosePhoto: '選擇照片',
      takePhoto: '拍照',
      capture: 'Capture',
      cancel: '取消',
      
      // Face adjuster
      adjustFaces: '✏️ 調整人臉框',
      dragToAdjust: '拖拽調整位置和大小',
      noFacesDetected: '未偵測到人臉',
      manuallyMarkLucky: '請手動標記每位幸運兒',
      addFace: '➕ 新增',
      deleteFace: '➖ 刪除',
      save: '保存',
      
      // Lottery modal
      whoIsLucky: '🎲 誰是幸運兒...',
      thisLucky: '🎉 本期幸運兒',
      ding: '✨ 叮叮',
      clickPhotoReselect: '💡 點擊照片重新選擇',
      clickBlankClose: '💡 點擊空白處或按 ESC 鍵關閉視窗',
      
      // Tutorial
      step: '步驟',
      skipTutorial: '跳過教學',
      uploadPhotoTitle: '上傳照片',
      uploadPhotoDesc: '點擊上方區域選擇照片，或使用相機直接拍攝',
      detectFaceTitle: '偵測人臉',
      detectFaceDesc: 'AI 會自動偵測照片中的所有人臉，並標記出來',
      randomSelectTitle: '隨機選擇中',
      randomSelectDesc: '確認候選人數，點擊按鈕開始隨機選擇',
      congratsTitle: '恭喜幸運兒',
      congratsDesc: '恭喜！查看被選中的幸運兒，可重新選擇',
      previous: '上一步',
      next: '下一步',
      complete: '完成',
      
      // Common
      close: '關閉',
      adjust: '調整',
      loading: '載入中...',
      tutorial: '教學',
      watchTutorial: '觀看教學',
      
      // Error messages
      error: {
        noFaces: '照片中未偵測到人臉',
        cameraAccess: '無法啟動相機，請檢查權限設定',
        uploadFailed: '照片上傳失敗',
        loadingAI: 'Loading AI...'
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