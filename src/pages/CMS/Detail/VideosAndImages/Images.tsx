import React, { useState, useEffect } from 'react';

import { useTranslation } from 'react-i18next';

import ReactTooltip from 'react-tooltip';

import {
  showNotification,
  excludeNe,
  classNames,
  returnIcon,
} from '@/utils/commonFn';

import defaulThumbImageLG from '@/assets/images/cms/defaultThumbLG.svg';
import defaulThumbImageMD from '@/assets/images/cms/defaultThumbMD.svg';
import defaulThumbImageSM from '@/assets/images/cms/defaultThumbSM.svg';
import { ButtonInputAdd } from '@/components/Button/Button';
import Image from '../../component/ImageItem';
import { getCacheBuster } from '@/utils/commonFn';

type ShowInputs = {
  normal: boolean;
  banner: boolean;
  icon: boolean;
};

export type ImageSizeType = 'large' | 'middle' | 'small';

type ImagesType =
  | 'thumb_large'
  | 'thumb_middle'
  | 'thumb_small'
  //
  | 'image_large'
  | 'image_middle'
  | 'image_small'
  //
  | 'banner_large'
  | 'banner_middle'
  | 'banner_small'
  //
  | 'icon_large'
  | 'icon_middle'
  | 'icon_small';

// TODO: 타이핑하기
interface PropsType {
  list: any[];
  // list: Record<ImageUploadType, ImgSizeType[]>[];
  cmsData: TotalItemType;
  isUpdate: boolean;
  imagesInfo: any;
  setImagesInfo: (data) => void;
  imageDeleteArr: any;
  autoThumbnails: any;
}

