import { en } from './en';
import { zh } from './zh';

export const resources = {
  en: en,
  zh: zh,
  // 預留給未來語言
  // ja: () => import('./ja').then(module => module.ja),
  // ko: () => import('./ko').then(module => module.ko),
  // es: () => import('./es').then(module => module.es),
  // fr: () => import('./fr').then(module => module.fr),
};

export { en, zh };