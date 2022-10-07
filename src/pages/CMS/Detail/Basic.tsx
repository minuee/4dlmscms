import React, { useState, useContext, useEffect, lazy } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import { useFormik } from 'formik';
import { useTranslation } from 'react-i18next';
import ReactTooltip from 'react-tooltip';

import { excludeNe, showNotification } from '@/utils/commonFn';
import {
  AUTO_UPLOAD_TAG_BY_FAIL_RM,
  CMS_SERVICE_STATUS,
  CMS_VIDEO_TYPE,
  CMS_TIMEZONE_PLACE,
  IS_CHILD,
} from '@/settings/constants';

import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { ReducerType } from '@/redux/reducer';
// new redux data
import {
  setParentCurrent,
  setChildCurrent,
  updateParentContent,
  addParentContent,
  updateChildContent,
  addChildContent,
} from '@/redux/CMS/contentSlices';

import { CMSContext } from 'cont/cms';
import { useValidation } from '@/hooks/validation-hooks';
import { useAccordion } from '@/hooks/accordion-hooks';
import { useCMSCategoryRequest } from '@/apis/category/list/index';
import { useCMSBasicRequest } from '@/apis/CMS/basic/index';

import Input, { Textarea } from 'comp/Input/InputText';
import Select, { Option } from 'comp/Input/Select';
import Button, { ButtonInputAdd } from 'comp/Button/Button';

const Toggle = lazy(() => import('comp/Input/ToggleSlider'));
interface IF {
  cmsData: TotalItemType;
}

type ShowInputs = {
  name: boolean;
  subName: boolean;
  desc: boolean;
};