// IMAGE
function Images(props: PropsType) {
  const {
    cmsData,
    isUpdate,
    imagesInfo,
    setImagesInfo,
    imageDeleteArr,
    autoThumbnails, // big file auto attatch에서 받은 썸네일 이미지들
  } = props;

  const { t } = useTranslation();

  // 비 필수 항목 숨김, 보임 처리 관련 state
  const [isShow, setIsShow] = useState<ShowInputs>({
    normal: false,
    banner: false,
    icon: false,
  });

  // 비필수 입력 항목들을 보여주고 숨기는 처리 관련 메서드
  const handleChangeInputShow = (name: keyof ShowInputs, value: boolean) =>
    setIsShow((prev) => ({ ...prev, [name]: value }));

  const [pictures, setPictures] = useState({
    thumb_large: null,
    thumb_middle: null,
    thumb_small: null,
    //
    image_large: null,
    image_middle: null,
    image_small: null,
    //
    icon_large: null,
    icon_middle: null,
    icon_small: null,
    //
    banner_large: null,
    banner_middle: null,
    banner_small: null,
  });

  useEffect(() => {
    // big file attatch를 통해 자동 썸네일 생성&저장 시 컴포넌트에서 보여주는 썸네일도 업데이트 한다.
    if (!autoThumbnails) return;

    const cacheBuster = getCacheBuster();

    setPictures((prev) => ({
      ...prev,
      thumb_large: autoThumbnails.large_url + cacheBuster,
      thumb_middle: autoThumbnails.middle_url + cacheBuster,
      thumb_small: autoThumbnails.small_url + cacheBuster,
    }));
  }, [autoThumbnails]);

  useEffect(() => {
    // 수정일 경우만 기존의 값을 세팅한다.
    if (!cmsData || !isUpdate) return;

    // 사진
    // TODO: 반복문으로 만들기
    setPictures({
      thumb_large: excludeNe(cmsData?.photo?.thumb?.large_url)
        ? cmsData?.photo?.thumb?.large_url
        : defaulThumbImageLG,
      thumb_middle: excludeNe(cmsData?.photo?.thumb?.middle_url)
        ? cmsData?.photo?.thumb?.middle_url
        : defaulThumbImageMD,
      thumb_small: excludeNe(cmsData?.photo?.thumb?.small_url)
        ? cmsData?.photo?.thumb?.small_url
        : defaulThumbImageSM,
      // image
      image_large: excludeNe(cmsData?.photo.image.large_url)
        ? cmsData?.photo.image.large_url
        : defaulThumbImageLG,
      image_middle: excludeNe(cmsData?.photo.image.middle_url)
        ? cmsData?.photo.image.middle_url
        : defaulThumbImageMD,
      image_small: excludeNe(cmsData?.photo.image.small_url)
        ? cmsData?.photo.image.small_url
        : defaulThumbImageSM,
      // icon
      icon_large: excludeNe(cmsData?.photo.icon.large_url)
        ? cmsData?.photo.icon.large_url
        : defaulThumbImageLG,
      icon_middle: excludeNe(cmsData?.photo.icon.middle_url)
        ? cmsData?.photo.icon.middle_url
        : defaulThumbImageMD,
      icon_small: excludeNe(cmsData?.photo.icon.small_url)
        ? cmsData?.photo.icon.small_url
        : defaulThumbImageSM,
      // banner
      banner_large: excludeNe(cmsData?.photo.banner.large_url)
        ? cmsData?.photo.banner.large_url
        : defaulThumbImageLG,
      banner_middle: excludeNe(cmsData?.photo.banner.middle_url)
        ? cmsData?.photo.banner.middle_url
        : defaulThumbImageMD,
      banner_small: excludeNe(cmsData?.photo.banner.small_url)
        ? cmsData?.photo.banner.small_url
        : defaulThumbImageSM,
    });
  }, []);

  // 썸네일 사진 파일 변경(사진 파일 선택) 메서드
  const handleImgFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    event.preventDefault();
    const name = event.target.id;
    document.querySelector(`#${name}`)?.classList.add('fade-in');
    let reader = new FileReader();
    let file = event.target?.files[0];

    if (!file) return;
    // png, jpg, jpeg 파일만 업로드 가능하게 한다.
    const fileType = file.type.split('/')[1];

    if (!['png', 'jpg', 'jpeg'].includes(fileType.toLowerCase())) {
      showNotification(t('cms:PleaseUploadPngOrJpgOrJpegFile'), 'error');
      return;
    }

    setImagesInfo((prev) => ({ ...prev, [name]: null }));

    // 부모 컴포넌트의 정보를 업데이트 한다.
    setImagesInfo((prev) => ({ ...prev, [name]: file }));

    reader.onloadend = () => {
      let csv = reader.result;
      if (typeof csv !== 'string') {
        csv = csv.toString();
      }

      // 화면에 바로 보여줄 수 있는 csv데이터를 따로 담는다(파일과 별도로 저장)
      setPictures({ ...pictures, [name]: csv });
    };
    reader.readAsDataURL(file);
  };

  // 삭제요청할 사진 목록을 얻는 메서드
  const checkImageDeleteArray = (): string[] => {
    let deleteArr = [];
    Object.keys(imagesInfo).map((image) => {
      const [type, size] = image.split('_');
      if (
        excludeNe(cmsData?.photo[type][size]) &&
        imageDeleteArr.current.includes(image)
      )
        deleteArr.push(image);
    });

    return deleteArr;
  };

  // 썸네일 사진 초기화, 서버 삭제 요청 배열에 추가
  const resetCmsImg = (id: ImagesType) => {
    const [type, size] = id.split('_');

    let defaultThumbImage;

    // 화면에 보여줄 이미지를 디폴트 이미지로 바꿔준다.
    switch (size) {
      case 'large':
        defaultThumbImage = defaulThumbImageLG;
        break;
      case 'middle':
        defaultThumbImage = defaulThumbImageMD;
        break;
      case 'small':
        defaultThumbImage = defaulThumbImageSM;
        break;
      default:
        defaultThumbImage = defaulThumbImageLG;
        break;
    }

    setPictures((prev) => ({ ...prev, [id]: defaultThumbImage }));

    // 서버에 저장 요청하기 위해 담아뒀던 파일을 없애준다(저장 요청을 안 할 거기 때문에)
    // imagesInfo.current[id] = null;
    setImagesInfo((prev) => ({ ...prev, [id]: null }));
    // 있다가 삭제한 경우를 위해 서버에 사진 삭제 요청 리스트에 담는다.
    // 서버에 이미 저장되어있는지 여부를 체크
    if (!cmsData?.photo?.[type]?.[size]) return;
    // 서버에 이미 저장되어있던 경우만 삭제 요청을 진행할 배열에 넣는다.
    imageDeleteArr.current.push(id);
  };

  //////////////////////////////////////////////////
  return (
    <>
      {/* 사진 */}
      {/* 썸네일  */}
      <div className='flex items-center my-4 '>
        <label htmlFor='thumb_img' className='capitalize mr-2'>
          {t('cms:thumbnailImage')}
        </label>
      </div>
      <div className='thumb__img__wrapper'>
        {/* {list.map((type, idx) => {
          console.log({ type });
          console.log(Object.keys(type));
return  type!=="thumb" ? null:(

  // <Image
  // type="thumb"
  // size={type[idx]}
  // pictures=
  // />
  )
})} */}

        {/* thumb large */}
        <div className='thumb__img--lg'>
          <div className='image__total-wrapper--border'>
            <div className='image__wrapper'>
              <img
                id='thumb_large__image'
                className='rounded-md'
                alt={t('cms:thumbnailImage')}
                src={pictures.thumb_large}
                crossOrigin='anonymous'
              />
              <div
                title={t('cms:removeImage')}
                className='image__label__delete'
                onClick={() => resetCmsImg('thumb_large')}
              >
                {returnIcon({ icon: 'X', className: 'text-white' })}
              </div>
            </div>

            <div className='image__input-wrapper'>
              <label htmlFor='thumb_large' className='image__label__select'>
                {t('cms:selectLargeImage')}
              </label>
              <ReactTooltip />
              <input
                id='thumb_large'
                type='file'
                className='sr-only'
                onChange={(e) => {
                  handleImgFileChange(e);
                  // 여러 번 사진을 선택할 수 있게하는 코드
                  (e.target as HTMLInputElement).value = null;
                }}
              />
            </div>
          </div>
        </div>

        {/* 2 */}
        <div className='thumb__img--md '>
          <div className='image__total-wrapper--border'>
            <div className='image__wrapper'>
              <img
                id='thumb_middle__image'
                className='rounded-md'
                alt={t('cms:thumbnailImage')}
                src={pictures.thumb_middle}
                crossOrigin='anonymous'
              />
              <div
                title={t('cms:removeImage')}
                className='image__label__delete'
                onClick={() => resetCmsImg('thumb_middle')}
              >
                {returnIcon({ icon: 'X' })}
              </div>
            </div>
            <div className='image__input-wrapper'>
              <label
                htmlFor='thumb_middle'
                className='image__label__select'
                data-tip={t('cms:removeImage')}
              >
                {t('cms:selectMiddleImage')}
              </label>
              <ReactTooltip />
              <input
                id='thumb_middle'
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

        {/* 3 */}
        <div className='thumb__img--sm'>
          <div className='image__total-wrapper--border'>
            <div className='image__wrapper'>
              <img
                id='thumb_small__image'
                className='rounded-md'
                alt={t('cms:thumbnailImage')}
                src={pictures.thumb_small}
                crossOrigin='anonymous'
              />
              <div
                title={t('cms:removeImage')}
                className='image__label__delete'
                onClick={() => resetCmsImg('thumb_small')}
              >
                {returnIcon({ icon: 'X' })}
              </div>
            </div>
            <div className='image__input-wrapper'>
              <label htmlFor='thumb_small' className='image__label__select'>
                {t('cms:selectSmallImage')}
              </label>
              <ReactTooltip />
              <input
                id='thumb_small'
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
      </div>

      {/* /////////////////////////////////////////////////////////////////// */}
      {/* 그냥 이미지 영역 start */}
      {/* 여기서부터는 화면에서 숨겨둔다. */}
      <div className='flex items-center my-4 '>
        <label htmlFor='thumb_img' className={`capitalize mr-2`}>
          {t('cms:normalImage')}
        </label>
        <ReactTooltip />
        {/* 추가버튼 */}
        <ButtonInputAdd
          isHide={isShow.normal}
          text='cms:addNoramlImages?'
          onClick={() => handleChangeInputShow('normal', true)}
        />
      </div>

      <div
        className={classNames`${
          isShow.normal ? 'thumb__img__wrapper' : 'invisible-and-take-no-space'
        }`}
      >
        <div className='thumb__img--lg'>
          <div className='image__total-wrapper--border'>
            <div className='image__wrapper'>
              <img
                id='image_large__image'
                className='rounded-md'
                alt={t('cms:normalImage')}
                src={pictures.image_large}
                crossOrigin='anonymous'
              />
              <div
                title={t('cms:removeImage')}
                className='image__label__delete'
                onClick={() => resetCmsImg('image_large')}
              >
                {returnIcon({ icon: 'X' })}
              </div>
            </div>
            <div className='image__input-wrapper'>
              <label htmlFor='image_large' className='image__label__select'>
                {t('cms:selectLargeImage')}
              </label>
              <ReactTooltip />
              <input
                id='image_large'
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

        {/* 2 */}
        <div className=' thumb__img--md '>
          <div className='image__total-wrapper--border'>
            <div className='image__wrapper'>
              <img
                id='image_middle__image'
                className='rounded-md'
                alt={t('cms:normalImage')}
                src={pictures.image_middle}
                crossOrigin='anonymous'
              />
              <div
                title={t('cms:removeImage')}
                className='image__label__delete'
                onClick={() => resetCmsImg('image_middle')}
              >
                {returnIcon({ icon: 'X' })}
              </div>
            </div>

            <div className='image__input-wrapper'>
              <label htmlFor='image_middle' className='image__label__select'>
                {t('cms:selectMiddleImage')}
              </label>
              <ReactTooltip />
              <input
                id='image_middle'
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

        {/* 3 */}
        <div className='thumb__img--sm '>
          <div className='image__total-wrapper--border'>
            <div className='image__wrapper'>
              <img
                id='image_small__image'
                className='rounded-md'
                alt={t('cms:normalImage')}
                src={pictures.image_small}
                crossOrigin='anonymous'
              />
              <div
                title={t('cms:removeImage')}
                className='image__label__delete'
                onClick={() => resetCmsImg('image_small')}
              >
                {returnIcon({ icon: 'X' })}
              </div>
            </div>
            <div className='mx-auto cursor-pointer relative mt-5'>
              <label htmlFor='image_small' className='image__label__select'>
                {t('cms:selectSmallImage')}
              </label>
              <ReactTooltip />
              <input
                id='image_small'
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
      </div>
      {/* 그냥 이미지 영역 end */}

      {/* /////////////////////////////////////////////////////////////////// */}
      {/* 배너 이미지 영역 start */}
      <div className='flex items-center my-4 '>
        <label htmlFor='thumb__img__wrapper' className={`capitalize mr-2`}>
          {t('cms:bannerImage')}
        </label>
        <ReactTooltip />
        {/* 추가버튼 */}
        <ButtonInputAdd
          isHide={isShow.banner}
          text='cms:addBannerImages?'
          onClick={() => handleChangeInputShow('banner', true)}
        />
      </div>

      <div
        className={classNames`${
          isShow.banner ? 'thumb__img__wrapper' : 'invisible-and-take-no-space'
        }`}
      >
        <div className='thumb__img--lg'>
          <div className='image__total-wrapper--border'>
            <div className='image__wrapper'>
              <img
                id='banner_large__image'
                className='rounded-md'
                alt={t('cms:bannerImage')}
                src={pictures.banner_large}
                crossOrigin='anonymous'
              />
              <div
                title={t('cms:removeImage')}
                className='image__label__delete'
                onClick={() => resetCmsImg('banner_large')}
              >
                {returnIcon({ icon: 'X' })}
              </div>
            </div>
            <div className='image__input-wrapper'>
              <label htmlFor='banner_large' className='image__label__select'>
                {t('cms:selectLargeImage')}
              </label>
              <ReactTooltip />
              <input
                id='banner_large'
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

        {/* 2 */}
        <div className='thumb__img--md '>
          <div className='image__total-wrapper--border'>
            <div className='image__wrapper'>
              <img
                id='banner_middle__image'
                className='rounded-md'
                alt={t('cms:bannerImage')}
                src={pictures.banner_middle}
                crossOrigin='anonymous'
              />
              <div
                title={t('cms:removeImage')}
                className='image__label__delete'
                onClick={() => resetCmsImg('banner_middle')}
              >
                {returnIcon({ icon: 'X' })}
              </div>
            </div>
            <div className='image__input-wrapper'>
              <label htmlFor='banner_middle' className='image__label__select'>
                {t('cms:selectMiddleImage')}
              </label>
              <ReactTooltip />
              <input
                id='banner_middle'
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

        {/* 3 */}
        <div className='thumb__img--sm '>
          <div className='image__total-wrapper--border'>
            <div className='image__wrapper'>
              <img
                id='banner_small__image'
                className='rounded-md'
                alt={t('cms:bannerImage')}
                src={pictures.banner_small}
                crossOrigin='anonymous'
              />
              <div
                title={t('cms:removeImage')}
                className='image__label__delete'
                onClick={() => resetCmsImg('banner_small')}
              >
                {returnIcon({ icon: 'X' })}
              </div>
            </div>

            <div className='image__input-wrapper'>
              <label htmlFor='banner_small' className='image__label__select'>
                {t('cms:selectSmallImage')}
              </label>
              <ReactTooltip />
              <input
                id='banner_small'
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
      </div>
      {/* 배너 이미지 영역 end */}

      {/* ///////////////////////////////////////////////////////////// */}
      {/* 아이콘 이미지 영역 start */}
      <div className='flex items-center my-4 '>
        <label htmlFor='icon__img__wrapper' className={`capitalize mr-2`}>
          {t('cms:iconImage')}
        </label>
        <ReactTooltip />
        {/* 추가버튼 */}
        <ButtonInputAdd
          isHide={isShow.icon}
          text='cms:addIconImages?'
          onClick={() => handleChangeInputShow('icon', true)}
        />
      </div>

      <div
        className={classNames`${
          isShow.icon ? 'thumb__img__wrapper' : 'invisible-and-take-no-space'
        }`}
        id='icon__img__wrapper'
      >
        <div className='thumb__img--lg'>
          <div className='image__total-wrapper--border'>
            <div className='image__wrapper'>
              <img
                id='icon_large__image'
                className='rounded-md'
                alt={t('cms:iconImage')}
                src={pictures.icon_large}
                crossOrigin='anonymous'
              />
              <div
                title={t('cms:removeImage')}
                className='image__label__delete'
                onClick={() => resetCmsImg('icon_large')}
              >
                {returnIcon({ icon: 'X' })}
              </div>
            </div>

            <div className='image__input-wrapper'>
              <label htmlFor='icon_large' className='image__label__select'>
                {t('cms:selectLargeImage')}
              </label>
              <ReactTooltip />
              <input
                id='icon_large'
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

        {/* 2 */}
        <div className='thumb__img--md '>
          <div className='image__total-wrapper--border'>
            <div className='image__wrapper'>
              <img
                id='icon_middle__image'
                className='rounded-md'
                alt={t('cms:iconImage')}
                src={pictures.icon_middle}
                crossOrigin='anonymous'
              />
              <div
                title={t('cms:removeImage')}
                className='image__label__delete'
                onClick={() => resetCmsImg('icon_middle')}
              >
                {returnIcon({ icon: 'X' })}
              </div>
            </div>

            <div className='image__input-wrapper'>
              <label htmlFor='icon_middle' className='image__label__select'>
                {t('cms:selectMiddleImage')}
              </label>
              <ReactTooltip />
              <input
                id='icon_middle'
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

        {/* 3 */}
        <div className='thumb__img--sm '>
          <div className='image__total-wrapper--border'>
            <div className='image__wrapper'>
              <img
                id='icon_small__image'
                className='rounded-md'
                alt={t('cms:iconImage')}
                src={pictures.icon_small}
                crossOrigin='anonymous'
              />
              <div
                title={t('cms:removeImage')}
                className='image__label__delete'
                onClick={() => resetCmsImg('icon_small')}
              >
                {returnIcon({ icon: 'X' })}
              </div>
            </div>

            <div className='image__input-wrapper'>
              <label htmlFor='icon_small' className='image__label__select'>
                {t('cms:selectSmallImage')}
              </label>
              <ReactTooltip />
              <input
                id='icon_small'
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
      </div>

      {/* 아이콘 이미지 영역 end */}
    </>
  );
};

export default Images;
