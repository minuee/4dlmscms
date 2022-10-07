import React, { useState, useRef, useEffect, lazy, useContext } from 'react';
import { useLocation } from 'react-router-dom';

import { useTranslation } from 'react-i18next';

import { FFmpeg } from '@ffmpeg/ffmpeg';

import {
  showNotification,
  classNames,
  changeToSmallInt,
} from '@/utils/commonFn';

import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { ReducerType } from '@/redux/reducer';
// new redux data
import {
  setParentCurrent,
  setChildCurrent,
  updateChildContent,
  updateParentContent,
} from '@/redux/CMS/contentSlices';

import { useCMSVideosAndImagesRequest } from '@/apis/CMS/videosAndImages';

const Input = lazy(() => import('comp/Input/InputText'));
const Toggle = lazy(() => import('comp/Input/ToggleSlider'));
const Button = lazy(() => import('comp/Button/Button'));
const Backdrop = lazy(() => import('comp/Backdrop/Backdrop'));
const Modal = lazy(() => import('comp/Modal/Modal'));
import { ReactComponent as Loader } from 'imgs/loader/oval.svg';
import { IS_CHILD } from '@/settings/constants';

const PageLoaderModal = React.lazy(() =>
  import('comp/PageLoader/PageLoaderModal').then((module) => ({
    default: module.PageLoaderModal,
  }))
);

interface IF {
  ffmpeg: FFmpeg;
  isFfmpegLoaded: boolean;
  ffmpegLoadFailed: boolean;
  cmsData: TotalItemType;
  isShow?: boolean;
}

