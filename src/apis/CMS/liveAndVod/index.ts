import { useRestfulCustomAxios } from '@/hooks/axios-hooks-restful';
import { convertTimeToNumber, IsJsonString, returnNe } from '@/utils/commonFn';

export const useCMSLiveAndVodRequest = () => {
  const { isLoading, sendRequest } = useRestfulCustomAxios();

  const submitData = async (
    putType: 'live' | 'vod',
    values,
    content_id,
    _id,
    league_id,
    stream_geo_permission_list,
    download_geo_permission_list,
    playInfo?
  ) => {
    // console.log({ values });

    const data = JSON.stringify({
      status: Number(values.status),
      start_time: convertTimeToNumber(values.start_time),
      end_time: convertTimeToNumber(values.end_time),
      rtsp_url: values.rtsp_url,
      hls_url: values.hls_url,
      info:
        putType === 'vod'
          ? JSON.parse(values.info)
          : {
              sport: Number(playInfo.sport),
              play_type: Number(playInfo.play_type),
              present_round: playInfo.present_round,
              present_quarter: playInfo.present_quarter,
              detail_url: playInfo.detail_url,
              api_url: playInfo.api_url,
              extra_1_str: playInfo.extra_1_str,
              etc: JSON.parse(playInfo?.etc ? playInfo.etc : {}),
              home: {
                name: {
                  'en-US': returnNe(playInfo['home_team_name__en-US']),
                  'ko-KR': returnNe(playInfo['home_team_name__ko-KR']),
                },
                nick_name: {
                  'en-US': returnNe(playInfo['home_team_nickname__en-US']),
                  'ko-KR': returnNe(playInfo['home_team_nickname__ko-KR']),
                },
                icon: returnNe(playInfo.home_team_icon),
                score: playInfo.home_team_score,
              },
              away: {
                name: {
                  'en-US': returnNe(playInfo['away_team_name__en-US']),
                  'ko-KR': returnNe(playInfo['away_team_name__ko-KR']),
                },
                nick_name: {
                  'en-US': returnNe(playInfo['away_team_nickname__en-US']),
                  'ko-KR': returnNe(playInfo['away_team_nickname__ko-KR']),
                },
                icon: returnNe(playInfo.away_team_icon),
                score: playInfo.away_team_score,
              },
            },
      camera_group: Array.isArray(JSON.parse(values.camera_group))
        ? JSON.parse(values.camera_group)
        : [values.camera_group],
      drm_free: values.drm_free,
      can_download: values.can_download,
      stream_geo_permission: stream_geo_permission_list,
      download_geo_permission: download_geo_permission_list,
      bundle: [Number(values.status)],
      exposure_order: values.exposure_order,
      stream_expired_term: values.stream_expired_term,
      download_expired_term: values.download_expired_term,
      total_stream_price: {
        USD: values.total_stream_price__USD,
        KRW: values.total_stream_price__KRW,
        EURO: values.total_stream_price__EURO,
        CNY: values.total_stream_price__CNY,
        JPY: values.total_stream_price__JPY,
        TWD: values.total_stream_price__TWD,
      },
      partial_stream_price: {
        USD: values.partial_stream_price__USD,
        KRW: values.partial_stream_price__KRW,
        EURO: values.partial_stream_price__EURO,
        CNY: values.partial_stream_price__CNY,
        JPY: values.partial_stream_price__JPY,
        TWD: values.partial_stream_price__TWD,
      },
      total_download_price: {
        USD: values.total_download_price__USD,
        KRW: values.total_download_price__KRW,
        EURO: values.total_download_price__EURO,
        CNY: values.total_download_price__CNY,
        JPY: values.total_download_price__JPY,
        TWD: values.total_download_price__TWD,
      },
      partial_download_price: {
        USD: values.partial_download_price__USD,
        KRW: values.partial_download_price__KRW,
        EURO: values.partial_download_price__EURO,
        CNY: values.partial_download_price__CNY,
        JPY: values.partial_download_price__JPY,
        TWD: values.partial_download_price__TWD,
      },
    });

    const responseData = await sendRequest(
      `/content/meta/${putType}/${content_id}/${_id}?league_id=${league_id}`,
      'restful',
      'put',
      undefined,
      data,
      false,
      false
    );

    return responseData;
  };

  // play info 업데이트
  const updatePlayInfo = async (values, type, content_id, _id, league_id) => {
    const data = JSON.stringify({
      sport: Number(values.sport),
      play_type: Number(values.play_type),
      present_round: values.present_round,
      present_quarter: values.present_quarter,
      detail_url: values.detail_url,
      api_url: values.api_url,
      extra_1_str: values.extra_1_str,
      etc: JSON.parse(values?.etc ? values.etc : {}),
      home: {
        name: {
          'en-US': returnNe(values['home_team_name__en-US']),
          'ko-KR': returnNe(values['home_team_name__ko-KR']),
        },
        nick_name: {
          'en-US': returnNe(values['home_team_nickname__en-US']),
          'ko-KR': returnNe(values['home_team_nickname__ko-KR']),
        },
        icon: returnNe(values.home_team_icon),
        score: values.home_team_score,
      },
      away: {
        name: {
          'en-US': returnNe(values['away_team_name__en-US']),
          'ko-KR': returnNe(values['away_team_name__ko-KR']),
        },
        nick_name: {
          'en-US': returnNe(values['away_team_nickname__en-US']),
          'ko-KR': returnNe(values['away_team_nickname__ko-KR']),
        },
        icon: returnNe(values.away_team_icon),
        score: values.away_team_score,
      },
    });
    // console.log("check json parsed");
    // console.log(JSON.parse(data));
    // console.log(values.etc);
    // console.log(JSON.parse(values.etc));
    // console.log(IsJsonString(values.etc));
    // console.log(typeof values.etc);

    const responseData = await sendRequest(
      `/content/meta/board/${type}/${content_id}/${_id}?league_id=${league_id}`,
      'restful',
      'put',
      undefined,
      data,
      false,
      false
    );

    return responseData;
  };

  // 카메라그룹 정보 IMS로부터 받은 정보로 자동갱신 요청하는 메서드
  const requestUpdatedCameraGroupInfo = async (content_id, _id, league_id) => {
    const responseData = await sendRequest(
      `/content/meta/camera_group/${content_id}/${_id}?league_id=${league_id}`,
      'restful',
      'patch',
      undefined,
      undefined,
      false,
      false
    );

    return responseData;
  };

  // 이벤트아이디, rtsp_url IMS로부터 받은 정보로 자동갱신 요청하는 메서드
  const requestUpdatedEventIdAndRtspInfo = async (
    content_id,
    _id,
    league_id
  ) => {
    const responseData = await sendRequest(
      `/content/meta/live_rtsp_url/${content_id}/${_id}?league_id=${league_id}`,
      'restful',
      'patch',
      undefined,
      undefined,
      false,
      false
    );

    return responseData;
  };

  return {
    submitData,
    updatePlayInfo,
    requestUpdatedCameraGroupInfo,
    requestUpdatedEventIdAndRtspInfo,
    isLoading,
  };
};
