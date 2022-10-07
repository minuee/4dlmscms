import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import baseEn from './locales/en/base.json';
import listEn from './locales/en/list.json';
import authEn from './locales/en/auth.json';
import userEn from './locales/en/user.json';
import InputCommonEn from './locales/en/inputCommon.json';
import cmsEn from './locales/en/cms.json';
import categoryEn from './locales/en/category.json';
// ims
import venueEn from './locales/en/venue.json';
import systemEn from './locales/en/system.json';

import baseKo from './locales/ko/base.json';
import authKo from './locales/ko/auth.json';
import userKo from './locales/ko/user.json';
import InputCommonKo from './locales/ko/inputCommon.json';
import cmsKo from './locales/ko/cms.json';
import categoryKo from './locales/ko/category.json';
// ims
import venueKo from './locales/ko/venue.json';
import systemKo from './locales/ko/system.json';

import baseJa from './locales/ja/base.json';
import authJa from './locales/ja/auth.json';
import userJa from './locales/ja/user.json';
import inputCommonJa from './locales/ja/inputCommon.json';
import cmsJa from './locales/ja/cms.json';
import categoryJa from './locales/ja/category.json';

const languagesOption = ['en', 'ko', 'ja'];
type languagesOption = 'en' | 'ko' | 'ja';

export const LANG_VARIANTS: Record<languagesOption, string> = {
  en: 'EN',
  ko: 'KO',
  ja: 'JA',
};

export const languages = ['EN', 'KO', 'JA'] as const;
export type Languages = typeof languages[number];

const resources = {
  en: {
    base: baseEn,
    auth: authEn,
    user: userEn,
    input: InputCommonEn,
    cms: cmsEn,
    category: categoryEn,
    venue: venueEn,
    system: systemEn,
    list: listEn,
  },
  ko: {
    base: baseKo,
    auth: authKo,
    user: userKo,
    input: InputCommonKo,
    cms: cmsKo,
    category: categoryKo,
    venue: venueKo,
    system: systemKo,
  },
  ja: {
    base: baseJa,
    auth: authJa,
    user: userJa,
    input: inputCommonJa,
    cms: cmsJa,
    category: categoryJa,
  },
};

const userLanguage = window.navigator.language; // || window.navigator.userLanguage;

i18n.use(initReactI18next).init({
  fallbackLng: 'en', // 원하는 다국어 언어 스트링이 없을 경우 보여줄 언어, 예: hello 키값의 밸류가 ko에 없다면 en에서 찾아서 보여준다.
  resources,
  defaultNS: 'base', // 디폴트 언어 파일을 어떤 것으로 사용할 것인지 결정 (디폴트 파일을 제외한 값들을 사용하기 위해서는 파일키값:언어키값 이렇게 값을 넘겨야한다.)
  whitelist: languagesOption,
  lng: localStorage.getItem('language') || userLanguage || 'en',
  keySeparator: false,
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
