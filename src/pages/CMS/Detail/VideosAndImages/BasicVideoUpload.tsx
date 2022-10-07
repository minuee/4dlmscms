import React, { useState, useRef, useEffect, lazy } from 'react';
import { useFormik } from 'formik';
import { useTranslation } from 'react-i18next';
import ReactTooltip from 'react-tooltip';

import { FmpegProps } from '../index';

import { showNotification, excludeNe, returnIcon, getFileExtension, getHlsBaseUrl } from '@/utils/commonFn';

import { useCMSVideosAndImagesRequest } from '@/apis/CMS/videosAndImages';
import { useBasicCMSVideo } from '@/hooks/CMS/basic-video-upload-hooks';
import { ReactComponent as Loader } from 'imgs/loader/oval.svg';
import playIcon from '@/assets/images/cms/playIcon.svg';
//import { is } from 'immer/dist/internal';

const Input = lazy(() => import('comp/Input/InputText'));
const Toggle = lazy(() => import('comp/Input/ToggleSlider'));
const Button = lazy(() => import('comp/Button/Button'));
const Backdrop = lazy(() => import('comp/Backdrop/Backdrop'));
const Modal = lazy(() => import('comp/Modal/Modal'));

const HlsPlayer = lazy(() => import('comp/Player/HlsPlayer'));
// const Checkbox = lazy(() => import('comp/Input/Checkbox'));
interface IF extends FmpegProps {
  isShow: boolean;
  isUpdate: boolean;
  cmsData: TotalItemType;
  isMobile: boolean;
  videoInfo: VideoInputsType;
  setVideoInfo: (data: any) => void;
  setImagesInfo: (data: any) => void;
  errors: any;
  // isVideoChanged일 경우 isRequestingVideoDelete도 false로 바꿔줘야 한다.
  isRequestingVideoDelete: {
    current: boolean;
  };
  // 비디오 삭제 시 isVideoChanged도 false로 바꿔줘야 한다.
  isVideoChanged: {
    current: boolean;
  };
  // onChangeThumbnail,
}

const initialInputValues = {
  // 아래는 헤더에 들어갈 정보
  duration: 0,
  fps: 0,
  frame_count: 0,
  resolution: 1080,
  codec: '',
  channel_count: 0,
  default_channel_id: 0,
  md5: 'ne',
  //////////////////////////
  // 아래는 바디에 들어갈 정보
  // media: '', // 파일
  // mid: '',
  // content_id: '',
  is_interactive: false,
  hls_replay: true,
  file_size: 0,
};

const initialValues: VideoInputsType = {
  file: null,
  fileName: '',
  fileType: '',
  url: '',
  uploadedVideoURL: '',
  origin_file_name: '',
  frame_count_array: [],
  ...initialInputValues,
};

