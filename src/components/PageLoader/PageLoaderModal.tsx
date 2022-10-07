import React, { FC, memo } from 'react';
import ReactDOM from 'react-dom';

import { ReactComponent as Loader } from 'imgs/loader/oval.svg';

export interface PageLoaderProps {
  isOpen?: boolean;
}

export const PageLoaderModal: FC<PageLoaderProps> = memo((props) => {
  const { isOpen = false } = props;

  // useEffect(() => {
  //   if (!isMonted) isMonted = true;

  //   if (isMonted) {
  //     document.body.style.overflow = 'hidden';
  //   }
  // }, []);

  // useEffect(() => {
  //   return () => {
  //     // 스크롤 방지 해제
  //     document.body.style.overflow = 'unset';
  //   };
  // });

  if (!isOpen) {
    return null;
  } else {
    return ReactDOM.createPortal(
      <div className='backdrop'>
        <div className='absolute inset-1/2 transform -translate-x-1/2 -translate-y-1/2'>
          <Loader />
        </div>
      </div>,
      document.getElementById('backdrop-hook')
    );
  }
});

export default PageLoaderModal;