// 큰파일 업로드하는 컴포넌트
const LargeVideoUpload = (props) => {
  const { t } = useTranslation();

  const { cmsData } = props;
  const { onChangeThumbnail, isShow } = props;
  const [list, setList] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<string>();
  const [fileName, setFileName] = useState<string>();
  const [isRequireImageExtract, setIsRequireImageExtract] =
    useState<boolean>(false);
  // auto attatch 이후 반환되는 결과값을 담는 스테이트
  const [resultValue, setResultValue] = useState({
    duration: 0,
    fps: 0,
    frame_count: 0,
    resolution: 0,
    codec: '',
    channel_count: 0,
    default_channel_id: 0,
    md5: '',
    file_size: 0,
    is_interactive: false,
  });
  const loaderRef = useRef<HTMLDivElement>(null);

  const { requestBigFileList, requestBigAutoAttach, isLoading } =
    useCMSVideosAndImagesRequest();

  const dispatch = useAppDispatch();

  const location = useLocation();
  const pathName = location.pathname;
  const isChildContent = pathName.includes(IS_CHILD) ? true : false;

  const handleFileNameChange = (e) => {
    const value = e.target.value;
    setFileName(value);
  };

  const toggleImageExtract = (e) => {
    const value = e.target.checked;
    setIsRequireImageExtract(value);
  };

  // s3 list를 받아서 셋한다.
  const requestData = async () => {
    const bucketName = cmsData?.video?.bucket_name;
    const result = await requestBigFileList(bucketName);
    if (!result) return;
    // console.log({ result });
    setList(result);
  };

  // file info를 요청하고 해당 비디오 정보 파싱 요청할 아이템을 선택하는 메서드
  const handleSelectItem = (id) => {
    // 모달창 열기
    handleOpenModal(id);
  };

  useEffect(() => {
    // s3 list를 요청하여 받는다.
    // large video tab이 클릭 된 상태에서만 리스트를 불러온다.
    if (!isShow) return;
    requestData();
  }, [isShow]);

  const handleOpenModal = (id: string) => {
    if (!id) {
      showNotification('noSelectedItem', 'error');
      return;
    }

    // 클릭한 아이템 세팅
    setSelectedItem(id);
    // 모달을 연다
    setIsModalOpen(true);
  };

  const handleCloseModal = () => setIsModalOpen(false);

  // auto attatch 요청하는 메서드
  // TODO: 이 부분도 로직의 통일성을 위해 상위 컴포넌트에게 위임하는 로직으로 변경하기
  const handleSubmit = async (e) => {
    e.preventDefault();

    const result = await requestBigAutoAttach(
      cmsData.content_id,
      cmsData._id,
      list?.[Number(selectedItem)]?.name,
      fileName,
      changeToSmallInt(isRequireImageExtract)
    );

    // 모달을 닫는다.
    handleCloseModal();
    if (!result) return;
    // TODO: 여기 result값에 비디오 값 내려오는지 보기
    console.log({ result });
    // redux update
    // updateCMSReduxData(
    //   result,
    //   isUpdate,
    //   result?.have_parent ? 3 : 2,
    //   !result?.have_parent
    // );

    // updated redux
    // new redux 로직 update
    // current 정보 업데이트
    dispatch(
      isChildContent ? setChildCurrent(result) : setParentCurrent(result)
    );

    // list내의 정보 업데이트
    dispatch(
      isChildContent ? updateChildContent(result) : updateParentContent(result)
    );

    // 결과값을 담는다.
    setResultValue(result?.video);
    // setList(result);

    // 이미지를 추출한다고 했을 때만 추출한 이미지로 변경 처리한다.
    if (!isRequireImageExtract) return;
    onChangeThumbnail(result?.photo?.thumb);
  };

  /////////////////////////////////////////////////////////////
  return (
    <div
      id='video-upload__big'
      className={isShow ? '' : 'invisible-and-take-no-space'}
    >
      <>
        <Backdrop isShow={isModalOpen} />
        <Modal
          isShow={isModalOpen}
          title={t('cms:autoVideoUpload')}
          content={
            <form className='flex flex-col relative'>
              <div
                ref={loaderRef}
                className={classNames`absolute top-1/2 left-1/2 transform z-50 -translate-x-1/2 -translate-y-1/2 ${
                  isLoading ? '' : 'hidden'
                } `}
              >
                <Loader />
              </div>
              <span>
                {t('cms:selectedItem')}
                {list?.[Number(selectedItem)]?.name}
              </span>
              {/* 저장하고 싶은 파일명 입력 */}
              <Input
                type='text'
                name='file_name'
                onChange={handleFileNameChange}
                value={fileName || ''}
                label={t('cms:fileName')}
                placeholder={t('cms:fileNamePlaceholder')}
                onClick={() => null}
                design='inputGroupHeader'
              />
              {/* 이미지 추출 여부 선택 */}
              <Toggle
                name='image_extract'
                id='image_extract'
                onChange={toggleImageExtract}
                label={t('cms:extractImage')}
                checked={isRequireImageExtract}
              />

              <Button
                margin='top'
                type='submit'
                color='btn-primary'
                onClick={handleSubmit}
              >
                {t('cms:save')}
              </Button>
            </form>
          }
          type='info'
          closeBtn
          onClick={handleSubmit}
          onClose={handleCloseModal}
        >
          <Button color='btn-secondary' onClick={handleCloseModal}>
            {t('cms:close')}
          </Button>
        </Modal>
      </>

      <section>
        <h1 className='sr-only'>{t('cms:largeVideoUpload')}</h1>
        <article className='flex justify-between p-4 '>
          {/* list */}
          <article>
            {list.length === 0 && isLoading && (
              <PageLoaderModal isOpen={isLoading} />
            )}
            <h3 className='capitalize mt-3'>{t('cms:s3VideoList')}</h3>
            {list.length === 0 && <span>{t('cms:noData')}</span>}
            {list.length !== 0 && (
              <ul className='cms__video__large__s3-list'>
                {list.map((item, idx) => {
                  return (
                    <li
                      key={item.name}
                      id={idx.toString()}
                      className={classNames`inbox__item--darker  ${
                        selectedItem === idx.toString()
                          ? 'inbox__item--darker--active text-red-400'
                          : ''
                      }`}
                      onClick={() => handleSelectItem(idx.toString())}
                    >
                      <div
                        className={`inbox__item--darker inline-block sm:block text-gray-500 bg-dark-1 border-b border-dark-1 ${
                          selectedItem === idx.toString()
                            ? 'inbox__item--darker--active text-red-400'
                            : ''
                        }`}
                      >
                        <div className='flex px-5 py-3'>
                          <div className='w-72 flex-none flex items-center mr-5'>
                            <div className='inbox__item--sender truncate ml-3'>
                              {item.name}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            {/* TODO: 클릭 시
            seletedItem없으면 리턴하기
            파일이름 입력할 수 있는 모달창 띄우기
            그리고 입력하고 저장 버튼 누르면
            'are you sure?'하고 물어보기,
            
            */}
            {/* <Button color='btn-primary' onClick={handleOpenModal}>
                Select
              </Button> */}
          </article>
          {/* file info */}
          <article className={!selectedItem ? 'hidden' : ''}>
            {/* TODO: spinner돌리다가 요청 끝나면 값 모두 세팅한 다음 보여주기 */}
            <h3 className='mt-3'>{t('cms:fileInfo')}</h3>
            {!resultValue && isLoading && (
              <PageLoaderModal isOpen={isLoading} />
            )}
            <Input
              name='duration'
              label={t('cms:duration')}
              design='inputGroupHeader'
              value={resultValue?.duration}
              readonly
            />
            <Input
              name='fps'
              label={t('cms:fps')}
              design='inputGroupHeader'
              value={resultValue?.fps}
              readonly
            />
            <Input
              name='frame_count'
              label={t('cms:frameCount')}
              design='inputGroupHeader'
              value={resultValue?.frame_count}
              readonly
            />
            <Input
              name='resolution'
              label={t('cms:resolution')}
              design='inputGroupHeader'
              value={resultValue?.resolution}
              readonly
            />
            <Input
              name='codec'
              label={t('cms:codec')}
              design='inputGroupHeader'
              value={resultValue?.codec}
              readonly
            />
            <Input
              name='channel_count'
              label={t('cms:channelCount')}
              design='inputGroupHeader'
              value={resultValue?.channel_count}
              readonly
            />
            <Input
              name='default_channel_id'
              label={t('cms:defaultChannel')}
              design='inputGroupHeader'
              value={resultValue?.default_channel_id}
              readonly
            />
            <Input
              name='md5'
              label={t('cms:md5')}
              design='inputGroupHeader'
              value={resultValue?.md5}
              readonly
            />
            <Input
              name='file_size'
              label={t('cms:fileSize')}
              design='inputGroupHeader'
              value={resultValue?.file_size}
              readonly
            />
            <Toggle
              name='is_interactive'
              label={t('cms:interactive')}
              checked={resultValue?.is_interactive}
              readonly
            />
          </article>
        </article>
      </section>
    </div>
  );
};

export default LargeVideoUpload;
