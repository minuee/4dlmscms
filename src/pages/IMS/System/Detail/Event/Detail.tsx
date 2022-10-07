import React, { useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useFormik } from 'formik';
import { useTranslation } from 'react-i18next';

import { useValidation } from '@/hooks/validation-hooks';
import { useEventDetailRequest } from '@/apis/IMS/system/detail/event/detail';
import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { ReducerType } from '@/redux/reducer';
import { setCurrent, setList } from '@/redux/IMS/system/eventSlices';

import {
  IS_IMS_TEST,
  SYSTEM_CREATE_EVENT,
  SYSTEM_UPDATE_EVENT,
} from '@/settings/constants';
import {
  returnBoolean,
  returnImsBoolString,
  trimAllData,
  trimAllWhitespace,
} from '@/utils/commonFn';

import {
  LIVE_STATUS_TYPE,
  DEPLOY_TYPE,
  INSTANCE_STATUS_TYPE,
  LS_TYPE,
  ML_TYPE,
  NODE_STATUS_TYPE,
  NODE_TYPE,
  REGION_TYPE,
} from '@/settings/imsStringData';

import Select, { Option } from '@/components/Input/Select';
import Input from 'comp/Input/InputText';
import Button from 'comp/Button/Button';
import Toggle from '@/components/Input/ToggleSlider';

interface IF {}

export const initialValues = {
  name: '',
  id: undefined,
  content_id: undefined,
  description: '',
  live_status: LIVE_STATUS_TYPE.list[0].code,
  is_public: false,
  scheduled_at:'',
  is_public_name: '',
  live_status_name: ''
};

