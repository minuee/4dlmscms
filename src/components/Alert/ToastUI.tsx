import { returnIcon } from '@/utils/commonFn';
import React from 'react';
export type ToastType = 'info' | 'success' | 'error';

interface Props {
  type: ToastType;
  message: string;
}

function ToastUI(props: Props) {
  let AlertIcon;
  switch (props.type) {
    case 'info':
      AlertIcon = returnIcon({ icon: 'Info', className: 'text-theme-23' });
      break;
    case 'success':
      AlertIcon = returnIcon({ icon: 'CheckCircle', className: 'text-theme-10' });
      break;
    case 'error':
      AlertIcon = returnIcon({ icon: 'AlertTriangle', className: 'text-theme-5' });
      break;
    default:
      break;
  }

  return (
    <div className='toastify-content flex'>
      {AlertIcon}
      <div className='ml-4 mr-4'>
        <div className='font-medium'>{props.message}</div>
      </div>
    </div>
  );
};

export default ToastUI;
