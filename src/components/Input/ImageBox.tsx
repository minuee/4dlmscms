import React, { useState, useRef } from 'react';
import ReactTooltip from 'react-tooltip';
import { useTranslation } from 'react-i18next';

import {
  showNotification,
  excludeNe,
  classNames,
  returnIcon,
} from '@/utils/commonFn';

import defaulThumbImage_large from '@/assets/images/cms/defaultThumbLG.svg';
import defaulThumbImage_middle from '@/assets/images/cms/defaultThumbMD.svg';
import defaulThumbImage_small from '@/assets/images/cms/defaultThumbSM.svg';

interface IF {
  size: 'large' | 'middle' | 'small';
  type: 'thumb' | 'normal' | 'icon' | 'banner';
  onSubmit: (image: string) => void;
  savedImg?: string;
}

const ImageBox: React.FC<IF> = (props: IF) => {
  const [img, setImg] = useState<string>();
  const { t } = useTranslation();
  // const ImgRef = useRef();

  // 부모에게 이미지를 리턴하는 메서드
  const returnImg = () => {
    // 줄 이미지가 없으면 주지 않는다.
    if (!img) return;
    props.onSubmit(img);
  };

  // 썸네일 사진 파일 변경(사진 파일 선택) 메서드
  const handleImgFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    event.preventDefault();
    let reader = new FileReader();
    let file = event.target?.files[0];

    if (!file) return;

    // png, jpg, jpeg 파일만 업로드 가능하게 한다.
    const fileType = file.type.split('/')[1];

    if (!['png', 'jpg', 'jpeg'].includes(fileType.toLowerCase())) {
      showNotification(t('cms:PleaseUploadPngOrJpgOrJpegFile'), 'error');
      return;
    }

    reader.onloadend = () => {
      let csv = reader.result;
      if (typeof csv !== 'string') {
        csv = csv.toString();
      }

      setImg(csv);
    };
    reader.readAsDataURL(file);
  };

  const returnDefaultImg = () => {
    switch (props.size) {
      case 'large':
        return defaulThumbImage_large;
      case 'middle':
        return defaulThumbImage_middle;
      case 'small':
        return defaulThumbImage_small;

      default:
        return defaulThumbImage_large;
    }
  };

  return (
    <div className={`thumb__img--${props.size}`}>
      <div className='border-2 border-dashed shadow-sm border-dark-5 rounded-md p-5'>
        <div className=' h-40 relative image-fit cursor-pointer zoom-in mx-auto'>
          <img
            id={`icon_img_${props.size}`}
            className='rounded-md'
            alt='icon image'
            src={img ? img : returnDefaultImg()}
            crossOrigin='anonymous'
          />
          <div
            title='Remove this image?'
            className='tooltip w-5 h-5 flex items-center justify-center absolute rounded-full text-white bg-theme-24 right-0 top-0 -mr-2 -mt-2'
            onClick={() => setImg(null)}
          >
            {returnIcon({ icon: 'X' })}
          </div>
        </div>
        <div className='mx-auto cursor-pointer relative mt-5'>
          <label
            htmlFor={`iconImg_img_${props.size}`}
            className='btn btn-primary w-full capitalize cursor-pointer'
            // data-tip={t('user:removeProfileImg')}
          >
            Select({props.size})
          </label>
          <ReactTooltip />
          <input
            id={`iconImg_img_${props.size}`}
            type='file'
            className='sr-only'
            onChange={(e) => {
              handleImgFileChange(e);
              (e.target as HTMLInputElement).value = null;
            }}
          />
        </div>
      </div>
    </div>
  );
};
export default ImageBox;
