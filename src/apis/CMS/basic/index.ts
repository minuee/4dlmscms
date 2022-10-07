import { useRestfulCustomAxios } from '@/hooks/axios-hooks-restful';
import { returnNe } from '@/utils/commonFn';

export const useCMSBasicRequest = () => {
  const { isLoading, sendRequest } = useRestfulCustomAxios();

  const submitCMSBasicInfo = async (
    content_id,
    _id,
    method: 'put' | 'post',
    values
  ) => {
    const data = JSON.stringify({
      name: {
        'en-US': returnNe(values['name__en-US']),
        // 'ko-KR': returnNe(values['name__ko-KR']),
        'ko-KR': values['name__ko-KR']
          ? values['name__ko-KR']
          : values['name__en-US'],
        'zh-CN': returnNe(values['name__zh-CN']),
        'zh-TW': returnNe(values['name__zh-TW']),
        'ja-JP': returnNe(values['name__ja-JP']),
        'fr-FR': returnNe(values['name__fr-FR']),
        'de-DE': returnNe(values['name__de-DE']),
        'es-ES': returnNe(values['name__es-ES']),
      },
      sub_name: {
        'en-US': returnNe(values['sub_name__en-US']),
        // 'ko-KR': returnNe(values['sub_name__ko-KR']),
        'ko-KR': values['sub_name__ko-KR']
          ? values['sub_name__ko-KR']
          : values['sub_name__en-US'],
        'zh-CN': returnNe(values['sub_name__zh-CN']),
        'zh-TW': returnNe(values['sub_name__zh-TW']),
        'ja-JP': returnNe(values['sub_name__ja-JP']),
        'fr-FR': returnNe(values['sub_name__fr-FR']),
        'de-DE': returnNe(values['sub_name__de-DE']),
        'es-ES': returnNe(values['sub_name__es-ES']),
      },
      desc: {
        'en-US': returnNe(values['desc__en-US']),
        // 'ko-KR': returnNe(values['desc__ko-KR']),
        'ko-KR': values['desc__ko-KR']
          ? values['desc__ko-KR']
          : values['desc__en-US'],
        'zh-CN': returnNe(values['desc__zh-CN']),
        'zh-TW': returnNe(values['desc__zh-TW']),
        'ja-JP': returnNe(values['desc__ja-JP']),
        'fr-FR': returnNe(values['desc__fr-FR']),
        'de-DE': returnNe(values['desc__de-DE']),
        'es-ES': returnNe(values['desc__es-ES']),
      },
      package_id: values.package_id ? Number(values.package_id) : '',
      event_id: Number(values.event_id),
      ims_event_id: returnNe(values.ims_event_id),
      ims_system_id: returnNe(values.ims_system_id),
      genre_id: Number(values.genre_id),
      category_id: Number(values.category_id),
      league_id: Number(values.league_id),
      season_id: Number(values.season_id),
      round_id: Number(values.round_id),
      video_type_id: Number(values.video_type_id),
      service_status: Number(values.service_status),
      have_parent: values.have_parent,
      parent_id: values.parent_id,
      is_live: values.is_live,
      is_category: values.is_category,
      place: values.place,
      exposure_order: values.exposure_order,
    });

    const responseData = await sendRequest(
      method === 'put'
        ? `/content/meta/basic/${content_id}/${_id}`
        : `/content`,
      'restful',
      method,
      undefined,
      data,
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

  // content id를 IMS가 업데이트 하는 메서드
  const requestUpdateContentIdByIms = async (content_id, _id, league_id) => {
    const responseData = await sendRequest(
      `/content/meta/cms_id_to_ims/${content_id}/${_id}?league_id=${league_id}`,
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
    submitCMSBasicInfo,
    requestUpdatedEventIdAndRtspInfo,
    requestUpdateContentIdByIms,
    isLoading,
  };
};
