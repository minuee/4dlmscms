import React from 'react';
import ReactDOM from 'react-dom';

interface ProgressBarProps {
  progress: string;
  isShow: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = (props: ProgressBarProps) => {
  const { isShow, progress } = props;

  return !isShow
    ? null
    : ReactDOM.createPortal(
        <div className='backdrop'>
          <div className='progress'>
            <span style={{ width: progress }}>{progress}</span>
          </div>
        </div>,
        document.getElementById('backdrop-hook')
      );
};
export default ProgressBar;
