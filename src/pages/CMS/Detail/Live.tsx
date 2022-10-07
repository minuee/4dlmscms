import React, {
  useState,
  useRef,
  useEffect,
  useReducer,
  useContext,
  lazy,
} from 'react';
import { useLocation } from 'react-router-dom';

import { iso31661 } from 'iso-3166';
import { useFormik } from 'formik';
import { useTranslation } from 'react-i18next';

import {
  showNotification,
  IsJsonString,
  excludeNe,
  getLocalDate,
  getLocalDateFromDate,
} from '@/utils/commonFn';

import { useCMSLiveAndVodRequest } from '@/apis/CMS/liveAndVod';

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
import { useCMS } from '@/hooks/cms-hooks';
import { usePlayInfoHooks } from '@/hooks/CMS/usePlayInfo-hooks';
import { useAccordion } from '@/hooks/accordion-hooks';

import { LIVE_STATUS_DATA } from '@/settings/cmsOptionsData';

import Input, { Textarea } from 'comp/Input/InputText';
import Select, { Option } from 'comp/Input/Select';
import { IS_CHILD } from '@/settings/constants';
import { ButtonInputAdd } from 'comp/Button/Button';
const Toggle = lazy(() => import('comp/Input/ToggleSlider'));
const Button = lazy(() => import('comp/Button/Button'));
const Backdrop = lazy(() => import('comp/Backdrop/Backdrop'));
const SearchModal = lazy(() => import('comp/Modal/SearchModal'));
const MultiSelect = lazy(
  () => import('@/containers/Dropdown/dropdownMultiSelect')
);
const InfoInputs = lazy(() => import('comp/Modal/CmsInfoModal'));
const ReactTooltip = lazy(() => import('react-tooltip'));
const Modal = lazy(() => import('@/components/Modal/Modal'));

interface IF {
  cmsData: TotalItemType;
}

type ShowInputs = {
  permission: boolean;
  expiration: boolean;
  price: boolean;
};

