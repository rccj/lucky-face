'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AcademicCapIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import LanguageSwitcher from './LanguageSwitcher';

interface HeaderProps {
  onStartTour: () => void;
}

export default function Header({ onStartTour }: HeaderProps) {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleStartTour = () => {
    onStartTour();
    setIsMenuOpen(false);
  };

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20' 
          : 'bg-white shadow-sm border-b border-gray-100'
      }`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="text-2xl mr-2">🍀</div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                LuckyFace
              </h1>
              <span className="ml-2 text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">v0.0.19</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <button
                onClick={onStartTour}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors font-medium"
              >
                <AcademicCapIcon className="w-5 h-5 mr-2" />
                {t('tutorial')}
              </button>
              <LanguageSwitcher />
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-600 hover:text-gray-900 transition-all duration-200 p-2 relative z-50 hover:bg-gray-100 rounded-lg"
              >
                <div className="w-6 h-6 relative">
                  {isMenuOpen ? (
                    <XMarkIcon className="w-6 h-6 transition-all duration-300 ease-out animate-in zoom-in-75" />
                  ) : (
                    <Bars3Icon className="w-6 h-6 transition-all duration-300 ease-out animate-in zoom-in-75" />
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Slide Menu */}
      <div className={`fixed inset-0 z-30 md:hidden ${
        isMenuOpen ? 'pointer-events-auto' : 'pointer-events-none'
      }`}>
        {/* Backdrop */}
        <div 
          className={`absolute inset-0 bg-black transition-opacity duration-500 ease-out ${
            isMenuOpen ? 'opacity-50' : 'opacity-0'
          }`}
          onClick={() => setIsMenuOpen(false)}
        />
        
        {/* Slide Menu */}
        <div 
          className="absolute top-0 left-0 h-full w-64 bg-white shadow-2xl will-change-transform"
          style={{
            transform: isMenuOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 400ms cubic-bezier(0.4, 0.0, 0.2, 1)',
          }}
        >
          <div className="pt-20 px-6">
            <div className="space-y-4">
              <button
                onClick={handleStartTour}
                className={`flex items-center w-full text-left py-4 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-300 font-medium border-b border-gray-100 transform ${
                  isMenuOpen ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
                }`}
                style={{ transitionDelay: isMenuOpen ? '100ms' : '0ms' }}
              >
                <AcademicCapIcon className="w-6 h-6 mr-4" />
                <span>{t('watchTutorial')}</span>
              </button>
              <div
                className={`transform transition-all duration-300 ${
                  isMenuOpen ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
                }`}
                style={{ transitionDelay: isMenuOpen ? '150ms' : '0ms' }}
              >
                <LanguageSwitcher />
              </div>
            </div>
          </div>
        </div>
      </div>

    </>
  );
}