function BasicVideoUpload(props: IF) {
  const {
    ffmpeg,
    isShow,
    isUpdate,
    cmsData,
    isMobile,
    videoInfo,
    setVideoInfo,
    setImagesInfo,
    errors,
    // isVideoChanged일 경우 isRequestingVideoDelete도 false로 바꿔줘야 한다.
    isRequestingVideoDelete,
    // 비디오 삭제 시 isVideoChanged도 false로 바꿔줘야 한다.
    isVideoChanged,
    // onChangeThumbnail,
  } = props;

  const { t } = useTranslation();
  const { getUploadedVideoURL } = useCMSVideosAndImagesRequest();
  const { parseFfmpegLogMessage, parsedValue, returnFrameCount, returnChannelCount } = useBasicCMSVideo();

  const [capturedImg, setCapturedThumbImg] = useState<string>();
  const [isVideoLoaded, setIsVideoLoaded] = useState<boolean>(false);
  const [isInputValuesSetted, setIsInputValuesSetted] = useState<boolean>(false);
  // 모달 visibility 상태
  const [isModalOpen, setIsModalOpen] = useState({ delete: false, checkUploaded: false });
  const [isHlsPlayer, setIsHlsPlayer] = useState<boolean>(false);

  const loaderRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoModalRef = useRef<HTMLVideoElement | null>(null);
  const videoInfoRef = useRef<VideoInputsType>(initialValues); 

  const formik = useFormik({
    initialValues: initialInputValues,
    validate: null,
    onSubmit: null,
    validateOnChange: false,
    validateOnBlur: false,
  });

  // 비디오 삭제를 위해 삭제할 비디오가 있는지 확인하고
  // 진짜 삭제할건지 문의하는 모달을 띄운다.
  const openVideoDeleteModal = (e) => {
    e.stopPropagation();

    // 삭제할 비디오가 없으면 리턴한다.
    if (!excludeNe(cmsData.video?.url)) {
      showNotification(t('cms:noVideoToDelete'), 'error');
      return;
    }
    // 모달을 연다.
    setIsModalOpen((prev) => ({ ...prev, delete: true }));
  };

  const resetError = (e: React.MouseEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,  MouseEvent>) => {
    const name = (e.target as HTMLInputElement).name;
    formik.setErrors({ ...formik.errors, [name]: '' });
  };  

  // 상위 컴포넌트에 비디오 인포를 전달하는 메서드
  // 저장은 상위 컴포넌트에서 이루어지기 때문에 상위 컴포넌트로 데이터를 전달해야함
  const handleUpdateInputInfo = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    const name = e.target.name;

    if (!videoInfo?.md5) {
      // 메타 정보만 저장할 때 videoInfo만 보내면 기존에 저장된 값은 안 보내져서 수정 안 되는 문제 해결하기 위해
      // 메타 정보 저장 시 기존에 저장한 값들도 videoInfo에 담기 위한 처리
      setVideoInfo((prev) => (
        {
          ...prev,
          ...formik.values,
          [name]: name === 'is_interactive' || 'hls_replay' ? (e.target as HTMLInputElement).checked : value
        }
      ));
      return;
    }

    setVideoInfo((prev) => (
      {
        ...prev,
        [name]: name === 'is_interactive' || 'hls_replay' ? (e.target as HTMLInputElement).checked : value,      
      }
    ));
  };  

  // 기존에 저장된 정보로(cmsData) 포믹 인풋 업데이트 하는 메서드
  const updateFieldValueWithCmsData = (cmsData: TotalItemType) => {
    formik.setFieldValue('duration', cmsData.video?.duration, false);
    formik.setFieldValue('fps', cmsData.video?.fps, false);
    formik.setFieldValue('frame_count', cmsData.video?.frame_count, false);
    formik.setFieldValue('resolution', cmsData.video?.resolution, false);
    formik.setFieldValue('codec', excludeNe(cmsData.video?.codec), false);
    formik.setFieldValue('channel_count', cmsData.video?.channel_count, false);
    formik.setFieldValue('default_channel_id', Number(cmsData.video?.default_channel_id), false);
    formik.setFieldValue('md5', excludeNe(cmsData.video?.md5), false);
    formik.setFieldValue('file_size', cmsData.video?.file_size, false);
    formik.setFieldValue('is_interactive', cmsData.video?.is_interactive, false);
    formik.setFieldValue('hls_replay', cmsData.video?.hls_replay ? cmsData.video?.hls_replay : true, false);
  };

  // 기존에 저장된 정보로(cmsData) 비디오인포 데이터 업데이트 하는 메서드
  const updateVideoInfoValueWithCmsData = (cmsData: TotalItemType) => {
    videoInfoRef.current.duration = cmsData.video?.duration;
    videoInfoRef.current.fps = cmsData.video?.fps;
    videoInfoRef.current.frame_count = cmsData.video?.frame_count;
    videoInfoRef.current.resolution = cmsData.video?.resolution;
    videoInfoRef.current.codec = excludeNe(cmsData.video?.codec);
    videoInfoRef.current.channel_count = cmsData.video?.channel_count;
    videoInfoRef.current.default_channel_id = Number(cmsData.video?.default_channel_id);
    videoInfoRef.current.md5 = cmsData.video?.md5;
    videoInfoRef.current.file_size = cmsData.video?.file_size;
    videoInfoRef.current.fileType = cmsData.video?.content_type;
    videoInfoRef.current.is_interactive = cmsData.video?.is_interactive;
    videoInfoRef.current.hls_replay = cmsData.video?.hls_replay || true; 
    videoInfoRef.current.video_type_id = cmsData.video_type_id;  
    
    // if(!cmsData.video?.hls_replay) {
    //   isVideoChanged.current = true;
    //   setVideoInfo(
    //     (prev) => (
    //       {
    //         ...prev,
    //         ...formik.values
    //       }
    //     )
    //   );
    // }
  };

  useEffect(() => {
    // 수정일 경우만 기존의 값을 세팅한다.
    if (!cmsData || !isUpdate) return;

    // 저장 된 비디오가 있다면 일정 시간 동안만 플레이할 수 있는 영상 정보를 받아온다.
    //excludeNe(cmsData.video?.url) && fetchUploadedVideo(); // HLS 로 변경되면서 제외 시킴.
    //excludeNe(cmsData.video?.url) && checkFileExtension(cmsData.video?.url);
    if (excludeNe(cmsData.vod?.hls_url)) {
      let cmsVideoType;
      if(cmsData.video.channel_count > 1 && cmsData.video_type_id === 10000) {
        cmsVideoType = 'multi';
      } else {
        cmsVideoType = 'single';
      }
      checkFileExtension(cmsData.vod?.hls_url, cmsVideoType);
    }
    // 필드 값 세팅
    updateFieldValueWithCmsData(cmsData);
    // videoInfo ref 업데이트
    updateVideoInfoValueWithCmsData(cmsData);

    return () => void (videoInfoRef.current.uploadedVideoURL = '');
  }, []);

  // cmsData의 비디오 메타데이터 정보가 바뀌면 셋 밸류 해줘야 한다.
  // video meta data 를 서버에서 파싱하는 경우를 위해 존재하는 코드
  useEffect(() => {
    // 필드 값 세팅
    updateFieldValueWithCmsData(cmsData);
  }, [cmsData]);

  // 상위 컴포넌트에서 validation 후 에러가 있을 시 에러를 세팅해준다.
  // submit은 상위컴포넌트에서 하므로 (이미지들과 모아서 서버 요청 하기 위해),
  // validation도 상위 컴포넌트에서 진행하고 그 결과를 props로 내려준다.
  useEffect(() => {
    // console.log({ errors });
    if (!errors) return;
    formik.setErrors(errors);
  }, [errors]);

  useEffect(() => {
    if(!isHlsPlayer && !isModalOpen.checkUploaded) {
      if(videoModalRef && videoModalRef.current) {
        videoModalRef.current.pause();
        videoModalRef.current.currentTime = 0;
      }
    } else {
      // if(!isModalOpen.checkUploaded) {
      //   videoInfoRef.current.uploadedVideoURL = '';
      // }
    }
  }, [isModalOpen]);

  // ///////////////////////

  // 선택한 비디오 선택 취소 메서드
  const cancelSelectedVideo = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    e.stopPropagation();

    // 비디오 영역, 캡쳐버튼 숨기기
    videoRef?.current.classList.add('invisible-and-take-no-space');
    document
      .querySelector('.cms__video--delete-btn')
      ?.classList.add('invisible-and-take-no-space');

    setIsVideoLoaded(false);

    // 만일 해당 비디오가 서버에 저장 된 상태라면
    if (excludeNe(cmsData.video?.url)) {
      // 서버 삭제 요청을 날린다.
      openVideoDeleteModal(e);
      return;
    }

    // 서버에 저장 요청을 날리지 않도록 isVideoChanged값을 false로 만든다.
    isVideoChanged.current = false;
    // ref 정보 초기화
    // 상위 컴포넌트에 전달하는 값 초기화
    // setVideoInfo(null);
    // 현재 컴포넌트에서 가지고 있는 값 초기화
    resetVideoInfo();

    setTimeout(() => {
      //  필드 밸류 초기화
      // 위 정보랑 맞춰서 바꿔야 함
      resetInputValues();
    }, 0);
  };

  // 비디오에서 사진을 추출하고 해당 파일을 다운받는 메서드
  const captureAndDownloadImage = (
    size: 'lg' | 'md' | 'sm',
    width: 1920 | 480 | 128,
    height: 1080 | 360 | 72,
    isVisible: boolean,
    type: 'upload' | 'update'
  ) => {
    const video = type === 'upload' ? videoRef.current : videoModalRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    canvas.className = !isVisible ? 'invisible-and-take-no-space' : null;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, width, height);

    const img = new Image();
    img.src = canvas.toDataURL('image/png');

    setCapturedThumbImg(canvas.toDataURL('image/png'));

    //사진 다운로드
    const fileDownloadName = videoInfoRef.current.fileName.split('.')[0].trim();

    const dlLink = document.createElement('a');
    dlLink.download =
      type === 'upload'
        ? `${fileDownloadName}_${size}.png`
        : `${cmsData?.video?.origin_file_name.split('.mp4')[0]}_${size}.png`; // 파일이름
    dlLink.href = canvas.toDataURL('image/png');
    dlLink.className = 'invisible-and-take-no-space';
    dlLink.dataset.downloadurl = [
      'image/png',
      dlLink.download,
      dlLink.href,
    ].join(':');

    document.body.appendChild(dlLink);
    dlLink.click();
    document.body.removeChild(dlLink);
  };

  // 썸네일 추출을 트리거 하는 메서드
  const capture = (type: 'upload' | 'update') => {
    showNotification('success', 'success');

    const MAX_WIDTH_LG = 1920;
    const MAX_HEIGHT_LG = 1080;
    const MAX_WIDTH_MD = 480;
    const MAX_HEIGHT_MD = 360;
    const MAX_WIDTH_SM = 128;
    const MAX_HEIGHT_SM = 72;

    captureAndDownloadImage('lg', MAX_WIDTH_LG, MAX_HEIGHT_LG, true, type);
    captureAndDownloadImage('md', MAX_WIDTH_MD, MAX_HEIGHT_MD, false, type);
    captureAndDownloadImage('sm', MAX_WIDTH_SM, MAX_HEIGHT_SM, false, type);
  };

  // 업로드한 비디오를 불러오는 메서드
  // 업로드한 비디오는 limited된 시간 동안만 플레이 할 수 있는 링크로 전달받는다.
  // const fetchUploadedVideo = async () => {
  //   const result = await getUploadedVideoURL(cmsData.content_id, cmsData._id);
  //   if (!result) return;
  //   videoInfoRef.current.uploadedVideoURL = result;
  //   videoInfoRef.current.origin_file_name = cmsData.video?.origin_file_name;

  //   setIsHlsPlayer(true);
  // };

  const checkFileExtension = async (fileUrl: string, cmsVideoType: string) => {
    console.log(fileUrl);
    if(fileUrl) {
      const fileExtension = getFileExtension(fileUrl);
      if(fileExtension.toLowerCase() === 'm3u8') {
        let hlsBaseUrl;
        if (cmsVideoType === 'multi') {
          hlsBaseUrl = getHlsBaseUrl(fileUrl, false);
        } else {
          hlsBaseUrl = fileUrl;
        }
        videoInfoRef.current.uploadedVideoURL = hlsBaseUrl;
        videoInfoRef.current.cmsVideoType = cmsVideoType;
        setIsHlsPlayer(true);
      } else {
        const result = await getUploadedVideoURL(cmsData.content_id, cmsData._id);
        if (!result) return;
        videoInfoRef.current.uploadedVideoURL = result;
        videoInfoRef.current.origin_file_name = cmsData.video?.origin_file_name;
        setIsHlsPlayer(false);
      }
    }
  }

  // 비디오가 로드 되면 로딩 스피너를 없앤다, 캡쳐버튼을 활성화 한다.
  const handleVideoLoaded = () => {
    setIsVideoLoaded(true);
    videoRef?.current.classList.remove('invisible-and-take-no-space');
    document.querySelector('.cms__video--delete-btn')?.classList.remove('invisible-and-take-no-space');
  };

  // 파일이 비디오인지 확인하기
  const checkVideoFileIsValid = (e: React.ChangeEvent<HTMLInputElement>): boolean => {
    const file = e.target.files?.item(0);

    if (!file) return false;

    const fileType = file.type.split('/')[0];
    const fileExtension = file.type.split('/')[1];

    // 비디오 파일만 업로드 가능하게 한다.
    if (fileType !== 'video') {
      showNotification(t('cms:PleaseUploadVideoFile'), 'error');
      return false;
    }

    // mp4만 업로드 가능하게 한다.
    if (fileExtension.toLowerCase() !== 'mp4') {
      showNotification(t('cms:PleaseUploadMP4File'), 'error');
      return false;
    }

    const fileName = file.name.split('.mp4')[0];
    // 파일명에 .이 들어간 파일은 업로드 하지 못하게 한다.
    if (fileName.includes('.')) {
      showNotification(t('cms:videoFileNameMustNotIncludeDot'), 'error');
      return false;
    }
    // 저장 시 필요한 파일 타입 정보를 저장해둔다.
    videoInfoRef.current.fileType = file.type;
    return true;
  };

  // 인풋 파일에서 비디오 선택 후 처리 메서드
  const handleChangeVideoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // ffmpeg이 로드되지 않았으면 리턴한다.
    if (process.env.REACT_APP_IS_DOCKER_LOCAL_VERION !== 'true' && !ffmpeg.isLoaded()) {
      showNotification('FFMPEGNotLoaded', 'error');
      // 로딩 스피너를 숨긴다.
      loaderRef?.current.classList.add('hidden');
      return;
    }

    try {
      // 로딩 스피너를 띄운다.
      loaderRef?.current.classList.remove('hidden');

      // 파일이 비디오파일인지 체크
      const isVideo = await checkVideoFileIsValid(e);
      if (!isVideo) return;

      // 초기화
      // 이미지를 초기화하라는 플래그를 넘긴다. (영상이 바뀌었으므로)
      setImagesInfo(null);

      // videoInfoRef 값 초기화
      resetVideoInfo();
      // formik (inputs) values도 초기화
      resetInputValues();

      // 캡쳐 이미지들 초기화
      setCapturedThumbImg(null);

      // 비디오 로드 상태와 인풋값 설정 초기화
      setIsInputValuesSetted(false);
      setIsVideoLoaded(false);
      
      // 위에까지가 초기화 단계
      // 새로운 비디오 관련 값 세팅 시작
      // 새로 등록한 비디오와 관련한 값 저장
      const file = e.target.files?.item(0);
      videoInfoRef.current.file = file;
      videoInfoRef.current.fileName = file.name;
      videoInfoRef.current.file_size = file.size;

      // 파일 크기는 ffmpeg으로 파싱할 필요 없으므로 여기서 바로 세팅
      formik.setFieldValue('file_size', file.size, false);

      const videourl = URL.createObjectURL(file);
      videoInfoRef.current.url = videourl;      

      // 0120 추가
      setVideoInfo(videoInfoRef.current);

      if (process.env.REACT_APP_IS_DOCKER_LOCAL_VERION !== 'true') {
        // REACT_APP_IS_DOCKER_LOCAL_VERION가 아닐 경우 ffmpeg으로 meta data 파싱
        ffmpeg.setLogger(({ type, message }) => {
          parseFfmpegLogMessage(message);
          // TODO: 파싱 실패 시 처리
        });

        const fetchFileWithFfmpeg = async () => {
          const { fetchFile } = await import('@ffmpeg/ffmpeg');
          // Write the file to memory
          ffmpeg.FS('writeFile', file.name, await fetchFile(e.target.files?.item(0)));
        };

        // Write the file to memory
        await fetchFileWithFfmpeg();

        // ffmpeg run
        await ffmpeg.run('-i', file.name, '-f', 'null', '/dev/null');

        // md5 hashing
        await ffmpeg.run('-i', file.name, '-map', '0:v', '-c', 'copy', '-f', 'md5', '-');

        // frame_count, channel count는 따로 계산해줘야 함
        // return;
        // frame count
        const frame_count = returnFrameCount(parsedValue);

        parsedValue['frame_count'] = Number(frame_count);
        // channel count
        const channelCount = returnChannelCount(parsedValue);
        parsedValue['channelCount'] = Number(channelCount);

        setInputValues(parsedValue);

        // video info 업데이트 (& 상위 컴포넌트에 전달)
        setVideoInfoValues(parsedValue);

        // 별도로 인풋 밸류를 셋해줘야 하는 경우들
        formik.setFieldValue('frame_count', frame_count, false);
        formik.setFieldValue('channel_count', channelCount, false);
        // channelCount가 여러 개면 is_interactive 를 true로 설정한다.
        formik.setFieldValue('is_interactive', channelCount > 1, false);
        setVideoInfoValues({
          frame_count,
          channel_count: channelCount,
          is_interactive: channelCount > 1,
        });

        // 모든 파싱된 값이 세팅 완료 되었다는 표시
        setIsInputValuesSetted(true);
      }      

      // 비디오가 변경되었으므로
      // isVideoChanged를 true로 바꾼다.
      isVideoChanged.current = true;

      // 비디오 삭제여부를 false로 바꾼다
      // (업로드할 비디오가 있으므로, 삭제하는 영상이 없다고 처리.
      // 이미 등록된 영상이 있는 경우-영상 수정-
      // 서버에서 알아서 기존 영상을 삭제하고 새로운 영상으로 바꾼다.)
      isRequestingVideoDelete.current = false;      
    } catch(e) {

    } finally {
      // 새로운 값 세팅이 완료되었으므로
      // 로딩 스피너를 숨긴다.
      loaderRef?.current.classList.add('hidden');
    }
  };

  // video info value 를 set해주는 메서드 ()
  const setVideoInfoValues = (value: VideoInputsType) => {
    for (const property in value) {
      // console.log(`${property}: ${value[property]}`);

      videoInfoRef.current[property] = value[property];
      setVideoInfo((prev) => ({ ...prev, [property]: value[property] }));
    }
  };

  // input value 를 set해주는 메서드 (formik.setFieldValue를 해준다)
  const setInputValues = (value: VideoInputsType) => {
    for (const property in value) {
      formik.setFieldValue(property, value[property], false);
    }
  };

  // formik 값들을 초기화 하는 메서드
  const resetInputValues = () => setInputValues(initialInputValues);

  // videoInfo ref를 초기화하는 메서드
  const resetVideoInfo = () => {
    // 상위 컴포넌트에 전달하는 값 초기화
    setVideoInfo(null);
    // 현재 컴포넌트에서 가지고 있는 값 초기화
    videoInfoRef.current = initialValues;
  };

  // 비디오 삭제 버튼 클릭 시 시행되는 메서드
  // 이미 삭제할 비디오가 있는지 없는지 체크가 완료된 상태
  const handleClickRemoveVideo = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.stopPropagation();

    setIsModalOpen((prev) => ({ ...prev, delete: false }));
    // 삭제할 비디오가 있다고 값을 세팅한다.
    isRequestingVideoDelete.current = true;
    // 업로드할 비디오가 없으므로 비디오가 변경되지 않았다고 세팅한다.
    isVideoChanged.current = false;

    // videoInfo ref 정보 초기화
    setVideoInfo(null);
    resetVideoInfo();

    // 필드 밸류 초기화
    // 위 정보랑 맞춰서 바꿔야 함
    resetInputValues();
  };
  //////////////////////////////////////////////////////////////////
  return (
    <div id='video-upload__basic' className={isShow ? '' : 'invisible-and-take-no-space'}>
      {/* 동영상을 플레이해볼 수 있는 모달 */}
      <>
        <Backdrop isShow={isModalOpen.checkUploaded} />
        <Modal
          isShow={isModalOpen.checkUploaded}
          title={t('cms:uploadedVideo')}
          content={
            <div className='flex flex-col'>
              {isHlsPlayer ? 
                <HlsPlayer 
                  url={videoInfoRef.current.uploadedVideoURL} 
                  videoChannel={videoInfoRef.current.channel_count}
                  defaultChannel={videoInfoRef.current.default_channel_id}
                  cmsVideoType={videoInfoRef.current.cmsVideoType}
                  isShowModal={isModalOpen.checkUploaded}                  
                />
                :
                <video
                  ref={videoModalRef}
                  className='w-full'
                  id='video__player'
                  src={videoInfoRef.current.uploadedVideoURL}
                  crossOrigin='anonymous'
                  controls
                >
                  {t('cms:browserNotSupportsVideos')}
                </video>
              }

              <div className='flex justify-center mt-3 mb-4 uploaded-video__capture-btn'>
                <Button color='btn-primary' onClick={() => capture('update')}>
                  {t('cms:capture')}
                </Button>
              </div>
            </div>
          }
          type='info'
          closeBtn
          onClose={() => {
            setIsModalOpen((prev) => ({ ...prev, checkUploaded: false }));
          }}
        >
          <Button
            color='btn-secondary'
            onClick={() => {
              setIsModalOpen((prev) => ({ ...prev, checkUploaded: false }));
            }}
          >
            {t('cms:close')}
          </Button>
        </Modal>
      </>

      {/* 영상 삭제 모달 */}
      <>
        <Backdrop isShow={isModalOpen.delete} />
        <Modal
          isShow={isModalOpen.delete}
          title={t('cms:deleteVideo')}
          content={
            <p>
              {t('cms:checkDelete')}
              <br />
              <br />
              {t('cms:clickSaveBtnToDelete')}
            </p>
          }
          type='danger'
          closeBtn
          onClose={() => {
            setIsModalOpen((prev) => ({ ...prev, delete: false }));
          }}
        >
          <Button
            color='btn-danger'
            onClick={(e) => {
              handleClickRemoveVideo(e);
            }}
          >
            {t('cms:yes')}
          </Button>
        </Modal>
      </>

      {!isMobile && (
        <div className='relative'>
          <label className='capitalize form-label'>
            {t('cms:registerVideoFile')}
          </label>
          <div className='flex flex-row'>            
            <input
              id='uploadFile'
              name='uploadFile'
              type='text'
              className='mr-auto form-control'
              placeholder={'반드시 영문명의 mp4 파일을 선택해 주세요.'}
              value={videoInfoRef.current.fileName}
              readOnly
            />
            <div className='flex flex-row w-full ml-auto'>              
              {/* 비디오는 mp4파일만 허용한다.  */}
              <input
                className='sr-only'
                type='file'
                accept='.mp4'
                name='videoFile'
                id='videoFile'
                onChange={(e) => handleChangeVideoFile(e)}
                onClick={(event) => {
                  (event.target as HTMLInputElement).value = null;
                }}
              />
              <label htmlFor='videoFile' className='ml-2 btn btn-primary'>
                {t('cms:selectVideoFile')}
              </label>
              {/* <div className="ml-2 form-check">
                <Checkbox
                  id={'makeHlsMovie'}
                  name={'props.name'}
                  checked={true}
                  label={'Create HLS'}
                  onChange={(e) => {
                    handleUpdateInputInfo(e);
                    formik.handleChange(e);
                  }}
                />                  
              </div> */}
              <div className={`ml-2 video__player__capture-btn ${!isVideoLoaded && 'invisible-and-take-no-space' }`}>
                <Button color='btn-secondary' onClick={() => capture('upload')}>
                  {t('cms:capture')}
                </Button>
              </div>
            </div>            
          </div>
          
          <div className='flex flex-row mt-1'>    
            {!isUpdate && (      
              <div className='w-full image__total-wrapper--border'>
                <div className='relative'>
                  {/* 삭제 버튼(선택 취소 버튼-아직 저장 전-) */}
                  {/* 인풋 밸류가 셋 되기 전에 취소를 누르면 값 세팅 초기화 되지 않고 영상 선택을 취소했어도 파싱한 정보를 세팅하기 때문에 아래 플래그를 걸어 값이 모두 세팅 되기 전까지는 선택을 취소하지 못하게 한다.*/}
                  
                  <div title={t('cms:checkVideoDelete')} className={`cms__video--delete-btn invisible-and-take-no-space `} onClick={(e) => cancelSelectedVideo(e)}>
                    {returnIcon({ icon: 'X' })}
                  </div>                  

                  <video
                    // className='mb-4 cms__video'
                    className='mb-4 invisible-and-take-no-space cms__video'
                    ref={videoRef}
                    id='video__player'
                    src={videoInfoRef.current?.url}
                    crossOrigin='anonymous'
                    controls
                    onLoadedData={handleVideoLoaded}
                  >
                    {t('cms:browserNotSupportsVideos')}
                  </video>

                  {/* loading spinner */}
                  <div className={`absolute top-1/2 left-56 transform -translate-y-1/2 -translate-x-1/2 mb-32
                    ${isVideoLoaded ? 'invisible-and-take-no-space' : videoInfoRef.current.fileName ? '' : 'invisible-and-take-no-space'}                  
                  `}>
                    <Loader />
                  </div>
                </div>
              </div>
            )}
          </div>          
        </div>
      )}

      {/* 수정 시 보여주는 비디오 플레이 UI */}
      {isUpdate && !isVideoLoaded && excludeNe(cmsData.video?.url) && (
        <div className='image__total-wrapper--border'>
          <div
            className='relative w-40 savedVideoWrapper'
            onClick={() =>
              setIsModalOpen((prev) => ({ ...prev, checkUploaded: true }))
            }
          >
            {!isHlsPlayer ?
              <video
                className='savedVideo'
                src={videoInfoRef.current.uploadedVideoURL}
                crossOrigin='anonymous'
                data-tip={t('cms:videoOnlyLast2Hours')}
                controls
              >
                {t('cms:browserNotSupportsVideos')}
              </video>
              :
              <video
                className='savedVideo'
                crossOrigin='anonymous'
                controls
              >
                {t('cms:browserNotSupportsVideos')}
              </video>
            }

            <div
              title={t('cms:checkVideoDelete')}
              className='absolute top-0 right-0 flex items-center justify-center w-5 h-5 -mt-2 -mr-2 text-white rounded-full cursor-pointer tooltip bg-theme-24'
              onClick={(e) => openVideoDeleteModal(e)}
            >
              {returnIcon({ icon: 'X' })}
            </div>
            <img
              className='absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer video-play-modal__img left-1/2 top-1/2'
              src={playIcon}
              alt='play icon'
            />
            <ReactTooltip />
          </div>
        </div>
      )}

      {/* video meta info */}
      <div className='relative'>
        <div
          ref={loaderRef}
          className={`hidden absolute top-1/2 left-1/2 transform z-50 -translate-x-1/2 -translate-y-1/2`}
        >
          <Loader />
        </div>

        <div className='flex items-center mt-3 text-orange-500'>
          {returnIcon({ icon: 'Info' })}
          <span className='ml-2.5 text-xs text-orange-400 font-semibold'>{t('cms:dataWillAutomaticallyParsed')}</span>
        </div>      

        <div className='flex flex-col md:flex-row'>
          <div className='flex-1 md:mr-1'>
            <Input
              id='md5'
              name='md5'
              type='text'
              placeholder={t('cms:md5')}
              onClick={(e) => resetError(e)}
              onChange={(e) => {
                handleUpdateInputInfo(e);
                formik.handleChange(e);
              }}
              errMsg={formik.errors.md5}
              label={t('cms:md5')}
              autoComplete='on'
              transformDirection='intro-y'
              design='inputGroupHeader'
              value={formik.values.md5 || 'ne'}
              readonly
            />
          </div>
          <div className='flex-1 md:mr-1'>
            <Input
              id='file_size'
              name='file_size'
              type='number'
              min={0}
              step={1}
              placeholder={t('cms:fileSize')}
              onClick={(e) => resetError(e)}
              onChange={(e) => {
                handleUpdateInputInfo(e);
                formik.handleChange(e);
              }}
              errMsg={formik.errors.file_size}
              label={t('cms:fileSizeWithAsterisk')}
              autoComplete='on'
              transformDirection='intro-y'
              design='inputGroupHeader'
              value={formik.values.file_size || ''}
              // readonly={isUpdate ? false : !isInputValuesSetted}
            />
          </div>
          <div className='flex-1 md:mr-1'>
            <Input
              id='codec'
              name='codec'
              type='text'
              placeholder={t('cms:codec')}
              onClick={(e) => resetError(e)}
              onChange={(e) => {
                handleUpdateInputInfo(e);
                formik.handleChange(e);
              }}
              errMsg={formik.errors.codec}
              label={t('cms:codecWithAsterisk')}
              autoComplete='on'
              transformDirection='intro-y'
              design='inputGroupHeader'
              value={formik.values.codec || ''}
              // readonly={isUpdate ? false : !isInputValuesSetted}
            />
          </div>
        </div>
        <div className='flex flex-col md:flex-row'>
          <div className='flex-1 md:mr-1'>
            <Input
              id='resolution'
              name='resolution'
              type='number'
              min={0}
              step={1}
              placeholder={t('cms:resolution')}
              onClick={(e) => resetError(e)}
              onChange={(e) => {
                handleUpdateInputInfo(e);
                formik.handleChange(e);
              }}
              errMsg={formik.errors.resolution}
              label={t('cms:resolutionWithAsterisk')}
              autoComplete='on'
              transformDirection='intro-y'
              design='inputGroupHeader'
              value={formik.values.resolution || ''}
              // readonly={isUpdate ? false : !isInputValuesSetted}
            />
          </div>
          <div className='flex-1 md:mr-1'>
            <Input
              id='fps'
              name='fps'
              type='number'
              min={0}
              step='any'
              placeholder={t('cms:fps')}
              onClick={(e) => resetError(e)}
              onChange={(e) => {
                handleUpdateInputInfo(e);
                formik.handleChange(e);
              }}
              errMsg={formik.errors.fps}
              label={t('cms:fpsWithAsterisk')}
              autoComplete='on'
              transformDirection='intro-y'
              design='inputGroupHeader'
              value={formik.values.fps || ''}
              // readonly={isUpdate ? false : !isInputValuesSetted}
            />
          </div>
          <div className='flex-1 md:mr-1'>
            <Input
              id='duration'
              name='duration'
              type='number'
              min={0}
              step='any'
              placeholder={t('cms:durationPlaceholder')}
              onClick={(e) => resetError(e)}
              onChange={(e) => {
                handleUpdateInputInfo(e);
                formik.handleChange(e);
              }}
              errMsg={formik.errors.duration}
              label={t('cms:durationWithAsterisk')}
              autoComplete='on'
              transformDirection='intro-y'
              design='inputGroupHeader'
              value={formik.values.duration || 0}
              // readonly={isUpdate ? false : !isInputValuesSetted}
            />
          </div>
        </div>
        <div className='flex flex-col md:flex-row'>
          <div className='flex-1 md:mr-1'>
            <Input
              id='channel_count'
              name='channel_count'
              type='number'
              min={0}
              step={1}
              placeholder={t('cms:channelCount')}
              onClick={(e) => resetError(e)}
              onChange={(e) => {
                handleUpdateInputInfo(e);
                formik.handleChange(e);
              }}
              errMsg={formik.errors.channel_count}
              label={t('cms:channelCountWithAsterisk')}
              autoComplete='on'
              transformDirection='intro-y'
              design='inputGroupHeader'
              value={formik.values.channel_count || ''}
              // readonly={isUpdate ? false : !isInputValuesSetted}
            />
          </div>
          <div className='flex-1 md:mr-1'>
            <Input
              id='default_channel_id'
              name='default_channel_id'
              type='number'
              min={0}
              step={1}
              placeholder={t('cms:defaultChannel')}
              onClick={(e) => resetError(e)}
              onChange={(e) => {
                handleUpdateInputInfo(e);
                formik.handleChange(e);
              }}
              errMsg={formik.errors.default_channel_id}
              label={t('cms:defaultChannelWithAsterisk')}
              autoComplete='on'
              transformDirection='intro-y'
              design='inputGroupHeader'
              value={formik.values.default_channel_id}
            />
          </div>

          <div className='flex-1 md:mr-1'>
            <Input
              id='frame_count'
              name='frame_count'
              type='number'
              min={0}
              step='any'
              placeholder={t('cms:frameCount')}
              onClick={(e) => resetError(e)}
              onChange={(e) => {
                handleUpdateInputInfo(e);
                formik.handleChange(e);
              }}
              errMsg={formik.errors.frame_count}
              label={t('cms:frameCountWithAsterisk')}
              autoComplete='on'
              transformDirection='intro-y'
              design='inputGroupHeader'
              value={formik.values.frame_count || ''}
              // readonly={isUpdate ? false : !isInputValuesSetted}
            />
          </div>
        </div>        
      </div>
      <div className='flex'>
        <Toggle
          id='hls_replay'
          name='hls_replay'          
          onChange={(e) => {
            handleUpdateInputInfo(e);
            formik.handleChange(e);
          }}
          label={t('cms:createHLS')}
          checked={formik.values.hls_replay}
          marginRight={true}
          tabIndex={0}
        />
        <Toggle
            id='is_interactive'
            name='is_interactive'                       
            onChange={(e) => {
              handleUpdateInputInfo(e);
              formik.handleChange(e);
            }}
            label={t('cms:interactive')}
            checked={formik.values.is_interactive || false}
            tabIndex={1}
        />
      </div>
    </div>
  );
};
export default BasicVideoUpload;
