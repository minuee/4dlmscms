import React, { useState, useEffect } from 'react';
import { Dropdown, DropdownToggle, DropdownMenu } from 'reactstrap';
import { useTranslation } from 'react-i18next';

import KR from 'imgs//main/kr.svg';
import US from 'imgs//main/us.svg';
import JP from 'imgs//main/jp.svg';
import { returnIcon } from '@/utils/commonFn';

interface LanguageProps {}

type LanguagesType = 'en' | 'ko';

export const Language: React.FC<LanguageProps> = ({}: LanguageProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [currentLanguage, setCurrentLanguage] = useState<LanguagesType>('en');

  const { t, i18n } = useTranslation();
  const changeLanguageHandler = (lang: LanguagesType) => {
    i18n.changeLanguage(lang);
    setCurrentLanguage(lang);
    setIsOpen(false);
  };

  useEffect(() => {
    let language: LanguagesType = 'en';
    const storageLanguage = localStorage.getItem('language') as LanguagesType;
    const browserLanguage = window.navigator.language;

    // 로컬 스토리지에 저장된 언어 정보가 있으면 해당 정보로 언어 세팅을 한다.
    if (storageLanguage) {
      language = storageLanguage;
      // 로컬 스토리지에 저장된 언어 정보가 없으면
    } else {
      // 브라우저에서 감지한 언어로 세팅을 하는데,
      // 우리는 영어, 일본어, 한국어만 지원하기 때문에 이 언어들에 해당하지 않는 언어는 영어로 세팅한다.
      if (['en', 'ko'].includes(browserLanguage)) {
        language = browserLanguage as LanguagesType;
      }
    }

    setCurrentLanguage(language);
  }, []);

  return (
    <Dropdown
      isOpen={isOpen}
      toggle={() => setIsOpen(!isOpen)}
      className='mr-4 intro-x sm:mr-6'
    >
      <DropdownToggle className='cursor-pointer dropdown-toggle' tag='div'>
        {returnIcon({ icon: 'Globe', className: 'search__icon text-theme-25' })}
        <span className='absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs leading-none text-red-100 uppercase transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-lg'>
          {currentLanguage}
        </span>
      </DropdownToggle>

      <DropdownMenu right className='w-24 mt-1 dropdown-menu'>
        <div
          className='text-white dropdown-menu__content box animate-dropdownSlide'
          style={{ backgroundColor: '#2b3348' }}
        >
          <div className='px-4 py-2 font-medium border-b border-dark-3'>
            Language
          </div>
          <div className='p-2'>
          <button
              onClick={() => changeLanguageHandler('en')}
              className='flex items-center p-2 transition duration-300 ease-in-out rounded-md hover:bg-dark-3'
            >
              <img alt='America' className='w-4 h-4 mr-2' src={US} /> EN
            </button>
            <button
              onClick={() => changeLanguageHandler('ko')}
              className='flex items-center p-2 transition duration-300 ease-in-out rounded-md hover:bg-dark-3'
            >
              <img alt='Korea' className='w-4 h-4 mr-2' src={KR} /> KO
            </button>            
            {/* <button
              onClick={() => changeLanguageHandler('ja')}
              className='flex items-center p-2 transition duration-300 ease-in-out rounded-md hover:bg-dark-3'
            >
              <img alt='Japan' className='w-4 h-4 mr-2' src={JP} /> JP
            </button> */}
          </div>
        </div>
      </DropdownMenu>
    </Dropdown>
  );
};
