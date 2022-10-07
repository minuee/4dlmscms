import { useRestfulCustomAxios } from '@/hooks/axios-hooks-restful';
import { useVideoImagesAxios } from '@/hooks/CMS/axios-hooks-videosAndImages';
import { ImageSizeType } from '@/pages/CMS/Detail/VideosAndImages/Images';
import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { setUploadProgress } from '@/redux/CMS/BasicVideoUploadSlices';

export const useCMSVideosAndImagesRequest = () => {
  const { isLoading, sendRequest } = useRestfulCustomAxios();
  const dispatch = useAppDispatch();

  const {
    isLoading: IsVideoImageRequestLoading,
    sendRequest: sendVideoImageRequest,
  } = useVideoImagesAxios();

  // video파일과 비디오 meta 정보를 저장 요청하는 메서드
  const requestSaveVideoData = async (
    values,
    file,
    content_id,
    _id,
    league_id
  ) => {
    const formData = new FormData();
    formData.append('media', file);
    formData.append('mid', _id);
    formData.append('content_id', content_id);

    const responseData = await sendVideoImageRequest({
      url: `/content/video/upload/media?mid=${_id}&content_id=${content_id}&size=large&duration=${
        values.duration
      }&fps=${values.fps}&frame_count=${values.frame_count}&resolution=${
        values.resolution
      }&codec=${values.codec}&channel_count=${
        values.channel_count
      }&default_channel_id=${Number(values.default_channel_id)}&md5=${
        values.md5 ? values.md5 : 'ne'
      }&hls_replay=${values.hls_replay}&is_interactive=${
        values.is_interactive
      }&league_id=${league_id}`,
      method: 'patch',
      headers: undefined,
      data: formData,
      noSuccessAlert: true,
      param: `videoSave`,
    });

    return responseData;
  };

  const requestThumbnail = async (filename, frame_offset, channel_index) => {
    const responseData = await sendVideoImageRequest({
      url: `/content/video/thumbnail/${filename}?frame_offset=${frame_offset}&channel_index=${channel_index}`,
      method: 'get',
      headers: undefined,
      data: undefined,
      noSuccessAlert: true,
      param: false
    });
    return responseData;
  };

  const requestSaveThumbnail = async (filename) => {
    const responseData = await sendVideoImageRequest({
      url: `/content/video/thumbnail/${filename}`,
      method: 'put',
      headers: undefined,
      data: undefined,
      noSuccessAlert: true,
      param: false
    });
    return responseData;
  }

  // 0120 추가
  // 비디오 업로드 시 서버측에서 비디오 메타데이터 파싱 및 썸네일 추출도 해주는 메서드
  const requestUploadVideoAndParseMetadata = async (
    obj = 'media',
    file,
    _id,
    content_id,
    hls_replay = false,
    league_id = 1
  ) => {
    const formData = new FormData();
    formData.append('media', file);

    const responseData = await sendVideoImageRequest({
      url: `/content/video/file_upload/${obj}?mid=${_id}&content_id=${content_id}&league_id=${league_id}&hls_replay=${hls_replay}`,
      method: 'patch',
      headers: undefined,
      data: formData,
      noSuccessAlert: true,
      param: `videoSaveAndParseData`,
      // onUploadProgress: returnProgress,
      onUploadProgress: (progress) => {
        const { total, loaded } = progress;
        const totalSizeInMB = total / 1000000;
        const loadedSizeInMB = loaded / 1000000;
        const uploadPercentage = (loadedSizeInMB / totalSizeInMB) * 100;
        // setProgress(uploadPercentage.toFixed(2) + '%');
        dispatch(setUploadProgress(uploadPercentage.toFixed(2) + '%'));
        console.log('total size in MB ==> ', totalSizeInMB);
        console.log('uploaded size in MB ==> ', loadedSizeInMB);
      },
    });

    // reset
    dispatch(setUploadProgress('0%'));

    return responseData;
  };

  // local ivod로 서버에 요청하는 경우
  // 비디오 업로드 시 서버측에서 비디오 메타데이터 파싱 및 썸네일 추출도 해주는 메서드
  const requestUploadInteractiveVideoAndParseMetadata = async (
    obj = 'media',
    file,
    _id,
    content_id,
    hls_replay = false,
    league_id = 1,
    system_id,
    event_id
  ) => {
    const formData = new FormData();
    formData.append('media', file);

    const responseData = await sendVideoImageRequest({
      url: `/content/video/ivod_file_upload/${obj}?mid=${_id}&content_id=${content_id}&league_id=${league_id}&hls_replay=${hls_replay}&system_id=${system_id}&event_id=${event_id}`,
      method: 'patch',
      headers: undefined,
      data: formData,
      noSuccessAlert: true,
      param: `videoSaveAndParseData`,
      // onUploadProgress: returnProgress,
      onUploadProgress: (progress) => {
        const { total, loaded } = progress;
        const totalSizeInMB = total / 1000000;
        const loadedSizeInMB = loaded / 1000000;
        const uploadPercentage = (loadedSizeInMB / totalSizeInMB) * 100;
        // setProgress(uploadPercentage.toFixed(2) + '%');
        dispatch(setUploadProgress(uploadPercentage.toFixed(2) + '%'));
        console.log('total size in MB ==> ', totalSizeInMB);
        console.log('uploaded size in MB ==> ', loadedSizeInMB);
      },
    });

    // reset
    dispatch(setUploadProgress('0%'));

    return responseData;
  };

  // 서버에 사진 업로드 요청하는 메서드
  const requestSavePicture = async (
    file: File,
    size: ImageSizeType,
    type: ImageUploadType,
    content_id,
    _id,
    league_id
  ) => {
    const formData = new FormData();
    formData.append('media', file);
    const responseData = await sendVideoImageRequest({
      url: `/content/picture/upload/${type}?mid=${_id}&content_id=${content_id}&size=${size}&league_id=${league_id}`,
      method: 'put',
      headers: undefined,
      data: formData,
      noSuccessAlert: true,
      param: `${type}${size}Save`,
    });

    return responseData;
  };

  // 사진 혹은 영상 삭제를 요청하는 메서드
  const requestDeletePictureOrVideo = async (
    content_id,
    _id,
    league_id,
    id?: string
  ) => {
    const type = id ? id.split('_')[0] : 'media';
    const size = id ? id.split('_')[1] : 'large';

    const responseData = await sendVideoImageRequest({
      url: `/content/file/${type}?mid=${_id}&content_id=${content_id}&size=${size}&league_id=${league_id}`,
      method: 'delete',
      headers: undefined,
      data: undefined,
      noSuccessAlert: true,
      param: `${type}${size}Delete`,
    });

    return responseData;
  };

  //  비디오 메타데이터 업데이트
  //! 수정 시에는 md5를 보내면 안 된다!
  const updateVideoMetaData = async (
    values,
    content_id,
    _id,
    league_id,
    fileType
  ) => {
    // console.log({ values });

    const data = JSON.stringify({
      // content_type: videoInfoRef.current.fileType,
      content_type: fileType,
      duration: Number(values.duration),
      fps: Number(values.fps),
      frame_count: Number(values.frame_count),
      resolution: Number(values.resolution),
      codec: values.codec,
      file_size: values.file_size,
      default_channel_id: Number(values.default_channel_id),
      channel_count: Number(values.channel_count),
      hls_replay: values.hls_replay,
      is_interactive: values.is_interactive,
    });

    const responseData = await sendVideoImageRequest({
      url: `/content/meta/video/${content_id}/${_id}?league_id=${league_id}`,
      method: 'put',
      headers: undefined,
      data,
      noSuccessAlert: true,
      param: `videoMetaSave`,
    });

    return responseData;
  };

  // 업로드했던 영상을 받아오는 메서드
  const getUploadedVideoURL = async (content_id, _id) => {
    const responseData = await sendRequest(
      `/content/video/link/${content_id}/${_id}`,
      'restful',
      'get',
      undefined,
      undefined,
      true,
      false
    );

    return responseData;
  };

  // ********************************************************************
  // big file upload 관련 메서드들
  // ********************************************************************
  // 100mb이상의 경우 클라이언트에서 비디오를 업로드하지 않고,
  // 서버에 이미 s3로 올라가있는 비디오 중에 골라서 매핑만 한다.
  // 서버에 올라간 영상과 리스트를 요청하는 메서드

  const requestBigFileList = async (bucket_name: string = '4dlive-content') => {
    const responseData = await sendRequest(
      `/bigfile/list/s3/${bucket_name}`,
      'restful',
      'get',
      undefined,
      undefined,
      true,
      false
    );

    return responseData;
  };

  // 100mb이상의 경우 클라이언트에서 비디오를 업로드하지 않고,
  // 서버에 이미 s3로 올라가있는 비디오 중에 골라서 매핑만 한다.
  // 서버에 올라간 영상과 매핑하는 메서드
  const requestBigAutoAttach = async (
    content_id,
    _id,
    file_name = 'EP02_MRLEE.mp4',
    origin_file_name = 'ORIGIN_EP02_MRLEE_EDIT.mp4',
    image_extract = 0
  ) => {
    const data = JSON.stringify({
      file_name,
      origin_file_name,
      image_extract,
    });

    const responseData = await sendRequest(
      `/bigfile/attatch/s3/auto/${content_id}/${_id}`,
      'restful',
      'put',
      undefined,
      data,
      false,
      false
    );

    return responseData;
  };

  return {
    requestSaveVideoData,
    requestSavePicture,
    requestDeletePictureOrVideo,
    updateVideoMetaData,
    getUploadedVideoURL,
    requestBigFileList,
    requestBigAutoAttach,
    requestUploadVideoAndParseMetadata,
    requestUploadInteractiveVideoAndParseMetadata,
    requestThumbnail,
    requestSaveThumbnail,
    isLoading,
  };
};