const Live: React.FC<IF> = (props: IF) => {
  const { cmsData } = props;
  const { t } = useTranslation();

  const location = useLocation();
  const pathName = location.pathname;
  const isChildContent = pathName.includes(IS_CHILD) ? true : false;

  const dispatch = useAppDispatch();
  const {
    submitData,
    requestUpdatedCameraGroupInfo,
    requestUpdatedEventIdAndRtspInfo,
    isLoading,
  } = useCMSLiveAndVodRequest();

  const {
    isShowAccordion,
    handleToggleAccordionView,
    setisShowAccordion,
    returnUpDownIcon,
  } = useAccordion();

  // 플레이인포 관련 커스텀 훅
  const {
    playInfoData,
    handleResetPlayInfoValues,
    handleSetPlayInfoValues,
    handleUpdatePlayInfoValues,
  } = usePlayInfoHooks();

  const { updateStep, isUpdate } = useContext(CMSContext);
  const { validateFormData } = useValidation();
  const wrapperRef = useRef<HTMLElement | null>(null);

  // 모달 open 상태 관련 값들
  const [isModalOpen, setIsModalOpen] = useState({
    geoStream: false,
    geoDownload: false,
    info: false,
    cameraGroup: false,
  });

  const [geoPermissionList, setGeoPermissionList] = useState({
    stream: [],
    download: [],
  });

  // 비 필수 항목 숨김, 보임 처리 관련 state
  const [isShow, setIsShow] = useState<ShowInputs>({
    permission: false,
    expiration: false,
    price: false,
  });

  // !
  // IMS로부터 카메라그룹 정보 갱신하는 메서드
  const updateCameraInfoByIms = async () => {
    if (
      !excludeNe(cmsData?.ims_event_id) ||
      !excludeNe(cmsData?.ims_system_id)
    ) {
      // ims_system_id, ims_event_id가 없으면 요청 못하게 한다.
      // '저장' 먼저 하라고 알려주기
      showNotification(t('cms:needImsEventIdAndImsSystemId'), 'info');
      return;
    }

    // 서버 요청
    const result = await requestUpdatedCameraGroupInfo(
      cmsData.content_id,
      cmsData._id,
      cmsData.league_id
    );

    // 성공 시에만 업데이트
    if (!result) return;

    // 값 세팅
    formik.setFieldValue('camera_group', JSON.stringify(result), false);
    //! 리덕스 업데이트

    const data = {
      ...cmsData,
      // ims_event_id: result.ims_event_id,
      live: {
        ...cmsData.live,
        camera_group: result,
      },
    };

    // updated redux
    // new redux 로직 update
    // current 정보 업데이트
    dispatch(isChildContent ? setChildCurrent(data) : setParentCurrent(data));

    // list내의 정보 업데이트
    dispatch(
      isChildContent ? updateChildContent(data) : updateParentContent(data)
    );
  };

  // IMS로부터 rtsp(, event_ims_id) 정보 갱신하는 메서드
  const upDateRtspUrlByIms = async () => {
    if (
      !excludeNe(cmsData?.ims_event_id) ||
      !excludeNe(cmsData?.ims_system_id)
    ) {
      // ims_system_id, ims_event_id가 없으면 요청 못하게 한다.
      // '저장' 먼저 하라고 알려주기
      showNotification(t('cms:needImsEventIdAndImsSystemId'), 'info');
      return;
    }

    const result = await requestUpdatedEventIdAndRtspInfo(
      cmsData.content_id,
      cmsData._id,
      cmsData.league_id
    );
    if (!result) return;
    // console.log({ result });

    formik.setFieldValue('rtsp_url', result.live_rtsp_url, false);
    // ! 이벤트 아이디도 업데이트해줘야 함!!@ => 리덕스 업데이트 하면 됨!

    // updated redux
    // new redux 로직 update
    // current 정보 업데이트
    dispatch(
      isChildContent
        ? setChildCurrent({
            ...cmsData,
            ims_event_id: result.ims_event_id,
            live: {
              ...cmsData.live,
              rtsp_url: result.live_rtsp_url,
            },
          })
        : setParentCurrent({
            ...cmsData,
            ims_event_id: result.ims_event_id,
            live: {
              ...cmsData.live,
              rtsp_url: result.live_rtsp_url,
            },
          })
    );

    // list내의 정보 업데이트
    dispatch(
      isChildContent
        ? updateChildContent({
            ...cmsData,
            ims_event_id: result.ims_event_id,
            live: {
              ...cmsData.live,
              rtsp_url: result.live_rtsp_url,
            },
          })
        : updateParentContent({
            ...cmsData,
            ims_event_id: result.ims_event_id,
            live: {
              ...cmsData.live,
              rtsp_url: result.live_rtsp_url,
            },
          })
    );
  };

  const handleChangeInputShow = (name: keyof ShowInputs, value: boolean) =>
    setIsShow((prev) => ({ ...prev, [name]: value }));

  useEffect(() => {
    !isUpdate && wrapperRef.current?.scrollIntoView({ behavior: 'smooth' });
    ////// !isUpdate && wrapperRef?.current && scrollYIntoView(wrapperRef);
    // console.log(playInfoDataRef.current);

    // 업데이트의 경우 parent_id가 있을 경우 접어둔다
    if (cmsData?.have_parent) setisShowAccordion(false);
  }, []);

  useEffect(() => {
    if (!cmsData.live) return;
    formik.setFieldValue('status', cmsData.live.status.toString(), false);
    formik.setFieldValue('exposure_order', cmsData.live.exposure_order, false);
    formik.setFieldValue('rtsp_url', excludeNe(cmsData.live.rtsp_url), false);
    formik.setFieldValue(
      'hls_url',
      excludeNe(cmsData.live.hls_url)
        ? cmsData.live.hls_url
        : 'http://www.4dreplay.com/hls',
      false
    );
    formik.setFieldValue('drm_free', cmsData.live.drm_free, false);
    formik.setFieldValue('can_download', cmsData.live.can_download, false);
    formik.setFieldValue(
      'bundle',
      (cmsData.live.bundle as string[]).join(', '),
      false
    );
    formik.setFieldValue(
      'camera_group',
      JSON.stringify(cmsData.live.camera_group),
      false
    );

    formik.setFieldValue(
      'stream_expired_term',
      cmsData.live.stream_expired_term,
      false
    );
    formik.setFieldValue(
      'download_expired_term',
      cmsData.live.download_expired_term,
      false
    );

    // price
    for (const currency in cmsData.live.total_stream_price) {
      formik.setFieldValue(
        `total_stream_price__${currency}`,
        cmsData.live.total_stream_price[currency],
        false
      );
    }
    for (const currency in cmsData.live.partial_stream_price) {
      formik.setFieldValue(
        `partial_stream_price__${currency}`,
        cmsData.live.total_stream_price[currency],
        false
      );
    }
    for (const currency in cmsData.live.total_download_price) {
      formik.setFieldValue(
        `total_download_price__${currency}`,
        cmsData.live.total_stream_price[currency],
        false
      );
    }
    for (const currency in cmsData.live.partial_download_price) {
      formik.setFieldValue(
        `partial_download_price__${currency}`,
        cmsData.live.total_stream_price[currency],
        false
      );
    }

    // permissions
    const countryListArrayStream = [...iso31661].map((c) => {
      return { ...c, isSelected: false, key: c.name };
    });

    const countryListArrayDownload = [...iso31661].map((c) => {
      return { ...c, isSelected: false, key: c.name };
    });

    const streamPermissionStateArray = [...countryListArrayStream].map(
      (country) => {
        if (cmsData.live.stream_geo_permission.includes(country.alpha3))
          country.isSelected = true;
        return country;
      }
    );

    const downloadPermissionStateArray = [...countryListArrayDownload].map(
      (country) => {
        if (cmsData.live.download_geo_permission.includes(country.alpha3))
          country.isSelected = true;
        return country;
      }
    );

    setGeoPermissionList({
      stream: streamPermissionStateArray,
      download: downloadPermissionStateArray,
    });

    // info는 수정일 경우에만 서버에서 저장한 값 세팅
    if (!cmsData || !isUpdate) return;

    formik.setFieldValue(
      'start_time',
      getLocalDate(cmsData.live.start_time),
      false
    );
    formik.setFieldValue(
      'end_time',
      getLocalDate(cmsData.live.end_time),
      false
    );

    formik.setFieldValue('info', JSON.stringify(cmsData.live.info[0]), false);

    if (cmsData.live.info) {
      const test = handleUpdatePlayInfoValues(cmsData?.live?.info, 'saved');
    }
  }, []);

  // permission 나라 선택을 바꿀 때 시행되는 메서드
  const onChange = (id: 'stream' | 'download', selectedItems) => {
    setGeoPermissionList((prev) => ({
      ...prev,
      [id]: selectedItems,
    }));
  };

  const getSelectedCountries = (selectedItems) => {
    const updatedList = selectedItems.filter(
      (country) => country.isSelected === true
    );
    return updatedList;
  };

  // info modal에서 값을 받아오는 메서드
  const getInfoValueFromModal = (values) => {
    handleSetPlayInfoValues(values);

    setIsModalOpen((prev) => ({ ...prev, info: false }));
  };

  /* formik */
  const submitFormData = async (values) => {
    const totalErr = await validateFormData(
      [
        'stream_geo_permission',
        'download_geo_permission',
        'drm_free',
        'can_download',
        'start_time',
        'end_time',
        'camera_group',
        'bundle',
        'stream_expired_term',
        'download_expired_term',
        'total_stream_price__USD',
        'total_stream_price__KRW',
        'total_stream_price__EURO',
        'total_stream_price__CNY',
        'total_stream_price__JPY',
        'total_stream_price__TWD',

        'partial_stream_price__USD',
        'partial_stream_price__KRW',
        'partial_stream_price__EURO',
        'partial_stream_price__CNY',
        'partial_stream_price__JPY',
        'partial_stream_price__TWD',

        'total_download_price__USD',
        'total_download_price__KRW',
        'total_download_price__EURO',
        'total_download_price__CNY',
        'total_download_price__JPY',
        'total_download_price__TWD',

        'partial_download_price__USD',
        'partial_download_price__KRW',
        'partial_download_price__EURO',
        'partial_download_price__CNY',
        'partial_download_price__JPY',
        'partial_download_price__TWD',

        'exposure_order',
      ],
      'createCMSLiveInfo',
      values,
      'cms'
    );

    // json parse가 안 되는 camera_group 값을 넣었다면 리턴
    if (
      IsJsonString(values.camera_group) === false ||
      Array.isArray(JSON.parse(values.camera_group)) === false
    ) {
      formik.setFieldError('camera_group', 'cameraGroupNotArrayString');
      showNotification(t('cms:cameraGroupNotArrayString'), 'error');
      return;
    }

    formik.setErrors(totalErr);
    // 에러가 있으면 저장요청을 하지 못하게 리턴한다.
    if (Object.keys(totalErr).length !== 0) {
      return;
    }

    const stream_geo_permission = getSelectedCountries(
      geoPermissionList.stream
    ).map((item) => item.alpha3);
    const download_geo_permission = getSelectedCountries(
      geoPermissionList.download
    ).map((item) => item.alpha3);

    // 서버 저장 요청
    const result = await submitData(
      'live',
      { ...values, camera_group: values.camera_group },
      cmsData.content_id,
      cmsData._id,
      cmsData.league_id,
      stream_geo_permission,
      download_geo_permission,
      // infoRef.current //0916
      // playInfoDataRef.current
      playInfoData
    );

    // 서버 요청 성공 시에만 리덕스 업데이트
    if (!result) return;
    // updateCMSReduxData(result, isUpdate, 3, !result.have_parent);

    // new redux 로직 update
    // current 정보 업데이트
    dispatch(
      isChildContent ? setChildCurrent(result) : setParentCurrent(result)
    );

    // list내의 정보 업데이트
    dispatch(
      isChildContent ? updateChildContent(result) : updateParentContent(result)
    );

    // context update
    !isUpdate && updateStep(3);
  };

  const formik = useFormik({
    initialValues: {
      status: '',
      // start_time: new Date().toISOString().substring(0, 16),
      start_time: getLocalDateFromDate(new Date()).substring(0, 16),
      end_time: getLocalDateFromDate(new Date()).substring(0, 16),
      rtsp_url: '',
      hls_url: 'http://www.4dreplay.com/hls ',
      camera_group: '',
      // info: '',
      drm_free: false,
      can_download: false,
      stream_geo_permission: [],
      download_geo_permission: [],
      bundle: 0,
      // bundle: [5, 12],
      stream_expired_term: '',
      download_expired_term: '',

      total_stream_price__USD: 0,
      total_stream_price__KRW: 0,
      total_stream_price__EURO: 0,
      total_stream_price__CNY: 0,
      total_stream_price__JPY: 0,
      total_stream_price__TWD: 0,

      partial_stream_price__USD: 0,
      partial_stream_price__KRW: 0,
      partial_stream_price__EURO: 0,
      partial_stream_price__CNY: 0,
      partial_stream_price__JPY: 0,
      partial_stream_price__TWD: 0,

      total_download_price__USD: 0,
      total_download_price__KRW: 0,
      total_download_price__EURO: 0,
      total_download_price__CNY: 0,
      total_download_price__JPY: 0,
      total_download_price__TWD: 0,

      partial_download_price__USD: 0,
      partial_download_price__KRW: 0,
      partial_download_price__EURO: 0,
      partial_download_price__CNY: 0,
      partial_download_price__JPY: 0,
      partial_download_price__TWD: 0,

      exposure_order: 0,
    },
    validate: null,
    onSubmit: submitFormData,
    validateOnChange: false,
    validateOnBlur: false,
  });

  const resetError = (e) => {
    const name = e.target.name;
    formik.setErrors({ ...formik.errors, [name]: '' });
  };

  // ! rtsp_url가 라이브의 ims_event_id가 바뀌면 업데이트 되어야 한다.
  useEffect(() => {
    // console.log('redux changed');

    formik.setFieldValue('rtsp_url', cmsData?.live?.rtsp_url, false);
  }, [cmsData?.ims_event_id, cmsData?.live?.rtsp_url]);

  /////////////////////////////////////////////
  return (
    <>
      {/* Country select modals starts */}
      <>
        {/* permissions stream */}
        <Backdrop
          isShow={isModalOpen.geoStream}
          onClick={() =>
            setIsModalOpen((prev) => ({ ...prev, geoStream: false }))
          }
        />
        <SearchModal
          key={isModalOpen.geoStream.toString()}
          isShow={isModalOpen.geoStream}
          title={t('cms:liveStreamGeoPermission')}
          buttonOkText={t('cms:done')}
          onClose={() =>
            setIsModalOpen((prev) => ({ ...prev, geoStream: false }))
          }
        >
          <MultiSelect
            searchOptions={[
              { name: 'name', value: 'name' },
              // { name: 'code', value: 'alpha3' },
            ]}
            list={geoPermissionList.stream}
            onSelect={(item) => onChange('stream', item)}
            onClose={() =>
              setIsModalOpen((prev) => ({ ...prev, geoStream: false }))
            }
          />
        </SearchModal>
      </>
      <>
        {/* permission download */}
        <Backdrop
          isShow={isModalOpen.geoDownload}
          onClick={() =>
            setIsModalOpen((prev) => ({ ...prev, geoDownload: false }))
          }
        />
        <SearchModal
          key={isModalOpen.geoDownload.toString()}
          isShow={isModalOpen.geoDownload}
          title={t('cms:liveDownloadGeoPermission')}
          buttonOkText={t('cms:done')}
          onClose={() =>
            setIsModalOpen((prev) => ({ ...prev, geoDownload: false }))
          }
        >
          <MultiSelect
            searchOptions={[
              { name: 'name', value: 'name' },
              // { name: 'code', value: 'alpha3' },
            ]}
            list={geoPermissionList.download}
            onSelect={(item) => onChange('download', item)}
            onClose={() =>
              setIsModalOpen((prev) => ({
                ...prev,
                geoDownload: false,
              }))
            }
          />
        </SearchModal>
      </>
      {/* country select modals end */}
      {/* info modal */}
      <>
        <Backdrop
          onClick={() =>
            setIsModalOpen((prev) => ({
              ...prev,
              info: false,
            }))
          }
          isShow={isModalOpen.info}
        />
        <InfoInputs
          isShow={isModalOpen.info}
          type='live'
          content_id={cmsData.content_id.toString()}
          _id={cmsData._id}
          league_id={cmsData.league_id.toString()}
          data={playInfoData} //0916
          onClose={() =>
            setIsModalOpen((prev) => ({
              ...prev,
              info: false,
            }))
          }
          onCloseAndGetValue={(values) => getInfoValueFromModal(values)}
        />
      </>

      {/* camera group modal */}
      <>
        <Backdrop
          isShow={isModalOpen.cameraGroup}
          onClick={() =>
            setIsModalOpen((prev) => ({ ...prev, cameraGroup: false }))
          }
        />
        <Modal
          isShow={isModalOpen.cameraGroup}
          title={t('cms:saveCameraGroupInfo')}
          content={<span>{t('doubleCheckNeeded')}</span>}
          type='warning'
          closeBtn
          onClose={() =>
            setIsModalOpen((prev) => ({ ...prev, cameraGroup: false }))
          }
        >
          <Button
            color='btn-danger'
            onClick={() => {
              setIsModalOpen((prev) => ({ ...prev, cameraGroup: false }));
            }}
          >
            {t('cms:close')}
          </Button>
        </Modal>
      </>
      {/* country select modals end */}
      <article className='mt-12' ref={wrapperRef}>
        <form className='cms__form' onSubmit={formik.handleSubmit}>
          {/* Accordion header */}
          <div className='flex justify-between'>
            <div className='flex flex-col'>
              <h1 className='text-xl font-extrabold'>{t('cms:liveInfo')}</h1>
              <h3>{t('cms:asteriskIsRequired')}</h3>
            </div>
            <button type='button' onClick={handleToggleAccordionView}>
              {returnUpDownIcon(isShowAccordion)}
            </button>
          </div>

          {/* Accordion body(main) */}
          <div className={isShowAccordion ? '' : 'hidden'}>
            {/* play info */}
            <div className='mt-4'>
              <label className='capitalize mt-3'>{t('cms:playInfo')}</label>
              <div className='flex flex-col md:flex-row'>
                <div className='flex-1 md:mr-1'>
                  <Input
                    id='start_time'
                    name='start_time'
                    type='datetime-local'
                    placeholder=''
                    onClick={(e) => resetError(e)}
                    onChange={formik.handleChange}
                    errMsg={formik.errors.start_time}
                    label={t('cms:startTime')}
                    autoComplete='on'
                    transformDirection='intro-y'
                    design='inputGroupHeader'
                    value={formik.values.start_time || ''}
                  />
                </div>
                <div className='flex-1 md:mr-1'>
                  <Input
                    id='end_time'
                    name='end_time'
                    type='datetime-local'
                    placeholder=''
                    onClick={(e) => resetError(e)}
                    onChange={formik.handleChange}
                    errMsg={formik.errors.end_time}
                    label={t('cms:endTime')}
                    autoComplete='on'
                    transformDirection='intro-y'
                    design='inputGroupHeader'
                    value={formik.values.end_time || ''}
                  />
                </div>
              </div>
              <div className='flex flex-col mt-2 md:flex-row'>
                <div
                  className='flex-1 md:mr-1 pt-3 pb-4'
                  data-tip={t('cms:cameraGroupNotArrayString')}
                >
                  <Textarea
                    id='camera_group'
                    name='camera_group'
                    rows={11}
                    placeholder=''
                    onClick={(e) => resetError(e)}
                    onChange={formik.handleChange}
                    errMsg={formik.errors.camera_group}
                    label={t('cms:cameraGroup')}
                    value={formik.values.camera_group || ''}
                    onBlur={() =>
                      setIsModalOpen((prev) => ({ ...prev, cameraGroup: true }))
                    }
                  />
                  <ReactTooltip />
                  <div className='mt-3 flex justify-center'>
                    <Button color='btn-primary' onClick={updateCameraInfoByIms}>
                      {t('cms:updatedByIms')}
                    </Button>
                  </div>
                </div>

                <div className='flex-1 md:mr-1 pt-3'>
                  {/* <label className='capitalize mb-1'>play info</label> */}
                  <div className='flex-1 flex-col md:mr-1'>
                    <Textarea
                      name='test'
                      rows={11}
                      placeholder=''
                      onClick={() => null}
                      onChange={() => null}
                      noMarginTop
                      // value={JSON.stringify(infoRef.current)}
                      // value={JSON.stringify(playInfoDataRef.current)} //0916
                      value={JSON.stringify({
                        ...playInfoData,
                        // ...playInfoDataRef.current,
                        etc: JSON.parse(
                          playInfoData.etc ? playInfoData.etc : '{}'
                        ),
                        // playInfoDataRef.current.etc
                        //   ? playInfoDataRef.current.etc
                        //   : "{}"
                      })} //0916
                      label={t('cms:playInfo')}
                      // readonly
                    />
                    <div className='mt-3 flex justify-center'>
                      <Button
                        color='btn-primary'
                        onClick={() =>
                          setIsModalOpen((prev) => ({ ...prev, info: true }))
                        }
                      >
                        {t('cms:changeInfo')}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* URLS */}
            <div className='mt-4'>
              <label className='capitalize mt-3'>{t('cms:urls')}</label>
              <div className='flex flex-col '>
                {/* <label className='capitalize mt-3 mb-4'>URLS</label> */}
                <label className='capitalize mt-3'>
                  {t('cms:rtspUrlWithAsterisk')}
                </label>

                <div className='flex items-center justify-evenly'>
                  <div className='flex-1'>
                    <Input
                      id='rtsp_url'
                      name='rtsp_url'
                      type='text'
                      placeholder=''
                      onClick={(e) => resetError(e)}
                      onChange={formik.handleChange}
                      errMsg={formik.errors.rtsp_url}
                      // label='*RTSP URL'
                      value={formik.values.rtsp_url || ''}
                      noMarginTop
                      noLabelMargin
                    />
                  </div>

                  <div className='mt-4 ml-5'>
                    <Button color='btn-primary' onClick={upDateRtspUrlByIms}>
                      {t('cms:updatedByIms')}
                    </Button>
                  </div>
                </div>

                <Input
                  id='hls_url'
                  name='hls_url'
                  type='text'
                  placeholder=''
                  onClick={(e) => resetError(e)}
                  onChange={formik.handleChange}
                  errMsg={formik.errors.hls_url}
                  label={t('cms:hlsUrlWithAsterisk')}
                  value={formik.values.hls_url || ''}
                />
              </div>
            </div>

            <Toggle
              name='drm_free'
              id='drm_free'
              onChange={formik.handleChange}
              label={t('cms:freeLiveDrm')}
              checked={formik.values.drm_free || false}
              tabIndex={0}
            />
            <Toggle
              name='can_download'
              id='can_download'
              onChange={formik.handleChange}
              label={t('cms:downloadAvailable')}
              checked={formik.values.can_download || false}
              tabIndex={0}
            />

            {/*status, bundle */}
            <div className='mt-4'>
              <div className='flex-1 md:mr-1'>
                <Select
                  name='status'
                  id='status'
                  onChange={formik.handleChange}
                  onClick={(e) => resetError(e)}
                  errMsg={formik.errors.status}
                  value={formik.values.status || ''}
                  label={t('cms:liveStatus')}
                  labelColor='red'
                >
                  <option value='' disabled hidden>
                    {t('cms:selectLiveStatus')}
                  </option>
                  {LIVE_STATUS_DATA.map((data) => {
                    return (
                      <Option
                        key={data.value}
                        value={data.value}
                        label={data.label}
                      />
                    );
                  })}
                </Select>
              </div>

              <div className='flex flex-col mt-2 md:flex-row'>
                <div className='flex-1 md:mr-1'>
                  <Input
                    name='exposure_order'
                    type='number'
                    min={1}
                    step={1}
                    placeholder={t('cms:exposureOrder')}
                    onClick={(e) => resetError(e)}
                    onChange={formik.handleChange}
                    errMsg={formik.errors.exposure_order}
                    label={t('cms:exposureOrder')}
                    autoComplete='on'
                    transformDirection='intro-y'
                    design='inputGroupHeader'
                    value={formik.values.exposure_order || ''}
                  />
                </div>
                <div className='flex-1 md:mr-1'>
                  <Input
                    id='bundle'
                    name='bundle'
                    type='number'
                    placeholder={t('cms:bundle')}
                    onClick={(e) => resetError(e)}
                    onChange={formik.handleChange}
                    errMsg={formik.errors.bundle}
                    label={t('cms:bundle')}
                    autoComplete='on'
                    transformDirection='intro-y'
                    design='inputGroupHeader'
                    value={formik.values.bundle || ''}
                  />
                </div>
              </div>
            </div>

            {/* permissions */}
            <div className='mt-4'>
              {/* 추가버튼 */}
              <div className='flex items-center'>
                <label className='capitalize mt-3'>{t('cms:permission')}</label>
                <ButtonInputAdd
                  isHide={isShow.permission}
                  text='cms:addPermisson?'
                  onClick={() => handleChangeInputShow('permission', true)}
                />
              </div>
              <div
                className={
                  isShow.permission ? 'flex flex-col md:flex-row' : 'hidden'
                }
              >
                <div className='flex-1 md:mr-1'>
                  <Input
                    id='stream_geo_permission'
                    name='stream_geo_permission'
                    type='text'
                    placeholder=''
                    onClick={(e) => {
                      setIsModalOpen((prev) => ({ ...prev, geoStream: true }));
                      resetError(e);
                    }}
                    onChange={formik.handleChange}
                    errMsg={formik.errors.stream_geo_permission}
                    label={t('cms:liveStreamWithAsterisk')}
                    autoComplete='off'
                    transformDirection='intro-y'
                    design='inputGroupHeader'
                    value={
                      getSelectedCountries(geoPermissionList.stream)
                        ?.map((item) => item.name)
                        ?.join(', ') || ''
                    }
                  />
                </div>
                <div className='flex-1 md:mr-1'>
                  <Input
                    id='download_geo_permission'
                    name='download_geo_permission'
                    type='text'
                    placeholder=''
                    onClick={(e) => {
                      setIsModalOpen((prev) => ({
                        ...prev,
                        geoDownload: true,
                      }));
                      resetError(e);
                    }}
                    onChange={formik.handleChange}
                    errMsg={formik.errors.download_geo_permission}
                    label={t('cms:liveDownloadWithAsterisk')}
                    autoComplete='off'
                    transformDirection='intro-y'
                    design='inputGroupHeader'
                    value={
                      getSelectedCountries(geoPermissionList.download)
                        ?.map((item) => item.name)
                        ?.join(', ') || ''
                    }
                  />
                </div>
              </div>
            </div>

            {/* expire term */}
            <div className='mt-4'>
              {/* 추가버튼 */}
              <div className='flex items-center'>
                <label className='capitalize mt-3'>
                  {t('cms:expirationTerm')}
                </label>

                <ButtonInputAdd
                  isHide={isShow.expiration}
                  text='cms:addExpiration?'
                  onClick={() => handleChangeInputShow('expiration', true)}
                />
              </div>
              <div
                className={
                  isShow.expiration ? 'flex flex-col  md:flex-row' : 'hidden'
                }
              >
                <div className='flex-1 md:mr-1'>
                  <Input
                    id='stream_expired_term'
                    name='stream_expired_term'
                    type='number'
                    // type='datetime-local'
                    placeholder={t('cms:unitHour')}
                    onClick={(e) => resetError(e)}
                    onChange={formik.handleChange}
                    errMsg={formik.errors.stream_expired_term}
                    label={t('cms:streamExpiredTerm')}
                    autoComplete='on'
                    transformDirection='intro-y'
                    design='inputGroupHeader'
                    value={formik.values.stream_expired_term || ''}
                  />
                </div>
                <div className='flex-1 md:mr-1'>
                  <Input
                    id='download_expired_term'
                    name='download_expired_term'
                    type='number'
                    // type='datetime-local'
                    placeholder={t('cms:unitHour')}
                    onClick={(e) => resetError(e)}
                    onChange={formik.handleChange}
                    errMsg={formik.errors.download_expired_term}
                    label={t('cms:downloadExpiredTerm')}
                    autoComplete='on'
                    transformDirection='intro-y'
                    design='inputGroupHeader'
                    value={formik.values.download_expired_term || ''}
                  />
                </div>
              </div>
            </div>

            {/* price*/}
            <div className='flex items-center mt-4'>
              <label className={isShow.price ? 'hidden' : 'capitalize mt-3'}>
                {t('cms:priceInfo')}
              </label>
              <ButtonInputAdd
                isHide={isShow.price}
                text='cms:addPrice?'
                onClick={() => handleChangeInputShow('price', true)}
              />
            </div>

            <div className={isShow.price ? 'mt-4' : 'hidden'}>
              {/* 1. total stream price */}
              <div>
                <label className='capitalize mt-3'>
                  {t('cms:totalStreamPrice')}
                </label>
                <div className='flex flex-col mt-2 md:flex-row'>
                  <div className='flex-1 md:mr-1'>
                    <Input
                      id='total_stream_price__USD'
                      name='total_stream_price__USD'
                      type='number'
                      min={0}
                      step='any'
                      placeholder={`${t('cms:totalStreamPrice')}${t(
                        'cms:usd'
                      )}`}
                      onClick={(e) => resetError(e)}
                      onChange={formik.handleChange}
                      errMsg={formik.errors.total_stream_price__USD}
                      label={`${t('cms:totalStreamPrice')}${t('cms:usd')}`}
                      autoComplete='on'
                      transformDirection='intro-y'
                      design='inputGroupHeader'
                      value={formik.values.total_stream_price__USD || ''}
                    />
                  </div>
                  <div className='flex-1 md:mr-1'>
                    <Input
                      id='total_stream_price__KRW'
                      name='total_stream_price__KRW'
                      type='number'
                      min={0}
                      step='any'
                      placeholder={`${t('cms:totalStreamPrice')}${t(
                        'cms:krw'
                      )}`}
                      onClick={(e) => resetError(e)}
                      onChange={formik.handleChange}
                      errMsg={formik.errors.total_stream_price__KRW}
                      label={`${t('cms:totalStreamPrice')}${t('cms:krw')}`}
                      autoComplete='on'
                      transformDirection='intro-y'
                      design='inputGroupHeader'
                      value={formik.values.total_stream_price__KRW || ''}
                    />
                  </div>
                </div>
                {/*  */}
                <div className='flex flex-col mt-2 md:flex-row'>
                  <div className='flex-1 md:mr-1'>
                    <Input
                      id='total_stream_price__EURO'
                      name='total_stream_price__EURO'
                      type='number'
                      min={0}
                      step='any'
                      placeholder={`${t('cms:totalStreamPrice')}${t(
                        'cms:euro'
                      )}`}
                      onClick={(e) => resetError(e)}
                      onChange={formik.handleChange}
                      errMsg={formik.errors.total_stream_price__EURO}
                      label={`${t('cms:totalStreamPrice')}${t('cms:euro')}`}
                      autoComplete='on'
                      transformDirection='intro-y'
                      design='inputGroupHeader'
                      value={formik.values.total_stream_price__EURO || ''}
                    />
                  </div>
                  <div className='flex-1 md:mr-1'>
                    <Input
                      id='total_stream_price__CNY'
                      name='total_stream_price__CNY'
                      type='number'
                      min={0}
                      step='any'
                      placeholder={`${t('cms:totalStreamPrice')}${t(
                        'cms:cny'
                      )}`}
                      onClick={(e) => resetError(e)}
                      onChange={formik.handleChange}
                      errMsg={formik.errors.total_stream_price__CNY}
                      label={`${t('cms:totalStreamPrice')}${t('cms:cny')}`}
                      autoComplete='on'
                      transformDirection='intro-y'
                      design='inputGroupHeader'
                      value={formik.values.total_stream_price__CNY || ''}
                    />
                  </div>
                </div>
                <div className='flex flex-col mt-2 md:flex-row'>
                  <div className='flex-1 md:mr-1'>
                    <Input
                      id='total_stream_price__JPY'
                      name='total_stream_price__JPY'
                      type='number'
                      min={0}
                      step='any'
                      placeholder={`${t('cms:totalStreamPrice')}${t(
                        'cms:jpy'
                      )}`}
                      onClick={(e) => resetError(e)}
                      onChange={formik.handleChange}
                      errMsg={formik.errors.total_stream_price__JPY}
                      label={`${t('cms:totalStreamPrice')}${t('cms:jpy')}`}
                      autoComplete='on'
                      transformDirection='intro-y'
                      design='inputGroupHeader'
                      value={formik.values.total_stream_price__JPY || ''}
                    />
                  </div>
                  <div className='flex-1 md:mr-1'>
                    <Input
                      id='total_stream_price__TWD'
                      name='total_stream_price__TWD'
                      type='number'
                      min={0}
                      step='any'
                      placeholder={`${t('cms:totalStreamPrice')}${t(
                        'cms:twd'
                      )}`}
                      onClick={(e) => resetError(e)}
                      onChange={formik.handleChange}
                      errMsg={formik.errors.total_stream_price__TWD}
                      label={`${t('cms:totalStreamPrice')}${t('cms:twd')}`}
                      autoComplete='on'
                      transformDirection='intro-y'
                      design='inputGroupHeader'
                      value={formik.values.total_stream_price__TWD || ''}
                    />
                  </div>
                </div>
              </div>

              {/* 2. partial stream price */}
              <div className='mt-4'>
                <label className='capitalize mt-3'>
                  {' '}
                  {t('cms:partialStreamPrice')}
                </label>
                <div className='flex flex-col mt-2 md:flex-row'>
                  <div className='flex-1 md:mr-1'>
                    <Input
                      id='partial_stream_price__USD'
                      name='partial_stream_price__USD'
                      type='number'
                      min={0}
                      step='any'
                      placeholder={`${t('cms:partialStreamPrice')}${t(
                        'cms:usd'
                      )}`}
                      onClick={(e) => resetError(e)}
                      onChange={formik.handleChange}
                      errMsg={formik.errors.partial_stream_price__USD}
                      label={`${t('cms:partialStreamPrice')}${t('cms:usd')}`}
                      autoComplete='on'
                      transformDirection='intro-y'
                      design='inputGroupHeader'
                      value={formik.values.partial_stream_price__USD || ''}
                    />
                  </div>
                  <div className='flex-1 md:mr-1'>
                    <Input
                      id='partial_stream_price__KRW'
                      name='partial_stream_price__KRW'
                      type='number'
                      min={0}
                      step='any'
                      placeholder={`${t('cms:partialStreamPrice')}${t(
                        'cms:krw'
                      )}`}
                      onClick={(e) => resetError(e)}
                      onChange={formik.handleChange}
                      errMsg={formik.errors.partial_stream_price__KRW}
                      label={`${t('cms:partialStreamPrice')}${t('cms:krw')}`}
                      autoComplete='on'
                      transformDirection='intro-y'
                      design='inputGroupHeader'
                      value={formik.values.partial_stream_price__KRW || ''}
                    />
                  </div>
                </div>
                {/*  */}
                <div className='flex flex-col mt-2 md:flex-row'>
                  <div className='flex-1 md:mr-1'>
                    <Input
                      id='partial_stream_price__EURO'
                      name='partial_stream_price__EURO'
                      type='number'
                      min={0}
                      step='any'
                      placeholder={`${t('cms:partialStreamPrice')}${t(
                        'cms:euro'
                      )}`}
                      onClick={(e) => resetError(e)}
                      onChange={formik.handleChange}
                      errMsg={formik.errors.partial_stream_price__EURO}
                      label={`${t('cms:partialStreamPrice')}${t('cms:euro')}`}
                      autoComplete='on'
                      transformDirection='intro-y'
                      design='inputGroupHeader'
                      value={formik.values.partial_stream_price__EURO || ''}
                    />
                  </div>
                  <div className='flex-1 md:mr-1'>
                    <Input
                      id='partial_stream_price__CNY'
                      name='partial_stream_price__CNY'
                      type='number'
                      min={0}
                      step='any'
                      placeholder={`${t('cms:partialStreamPrice')}${t(
                        'cms:cny'
                      )}`}
                      onClick={(e) => resetError(e)}
                      onChange={formik.handleChange}
                      errMsg={formik.errors.partial_stream_price__CNY}
                      label={`${t('cms:partialStreamPrice')}${t('cms:cny')}`}
                      autoComplete='on'
                      transformDirection='intro-y'
                      design='inputGroupHeader'
                      value={formik.values.partial_stream_price__CNY || ''}
                    />
                  </div>
                </div>
                <div className='flex flex-col mt-2 md:flex-row'>
                  <div className='flex-1 md:mr-1'>
                    <Input
                      id='partial_stream_price__JPY'
                      name='partial_stream_price__JPY'
                      type='number'
                      min={0}
                      step='any'
                      placeholder={`${t('cms:partialStreamPrice')}${t(
                        'cms:jpy'
                      )}`}
                      onClick={(e) => resetError(e)}
                      onChange={formik.handleChange}
                      errMsg={formik.errors.partial_stream_price__JPY}
                      label={`${t('cms:partialStreamPrice')}${t('cms:jpy')}`}
                      autoComplete='on'
                      transformDirection='intro-y'
                      design='inputGroupHeader'
                      value={formik.values.partial_stream_price__JPY || ''}
                    />
                  </div>
                  <div className='flex-1 md:mr-1'>
                    <Input
                      id='partial_stream_price__TWD'
                      name='partial_stream_price__TWD'
                      type='number'
                      min={0}
                      step='any'
                      placeholder={`${t('cms:partialStreamPrice')}${t(
                        'cms:twd'
                      )}`}
                      onClick={(e) => resetError(e)}
                      onChange={formik.handleChange}
                      errMsg={formik.errors.partial_stream_price__TWD}
                      label={`${t('cms:partialStreamPrice')}${t('cms:twd')}`}
                      autoComplete='on'
                      transformDirection='intro-y'
                      design='inputGroupHeader'
                      value={formik.values.partial_stream_price__TWD || ''}
                    />
                  </div>
                </div>
              </div>

              {/* 3. total download price */}
              <div className='mt-4'>
                <label className='capitalize mt-3'>
                  {' '}
                  {t('cms:totalDownloadPrice')}
                </label>
                <div className='flex flex-col mt-2 md:flex-row'>
                  <div className='flex-1 md:mr-1'>
                    <Input
                      id='total_download_price__USD'
                      name='total_download_price__USD'
                      type='number'
                      min={0}
                      step='any'
                      placeholder={`${t('cms:totalDownloadPrice')}${t(
                        'cms:usd'
                      )}`}
                      onClick={(e) => resetError(e)}
                      onChange={formik.handleChange}
                      errMsg={formik.errors.total_download_price__USD}
                      label={`${t('cms:totalDownloadPrice')}${t('cms:usd')}`}
                      autoComplete='on'
                      transformDirection='intro-y'
                      design='inputGroupHeader'
                      value={formik.values.total_download_price__USD || ''}
                    />
                  </div>
                  <div className='flex-1 md:mr-1'>
                    <Input
                      id='total_download_price__KRW'
                      name='total_download_price__KRW'
                      type='number'
                      min={0}
                      step='any'
                      placeholder={`${t('cms:totalDownloadPrice')}${t(
                        'cms:krw'
                      )}`}
                      onClick={(e) => resetError(e)}
                      onChange={formik.handleChange}
                      errMsg={formik.errors.total_download_price__KRW}
                      label={`${t('cms:totalDownloadPrice')}${t('cms:krw')}`}
                      autoComplete='on'
                      transformDirection='intro-y'
                      design='inputGroupHeader'
                      value={formik.values.total_download_price__KRW || ''}
                    />
                  </div>
                </div>
                {/*  */}
                <div className='flex flex-col mt-2 md:flex-row'>
                  <div className='flex-1 md:mr-1'>
                    <Input
                      id='total_download_price__EURO'
                      name='total_download_price__EURO'
                      type='number'
                      min={0}
                      step='any'
                      placeholder={`${t('cms:totalDownloadPrice')}${t(
                        'cms:euro'
                      )}`}
                      onClick={(e) => resetError(e)}
                      onChange={formik.handleChange}
                      errMsg={formik.errors.total_download_price__EURO}
                      label={`${t('cms:totalDownloadPrice')}${t('cms:euro')}`}
                      autoComplete='on'
                      transformDirection='intro-y'
                      design='inputGroupHeader'
                      value={formik.values.total_download_price__EURO || ''}
                    />
                  </div>
                  <div className='flex-1 md:mr-1'>
                    <Input
                      id='total_download_price__CNY'
                      name='total_download_price__CNY'
                      type='number'
                      min={0}
                      step='any'
                      placeholder={`${t('cms:totalDownloadPrice')}${t(
                        'cms:cny'
                      )}`}
                      onClick={(e) => resetError(e)}
                      onChange={formik.handleChange}
                      errMsg={formik.errors.total_download_price__CNY}
                      label={`${t('cms:totalDownloadPrice')}${t('cms:cny')}`}
                      autoComplete='on'
                      transformDirection='intro-y'
                      design='inputGroupHeader'
                      value={formik.values.total_download_price__CNY || ''}
                    />
                  </div>
                </div>
                <div className='flex flex-col mt-2 md:flex-row'>
                  <div className='flex-1 md:mr-1'>
                    <Input
                      id='total_download_price__JPY'
                      name='total_download_price__JPY'
                      type='number'
                      min={0}
                      step='any'
                      placeholder={`${t('cms:totalDownloadPrice')}${t(
                        'cms:jpy'
                      )}`}
                      onClick={(e) => resetError(e)}
                      onChange={formik.handleChange}
                      errMsg={formik.errors.total_download_price__JPY}
                      label={`${t('cms:totalDownloadPrice')}${t('cms:jpy')}`}
                      autoComplete='on'
                      transformDirection='intro-y'
                      design='inputGroupHeader'
                      value={formik.values.total_download_price__JPY || ''}
                    />
                  </div>
                  <div className='flex-1 md:mr-1'>
                    <Input
                      id='total_download_price__TWD'
                      name='total_download_price__TWD'
                      type='number'
                      min={0}
                      step='any'
                      placeholder={`${t('cms:totalDownloadPrice')}${t(
                        'cms:twd'
                      )}`}
                      onClick={(e) => resetError(e)}
                      onChange={formik.handleChange}
                      errMsg={formik.errors.total_download_price__TWD}
                      label={`${t('cms:totalDownloadPrice')}${t('cms:twd')}`}
                      autoComplete='on'
                      transformDirection='intro-y'
                      design='inputGroupHeader'
                      value={formik.values.total_download_price__TWD || ''}
                    />
                  </div>
                </div>
              </div>

              {/* 4. partial download price */}
              <div className='mt-4'>
                <label className='capitalize mt-3'>
                  partial download price
                </label>
                <div className='flex flex-col mt-2 md:flex-row'>
                  <div className='flex-1 md:mr-1'>
                    <Input
                      id='partial_download_price__USD'
                      name='partial_download_price__USD'
                      type='number'
                      min={0}
                      step='any'
                      placeholder={`${t('cms:partialDownloadPrice')}${t(
                        'cms:usd'
                      )}`}
                      onClick={(e) => resetError(e)}
                      onChange={formik.handleChange}
                      errMsg={formik.errors.partial_download_price__USD}
                      label={`${t('cms:partialDownloadPrice')}${t('cms:usd')}`}
                      autoComplete='on'
                      transformDirection='intro-y'
                      design='inputGroupHeader'
                      value={formik.values.partial_download_price__USD || ''}
                    />
                  </div>
                  <div className='flex-1 md:mr-1'>
                    <Input
                      id='partial_download_price__KRW'
                      name='partial_download_price__KRW'
                      type='number'
                      min={0}
                      step='any'
                      placeholder={`${t('cms:partialDownloadPrice')}${t(
                        'cms:krw'
                      )}`}
                      onClick={(e) => resetError(e)}
                      onChange={formik.handleChange}
                      errMsg={formik.errors.partial_download_price__KRW}
                      label={`${t('cms:partialDownloadPrice')}${t('cms:krw')}`}
                      autoComplete='on'
                      transformDirection='intro-y'
                      design='inputGroupHeader'
                      value={formik.values.partial_download_price__KRW || ''}
                    />
                  </div>
                </div>
                {/*  */}
                <div className='flex flex-col mt-2 md:flex-row'>
                  <div className='flex-1 md:mr-1'>
                    <Input
                      id='partial_download_price__EURO'
                      name='partial_download_price__EURO'
                      type='number'
                      min={0}
                      step='any'
                      placeholder={`${t('cms:partialDownloadPrice')}${t(
                        'cms:euro'
                      )}`}
                      onClick={(e) => resetError(e)}
                      onChange={formik.handleChange}
                      errMsg={formik.errors.partial_download_price__EURO}
                      label={`${t('cms:partialDownloadPrice')}${t('cms:euro')}`}
                      autoComplete='on'
                      transformDirection='intro-y'
                      design='inputGroupHeader'
                      value={formik.values.partial_download_price__EURO || ''}
                    />
                  </div>
                  <div className='flex-1 md:mr-1'>
                    <Input
                      id='partial_download_price__CNY'
                      name='partial_download_price__CNY'
                      type='number'
                      min={0}
                      step='any'
                      placeholder={`${t('cms:partialDownloadPrice')}${t(
                        'cms:cny'
                      )}`}
                      onClick={(e) => resetError(e)}
                      onChange={formik.handleChange}
                      errMsg={formik.errors.partial_download_price__CNY}
                      label={`${t('cms:partialDownloadPrice')}${t('cms:cny')}`}
                      autoComplete='on'
                      transformDirection='intro-y'
                      design='inputGroupHeader'
                      value={formik.values.partial_download_price__CNY || ''}
                    />
                  </div>
                </div>
                <div className='flex flex-col mt-2 md:flex-row'>
                  <div className='flex-1 md:mr-1'>
                    <Input
                      id='partial_download_price__JPY'
                      name='partial_download_price__JPY'
                      type='number'
                      min={0}
                      step='any'
                      placeholder={`${t('cms:partialDownloadPrice')}${t(
                        'cms:jpy'
                      )}`}
                      onClick={(e) => resetError(e)}
                      onChange={formik.handleChange}
                      errMsg={formik.errors.partial_download_price__JPY}
                      label={`${t('cms:partialDownloadPrice')}${t('cms:jpy')}`}
                      autoComplete='on'
                      transformDirection='intro-y'
                      design='inputGroupHeader'
                      value={formik.values.partial_download_price__JPY || ''}
                    />
                  </div>
                  <div className='flex-1 md:mr-1'>
                    <Input
                      id='partial_download_price__TWD'
                      name='partial_download_price__TWD'
                      type='number'
                      min={0}
                      step='any'
                      placeholder={`${t('cms:partialDownloadPrice')}${t(
                        'cms:twd'
                      )}`}
                      onClick={(e) => resetError(e)}
                      onChange={formik.handleChange}
                      errMsg={formik.errors.partial_download_price__TWD}
                      label={`${t('cms:partialDownloadPrice')}${t('cms:twd')}`}
                      autoComplete='on'
                      transformDirection='intro-y'
                      design='inputGroupHeader'
                      value={formik.values.partial_download_price__TWD || ''}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* buttons */}
            <div className='flex justify-end mt-5'>
              <Button type='submit' color='btn-primary' disabled={isLoading}>
                {t('cms:save')}
              </Button>
            </div>
          </div>
        </form>
      </article>
    </>
  );
};
export default Live;
