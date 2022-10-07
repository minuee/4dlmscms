import React, { useEffect, lazy } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useFormik } from 'formik';
import { useTranslation } from 'react-i18next';

import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { ReducerType } from '@/redux/reducer';
import { setList, setCurrent } from '@/redux/IMS/system/ruleSlices';

import { useValidation } from '@/hooks/validation-hooks';
import { useGroupDetailRequest } from '@/apis/IMS/system/detail/group/detail';

import {
  IS_IMS_TEST,
  SYSTEM_CREATE_GROUP,
  SYSTEM_CREATE_RULE,
  SYSTEM_UPDATE_GROUP,
  SYSTEM_UPDATE_RULE,
  TEST_SYSTEM_CREATE_GROUP,
  TEST_SYSTEM_CREATE_RULE,
  TEST_SYSTEM_UPDATE_GROUP,
  TEST_SYSTEM_UPDATE_RULE,
} from '@/settings/constants';
import { NODE_TYPE } from '@/settings/imsStringData';

import Input from 'comp/Input/InputText';
import Button from 'comp/Button/Button';
import Select, { Option } from 'comp/Input/Select';
const PageLoaderModal = lazy(() => import('comp/PageLoader/PageLoaderModal'));

interface IF {}
// ? 아직 안 쓰는 페이지임!

export const initialValues = {
  default_audio_index: 0,
  default_channel_index: 12,
  description: 'bird view',
  group_index: 8,
  is_default_group: false,
  is_external_group: false,
  is_interactive: false,
  is_pdview: false,
  is_replay: false,
  is_timemachine: false,
  registered_at: '2021-10-26T05:49:31.000+00:00',
  system_id: '0004A',
  type: '1',
  view_type: 'BIRDVIEWA',
  //
  id: 408,
  name: 'BIRDVIEW',
  updated_at: null,
};

const Detail: React.FC<IF> = (props: IF) => {
  const { validateFormData } = useValidation();
  const { t } = useTranslation();
  const history = useHistory();
  const location = useLocation();
  const pathName = location.pathname;
  const isTestPage = pathName.includes(IS_IMS_TEST);

  const compName =
    location.pathname.split('/')[3][0].toLowerCase() +
    location.pathname.split('/')[3].slice(1);

  const isUpdate = location.pathname.split(`${compName}/`)[1].includes('create')
    ? false
    : true;

  const { createData, updateData, isLoading } = useGroupDetailRequest();
  const systemData = useAppSelector((state: ReducerType) => state.info.current);
  const groupData = useAppSelector((state: ReducerType) => state.group.current);
  const groupListData = useAppSelector(
    (state: ReducerType) => state.group.list
  );
  const dispatch = useAppDispatch();

  // 뒤로가기
  const goBack = () => history.goBack();

  const submitFormData = async (values: typeof initialValues) => {
    const totalErr = await validateFormData(
      [
        'description',
        'id',
        'region',
        'updated_at',
        'registered_at',
        'node_type',
        'session',
        'max_instances',
      ],
      'CreateSystemRule',
      values,
      'venue'
    );
    formik.setErrors(totalErr);

    // 에러가 있으면 저장요청을 하지 못하게 리턴한다.
    if (Object.keys(totalErr).length !== 0) {
      return;
    }
    // 서버에 저장 요청
    const result = isUpdate
      ? await updateData(systemData.id, groupData.id, values, isTestPage)
      : await createData(systemData.id, values, isTestPage);
    if (!result) return;
    // dispatch(setList([...groupListData, { ...values, id: result.id }]));
    dispatch(setList([...groupListData, { ...result }]));
    dispatch(setCurrent(result));

    let nextPath;
    // update
    if (location.pathname.split('system')[1].includes('update')) {
      nextPath = isTestPage ? TEST_SYSTEM_UPDATE_GROUP : SYSTEM_UPDATE_GROUP;
    }
    // create
    else {
      nextPath = isTestPage ? TEST_SYSTEM_CREATE_GROUP : SYSTEM_CREATE_GROUP;
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

    formik.setValues(groupData, false);
  }, []);

  /////////////////////////////////////
  return (
    <>
      <PageLoaderModal isOpen={isLoading} />

      <section className='cms__basic mt-12'>
        <form className='cms__form' onSubmit={formik.handleSubmit}>
          <h1 className='text-xl uppercase font-extrabold'>
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

          {/* country */}
          <Select id='node_type' name='node_type' label='* Node Type'>
            {NODE_TYPE.list.map((item) => {
              return (
                <Option key={item.code} value={item.code} label={item.name} />
              );
            })}
          </Select>
          {/* Event Name */}
          <Input
            id='session'
            name='session'
            type='number'
            placeholder={t('system:session')}
            onClick={(e) => resetError(e)}
            onChange={formik.handleChange}
            errMsg={formik.errors['session']}
            autoComplete='on'
            label={t('system:sessionLabelWithAsterisk')}
            value={formik.values['session'] || ''}
          />

          {/* event year and month */}
          <Input
            id='max_instances'
            name='max_instances'
            type='number'
            placeholder={t('system:maxInstances')}
            onClick={(e) => resetError(e)}
            onChange={formik.handleChange}
            errMsg={formik.errors['max_instances']}
            autoComplete='on'
            label={t('system:maxInstancesWithAsterisk')}
            value={formik.values['max_instances'] || ''}
          />

          {/* description */}
          <Input
            id='description'
            name='description'
            type='text'
            placeholder={t('system:descriptionPlaceholder')}
            onClick={(e) => resetError(e)}
            onChange={formik.handleChange}
            errMsg={formik.errors['description']}
            autoComplete='on'
            label={t('system:description')}
            value={formik.values['description'] || ''}
          />

          {/* buttons */}
          <div className='btns-wrapper intro-y col-span-12 flex items-center justify-center sm:justify-end mt-5'>
            <Button type='button' color='btn-secondary' onClick={goBack}>
              {t('cancel')}
            </Button>
            <Button type='submit' color='btn-primary'>
              {t('save')}
            </Button>
          </div>
        </form>
      </section>
    </>
  );
};
export default Detail;
