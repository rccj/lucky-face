export const zh = {
  translation: {
    title: 'LuckyFace',
    subtitle: '上傳照片，隨機選出幸運兒',
    
    // Main interface
    selectPhoto: '選擇照片',
    selectPhotoDesc: '點擊區域選擇照片或使用相機拍攝',
    detectFaces: '偵測人臉',
    detecting: '偵測中...',
    selectLucky: '誰是幸運兒',
    selecting: '選擇中...',
    luckyPerson: '幸運兒',
    luckyPersons: '幸運兒',
    
    // Upload options
    choosePhoto: '選擇照片',
    choosePhotoDesc: '選擇你想要的照片來源',
    takePhoto: '拍照',
    capture: 'Capture',
    cancel: '取消',
    dropToUpload: '放開以上傳照片',
    clickOrDrag: '點擊選擇或拖拽照片到此處',
    
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
    loadingText: '載入中...',
    tutorial: '教學',
    watchTutorial: '觀看教學',

    // Error messages
    error: {
      noFaces: '照片中未偵測到人臉',
      cameraAccess: '無法啟動相機，請檢查權限設定',
      uploadFailed: '照片上傳失敗',
      loadingAI: '正在載入 AI 模型...',
      downloadingModels: '首次使用，正在下載 AI 模型...'
    },

    // Loading messages
    loading: {
      mobile: '載入中...',
      firstTimeDesktop: '首次使用需要下載 AI 模型，請稍候...',
      firstTimeMobile: '手機版載入中...',
      downloadingModels: '首次使用，正在下載 AI 模型...',
      
      // Model loading progress
      fastModelComplete: '快速檢測模型載入完成',
      lightModelComplete: '輕量模型載入完成', 
      precisionModelComplete: '高精度模型載入完成',
      loadingAIModels: '載入 AI 檢測模型...',
      loadingAIModelsMobile: '載入 AI 模型，請稍候...',
      allModelsComplete: '所有模型載入完成',
      modelsComplete: '模型載入完成',
      tryingFallback: '嘗試備用下載源...'
    },

    // SEO and Meta
    seo: {
      title: 'LuckyFace - 智能幸運兒抽選器 | AI人臉識別隨機抽獎',
      description: 'LuckyFace 智能幸運兒抽選器 - 上傳團體照片，AI自動偵測人臉，隨機選出幸運兒！完美適用於活動、聚會、團隊抽獎等場合。支援多人照片，公平公正的隨機選擇。',
      keywords: '幸運兒,抽獎,隨機選擇,人臉識別,AI,團體照,活動抽獎,LuckyFace',
      ogTitle: 'LuckyFace - 智能幸運兒抽選器 | AI人臉識別隨機抽獎',
      ogDescription: '上傳團體照片，AI自動偵測人臉，隨機選出幸運兒！完美適用於活動、聚會、團隊抽獎等場合。',
      twitterTitle: 'LuckyFace - 智能幸運兒抽選器',
      twitterDescription: 'AI人臉識別，隨機選出幸運兒！完美的活動抽獎工具。',
      appName: 'LuckyFace - 智能幸運兒抽選器',
      appShortName: 'LuckyFace',
      appDescription: 'AI人臉識別隨機抽獎工具，上傳照片自動選出幸運兒'
    },

    // Accessibility
    a11y: {
      mainHeading: 'LuckyFace - 智能幸運兒抽選器',
      appLabel: '幸運兒抽選工具',
      uploadedImageAlt: '已上傳的團體照片，等待進行人臉識別和幸運兒抽選',
      detectButtonDescription: '使用 AI 自動偵測照片中的所有人臉並標記位置',
      lotteryButtonDescription: '開始隨機選擇幸運兒，所有偵測到的人臉都有相等機會被選中'
    }
  }
};