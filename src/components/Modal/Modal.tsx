import React, { ReactElement, useState } from 'react';
import ReactDOM from 'react-dom';
import { classNames } from '@/utils/commonFn';

// close button
const CloseBtn = (props) => {
  return (
    <svg
      className='w-10 cursor-pointer modal__close-btn'
      xmlns='http://www.w3.org/2000/svg'
      fill='none'
      viewBox='0 0 24 24'
      stroke='currentColor'
      onClick={props.onClick}
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M6 18L18 6M6 6l12 12'
      />
    </svg>
  );
};

const ICON_VARIANT_MAPS = {
  info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  success: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  danger: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
};

interface ModalProps {
  type: 'info' | 'success' | 'warning' | 'danger';
  title: string;
  content: string | ReactElement;
  footer?: string | ReactElement;
  icon?: boolean;
  centered?: boolean;
  closeBtn?: boolean;
  footerColor?: 'gray' | 'white';
  onClose?: () => void;
  isShow: boolean;
}

const Modal: React.FC<ModalProps & WithChildren & Onclick> = (props: ModalProps & WithChildren & Onclick) => {
  return ReactDOM.createPortal(
    <div className={classNames`${ props.isShow ? 'modal_custom ' : 'invisible-and-take-no-space' }`}>
      {/* upperPart */}
      <div className={`shadow-md bg-dark-3 overflow-hidden flex flex-1 p-5 border-b  ${ props.centered ? `flex-col` : '' }`}>
        {props.icon && (
          <div className={classNames`self-center bg-dark-3 rounded-full p-3 mb-5`}>
            <svg
              className='w-10 modal__close-btn--top'
              xmlns='http://www.w3.org/2000/svg'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d={`${ICON_VARIANT_MAPS[props.type]}`}
              />
            </svg>
          </div>
        )}
        <div className={ props.centered ? `flex flex-col items-center w-full` : `flex flex-col w-full` }>
          <div className={`flex justify-between items-baseline mb-8`}>
            <h1 className={ props.centered ? `text-2xl font-bold break-all` : `text-2xl font-bold break-all mr-5` }>
              {props.title}
            </h1>
            {!props.centered && props.closeBtn && <CloseBtn onClick={props.onClose} />}
          </div>
          <div className='break-all'>{props.content}</div>
        </div>
      </div>
      {/* lowerPart, footer */}
      <div className={classNames`bg-dark-3 flex flex-row-reverse p-5 ${ props.centered ? 'justify-center' : 'justify-start' }`}>
        {props.footer ? props.footer : props.children}
      </div>
    </div>,
    document.getElementById('modal-hook')
  );
};

Modal.defaultProps = {
  footerColor: 'gray',
  closeBtn: true
};

export default Modal;
