import React, { useState, useRef, useEffect, useContext, lazy } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
// import { FFmpeg } from '@ffmpeg/ffmpeg';
import ReactTooltip from 'react-tooltip';

import { showNotification } from '@/utils/commonFn';

import { FmpegProps } from '././index';

import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { ReducerType } from '@/redux/reducer';

// new redux data
import {
  setParentCurrent,
  setChildCurrent,
  updateChildContent,
  updateParentContent,
} from '@/redux/CMS/contentSlices';

import { CMSContext } from 'cont/cms';
import { useValidation } from '@/hooks/validation-hooks';
import { useAccordion } from '@/hooks/accordion-hooks';

import { useBasicCMSVideo } from '@/hooks/CMS/basic-video-upload-hooks';
import { useCMSImages } from '@/hooks/CMS/image-hooks';

const Button = lazy(() => import('comp/Button/Button'));
const PageLoaderModal = React.lazy(() =>
  import('comp/PageLoader/PageLoaderModal').then((module) => ({
    default: module.PageLoaderModal,
  }))
);

import { IS_CHILD } from '@/settings/constants';
import BasicVideoUpload from './VideosAndImages/BasicVideoUpload';
import LargeVideoUpload from './VideosAndImages/LargeVideoUpload'; // comp, ncaa를 위해 잠시 주석처리
import Images from './VideosAndImages/Images';
import ProgressBar from '@/components/ProgressBar/ProgressBar';

const Backdrop = lazy(() => import('comp/Backdrop/Backdrop'));
const Modal = lazy(() => import('comp/Modal/Modal'));
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { useRestfulCustomAxios } from '@/hooks/axios-hooks-restful';
import { useCMSVideosAndImagesRequest } from '@/apis/CMS/videosAndImages';
import { getCacheBuster } from '@/utils/commonFn';
import { cms } from '@/redux/CMS/cmsSlices';

interface IF extends FmpegProps {
  // ffmpeg?: FFmpeg;
  // isFfmpegLoaded?: boolean;
  // ffmpegLoadFailed?: boolean;
  cmsData: TotalItemType;
}

//
type ImagesType = {
  large: null | string;
  middle: null | string;
  small: null | string;
  large_url: null | string;
  middle_url: null | string;
  small_url: null | string;
};

// TODO: 이미지 동적으로
const IMAGES_LIST = [
  { thumb: ['large', 'middle', 'small'] },
  { normal: ['large', 'middle', 'small'] },
  { banner: ['large', 'middle', 'small'] },
  { icon: ['large', 'middle', 'small'] },
];

// export const getProgress = (progress) => {};

