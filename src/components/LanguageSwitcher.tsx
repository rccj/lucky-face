'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

const languages = [
  { code: 'zh', name: '中文' },
  { code: 'en', name: 'English' },
  // 預留給未來語言
  // { code: 'ja', name: '日本語' },
  // { code: 'ko', name: '한국어' },
  // { code: 'es', name: 'Español' },
  // { code: 'fr', name: 'Français' },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  
  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];
  
  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
      >
        <span className="font-medium text-gray-700">{currentLanguage.name}</span>
        <ChevronDownIcon 
          className={`w-4 h-4 text-gray-500 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>
      
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* 語言選單 */}
          <div className="absolute right-0 top-full mt-2 w-32 bg-white border border-gray-200 rounded-2xl shadow-lg z-50 py-2">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                className={`w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors flex items-center justify-between ${
                  i18n.language === language.code ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                }`}
              >
                <span className="font-medium">{language.name}</span>
                {i18n.language === language.code && (
                  <span className="text-blue-600">✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}