function Basic(props: IF) {
  const { t } = useTranslation();
  const history = useHistory();
  const location = useLocation();

  // child 업데이트/생성인지 parent 업데이트/생성인지 나타내는 변수
  const isChildContent = location.pathname.includes(IS_CHILD) ? true : false;
  const dispatch = useAppDispatch();

  // updated redux
  const cmsData = useAppSelector((state: ReducerType) => state.content);
  const cmsDataCurrent = useAppSelector((state: ReducerType) =>
    isChildContent ? state.content.childCurrent : state.content.parentCurrent
  );

  const { isUpdate, updateStep } = useContext(CMSContext);
  const { validateFormData } = useValidation();
  const { getAllCategories } = useCMSCategoryRequest();
  const {
    submitCMSBasicInfo,
    requestUpdatedEventIdAndRtspInfo,
    requestUpdateContentIdByIms,
    isLoading,
  } = useCMSBasicRequest();
  const { isShowAccordion, handleToggleAccordionView, returnUpDownIcon } = useAccordion();
  const [isAlreadySaved, setIsAlreadySaved] = useState<boolean>(false);
  const [categoryList, setCategoryList] = useState({ category: [], genre: [], league: [], round: [], season: [] });
  const [isShow, setIsShow] = useState<ShowInputs>({ name: false, subName: false, desc: false });

  const handleChangeInputShow = (name: keyof ShowInputs, value: boolean) => {
    setIsShow((prev) => ({ ...prev, [name]: value }));
  }

  const fetchAllCategoryData = async () => {
    const [ categoryResult, genreResult, leagueResult, roundResult, seasonResult ] = await getAllCategories();
    setCategoryList({
      category: categoryResult ? categoryResult : [],
      genre: genreResult ? genreResult : [],
      league: leagueResult ? leagueResult : [],
      round: roundResult ? roundResult : [],
      season: seasonResult ? seasonResult : [],
    });
  };

  useEffect(() => {
    // 리그, 시즌, 라운드, 장르, 카테고리를 선택할 수 있도록 정보를 받아온다.
    // ? 정보가 없으면 리턴하기    

    fetchAllCategoryData();
    
    //?  사실 아래 조건에서  !isUpdate 이거만 뺴면 된다
    // if (!cmsData || !cmsData?.isUpdate) return; // !원래 이 로직 사용함
    if ((!cmsData && !cmsDataCurrent) || location.pathname.toLowerCase().includes('createitem'))
      return;
    // if (Object.keys(cmsData).length !== 0) setIsUpdate(true);

    // 수정일 경우 값 세팅
    for (const name in cmsDataCurrent.name) {
      formik.setFieldValue(`name__${name}`, excludeNe(cmsDataCurrent.name[name]), false);
    }

    // subname
    for (const name in cmsDataCurrent.sub_name) {
      formik.setFieldValue(`sub_name__${name}`, excludeNe(cmsDataCurrent.sub_name[name]), false);
    }

    // desc
    for (const name in cmsDataCurrent.desc) {
      formik.setFieldValue(`desc__${name}`, excludeNe(cmsDataCurrent.desc[name]), false);
    }

    // Package ID는 Child Item에 없는 경우 Parent의 Package ID를 사용하지 않고 ''로 처리함(중복허용안됨). 2022.06.27 - JS Park 수정
    formik.setFieldValue('package_id', cmsDataCurrent.package_id ? cmsDataCurrent.package_id : '', false);
    
    formik.setFieldValue('event_id', cmsDataCurrent.event_id, false);
    formik.setFieldValue('ims_event_id', cmsDataCurrent.ims_event_id, false);
    formik.setFieldValue('genre_id', cmsDataCurrent.genre_id, false);
    formik.setFieldValue('category_id', cmsDataCurrent.category_id, false);
    formik.setFieldValue('league_id', cmsDataCurrent.league_id, false);
    formik.setFieldValue('season_id', cmsDataCurrent.season_id, false);
    formik.setFieldValue('round_id', cmsDataCurrent.round_id, false);
    formik.setFieldValue('video_type_id', cmsDataCurrent.video_type_id.toString(), false);
    formik.setFieldValue('service_status', cmsDataCurrent.service_status.toString(), false);
    // series 여부
    formik.setFieldValue('have_parent', cmsDataCurrent.have_parent, false);
    formik.setFieldValue('parent_id', cmsDataCurrent.parent_id, false);
    formik.setFieldValue('is_live', cmsDataCurrent.is_live, false);
    formik.setFieldValue('is_category', cmsDataCurrent.is_category, false);    
    formik.setFieldValue('place', excludeNe(cmsDataCurrent.place), false);
    formik.setFieldValue('exposure_order', cmsDataCurrent.exposure_order, false);
  }, []);

  // 뒤로가기
  const goBack = () => history.goBack();

  /* formik */
  const submitFormData = async (values) => {
    // setIsLoading(true);
    // ! PM요청으로 제목, 부제목, 설명 한국어는 입력 안 했을 시 영어와 동일하게 저장되게 함
    const totalErr = await validateFormData(
      [
        'name__ko-KR',
        'name__zh-CN',
        'name__zh-TW',
        'name__ja-JP',
        'name__fr-FR',
        'name__de-DE',
        'name__es-ES',
        'sub_name__ko-KR',
        'sub_name__zh-CN',
        'sub_name__zh-TW',
        'sub_name__ja-JP',
        'sub_name__fr-FR',
        'sub_name__de-DE',
        'sub_name__es-ES',
        'desc__ko-KR',
        'desc__zh-CN',
        'desc__zh-TW',
        'desc__ja-JP',
        'desc__fr-FR',
        'desc__de-DE',
        'desc__es-ES',
        'genre_id',
        'category_id',
        'league_id',
        'season_id',
        'round_id',
        'video_type_id',
        'exposure_order',
        'is_live',
        'is_category',
        'have_parent',
        'parent_id',        
        'ims_event_id',
        'ims_system_id',
      ],
      'CreateCMSBasicInfo',
      values,
      'cms'
    );
    formik.setErrors(totalErr);

    // 에러가 있으면 저장요청을 하지 못하게 리턴한다.
    if (Object.keys(totalErr).length !== 0) {
      // setIsLoading(false);
      return;
    }

    // 서버에 저장 요청
    const result = await submitCMSBasicInfo(
      cmsDataCurrent.content_id,
      cmsDataCurrent._id,
      isUpdate || isAlreadySaved ? 'put' : 'post',
      values
    );
    // setIsLoading(false);

    // 서버 요청 성공 시에만 리덕스 업데이트
    if (!result) return;
    // updated redux
    dispatch(isChildContent ? setChildCurrent(result) : setParentCurrent(result));

    // new redux 로직 update
    if (isChildContent) {
      dispatch(isUpdate ? updateChildContent(result) : addChildContent(result));
    } else {
      dispatch(isUpdate ? updateParentContent(result) : addParentContent(result));
    }

    // context update
    !isUpdate && updateStep(1);
  };

  // child content는 parent current의 카테고리 정보를 물고있어야 한다.
  const formik = useFormik({
    initialValues: {
      package_id: cmsData.parentCurrent?.package_id ? cmsData.parentCurrent?.package_id : '',
      event_id: cmsData.parentCurrent?.event_id ? cmsData.parentCurrent?.event_id : '',
      ims_event_id: cmsData.parentCurrent?.ims_event_id ? cmsData.parentCurrent?.ims_event_id : '',
      ims_system_id: cmsData.parentCurrent?.ims_system_id ? cmsData.parentCurrent?.ims_system_id : '',
      genre_id: cmsData.parentCurrent?.genre_id ? cmsData.parentCurrent?.genre_id : 0,
      category_id: cmsData.parentCurrent?.category_id ? cmsData.parentCurrent?.category_id : 0,
      league_id: cmsData.parentCurrent?.league_id ? cmsData.parentCurrent?.league_id : 0,
      season_id: cmsData.parentCurrent?.season_id ? cmsData.parentCurrent?.season_id : 0,
      round_id: cmsData.parentCurrent?.round_id ? cmsData.parentCurrent?.round_id : 0,
      video_type_id: cmsData.parentCurrent?._id ? '1' : '', // 하위 컨텐츠면 무조건 1(하이라이트)영상으로 들어간다.
      service_status: '',
      have_parent: cmsData.parentCurrent?._id ? true : false,
      parent_id: cmsData.parentCurrent?.content_id ? cmsData.parentCurrent?.content_id : 0,
      is_live: false,
      is_category: false,
      place: '',
      exposure_order: 0,
      // 꼭 필요한 post정보
      'name__en-US': '',
      'name__ko-KR': '',
      'name__zh-CN': '',
      'name__zh-TW': '',
      'name__ja-JP': '',
      'name__fr-FR': '',
      'name__de-DE': '',
      'name__es-ES': '',
      //
      'sub_name__en-US': '',
      'sub_name__ko-KR': '',
      'sub_name__zh-CN': '',
      'sub_name__zh-TW': '',
      'sub_name__ja-JP': '',
      'sub_name__fr-FR': '',
      'sub_name__de-DE': '',
      'sub_name__es-ES': '',
      //
      'desc__en-US': '',
      'desc__ko-KR': '',
      'desc__zh-CN': '',
      'desc__zh-TW': '',
      'desc__ja-JP': '',
      'desc__fr-FR': '',
      'desc__de-DE': '',
      'desc__es-ES': '',
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

  // ! ims_event_id는 라이브의 rtsp_url가 바뀌면 업데이트 되어야 한다.
  useEffect(() => {
    if(cmsDataCurrent?.ims_event_id) {
      formik.setFieldValue('ims_event_id', cmsDataCurrent?.ims_event_id, false);
    }
  }, [cmsDataCurrent?.ims_event_id, cmsDataCurrent?.live?.rtsp_url]);

  // IMS를 통해 이벤트아이디를 갱신하는 메서드
  const updateImsEventIdByIms = async () => {
    if (!excludeNe(cmsDataCurrent?.ims_event_id) || !excludeNe(cmsDataCurrent?.ims_system_id)) {
      // ims_system_id, ims_event_id가 없으면 요청 못하게 한다.
      // '저장' 먼저 하라고 알려주기
      showNotification(t('cms:needImsEventIdAndImsSystemId'), 'info');
      return;
    }

    // 서버 요청
    const result = await requestUpdatedEventIdAndRtspInfo(
      cmsDataCurrent?.content_id,
      cmsDataCurrent?._id,
      cmsDataCurrent?.league_id
    );
    // setIsLoading(false);
    if (!result) return;
    console.log({ result });

    // 값 세팅
    formik.setFieldValue('ims_event_id', result.ims_event_id, false);

    const updatedData = {
      ...cmsDataCurrent,
      ims_event_id: result.ims_event_id,
      live: { ...cmsDataCurrent.live, rtsp_url: result.live_rtsp_url },
    };
    // updated redux
    dispatch(isChildContent ? setChildCurrent(updatedData) : setParentCurrent(updatedData));
  };

  // IMS를 통해 컨텐트아이디를 갱신하는 메서드
  const updateContentIdByIms = async () => {
    // 서버 요청
    const result = await requestUpdateContentIdByIms(
      cmsDataCurrent?.content_id,
      cmsDataCurrent?._id,
      cmsDataCurrent?.league_id
    );    
  };

  //////////////////////////////////////////////////////
  return (
    <article className='mt-12 cms__basic'>
      <form className='cms__form' onSubmit={formik.handleSubmit}>
        {/* Accordion header */}
        <div className='flex justify-between'>
          <div className='flex flex-col'>
            <h1 className='text-xl font-extrabold'>{t('cms:basicInfo')}</h1>
            <h3>{t('cms:asteriskIsRequired')}</h3>
          </div>
          <button type='button' onClick={handleToggleAccordionView}>
            {returnUpDownIcon(isShowAccordion)}
          </button>
        </div>
        {/* Accordion body(main) */}
        <div className={isShowAccordion ? '' : 'hidden'}>
          <div className=''>
            {/* name */}
            <div className='mt-4'>
              <div className='flex items-center '>
                <label className='mt-3 capitalize'>{t('cms:title')}</label>
                <ButtonInputAdd
                  onClick={() => handleChangeInputShow('name', true)}
                  text='cms:addTitle?'
                  isHide={isShow.name}
                />
                <ReactTooltip />
              </div>
              <div className='flex flex-col md:flex-row'>
                <div className='flex-1 md:mr-1'>
                  <Input
                    id='name__en-US'
                    name='name__en-US'
                    type='text'
                    placeholder={t('cms:titlePlaceholder')}
                    onClick={(e) => resetError(e)}
                    onChange={formik.handleChange}
                    errMsg={formik.errors['name__en-US']}
                    label={t('cms:englishLabelWithAsterisk')}
                    autoComplete='on'
                    design='inputGroupHeader'
                    value={formik.values['name__en-US'] || ''}
                  />
                </div>
                <div className='flex-1 md:mr-1'>
                  <Input
                    id='name__ko-KR'
                    name='name__ko-KR'
                    type='text'
                    placeholder={t('cms:titlePlaceholder')}
                    onClick={(e) => resetError(e)}
                    onChange={formik.handleChange}
                    errMsg={formik.errors['name__ko-KR']}
                    label={t('cms:koreanLabel')}
                    autoComplete='on'
                    design='inputGroupHeader'
                    value={formik.values['name__ko-KR'] || ''}
                  />
                </div>
              </div>
              {/* 비 필수 항목 */}
              <div className={isShow.name ? '' : 'hidden'}>
                <div className='flex flex-col md:flex-row'>
                  <div className='flex-1 md:mr-1'>
                    <Input
                      id='name__zh-CN'
                      name='name__zh-CN'
                      type='text'
                      placeholder={t('cms:titlePlaceholder')}
                      onClick={(e) => resetError(e)}
                      onChange={formik.handleChange}
                      errMsg={formik.errors['name__zh-CN']}
                      label={t('cms:ChineseSimplifiedLabel')}
                      autoComplete='on'
                      design='inputGroupHeader'
                      value={formik.values['name__zh-CN'] || ''}
                    />
                  </div>
                  <div className='flex-1 md:mr-1'>
                    <Input
                      id='name__zh-TW'
                      name='name__zh-TW'
                      type='text'
                      placeholder={t('cms:titlePlaceholder')}
                      onClick={(e) => resetError(e)}
                      onChange={formik.handleChange}
                      errMsg={formik.errors['name__zh-TW']}
                      label={t('cms:ChineseTraditionalLabel')}
                      autoComplete='on'
                      design='inputGroupHeader'
                      value={formik.values['name__zh-TW'] || ''}
                    />
                  </div>
                </div>
                <div className='flex flex-col md:flex-row'>
                  <div className='flex-1 md:mr-1'>
                    <Input
                      id='name__ja-JP'
                      name='name__ja-JP'
                      type='text'
                      placeholder={t('cms:titlePlaceholder')}
                      onClick={(e) => resetError(e)}
                      onChange={formik.handleChange}
                      errMsg={formik.errors['name__ja-JP']}
                      label={t('cms:JapaneseLabel')}
                      autoComplete='on'
                      design='inputGroupHeader'
                      value={formik.values['name__ja-JP'] || ''}
                    />
                  </div>
                  <div className='flex-1 md:mr-1'>
                    <Input
                      id='name__fr-FR'
                      name='name__fr-FR'
                      type='text'
                      placeholder={t('cms:titlePlaceholder')}
                      onClick={(e) => resetError(e)}
                      onChange={formik.handleChange}
                      errMsg={formik.errors['name__fr-FR']}
                      label={t('cms:FrenchLabel')}
                      autoComplete='on'
                      design='inputGroupHeader'
                      value={formik.values['name__fr-FR'] || ''}
                    />
                  </div>
                </div>
                <div className='flex flex-col md:flex-row'>
                  <div className='flex-1 md:mr-1'>
                    <Input
                      id='name__de-DE'
                      name='name__de-DE'
                      type='text'
                      placeholder={t('cms:titlePlaceholder')}
                      onClick={(e) => resetError(e)}
                      onChange={formik.handleChange}
                      errMsg={formik.errors['name__de-DE']}
                      label={t('cms:GermanLabel')}
                      autoComplete='on'
                      design='inputGroupHeader'
                      value={formik.values['name__de-DE'] || ''}
                    />
                  </div>
                  <div className='flex-1 md:mr-1'>
                    <Input
                      id='name__es-ES'
                      name='name__es-ES'
                      type='text'
                      placeholder={t('cms:titlePlaceholder')}
                      onClick={(e) => resetError(e)}
                      onChange={formik.handleChange}
                      errMsg={formik.errors['name__es-ES']}
                      label={t('cms:SpanishLabel')}
                      autoComplete='on'
                      design='inputGroupHeader'
                      value={formik.values['name__es-ES'] || ''}
                    />
                  </div>
                </div>
              </div>
            </div>
            {/* /////////////////////////////////////////////////// */}
            {/* subtitle */}
            <div className='mt-4'>
              <div className='flex items-center '>
                <label className='mt-3 capitalize'>{t('cms:subTitle')}</label>
                <ButtonInputAdd
                  onClick={() => handleChangeInputShow('subName', true)}
                  text='cms:addSubTitle?'
                  isHide={isShow.subName}
                />
                <ReactTooltip />
              </div>
              <div className='flex flex-col md:flex-row'>
                <div className='flex-1 md:mr-1'>
                  <Input
                    id='sub_name__en-US'
                    name='sub_name__en-US'
                    type='text'
                    placeholder={t('cms:subTitlePlaceholder')}
                    onClick={(e) => resetError(e)}
                    onChange={formik.handleChange}
                    errMsg={formik.errors['sub_name__en-US']}
                    label={t('cms:englishLabelWithAsterisk')}
                    autoComplete='on'
                    design='inputGroupHeader'
                    value={formik.values['sub_name__en-US'] || ''}
                  />
                </div>
                <div className='flex-1 md:mr-1'>
                  <Input
                    id='sub_name__ko-KR'
                    name='sub_name__ko-KR'
                    type='text'
                    placeholder={t('cms:subTitlePlaceholder')}
                    onClick={(e) => resetError(e)}
                    onChange={formik.handleChange}
                    errMsg={formik.errors['sub_name__ko-KR']}
                    label={t('cms:koreanLabel')}
                    autoComplete='on'
                    design='inputGroupHeader'
                    value={formik.values['sub_name__ko-KR'] || ''}
                  />
                </div>
              </div>
              {/* 비 필수항목 */}
              <div className={isShow.subName ? '' : 'hidden'}>
                <div className='flex flex-col md:flex-row'>
                  <div className='flex-1 md:mr-1'>
                    <Input
                      id='sub_name__zh-CN'
                      name='sub_name__zh-CN'
                      type='text'
                      placeholder={t('cms:subTitlePlaceholder')}
                      onClick={(e) => resetError(e)}
                      onChange={formik.handleChange}
                      errMsg={formik.errors['sub_name__zh-CN']}
                      label={t('cms:ChineseSimplifiedLabel')}
                      autoComplete='on'
                      design='inputGroupHeader'
                      value={formik.values['sub_name__zh-CN'] || ''}
                    />
                  </div>
                  <div className='flex-1 md:mr-1'>
                    <Input
                      id='sub_name__zh-TW'
                      name='sub_name__zh-TW'
                      type='text'
                      placeholder={t('cms:subTitlePlaceholder')}
                      onClick={(e) => resetError(e)}
                      onChange={formik.handleChange}
                      errMsg={formik.errors['sub_name__zh-TW']}
                      label={t('cms:ChineseTraditionalLabel')}
                      autoComplete='on'
                      design='inputGroupHeader'
                      value={formik.values['sub_name__zh-TW'] || ''}
                    />
                  </div>
                </div>
                <div className='flex flex-col md:flex-row'>
                  <div className='flex-1 md:mr-1'>
                    <Input
                      id='sub_name__ja-JP'
                      name='sub_name__ja-JP'
                      type='text'
                      placeholder={t('cms:subTitlePlaceholder')}
                      onClick={(e) => resetError(e)}
                      onChange={formik.handleChange}
                      errMsg={formik.errors['sub_name__ja-JP']}
                      label={t('cms:JapaneseLabel')}
                      autoComplete='on'
                      design='inputGroupHeader'
                      value={formik.values['sub_name__ja-JP'] || ''}
                    />
                  </div>
                  <div className='flex-1 md:mr-1'>
                    <Input
                      id='sub_name__fr-FR'
                      name='sub_name__fr-FR'
                      type='text'
                      placeholder={t('cms:subTitlePlaceholder')}
                      onClick={(e) => resetError(e)}
                      onChange={formik.handleChange}
                      errMsg={formik.errors['sub_name__fr-FR']}
                      label={t('cms:FrenchLabel')}
                      autoComplete='on'
                      design='inputGroupHeader'
                      value={formik.values['sub_name__fr-FR'] || ''}
                    />
                  </div>
                </div>
                <div className='flex flex-col md:flex-row'>
                  <div className='flex-1 md:mr-1'>
                    <Input
                      id='sub_name__de-DE'
                      name='sub_name__de-DE'
                      type='text'
                      placeholder={t('cms:subTitlePlaceholder')}
                      onClick={(e) => resetError(e)}
                      onChange={formik.handleChange}
                      errMsg={formik.errors['sub_name__de-DE']}
                      label={t('cms:GermanLabel')}
                      autoComplete='on'
                      design='inputGroupHeader'
                      value={formik.values['sub_name__de-DE'] || ''}
                    />
                  </div>
                  <div className='flex-1 md:mr-1'>
                    <Input
                      id='sub_name__es-ES'
                      name='sub_name__es-ES'
                      type='text'
                      placeholder={t('cms:subTitlePlaceholder')}
                      onClick={(e) => resetError(e)}
                      onChange={formik.handleChange}
                      errMsg={formik.errors['sub_name__es-ES']}
                      label={t('cms:SpanishLabel')}
                      autoComplete='on'
                      design='inputGroupHeader'
                      value={formik.values['sub_name__es-ES'] || ''}
                    />
                  </div>
                </div>
              </div>
            </div>
            {/* description */}
            <div className='mt-4'>
              <div className='flex items-center '>
                <label className='mt-3 capitalize'>
                  {t('cms:description')}
                </label>
                <ButtonInputAdd
                  onClick={() => handleChangeInputShow('desc', true)}
                  text='cms:addDesc?'
                  isHide={isShow.desc}
                />
                <ReactTooltip />
              </div>
              <div className='flex flex-col md:flex-row'>
                <div className='flex-1 md:mr-1'>
                  <Textarea
                    id='desc__en-US'
                    name='desc__en-US'
                    type='text'
                    placeholder={t('cms:descriptionPlaceholder')}
                    onClick={(e) => resetError(e)}
                    onChange={formik.handleChange}
                    errMsg={formik.errors['desc__en-US']}
                    label={t('cms:englishLabelWithAsterisk')}
                    autoComplete='on'
                    design='inputGroupHeader'
                    value={formik.values['desc__en-US'] || ''}
                  />
                </div>
                <div className='flex-1 md:mr-1'>
                  <Textarea
                    id='desc__ko-KR'
                    name='desc__ko-KR'
                    type='text'
                    placeholder={t('cms:descriptionPlaceholder')}
                    onClick={(e) => resetError(e)}
                    onChange={formik.handleChange}
                    errMsg={formik.errors['desc__ko-KR']}
                    label={t('cms:koreanLabel')}
                    autoComplete='on'
                    design='inputGroupHeader'
                    value={formik.values['desc__ko-KR'] || ''}
                  />
                </div>
              </div>
              {/* 비 필수항목 */}
              <div className={isShow.desc ? '' : 'hidden'}>
                <div className='flex flex-col md:flex-row'>
                  <div className='flex-1 md:mr-1'>
                    <Textarea
                      id='desc__zh-CN'
                      name='desc__zh-CN'
                      type='text'
                      placeholder={t('cms:descriptionPlaceholder')}
                      onClick={(e) => resetError(e)}
                      onChange={formik.handleChange}
                      errMsg={formik.errors['desc__zh-CN']}
                      label={t('cms:ChineseSimplifiedLabel')}
                      autoComplete='on'
                      design='inputGroupHeader'
                      value={formik.values['desc__zh-CN'] || ''}
                    />
                  </div>
                  <div className='flex-1 md:mr-1'>
                    <Textarea
                      id='desc__zh-TW'
                      name='desc__zh-TW'
                      type='text'
                      placeholder={t('cms:descriptionPlaceholder')}
                      onClick={(e) => resetError(e)}
                      onChange={formik.handleChange}
                      errMsg={formik.errors['desc__zh-TW']}
                      label={t('cms:ChineseTraditionalLabel')}
                      autoComplete='on'
                      design='inputGroupHeader'
                      value={formik.values['desc__zh-TW'] || ''}
                    />
                  </div>
                </div>
                <div className='flex flex-col md:flex-row'>
                  <div className='flex-1 md:mr-1'>
                    <Textarea
                      id='desc__ja-JP'
                      name='desc__ja-JP'
                      type='text'
                      placeholder={t('cms:descriptionPlaceholder')}
                      onClick={(e) => resetError(e)}
                      onChange={formik.handleChange}
                      errMsg={formik.errors['desc__ja-JP']}
                      label={t('cms:JapaneseLabel')}
                      autoComplete='on'
                      design='inputGroupHeader'
                      value={formik.values['desc__ja-JP'] || ''}
                    />
                  </div>
                  <div className='flex-1 md:mr-1'>
                    <Textarea
                      id='desc__fr-FR'
                      name='desc__fr-FR'
                      type='text'
                      placeholder={t('cms:descriptionPlaceholder')}
                      onClick={(e) => resetError(e)}
                      onChange={formik.handleChange}
                      errMsg={formik.errors['desc__fr-FR']}
                      label={t('cms:FrenchLabel')}
                      autoComplete='on'
                      design='inputGroupHeader'
                      value={formik.values['desc__fr-FR'] || ''}
                    />
                  </div>
                </div>
                <div className='flex flex-col md:flex-row'>
                  <div className='flex-1 md:mr-1'>
                    <Textarea
                      id='desc__de-DE'
                      name='desc__de-DE'
                      type='text'
                      placeholder={t('cms:descriptionPlaceholder')}
                      onClick={(e) => resetError(e)}
                      onChange={formik.handleChange}
                      errMsg={formik.errors['desc__de-DE']}
                      label={t('cms:GermanLabel')}
                      autoComplete='on'
                      design='inputGroupHeader'
                      value={formik.values['desc__de-DE'] || ''}
                    />
                  </div>
                  <div className='flex-1 md:mr-1'>
                    <Textarea
                      id='desc__es-ES'
                      name='desc__es-ES'
                      type='text'
                      placeholder={t('cms:descriptionPlaceholder')}
                      onClick={(e) => resetError(e)}
                      onChange={formik.handleChange}
                      errMsg={formik.errors['desc__es-ES']}
                      label={t('cms:SpanishLabel')}
                      autoComplete='on'
                      design='inputGroupHeader'
                      value={formik.values['desc__es-ES'] || ''}
                    />
                  </div>
                </div>
              </div>
            </div>

            <Input
              id='package_id'
              name='package_id'
              type='number'
              placeholder={t('cms:packageIdLabel')}
              onClick={(e) => resetError(e)}
              onChange={formik.handleChange}
              errMsg={formik.errors.package_id}
              label={t('cms:packageIdLabelWithAsterisk')}
              autoComplete='on'
              value={formik.values.package_id}
              min={0}
            />

            <Input
              id='event_id'
              name='event_id'
              type='number'
              placeholder={t('cms:eventIdLabel')}
              onClick={(e) => resetError(e)}
              onChange={formik.handleChange}
              errMsg={formik.errors.event_id}
              label={t('cms:eventIdLabelWithAsterisk')}
              autoComplete='on'
              value={formik.values.event_id}
              min={0}
            />

            {/*  */}
            <div className='flex flex-col '>
              <label className='mt-3 capitalize'>{t('cms:imsEventId')}</label>
              <div className='flex items-center justify-evenly'>
                <div className='flex-1'>
                  <Input
                    id='ims_event_id'
                    name='ims_event_id'
                    type='text'
                    placeholder={t('cms:eventIdLabel')}
                    onClick={(e) => resetError(e)}
                    onChange={formik.handleChange}
                    errMsg={formik.errors.ims_event_id}
                    autoComplete='on'
                    value={formik.values.ims_event_id || ''}
                    noMarginTop
                    noLabelMargin
                    min={0}
                  />
                </div>
                <div className='flex ml-3'>
                  <Button color='btn-primary' onClick={updateImsEventIdByIms}>
                    {t('cms:updatedByIms')}
                  </Button>
                  {/* content id를 IMS를 통해 갱신하는 버튼 */}
                  {isUpdate && (
                    <Button color='btn-primary' margin='left' onClick={updateContentIdByIms}>
                      {t('cms:contentIdUpdateByIms')}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <Input
              id='ims_system_id'
              name='ims_system_id'
              type='text'
              placeholder={t('cms:imsSystemID')}
              onClick={(e) => resetError(e)}
              onChange={formik.handleChange}
              errMsg={formik.errors.ims_system_id}
              label={t('cms:imsSystemID')}
              autoComplete='on'
              value={formik.values.ims_system_id || ''}
            />
            <Toggle
              name='is_live'
              id='is_live'
              onChange={formik.handleChange}
              label={t('cms:live')}
              checked={formik.values.is_live || false}
              tabIndex={0}
            />
          </div>

          {/* STEP 2 */}
          {/* CATEGORY */}
          <div className=''>
            <Select
              name='genre_id'
              id='genre_id'
              onChange={formik.handleChange}
              onClick={(e) => resetError(e)}
              errMsg={formik.errors.genre_id}
              value={formik.values.genre_id || ''}
              label={t('category:genre')}
              disabled={isChildContent}
            >
              <option value='' disabled hidden>
                {t('category:selectGenre')}
              </option>
              {categoryList.genre &&
                categoryList.genre?.map((genre) => {
                  return (
                    <Option
                      id={genre.genre_id}
                      key={genre.genre_id + '/' + genre.name['en-US']}
                      value={genre.genre_id}
                      label={genre.name['en-US']}
                    />
                  );
                })}
            </Select>

            <Select
              name='category_id'
              id='category_id'
              onChange={formik.handleChange}
              onClick={(e) => resetError(e)}
              errMsg={formik.errors.category_id}
              value={formik.values.category_id || ''}
              label={t('category:category')}
              disabled={isChildContent}
            >
              <option value='' disabled hidden>
                {t('category:selectCategory')}
              </option>
              {categoryList.category &&
                categoryList.category?.map((category) => {
                  return (
                    <Option
                      id={category.category_id}
                      key={category.category_id + '/' + category.name['en-US']}
                      value={category.category_id}
                      label={category.name['en-US']}
                    />
                  );
                })}
            </Select>

            <Select
              name='league_id'
              id='league_id'
              onChange={formik.handleChange}
              onClick={(e) => resetError(e)}
              errMsg={formik.errors.league_id}
              value={formik.values.league_id || ''}
              label={t('category:league')}
              disabled={isChildContent}
            >
              <option value='' disabled hidden>
                {t('category:selectLeague')}
              </option>
              {categoryList.league &&
                categoryList.league?.map((league) => {
                  return (
                    <Option
                      id={league.league_id}
                      key={league.league_id + '/' + league.name['en-US']}
                      value={league.league_id}
                      label={league.name['en-US']}
                    />
                  );
                })}
            </Select>

            <Select
              name='season_id'
              id='season_id'
              onChange={formik.handleChange}
              onClick={(e) => resetError(e)}
              errMsg={formik.errors.season_id}
              value={formik.values.season_id || ''}
              label={t('category:season')}
              disabled={isChildContent}
            >
              <option value='' disabled hidden>
                {t('category:selectSeason')}
              </option>
              {categoryList.season &&
                categoryList.season?.map((season) => {
                  return (
                    <Option
                      id={season.season_id}
                      key={season.season_id + '/' + season.name['en-US']}
                      value={season.season_id}
                      label={season.name['en-US']}
                    />
                  );
                })}
            </Select>

            <Select
              name='round_id'
              id='round_id'
              onChange={formik.handleChange}
              onClick={(e) => resetError(e)}
              errMsg={formik.errors.round_id}
              value={formik.values.round_id || ''}
              label={t('category:round')}
              disabled={isChildContent}
            >
              <option value='' disabled hidden>
                {t('category:selectRound')}
              </option>
              {categoryList.round &&
                categoryList.round?.map((round) => {
                  return (
                    <Option
                      id={round.round_id}
                      key={round.round_id + '/' + round.name['en-US']}
                      value={round.round_id}
                      label={round.name['en-US']}
                    />
                  );
                })}
            </Select>

            {/* 생성되는 컨텐츠의 상태값 [ 0: 서비스 중지됨, 1: 서비스 중, 2: 서비스 준비중, 3: 서비스 예약됨 */}
            <Select
              name='service_status'
              id='service_status'
              onChange={formik.handleChange}
              onClick={(e) => resetError(e)}
              errMsg={formik.errors.service_status}
              value={formik.values.service_status || ''}
              label={t('cms:serviceStatus')}
              labelColor='red'
            >
              <option value='' disabled hidden>
                {t('cms:selectServiceStatus')}
              </option>

              {CMS_SERVICE_STATUS.map((item) => {
                if (item.label === 'reserved') return;
                return (
                  <Option
                    id={item.name}
                    key={item.name}
                    value={item.value}
                    label={item.label}
                  />
                );
              })}
            </Select>
            {/* 시리즈인지 여부 */}
            <Toggle
              name='have_parent'
              id='have_parent'
              onChange={formik.handleChange}
              label={t('cms:seriesGameWithAsterisk')}
              checked={formik.values.have_parent || false}
              tabIndex={0}
            />
            {/* have_parent가 true 때 보여준다. */}
            {formik.values.have_parent && (
              <div className='flex-1 md:mr-1'>
                <Input
                  id='parent_id'
                  name='parent_id'
                  type='number'
                  placeholder={t('cms:parentId')}
                  onClick={(e) => resetError(e)}
                  onChange={formik.handleChange}
                  errMsg={formik.errors.parent_id}
                  label={t('cms:parentId')}
                  autoComplete='on'
                  value={formik.values.parent_id}
                  // readonly={cmsData.have_parent ? true : false}
                />
              </div>
            )}
            <Select
              name='video_type_id'
              id='video_type_id'
              onChange={formik.handleChange}
              onClick={(e) => resetError(e)}
              errMsg={formik.errors.video_type_id}
              value={formik.values.video_type_id || ''}
              label={t('cms:videoTypeWithAsterisk')}
              disabled={
                cmsDataCurrent?.video_type_id === AUTO_UPLOAD_TAG_BY_FAIL_RM
              }
            >
              <option value='' disabled hidden>
                {t('cms:selectVideoType')}
              </option>

              {CMS_VIDEO_TYPE.map((item, idx) => {
                if (!isUpdate && idx > 2) return;
                return (
                  <Option
                    id={item.label}
                    key={item.label}
                    value={item.value}
                    label={item.label}
                  />
                );
              })}
            </Select>
            <div className='flex flex-col md:flex-row'>
              <div className='flex-1 md:mr-1'>
                <Select
                  name='place'
                  id='place'
                  onChange={formik.handleChange}
                  onClick={(e) => resetError(e)}
                  errMsg={formik.errors.place}
                  value={formik.values.place || ''}
                  label={t('cms:placeWithAsterisk')}
                  // disabled={isChildContent}
                >
                  <option value='' disabled hidden>
                    {t('category:selectPlace')}
                  </option>
                  {CMS_TIMEZONE_PLACE.map((place) => {
                    return (
                      <Option
                        id={place.label}
                        key={place.label}
                        value={place.value}
                        label={place.label}
                      />
                    );
                  })}
                </Select>
                {/* <Input
                  id='place'
                  name='place'
                  type='text'
                  placeholder={t('cms:place')}
                  onClick={(e) => resetError(e)}
                  onChange={formik.handleChange}
                  errMsg={formik.errors.place}
                  label={t('cms:placeWithAsterisk')}
                  autoComplete='on'
                  value={formik.values.place || ''}
                /> */}
              </div>
              <div className='flex-1'>
                <Input
                  id='exposure_order'
                  name='exposure_order'
                  type='number'
                  placeholder={t('cms:exposureOrder')}
                  onClick={(e) => resetError(e)}
                  onChange={formik.handleChange}
                  errMsg={formik.errors.exposure_order}
                  label={t('cms:exposureOrder')}
                  autoComplete='on'
                  value={formik.values.exposure_order || ''}
                  noMarginTop={true}
                />
              </div>
            </div>
          </div>

          {/* buttons */}
          <div className='flex items-center justify-center col-span-12 mt-5 btns-wrapper sm:justify-end'>
            <Button type='button' color='btn-secondary' onClick={goBack}>
              {t('cms:cancel')}
            </Button>
            <Button type='submit' color='btn-primary' disabled={isLoading}>
              {t('cms:save')}
            </Button>
          </div>
        </div>
      </form>
    </article>
  );
};
export default Basic;
