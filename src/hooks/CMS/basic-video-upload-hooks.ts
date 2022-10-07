import React from 'react';
import { useCMSVideosAndImagesRequest } from '@/apis/CMS/videosAndImages';
import { useValidation } from '@/hooks/validation-hooks';

// ////////////////////////////////////////////
// cmsData.video.url, videoInfo 중요
// 1) cmsData.video.url&& isRequestingVideoDelete => delete
// 2) cmsData.video.url&& clicked handleChangeVideo(clicked가 사실 아니고 clicked 되었을 때 파일 정보가 모두 set되면 그 때 체크) => update
// 3) cmsData.video.url&& !clicked handleChangeVideo && cmsData.video!==videoInfo(videoInfo에 있는 항목 순회하며 체크) => only meta
// 4) !cmsData.video.url&& clicked handleChangeVideo => create
// 1-2) cmsData.video.url&& isRequestingVideoDelete&&clicked handleChangeVideo => update

// 1. 삭제만 원할 시
// isRequestingVideoDelete 여부에 따라

// 2. 수정 원할 시
// 영상 정보가 다를 시(이름, 파일)
// cmsData에 url정보가 있는데 handleVideoChange를 트리거 했을 때

// 3. 새로 등록할 시
// 기존에는 정보가 없었는데(cmsData.video.url이 없었는데)
// 새로 영상 정보를 얻을 시

// 4. 메타정보만 수정하고 싶을 시
// 파일 정보는 바뀐게 없는데(파일 삭제를 요청하지 않았는데)
// 나머지 정보가 변경되었을 시
// 플래그를 만들어서 handleChange에서 선택 완료 시
// 플래그를 바꾸는 방법도 좋을 듯

export type ParsedValueType = {
  channel_count_array: string[];
  codec: string;
  duration: number;
  fps: number;
  frame_count: number;
  frame_count_array: string[];
  md5: string;
  resolution: number;
};

