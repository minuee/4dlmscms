import React, { useRef, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import BtnTop from 'imgs/cms/btn_top.svg';

function Content({ children }) {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const mainRef = useRef<HTMLElement>(null);
  const location = useLocation();

  useEffect(() => {
    setIsVisible(false);
    setTimeout(() => {
      if (mainRef?.current?.getBoundingClientRect().height > window.innerHeight * 2 ) {
        setIsVisible(true);
      }
    }, 1000);
  }, [location]);

  const handleScrollUp = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main ref={mainRef} className='content'>
      {children}
      {/* 클릭 시 스크롤 맨 위로, 보였다 안 보였다 컨트롤 할 수 있어야 함 */}
      <img
        className={ isVisible ? 'content__top-icon' : 'invisible-and-take-no-space' }
        onClick={handleScrollUp}
        src={BtnTop}
        alt='top icon'
      />
    </main>
  );
};

export default Content;