const Detail: React.FC<IF> = (props: IF) => {
  const { validateFormData } = useValidation();
  const { t } = useTranslation();
  const history = useHistory();
  const location = useLocation();
  const pathName = location.pathname;
  const isTestPage = pathName.includes(IS_IMS_TEST);

  const compName =
    pathName.split('/')[3][0].toLowerCase() + pathName.split('/')[3].slice(1);

  const isUpdate = pathName.split(`${compName}/`)[1].includes('create')
    ? false
    : true;

  const { createData, updateData, isLoading } = useEventDetailRequest();
  const systemData = useAppSelector((state: ReducerType) => state.info.current);
  const eventData = useAppSelector((state: ReducerType) => state.event.current);
  const eventListData = useAppSelector((state: ReducerType) => state.event.list);
  const dispatch = useAppDispatch();

  // 뒤로가기
  const goBack = () => history.goBack();

  const submitFormData = async (values: typeof initialValues) => {
    const totalErr = await validateFormData(
      [
        'name',
        'id',
        'updated_at',
        'registered_at',
        'content_id',
        'description',
        'live_status',
        'is_public',
        'is_public_name',
        'live_status',
        'live_status_name',
        'status',
        'status_name',
        'system_id',
        'scheduled_at'
      ],
      'CreateSystemNode',
      values,
      'venue'
    );
    formik.setErrors(totalErr);

    // 에러가 있으면 저장요청을 하지 못하게 리턴한다.
    if (Object.keys(totalErr).length !== 0) {
      return;
    }

    // 서버에 저장 요청
    const data = {
      ...trimAllData(values),
      is_public: returnImsBoolString(values.is_public)
    }

  
    const result = isUpdate
      ? await updateData(systemData.id, eventData.id, data, isTestPage)
      : await createData(systemData.id, data, isTestPage);

    if (!result) return;
    // // dispatch(setList([...nodeListData, { ...values, id: result.id }]));
    dispatch(setList([...eventListData, { ...result }]));
    dispatch(setCurrent(result));

    let nextPath;
    // update일 경우
    if (location.pathname.split('system')[1].includes('update')) {
      nextPath = isTestPage ? SYSTEM_UPDATE_EVENT : SYSTEM_UPDATE_EVENT;

      // create일 경우
    } else {
      nextPath = isTestPage ? SYSTEM_CREATE_EVENT : SYSTEM_CREATE_EVENT;
    }

    history.push(nextPath);
  };

  const formik = useFormik({
    initialValues,
    validate: null,
    onSubmit: submitFormData,
    validateOnChange: false,
    validateOnBlur: false,
  });

  const resetError = (e) => {
    const name = e.target.name;
    formik.setErrors({ ...formik.errors, [name]: '' });
  };

  useEffect(() => {
    // 수정 시 값을 세팅해준다.
    if (!isUpdate) return;

    formik.setValues(eventData, false);
    
    // live status
    const liveStatus = LIVE_STATUS_TYPE.list.find(
      (item) => item.name === eventData?.live_status_name
    )?.code;
    formik.setFieldValue('live_status', liveStatus, false);

    // is public
    const isPublic = returnBoolean(eventData?.is_public_name);
    formik.setFieldValue('is_public', isPublic, false);

    // scheduled at
    const scheduledAt = eventData.scheduled_at ? eventData.scheduled_at?.split('.')[0] : null;
    formik.setFieldValue('scheduled_at', scheduledAt, false)

    // is_auto_scale_out -> 제외하기
    // const isAutoScaleOut = returnBoolean(nodeData?.is_auto_scale_out);
    // formik.setFieldValue('is_auto_scale_out', isAutoScaleOut, false);
  }, []);

  ///////////////////////////////////////////
  return (
    <article className='cms__basic mt-12'>
      <form className='cms__form' onSubmit={formik.handleSubmit}>
        <h1 className='text-xl font-extrabold uppercase'>
          {compName} {isUpdate ? 'UPDATE' : 'CREATE'}
        </h1>
        <h3>{t('asteriskIsRequired')}</h3>

        {/* name */}
        <Input
          id='name'
          name='name'
          type='text'
          placeholder={t('system:name2CharPlaceholder')}
          onClick={(e) => resetError(e)}
          onChange={formik.handleChange}
          errMsg={formik.errors['name']}
          autoComplete='on'
          value={formik.values['name'] || ''}
          label={t('system:nameLabelWithAsterisk')}
        />
        <Input
          id='content_id'
          name='content_id'
          type='number'
          placeholder={t('system:contentId')}
          onClick={(e) => resetError(e)}
          onChange={formik.handleChange}
          errMsg={formik.errors['content_id']}
          autoComplete='on'
          value={formik.values['content_id'] || ''}
          label={t('system:contentId')}
        />
        <Input
          id='description'
          name='description'
          type='text'
          placeholder={t('system:description')}
          onClick={(e) => resetError(e)}
          onChange={formik.handleChange}
          errMsg={formik.errors['description']}
          autoComplete='on'
          value={formik.values['description'] || ''}
          label={t('system:description')}
        />
        <Select
          id='live_status'
          name='live_status'
          onClick={(e) => resetError(e)}
          onChange={formik.handleChange}
          errMsg={formik.errors['live_status']}
          autoComplete='on'
          label={t('system:liveStatus')}
          value={formik.values['live_status'] || ''}
        >
          <option value='' disabled hidden>
            {t('select')}
          </option>
          {LIVE_STATUS_TYPE.list.map((item) => {
            return (
              <Option key={item.code} value={item.code} label={item.name} />
            );
          })}
        </Select>
        <Toggle
          label={t('system:isPublic')}
          name='is_public'
          checked={formik.values.is_public || false}
          onChange={formik.handleChange}
          tabIndex={0}
        />
        <Input
          id='status'
          name='status'
          type='text'
          placeholder={t('system:status')}
          errMsg={formik.errors['status_name']}
          value={formik.values['status_name'] || ''}
          label={t('system:status')}
          disabled={true}
        />
        <Input
          id='scheduled_at'
          name='scheduled_at'
          type='datetime-local'
          placeholder={t('system:scheduledAt')}
          onClick={(e) => resetError(e)}
          onChange={formik.handleChange}
          errMsg={formik.errors['scheduled_at']}
          autoComplete='on'
          value={formik.values['scheduled_at'] || ''}
          label={t('system:scheduledAt')}
        />

        {/* buttons */}
        <div className='btns-wrapper col-span-12 mt-5 flex items-center justify-center sm:justify-end'>
          <Button type='button' color='btn-secondary' onClick={goBack}>
            {t('cancel')}
          </Button>
          <Button type='submit' color='btn-primary'>
            {t('save')}
          </Button>
        </div>
      </form>
    </article>
  );
};
export default Detail;
