import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { classNames } from '@/utils/commonFn';

interface IF extends Onclick {
  isShow: boolean;
}
function Backdrop(props: IF) {
  useEffect(() => {
    if (!props.isShow) return;
    document.body.style.overflow = 'hidden';
    return () => {
      // 스크롤 방지 해제
      document.body.style.overflow = 'unset';
    };
  }, [props.isShow]);

  return ReactDOM.createPortal(
    <div className={classNames` ${props.isShow ? 'backdrop' : 'invisible-and-take-no-space'}`} onClick={props.onClick}></div>,
    document.getElementById('backdrop-hook')
  );
};

export default Backdrop;
