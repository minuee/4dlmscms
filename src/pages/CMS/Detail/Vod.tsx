import React, { useState, useRef, useEffect, useContext, lazy } from 'react';
import { useLocation } from 'react-router-dom';
import { iso31661 } from 'iso-3166';
import { useFormik } from 'formik';
import { useTranslation } from 'react-i18next';
import ReactTooltip from 'react-tooltip';

import { IS_CHILD, MANUAL_VOD_UPLOAD, VOD_STATUS } from '@/settings/constants';

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
import { useAccordion } from '@/hooks/accordion-hooks';

const Toggle = lazy(() => import('comp/Input/ToggleSlider'));
const Button = lazy(() => import('comp/Button/Button'));
const Backdrop = lazy(() => import('comp/Backdrop/Backdrop'));
const SearchModal = lazy(() => import('comp/Modal/SearchModal'));
const MultiSelect = lazy(
  () => import('@/containers/Dropdown/dropdownMultiSelect')
);
const Modal = lazy(() => import('@/components/Modal/Modal'));
import Input, { Textarea } from 'comp/Input/InputText';
import Select, { Option } from 'comp/Input/Select';
import { ButtonInputAdd } from 'comp/Button/Button';

interface IF {
  cmsData: TotalItemType;
}

type ShowInputs = {
  permission: boolean;
  expiration: boolean;
  price: boolean;
};

