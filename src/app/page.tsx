'use client';

import I18nProvider from '@/components/I18nProvider';
import PhotoLotteryApp from '@/components/PhotoLotteryApp';

export default function Home() {
  return (
    <I18nProvider>
      <PhotoLotteryApp />
    </I18nProvider>
  );
}