const VideoAndImages: React.FC<IF> = (props: IF) => {
  const { cmsData } = props;
  const location = useLocation();
  const pathName = location.pathname;
  // child 업데이트/생성인지 parent 업데이트/생성인지 나타내는 변수
  const isChildContent = pathName.includes(IS_CHILD) ? true : false;
  const progressPercentage = useAppSelector(
    (state: ReducerType) => state.basicVideoUpload.progress
  );

  // const { requestUploadVideoAndParseMetadata } = useCMSVideosAndImagesRequest();

  const { requestThumbnail, requestSaveThumbnail } = useCMSVideosAndImagesRequest();

  const dispatch = useAppDispatch();

  useEffect(() => {
    // console.log({ progressPercentage });
    setProgress(progressPercentage);
  }, [progressPercentage]);

  const { ffmpeg, ffmpegLoadFailed, isFfmpegLoaded } = props;
  const { updateStep, isUpdate } = useContext(CMSContext);

  const { t } = useTranslation();

  const { validateFormData } = useValidation();
  const { isShowAccordion, handleToggleAccordionView, returnUpDownIcon } =  useAccordion();

  const { videoPromiseList } = useBasicCMSVideo();
  const { imagesPromiseList } = useCMSImages();

  // process.env.REACT_APP_IS_DOCKER_LOCAL_VERION 일 경우 사용
  const [isReady, setIsReady] = useState<boolean>(true);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // process.env.REACT_APP_IS_DOCKER_LOCAL_VERION가 아닐 경우 사용
  const [isShowProgressBar, setIsShowProgressBar] = useState<boolean>(false);
  const [progress, setProgress] = useState<string>('0%');

  // basic video 업로드와 빅파일 업로드 중 선택하여 비디오를 업로드함
  const [isShowBasic, setIsShowBasic] = useState<boolean>(true);
  const [videoInfo, setVideoInfo] = useState<VideoInputsType>();
  const [videoErrors, setVideoErrors] = useState({});
  // 서버에 저장 요청할 파일들을 담는 스테이트 값
  const [imagesInfo, setImagesInfo] = useState({
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
  const [autoThumbs, setAutoThumbs] = useState({
    large: null,
    middle: null,
    small: null,
    large_url: null,
    middle_url: null,
    small_url: null,
  });

  const [durationValue, setDurationValue] = useState<number>(0);
  const [channelCount, setChannelCount] = useState<number>(100);
  const [offsetValue, setOffsetValue] = useState<number>(0);
  const [channelValue, setChannelValue] = useState<number>(0);
  const [videoName, setVideoName] = useState<string>('');
  const [isThumbChange, setIsThumbChange] = useState<boolean>(false);
  // 모달 visibility 상태
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isVideoUploaded, setIsVideoUploaded] = useState<boolean>(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const wrapperRef = useRef<HTMLElement | null>(null);
  // 비디오관련 서버 요청을 할 때 어떤 요청을 보낼지를 결정하기 위해 사용하는 변수들
  const isRequestingVideoDelete = useRef<boolean>(false);
  const isVideoChanged = useRef<boolean>(false);

  // 사진관련 서버 요청을 할 때 어떤 요청을 보낼지를 결정하기 위해 사용하는 변수들
  // 사진 삭제 요청을 보낼 배열
  const imageDeleteArr = useRef([]);

  useEffect(() => {
    // docker local 버전일 경우 리턴 (ffmpeg 사용 X)
    if (process.env.REACT_APP_IS_DOCKER_LOCAL_VERION === 'true') return;
    // ffmpeg 로드가 아예 실패한 경우
    if (ffmpegLoadFailed === true) {
      showNotification('failToLoadFFMPEG', 'error');
      return;
    }

    // ffmpeg로드가 아직 끝나지 않았을 경우
    // if (!ffmpeg.isLoaded()) {
    if (!isFfmpegLoaded) {
      // 로딩스피너를 보여준다.
      setIsReady(false);
    }
  }, []);

  useEffect(() => {
    // docker local 버전일 경우 리턴 (ffmpeg 사용 X)
    if (process.env.REACT_APP_IS_DOCKER_LOCAL_VERION === 'true') return;
    // 로드가 미리 완료되지 않은 상태에서 해당 페이지를 들어왔을 경우
    // 로딩이 완료되면 로딩 스피너를 끈다.
    if (isFfmpegLoaded) setIsReady(true);
  }, [isFfmpegLoaded]);

  // useEffect(() => {
  //   console.log({ videoInfo });
  // }, [videoInfo]);

  useEffect(() => {
    // 맨 처음 등록 시 화면 스크롤로 해당 화면에 진입하게 한다.
    !isUpdate && wrapperRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    // docker local 버전일 경우 리턴 (ffmpeg 사용 X)
    if (process.env.REACT_APP_IS_DOCKER_LOCAL_VERION === 'true') return;

    // 모바일 화면에서는 비디오 업로드 관련 기능을 사용하지 않게 하기 위해 모바일 접속인지를 확인함
    const isMobileDevice = /Mobi/i.test(window.navigator.userAgent);
    if (isMobileDevice) {
      showNotification('cms:unableToUploadVideoOnMobile', 'error');

      setIsMobile(true);
      setIsReady(true);
      // setIsInputValuesSetted(true);
      //? 아래 스텝(라이브, vod) 보여줘야 하나?
    }
  }, []);

  /* formik */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 삭제 요청이 있는지
    const isDelete = isRequestingVideoDelete.current;
    console.log({ videoInfo });

    // 로딩 시작
    setIsLoading(true);

    // 비디오 저장은 따로 하고 upload status 프로그레스바를 보여준다.

    // if (process.env.REACT_APP_IS_DOCKER_LOCAL_VERION === 'true') {
    //   // 저장할 비디오가 있을 때
    //   if (isVideoChanged.current) requestSaveVideoAndParseMeta();
    // }

    // 비디오를 저장하는 경우에만 밸리데이션을 진행한다.
    // process.env.REACT_APP_IS_DOCKER_LOCAL_VERION일 때는
    // 메타 정보만 저장 요청할 때 밸리데이션을 진행한다.
    if (
      (!isDelete &&
        isVideoChanged.current &&
        process.env.REACT_APP_IS_DOCKER_LOCAL_VERION !== 'true' &&
        videoInfo) ||
      (!isDelete &&
        !isVideoChanged.current &&
        process.env.REACT_APP_IS_DOCKER_LOCAL_VERION === 'true' &&
        videoInfo)
    ) {
      const totalErrVideo = await validateFormData(
        ['hls_replay', 'is_interactive', 'media', 'md5'],
        'createCMSVideoAndImagesInfo',
        videoInfo,
        'cms'
      );
      setVideoErrors(totalErrVideo);
      // 로딩 해제
      setIsLoading(false);
      // 저장을 원하는 비디오 에러가 있으면 저장을 못하게 한다.
      if (Object.keys(totalErrVideo).length !== 0) return;
    }

    const videoRequestList = videoPromiseList
      .initCmsData(cmsData)
      .filterSave(
        isVideoChanged.current,
        videoInfo,
        process.env.REACT_APP_IS_DOCKER_LOCAL_VERION
      )
      .filterSaveVideoAndMeta(
        isVideoChanged.current,
        videoInfo,
        process.env.REACT_APP_IS_DOCKER_LOCAL_VERION
      )
      .filterUpdateOnlyMetaData(isVideoChanged.current, videoInfo)
      .filterDelete(isRequestingVideoDelete.current);

    const videoPromises = videoRequestList.arr.save.concat(
      videoRequestList.arr.del
    );

    // imagesPromises를 만들고 videoPromises와 합친다.
    const imageRequestList = imagesPromiseList
      .initCmsData(cmsData)
      .initImagesInfo(imagesInfo)
      .initDelArr(imageDeleteArr.current)
      .filterSave();

    const imagesPromises = imageRequestList.arr.save.concat(
      imageRequestList.arr.del
    );

    // 0120 이미지, 비디오 분리
    const totalPromises = videoPromises.concat(imagesPromises);

    // 저장할 내용 없으면 리턴,
    // 도커 local의 경우에도 어떤 비디오, 이미지 처리 없을 경우 nothing to save 메시지를 보여준다.
    if (totalPromises.length === 0) {
      showNotification(t('cms:nothingToSave'), 'info');
      // 로딩 해제
      setIsLoading(false);
      return;
    }

    // local docker 환경에서 비디오 저장할 경우 프로그레스 바를 보여준다.
    if (
      process.env.REACT_APP_IS_DOCKER_LOCAL_VERION === 'true' &&
      isVideoChanged.current &&
      videoInfo &&
      videoInfo.file
    ) {
      setIsShowProgressBar(true);
    }

    // allSettled로 요청을 동시에 날린다.
    const result = await (Promise as any).allSettled(totalPromises);

    // update
    let failedList = ``;
    const okArr = result.map((t) => {
      // 성공한 요청만 내용을 업데이트 해준다.
      if (!t.value?.data || t.status !== 'fulfilled') {
        // 실패한 요청이 있을 경우, 어떤 요청들이 실패했는지를 메세지로 보여준다. (기존에 서버 요청 때 params라는 파라메터로 넣은 값을 활용)
        //// TODO: `cms:idx` 이런식으로 lang file 타게 하기 (다국어 적용)
        failedList += t.value?.param;
        return false;
      } else {
        // 썸네일 교체
        if (
          process.env.REACT_APP_IS_DOCKER_LOCAL_VERION === 'true' &&
          t.value?.param === 'videoSaveAndParseData'
        )
          handleGetThumbnails(t.value?.data.photo?.thumb);
      }

      // updated redux
      // current 정보 업데이트
      dispatch(
        isChildContent
          ? setChildCurrent(t.value.data)
          : setParentCurrent(t.value.data)
      );

      // list내의 정보 업데이트
      dispatch(
        isChildContent
          ? updateChildContent(t.value.data)
          : updateParentContent(t.value.data)
      );

      // context update
      !isUpdate && updateStep(3);

      return true;
    });

    // 로딩 해제
    setIsLoading(false);

    // 프로그레스바 숨기기, progress reset
    setIsShowProgressBar(false);
    setProgress('0%');

    // 모든 요청이 성공했을 경우
    if (!okArr.includes(false)) {
      setIsVideoUploaded(true);
      showNotification('success', 'success');
      return;
    }

    // 실패 알림 띄워주기
    showNotification(failedList, 'error');

    // 요청 관련 정보 초기화
    imageDeleteArr.current = [];
    isVideoChanged.current = false;
    isRequestingVideoDelete.current = false;
    setVideoInfo(null);
  };

  // /////////////////////////////////////////////
  // big file auto attatch에서 받은 썸네일 이미지들을 전달해주는 메서드
  const handleGetThumbnails = (thumbs: ImagesType) => setAutoThumbs(thumbs);

  const handleChangeTabs = (e) => {
    // console.log(e);
    const id = e.target.id;
    if (id === 'big-tab') {
      setIsShowBasic(false);
      return;
    }
    setIsShowBasic(true);
    // if(e.target.includes)
  };

  const reloadThumbImage = async (offset, channel) => {
    const responseData = await requestThumbnail(cmsData.video.bucket_key_name, offset, channel);
    
    if (responseData) {
      imgRef.current.src = responseData.data.file_name + getCacheBuster();
      setIsThumbChange(true);
    }
    
  }
  const onSelectThumbnail = () => {
    setDurationValue(cmsData.video.duration);
    setChannelCount(cmsData.video.channel_count);
    setVideoName(cmsData.video.bucket_key_name);
    setIsThumbChange(false);
    setIsModalOpen(true);
    reloadThumbImage(0, 0);
  }
  const onChangeOffsetValue = (value) => {
    console.log(value);
    setOffsetValue(value); 
  }
  const onChangeChannelValue = (value) => {
    console.log(value);
    setChannelValue(value);
  }
  const onOffsetAfterChangeSeekbar = (value) => {
    console.log('Offset: ' + value);
    reloadThumbImage(value, channelValue);
  }
  const onChannelAfterChangeSeekbar = (value) => {
    console.log('Channel: ' + value);
    reloadThumbImage(offsetValue, value);
  }
  const onSaveThumbnail = async () => {
    const responseData = await requestSaveThumbnail(videoName.split('.')[0]);
    
    if (responseData) {
      handleGetThumbnails(responseData.data);
    }
    setIsModalOpen(false);
  }

  // /////////////////////////////////////////////
  // /////////////////////////////////////////////

  return (
    <>
      <PageLoaderModal isOpen={isLoading} />

      {process.env.REACT_APP_IS_DOCKER_LOCAL_VERION === 'true' && (
        <ProgressBar isShow={isShowProgressBar} progress={progress} />
      )}

      <article className='mt-12' ref={wrapperRef}>
        <form className='cms__form' onSubmit={handleSubmit}>
          {/* Accordion header */}
          <div className='flex justify-between'>
            <div className='flex flex-col'>
              <h1 className='text-xl font-extrabold'>{t('cms:videoInfo')}</h1>
              <h3>{t('cms:asteriskIsRequired')}</h3>
            </div>
            <button type='button' onClick={handleToggleAccordionView}>
              {returnUpDownIcon(isShowAccordion)}
            </button>
          </div>
          {/* Accordion body(main) */}
          <div className={isShowAccordion ? '' : 'hidden'}>
            <div className='intro-y col-span-12 lg:col-span-8'>
              {/* 일반업로드, 큰파일 업로드 중 고를 수 있는 탭 */}
              <div className='post intro-y overflow-hidden box mt-5'>
                <div
                  className='post__tabs nav nav-tabs flex-col sm:flex-row bg-dark-2 text-gray-600'
                  role='tablist'
                  onClick={handleChangeTabs}
                >
                  {/* 일반 비디오 업로드 */}
                  <a
                    data-tip='files under 100mb'
                    data-toggle='tab'
                    className={isShowBasic ? 'tooltip active' : 'tooltip '}
                    id='basic-tab'
                    role='tab'
                    aria-controls='content'
                    aria-selected='true'
                  >
                    {t('cms:basic')}
                  </a>
                  {/* 대용량 비디오 업로드, 필요한 서비스에서만 탭을 노출한다. */}
                  {process.env.REACT_APP_BIG_FILE_UPLOAD_ENABLE === 'true' && (
                    <a
                      data-tip={t('cms:filesOver100mb')}
                      data-toggle='tab'
                      className={!isShowBasic ? 'tooltip  active' : 'tooltip '}
                      id='big-tab'
                      role='tab'
                      aria-selected='false'
                    >
                      {t('cms:bigFile')}
                    </a>
                  )}
                  <ReactTooltip />
                </div>
                <div className='post__content tab-content'>
                  <div
                    id='content'
                    className='tab-pane p-5 active'
                    role='tabpanel'
                    aria-labelledby='content-tab'
                  >
                    <div className='border border-dark-5 rounded-md p-5'>
                      {/* 일반업로드, 큰파일 업로드 중 업로드 방식을 고른다. */}
                      <BasicVideoUpload
                        isShow={isShowBasic}
                        ffmpeg={ffmpeg}
                        isFfmpegLoaded={isFfmpegLoaded}
                        ffmpegLoadFailed={ffmpegLoadFailed}
                        cmsData={cmsData}
                        isUpdate={isUpdate}
                        isMobile={isMobile}
                        videoInfo={videoInfo}
                        setVideoInfo={setVideoInfo}
                        setImagesInfo={setImagesInfo}
                        isRequestingVideoDelete={isRequestingVideoDelete}
                        isVideoChanged={isVideoChanged}
                        errors={videoErrors}
                        // onChangeThumbnail={handleGetThumbnails}
                      />
                      {/* 라지 파일 업로드 기능은 OTT 서비스에서만 제공한다. */}
                      {process.env.REACT_APP_BIG_FILE_UPLOAD_ENABLE ===
                        'true' && (
                        <LargeVideoUpload
                          isShow={!isShowBasic}
                          setImagesInfo={setImagesInfo}
                          imagesInfo={imagesInfo}
                          // 서버로부터 리턴받는 값으로 썸네일 정보 업데이트하는 메서드 전달
                          onChangeThumbnail={handleGetThumbnails}
                          cmsData={cmsData}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 썸네일 선택 모달 */}
            <>
              <Backdrop isShow={isModalOpen} />
              <Modal
                isShow={isModalOpen}
                title={t('cms:thumbnailImage')}
                content={
                  <>
                  <img
                    ref={imgRef}
                    crossOrigin="anonymous"
                    src={''}>
                  </img>
                  <div className={'image__input-wrapper'}>
                    <label className='form-check-label'>
                      {t('cms:time')}
                    </label>
                    <Slider 
                      style={{height: '20px'}}
                      railStyle={{
                        height: 3,
                        background: "#90918d"
                      }}
                      handleStyle={{
                        height: 14,
                        width: 14,
                        marginTop: -5, 
                        backgroundColor: "red",
                        border: 0
                      }}
                      trackStyle={{
                        background: "#e31414"
                      }}
                      min={0}
                      max={Math.floor(durationValue)}
                      step={1000}
                      onChange={onChangeOffsetValue}
                      onAfterChange={onOffsetAfterChangeSeekbar} 
                    />
                  </div>
                  <div className={channelCount > 1 ? 'image__input_wrapper' : 'image__input_wrapper hidden'}>
                    <label className='form-check-label'>
                      {t('cms:channel')}
                    </label>
                    <Slider 
                      style={{height: '20px'}}
                      railStyle={{
                        height: 3,
                        background: "#90918d"
                      }} 
                      handleStyle={{
                        height: 14,
                        width: 14,
                        marginTop: -5, 
                        backgroundColor: "red",
                        border: 0
                      }}
                      trackStyle={{
                        background: "#e31414"
                      }}
                      min={0}
                      max={channelCount - 1}
                      step={1}
                      onChange={onChangeChannelValue}
                      onAfterChange={onChannelAfterChangeSeekbar} 
                    />
                  </div>
                  </>
                }
                type='danger'
                closeBtn
                onClose={() => {
                  setIsModalOpen(false);
                }}
              >
                {/* 저장 button */}
                <Button
                  type='button'
                  id='thumbnailSaveBtn'
                  color='btn-primary'
                  onClick={onSaveThumbnail}
                  disabled={!isThumbChange}
                >
                  {t('cms:save')}
                </Button>
              </Modal>
            </>

            <Images
              list={IMAGES_LIST}
              cmsData={cmsData}
              isUpdate={isUpdate}
              imagesInfo={imagesInfo}
              setImagesInfo={setImagesInfo}
              imageDeleteArr={imageDeleteArr}
              autoThumbnails={autoThumbs}
            />
          </div>

          {/* 저장, 취소 buttons */}
          <div className='btns-wrapper intro-y col-span-12 flex items-center justify-center sm:justify-end mt-5'>
            <Button
              type='button'
              color='btn-primary'
              onClick={onSelectThumbnail}
              // disabled={!isVideoUploaded}
              disabled={ false }
            >
              {t('cms:selectThumbnail')}
            </Button>
            <Button
              type='submit'
              id='videosAndImagesSumbitBtn'
              color='btn-primary'
              disabled={isLoading}
            >
              {t('cms:save')}
            </Button>
          </div>
        </form>
      </article>
    </>
  );
};
export default VideoAndImages;