function Vod(props: IF) {
  const { cmsData } = props;

  const location = useLocation();
  const pathName = location.pathname;
  const isChildContent = pathName.includes(IS_CHILD) ? true : false;

  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { updateStep, isUpdate, changeIsUpdate } = useContext(CMSContext);
  const { validateFormData } = useValidation();
  const { submitData, isLoading } = useCMSLiveAndVodRequest();
  const { isShowAccordion, handleToggleAccordionView, returnUpDownIcon } = useAccordion();

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

  const handleChangeInputShow = (name: keyof ShowInputs, value: boolean) => {
    setIsShow((prev) => ({ ...prev, [name]: value }));
  }

  // 컨텐츠 생성 시 해당 컴포넌트로 자연스럽게 오도록 스크롤을 이동시켜줌
  // (컨텐츠 생성 시에는 베이직 컴포넌트를 제외한 모든 컴포넌트 숨겨두었다가
  // 한 스텝이 끝나면 다음 스텝 컴포넌트를 보여주는 로직임)
  useEffect(() => {
    !isUpdate && wrapperRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // cmsData.vod값을 세팅해준다.
  // video가 변경되었을 경우 vod값도 변경되어야 하므로, 단일 ([]) 업데이트만 하지 않고
  // dependency에 cmsData.vod를 걸어 cmsData.vod 변경 시 마다 세팅 값이 바뀌도록 함
  useEffect(() => {
    if (!cmsData.vod) return;

    formik.setFieldValue('status', cmsData.vod.status.toString(), false);
    formik.setFieldValue('exposure_order', cmsData.vod.exposure_order, false);
    formik.setFieldValue('rtsp_url', excludeNe(cmsData.vod.rtsp_url), false);
    formik.setFieldValue('hls_url', excludeNe(cmsData.vod.hls_url) ? cmsData.vod.hls_url : 'http://www.4dreplay.com/hls', false);
    formik.setFieldValue('drm_free', cmsData.vod.drm_free, false);
    formik.setFieldValue('can_download', cmsData.vod.can_download, false);
    formik.setFieldValue('bundle', (cmsData.vod.bundle as string[]).join(', '), false);
    formik.setFieldValue('camera_group', JSON.stringify(cmsData.vod.camera_group), false);
    formik.setFieldValue('info', JSON.stringify(cmsData.vod.info), false);
    formik.setFieldValue('stream_expired_term', cmsData.vod.stream_expired_term, false);
    formik.setFieldValue('download_expired_term', cmsData.vod.download_expired_term, false);

    // price
    for (const currency in cmsData.vod.total_stream_price) {
      formik.setFieldValue(
        `total_stream_price__${currency}`,
        cmsData.vod.total_stream_price[currency],
        false
      );
    }
    for (const currency in cmsData.vod.partial_stream_price) {
      formik.setFieldValue(
        `partial_stream_price__${currency}`,
        cmsData.vod.total_stream_price[currency],
        false
      );
    }
    for (const currency in cmsData.vod.total_download_price) {
      formik.setFieldValue(
        `total_download_price__${currency}`,
        cmsData.vod.total_stream_price[currency],
        false
      );
    }
    for (const currency in cmsData.vod.partial_download_price) {
      formik.setFieldValue(
        `partial_download_price__${currency}`,
        cmsData.vod.total_stream_price[currency],
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
        if (cmsData.vod.stream_geo_permission.includes(country.alpha3))
          country.isSelected = true;
        return country;
      }
    );

    const downloadPermissionStateArray = [...countryListArrayDownload].map(
      (country) => {
        if (cmsData.vod.download_geo_permission.includes(country.alpha3))
          country.isSelected = true;
        return country;
      }
    );

    setGeoPermissionList({
      stream: streamPermissionStateArray,
      download: downloadPermissionStateArray,
    });

    // 수정일 경우 값 세팅
    if (!cmsData || !isUpdate) return;

    formik.setFieldValue(
      'start_time',
      getLocalDate(cmsData.vod.start_time),
      false
    );
    formik.setFieldValue('end_time', getLocalDate(cmsData.vod.end_time), false);
  }, [cmsData.vod]);

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

  // 서버에 저장(업데이트, put) 요청하는 메서드
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
      'createCMSVodInfo',
      values,
      'cms'
    );

    // json parse가 안 되는 camera_group, info 값을 넣었다면 리턴
    if (
      IsJsonString(values.camera_group) === false ||
      Array.isArray(JSON.parse(values.camera_group)) === false
    ) {
      showNotification(t('cms:cameraGroupNotArrayString'), 'error');
      formik.setFieldError('camera_group', 'cameraGroupNotArrayString');
      return;
    }

    // info는 json이어야 함
    if (IsJsonString(values.info) === false) {
      showNotification(t('cms:VodInfoNotJsonString'), 'error');
      formik.setFieldError('info', 'VodInfoNotJsonString');
      return;
    }

    // info는 배열이면 안 됨
    if (Array.isArray(JSON.parse(values.info)) === true) {
      showNotification(t('cms:VodInfoShouldBeObjectNotArray'), 'error');
      formik.setFieldError('info', 'VodInfoShouldBeObjectNotArray');
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
      'vod',
      {
        ...values,
        info: values.info,
        camera_group: values.camera_group,
      },
      cmsData.content_id,
      cmsData._id,
      cmsData.league_id,
      stream_geo_permission,
      download_geo_permission,
      undefined
    );

    // 서버 요청 성공 시에만 리덕스 업데이트
    if (!result) return;

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
    !isUpdate && updateStep(4);
  };

  const formik = useFormik({
    initialValues: {
      status: '',
      start_time: getLocalDateFromDate(new Date()).substring(0, 16),
      end_time: getLocalDateFromDate(new Date()).substring(0, 16),
      rtsp_url: '',
      hls_url: 'http://www.4dreplay.com/hls ',
      camera_group: '',
      info: '',
      drm_free: false,
      can_download: false,
      stream_geo_permission: [],
      download_geo_permission: [],
      bundle: 0,
      // bundle: [5, 12],
      exposure_order: MANUAL_VOD_UPLOAD, // 0924에 직접 등록하는 exposure_order는 해당 값을 넣어주기로 결정함
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

  /////////////////////////////////////////////////////
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
          title={t('cms:vodStreamGeoPermission')}
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
          title={t('cms:vodDownloadGeoPermission')}
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

      {/* camera group modal */}
      <>
        <Backdrop isShow={isModalOpen.cameraGroup} />
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
            onClick={() =>
              setIsModalOpen((prev) => ({ ...prev, cameraGroup: false }))
            }
          >
            {t('cms:close')}
          </Button>
        </Modal>
      </>

      <article className='mt-12' ref={wrapperRef}>
        <form className='cms__form' onSubmit={formik.handleSubmit}>
          {/* Accordion header */}
          <div className='flex justify-between'>
            <div className='flex flex-col'>
              <h1 className='text-xl font-extrabold'>{t('cms:vodInfo')}</h1>
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
                    // id='start_time'
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
                    // id='end_time'
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
                  className='flex-1 md:mr-1'
                  data-tip={t('cms:cameraGroupNotArrayString')}
                >
                  <Textarea
                    rows={10}
                    // id='camera_group'
                    name='camera_group'
                    placeholder=''
                    onClick={(e) => resetError(e)}
                    onChange={formik.handleChange}
                    errMsg={formik.errors.camera_group}
                    label={t('cms:cameraGroup')}
                    transformDirection='intro-y'
                    noMarginTop
                    value={formik.values.camera_group || ''}
                    onBlur={() =>
                      setIsModalOpen((prev) => ({ ...prev, cameraGroup: true }))
                    }
                  />
                  <ReactTooltip />
                </div>
                <div className='flex-1 md:mr-1'>
                  <Textarea
                    // id='info'
                    rows={10}
                    name='info'
                    placeholder=''
                    onClick={(e) => resetError(e)}
                    onChange={formik.handleChange}
                    errMsg={formik.errors.info}
                    label={t('cms:info')}
                    transformDirection='intro-y'
                    noMarginTop
                    value={formik.values.info || ''}
                  />
                </div>
              </div>
            </div>

            {/* URLS */}
            <div className='mt-4'>
              <label className='capitalize mt-3'>{t('cms:urls')}</label>
              <div className='flex flex-col md:flex-row'>
                <div className='flex-1 md:mr-1'>
                  <Input
                    // id='rtsp_url'
                    name='rtsp_url'
                    type='text'
                    placeholder=''
                    onClick={(e) => resetError(e)}
                    onChange={formik.handleChange}
                    errMsg={formik.errors.rtsp_url}
                    label={t('cms:rtspUrlWithAsterisk')}
                    autoComplete='on'
                    transformDirection='intro-y'
                    design='inputGroupHeader'
                    value={formik.values.rtsp_url || ''}
                  />
                </div>
                <div className='flex-1 md:mr-1'>
                  <Input
                    // id='hls_url'
                    name='hls_url'
                    type='text'
                    placeholder=''
                    onClick={(e) => resetError(e)}
                    onChange={formik.handleChange}
                    errMsg={formik.errors.hls_url}
                    label={t('cms:hlsUrlWithAsterisk')}
                    autoComplete='on'
                    transformDirection='intro-y'
                    design='inputGroupHeader'
                    value={formik.values.hls_url || ''}
                  />
                </div>
              </div>
            </div>

            <Toggle
              name='drm_free'
              // id='drm_free'
              onChange={formik.handleChange}
              label={t('cms:freeVodDrm')}
              checked={formik.values.drm_free || false}
              tabIndex={0}
            />
            <Toggle
              name='can_download'
              // id='can_download'
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
                  // id='status'
                  onChange={formik.handleChange}
                  onClick={(e) => resetError(e)}
                  errMsg={formik.errors.status}
                  value={formik.values.status || ''}
                  label={t('cms:vodStatus')}
                >
                  <option value='' disabled hidden>
                    {t('cms:selectVodStatus')}
                  </option>
                  {VOD_STATUS.map((item) => {
                    return (
                      <Option
                        key={item.label}
                        value={item.value}
                        label={item.label}
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
                    labelColor='red'
                  />
                </div>
                <div className='flex-1 md:mr-1'>
                  <Input
                    // id='bundle'
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
                    // id='stream_geo_permission'
                    name='stream_geo_permission'
                    type='text'
                    placeholder=''
                    onClick={(e) => {
                      setIsModalOpen((prev) => ({ ...prev, geoStream: true }));
                      resetError(e);
                    }}
                    onChange={formik.handleChange}
                    errMsg={formik.errors.stream_geo_permission}
                    label={t('cms:vodStreamWithAsterisk')}
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
                    // id='download_geo_permission'
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
                    label={t('cms:vodDownloadWithAsterisk')}
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
                    name='stream_expired_term'
                    type='number'
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
                    // id='download_expired_term'
                    name='download_expired_term'
                    type='number'
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
                      // id='total_stream_price__USD'
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
                      // id='total_stream_price__KRW'
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
                  {t('cms:partialStreamPrice')}
                </label>
                <div className='flex flex-col mt-2 md:flex-row'>
                  <div className='flex-1 md:mr-1'>
                    <Input
                      // id='partial_stream_price__USD'
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
                      // id='partial_stream_price__KRW'
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
                  {t('cms:totalDownloadPrice')}
                </label>
                <div className='flex flex-col mt-2 md:flex-row'>
                  <div className='flex-1 md:mr-1'>
                    <Input
                      // id='total_download_price__USD'
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
                      // id='total_download_price__KRW'
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
                  {t('cms:partialDownloadPrice')}
                </label>
                <div className='flex flex-col mt-2 md:flex-row'>
                  <div className='flex-1 md:mr-1'>
                    <Input
                      // id='partial_download_price__USD'
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
                      // id='partial_download_price__KRW'
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
export default Vod;
