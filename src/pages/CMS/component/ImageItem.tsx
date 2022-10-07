import { returnIcon } from '@/utils/commonFn';
import React from 'react';
import { useTranslation } from 'react-i18next';
import ReactTooltip from 'react-tooltip';

interface IF {
  type: string;
  size: string;
  pictures: any;
  onClick: (data) => void;
  onChange: (data) => void;
}

const Image: React.FC<IF> = (props: IF) => {
  const { type, size, pictures, onClick, onChange } = props;
  const { t } = useTranslation();

  return (
    <div className={`${type}__img--${size}`}>
      <div className='image__total-wrapper--border'>
        <div className='image__wrapper'>
          <img
            id={`${type}_${size}__image`}
            className='rounded-md'
            alt={t(`cms:${type}Image`)}
            src={pictures[`${type}_${size}`]}
            crossOrigin='anonymous'
          />
          <div
            title={t('cms:removeImage')}
            className='image__label__delete'
            onClick={() => onClick(`${type}_${size}`)}
          >
            {returnIcon({ icon: 'X' })}
          </div>
        </div>

        <div className='image__input-wrapper'>
          <label htmlFor={`${type}_${size}`} className='image__label__select'>
            {t(`cms:select${size}Image`)}
          </label>
          <ReactTooltip />
          <input
            id={`${type}_${size}`}
            type='file'
            className='sr-only'
            onChange={(e) => {
              onChange(e);
              // 여러 번 사진을 선택할 수 있게하는 코드
              (e.target as HTMLInputElement).value = null;
            }}
          />
        </div>
      </div>
    </div>
  );
};
export default Image;