export const useBasicCMSVideo = () => {
  const { requestSaveVideoData, requestDeletePictureOrVideo, updateVideoMetaData, requestUploadVideoAndParseMetadata, requestUploadInteractiveVideoAndParseMetadata } = useCMSVideosAndImagesRequest();
  const { validateFormData } = useValidation();
  const videoPromiseList = {
    // 초기 값
    arr: { save: [], del: [] },
    arrStr: [],
    arrFormikErrors: {},
    cmsData: '',
    initCmsData(_cmsData) {
      this.cmsData = _cmsData;
      return this;
    },
    initArr(_arr) {
      this.arr = _arr;
      return this;
    },
    initArrStr(_arrStr) {
      this.arrStr = _arrStr;
      return this;
    },
    initArrFormikErrors(_formikErrors) {
      this.arrFormikErrors = _formikErrors;
      return this;
    },

    filterCheckNoErrorsOnValues: async function (_values) {
      // 저장할 내역 없다면 리턴
      const totalErrVideo = await validateFormData(
        ['hls_replay', 'is_interactive', 'media', 'md5'],
        'createCMSVideoAndImagesInfo',
        _values,
        'cms'
      );

      if (Object.keys(totalErrVideo).length === 0) return true;
      // 에러가 있을 경우 저장 요청 못하게 처리
      this.arrFormikErrors = totalErrVideo;
      return false;
    },
    // 프론트에서 직접 메타정보 파싱하여 비디오 저장 요청하는 경우
    filterSave: function (_isVideoChanged, _values, isDockerLocal) {
      if (!_isVideoChanged || isDockerLocal === 'true') return this;
      this.arr.save.push(
        requestSaveVideoData(
          _values,
          _values.file,
          this.cmsData.content_id,
          this.cmsData._id,
          this.cmsData.league_id
        )
      );

      // string 배열에도 푸쉬(나중에 실패 시 어떤 요청이 실패했는지 알려주기 위해)
      this.arrStr.push('videoSave');
      return this;
    },

    // 서버에 메타정보 파싱도 요청하는 경우
    filterSaveVideoAndMeta: function (_isVideoChanged, _values, isDockerLocal) {
      if (!_isVideoChanged || isDockerLocal !== 'true') return this;
      if(!_values.is_interactive) {
        // 일반 replay 업로드 요청인 경우
        this.arr.save.push(
          requestUploadVideoAndParseMetadata(
            'media',
            _values.file,
            this.cmsData._id,
            this.cmsData.content_id,
            _values.hls_replay,
            this.cmsData.league_id
          )
        );
        this.arrStr.push('videoSaveAndMetadata');
        return this;
      }
      else {
        // local ivod 업로드 요청인 경우
        console.log(`system id : ${this.cmsData.ims_system_id}`)
        console.log(`event id : ${this.cmsData.ims_event_id}`);
        console.log(this.cmsData)
        this.arr.save.push(
          requestUploadInteractiveVideoAndParseMetadata(
            'media',
            _values.file,
            this.cmsData._id,
            this.cmsData.content_id,
            _values.hls_replay,
            this.cmsData.league_id,
            this.cmsData.ims_system_id,
            this.cmsData.ims_event_id
          )
        );
        this.arrStr.push('interactiveVideoSaveAndMetadata')
        return this;
      }
    },

    filterUpdateOnlyMetaData: function (_isVideoChanged, _videoInfo) {
      // 비디오 자체가 변경되었다면 비디오 저장요청 진행해야 하므로 리턴
      if (_isVideoChanged) return this;
      // 저장할 데이터가 없다면
      if (!_videoInfo) return this;
      this.arr.save.push(
        updateVideoMetaData(
          _videoInfo,
          this.cmsData.content_id,
          this.cmsData._id,
          this.cmsData.league_id,
          _videoInfo.fileType
        )
      );

      // string 배열에도 푸쉬(나중에 실패 시 어떤 요청이 실패했는지 알려주기 위해)
      this.arrStr.push('videoMetaDataSave');
      return this;
    },

    filterDelete: function (_isRequestingVideoDelete) {
      if (!_isRequestingVideoDelete) return this;

      this.arr.del = [
        requestDeletePictureOrVideo(
          this.cmsData.content_id,
          this.cmsData._id,
          this.cmsData.league_id
        ),
      ];

      // string 배열에도 푸쉬(나중에 실패 시 어떤 요청이 실패했는지 알려주기 위해)
      this.arrStr.push('videoDelete');
      return this;
    },
  };

  // ///////////////////////////////////////
  // 서버 요청 외 메서드 들
  const parsedValue: ParsedValueType = {
    frame_count_array: [],
    codec: '',
    duration: 0,
    fps: 0,
    frame_count: 0,
    md5: '',
    channel_count_array: [],
    resolution: 1080,
  };

  // 메시지 스플릿 하는 메서드
  // FFMPEG로그 파싱하는 메서드
  const splitMessage = (
    message: string | number,
    splitStrStart: string,
    splitStrEnd: string
  ): string => {
    if (typeof message === 'number') message = message.toString();
    let trimedMsg = message.split(splitStrStart)[1];
    if (!splitStrEnd) return trimedMsg;
    trimedMsg = trimedMsg.split(splitStrEnd)[0];

    return trimedMsg;
  };

  // 로그를 파싱해서 컴포넌트에 보낸다.
  const parseFfmpegLogMessage = (message: string) => {
    // duration
    if (message.includes('Duration: ')) {
      let duration: string | number = splitMessage(message, 'Duration: ', ',');

      const array = duration.split(':');

      duration =
        parseInt(array[0], 10) * 60 * 60 * 1000 +
        parseInt(array[1], 10) * 60 * 1000 +
        parseInt(array[2], 10) * 1000;

      const decimalPoint = array[2].split('.')[1];
      const decimalPointArray = decimalPoint.split('');
      let zeroCount = 0;
      for (let index = 0; index < decimalPointArray.length; index++) {
        if (decimalPointArray[index] === '0') zeroCount++;
      }

      let decimalPointNum = Number(decimalPoint);
      decimalPointNum =
        (decimalPointNum / Math.pow(10, decimalPointArray.length - 1)) * 100;

      duration = duration + decimalPointNum;

      parsedValue['duration'] = duration;
    }

    // md5
    if (message.includes('MD5=')) {
      const md5 = splitMessage(message, 'MD5=', undefined);
      parsedValue['md5'] = md5;
    }

    // fps
    if (message.includes('fps')) {
      const fps = splitMessage(message, 'kb/s, ', ' fps');
      parsedValue['fps'] = Number(fps);
    }

    // resolution
    if (message.includes('720×480') || message.includes('720×576')) {
      parsedValue['resolution'] = 480;
    }
    if (message.includes('1280x720')) {
      parsedValue['resolution'] = 720;
    }
    if (message.includes('1920x1080')) {
      parsedValue['resolution'] = 1080;
    }
    if (message.includes('3840×2160')) {
      parsedValue['resolution'] = 2160;
    }
    if (message.includes('7680×4320')) {
      parsedValue['resolution'] = 4320;
    }
    // codec
    if (message.includes('Video: ')) {
      const codec = splitMessage(message, 'Video: ', ' (');
      if (codec.length < 6)
        parsedValue['codec'] = codec;
    }

    // frame count
    if (message.includes('frame=')) {
      parsedValue['frame_count_array'].push(message);      
    }

    // channel count
    if (message.toLowerCase().includes('stream #')) {
      if (!message.toLowerCase().includes('video')) return;
      parsedValue['channel_count_array'].push(message);
    }
  };

  // frame count
  const returnFrameCount = (parsedValue) => {
    const frame_count_raw = parsedValue.frame_count_array[parsedValue.frame_count_array.length - 1];
    const temp_frame_count = splitMessage(frame_count_raw, 'frame=', 'fps');
    const frame_count = parseInt(temp_frame_count, 10);
    return frame_count;
  };

  // channel count
  const returnChannelCount = (parsedValue) => {
    const channelCountArr = parsedValue['channel_count_array'].map((item) => {
      const result = item
        .toLowerCase()
        ?.split('stream #')[1]
        ?.split(':')[1]
        ?.split('(')[0];
      return Number(result);
    });

    // 채널 카운트 배열의 마지막 인덱스에 제일 큰값이 담기는 것이 보장되지 않으므로
    // e.g) [1,2,3,4,5,6,0]이런식으로 담긴다.
    // 담아둔 배열에서 가장 큰 값을 찾아서 뽑는다.
    // 만일 값이 없다면 1로 한다.
    const channelCount = Math.max(...channelCountArr) ? Math.max(...channelCountArr) : 1;
    return channelCount;
  };

  return {
    videoPromiseList,
    splitMessage,
    parseFfmpegLogMessage,
    parsedValue,
    returnFrameCount,
    returnChannelCount
  };
};
