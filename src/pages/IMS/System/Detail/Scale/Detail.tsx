import React, { lazy, useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useFormik } from 'formik';
import { useTranslation } from 'react-i18next';

import { useValidation } from '@/hooks/validation-hooks';
import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { ReducerType } from '@/redux/reducer';
import { setList, setCurrent } from '@/redux/IMS/system/scaleSlices';
import { useScaleDetailRequest } from '@/apis/IMS/system/detail/scale/detail';
import {
  IS_IMS_TEST,
  SYSTEM_CREATE_SCALE,
  SYSTEM_UPDATE_SCALE,
  TEST_SYSTEM_CREATE_SCALE,
  TEST_SYSTEM_UPDATE_SCALE,
} from '@/settings/constants';
import { trimAllData } from '@/utils/commonFn';
import { REGION_TYPE } from '@/settings/imsStringData';

const Input = lazy(() => import('comp/Input/InputText'));
const Button = lazy(() => import('comp/Button/Button'));
import Select, { Option } from 'comp/Input/Select';

interface IF {}

export const initialValues = {
  scale_group_count: undefined,
  scale_image_id: '',
  scale_instance_type: '',
  scale_instance_type2: '',
  scale_subnet_ids: '',
  scale_monitoring_tag_name: '',
  scale_monitoring_tag_value: '',
  scale_on: '',
  scale_out_resource: 0,
  scale_in_resource: 0,
  scale_out_limit_time: 0,
  scale_ss_name: '',
  scale_key_name: '',
  region: '',
  scale_security_group_ids: '',
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

  const { createData, updateData, isLoading } = useScaleDetailRequest();
  const systemData = useAppSelector((state: ReducerType) => state.info.current);
  const scaleData = useAppSelector((state: ReducerType) => state.scale.current);
  const scaleListData = useAppSelector(
    (state: ReducerType) => state.scale.list
  );
  const dispatch = useAppDispatch();

  // 뒤로가기
  const goBack = () => history.goBack();

  const submitFormData = async (values: typeof initialValues) => {
    const totalErr = await validateFormData(
      [
        'id',
        'region',
        'updated_at',
        'registered_at',
        'scale_group_count',
        'scale_image_id',
        'scale_instance_type',
        'scale_instance_type2',
        'scale_subnet_ids',
        'scale_monitoring_tag_name',
        'scale_monitoring_tag_value',
        'scale_on',
        'scale_out_resource',
        'scale_in_resource',
        'scale_out_limit_time',
        'scale_ss_name',
        'scale_key_name',
        'region',
        'scale_security_group_ids',
      ],
      'CreateSystemScale',
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
      ? await updateData(
          systemData.id,
          scaleData.id,
          trimAllData(values),
          isTestPage
        )
      : await createData(systemData.id, trimAllData(values), isTestPage);

    if (!result) return;
    // dispatch(setList([...scaleListData, { ...values, id: result.id }]));
    dispatch(setList([...scaleListData, { ...result }]));
    dispatch(setCurrent(result));

    // history.push(
    //   location.pathname.split('system')[1].includes('update')
    //     ? SYSTEM_UPDATE_SCALE
    //     : SYSTEM_CREATE_SCALE
    // );
    let nextPath;
    // update일 경우
    if (location.pathname.split('system')[1].includes('update')) {
      nextPath = isTestPage ? TEST_SYSTEM_UPDATE_SCALE : SYSTEM_UPDATE_SCALE;

      // create일 경우
    } else {
      nextPath = isTestPage ? TEST_SYSTEM_CREATE_SCALE : SYSTEM_CREATE_SCALE;
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
    // console.log({ scaleData });

    formik.setValues(scaleData, false);
  }, []);

  ////////////////////////////////////////////
  return (
    <article className='cms__basic mt-12'>
      <form className='cms__form' onSubmit={formik.handleSubmit}>
        <h1 className='text-xl uppercase font-extrabold'>
          {`${compName} ${isUpdate ? 'UPDATE' : 'CREATE'} `}
        </h1>
        <h3>{t('asteriskIsRequired')}</h3>

        <Input
          id='scale_group_count'
          name='scale_group_count'
          type='number'
          placeholder={t('system:scaleGroupCount')}
          onClick={(e) => resetError(e)}
          onChange={formik.handleChange}
          errMsg={formik.errors['scale_group_count']}
          autoComplete='on'
          label={t('system:scaleGroupCount')}
          value={formik.values['scale_group_count'] || ''}
        />

        <Input
          id='scale_image_id'
          name='scale_image_id'
          type='text'
          placeholder={t('system:scaleImageId')}
          onClick={(e) => resetError(e)}
          onChange={formik.handleChange}
          errMsg={formik.errors['scale_image_id']}
          autoComplete='on'
          label={t('system:scaleImageId')}
          value={formik.values['scale_image_id'] || ''}
        />

        <Input
          id='scale_instance_type'
          name='scale_instance_type'
          type='text'
          placeholder={t('system:scaleInstanceType')}
          onClick={(e) => resetError(e)}
          onChange={formik.handleChange}
          errMsg={formik.errors['scale_instance_type']}
          autoComplete='on'
          label={t('system:scaleInstanceType')}
          value={formik.values['scale_instance_type'] || ''}
        />
        <Input
          id='scale_instance_type2'
          name='scale_instance_type2'
          type='text'
          placeholder={t('system:scaleInstanceType2')}
          onClick={(e) => resetError(e)}
          onChange={formik.handleChange}
          errMsg={formik.errors['scale_instance_type2']}
          autoComplete='on'
          label={t('system:scaleInstanceType2')}
          value={formik.values['scale_instance_type2'] || ''}
        />

        <Input
          id='scale_subnet_ids'
          name='scale_subnet_ids'
          type='text'
          placeholder={t('system:scaleSubnetIds')}
          onClick={(e) => resetError(e)}
          onChange={formik.handleChange}
          errMsg={formik.errors['scale_subnet_ids']}
          autoComplete='on'
          label={t('system:scaleSubnetIds')}
          value={formik.values['scale_subnet_ids'] || ''}
        />
        <Input
          id='scale_monitoring_tag_name'
          name='scale_monitoring_tag_name'
          type='text'
          placeholder={t('system:scaleMonitoringTagName')}
          onClick={(e) => resetError(e)}
          onChange={formik.handleChange}
          errMsg={formik.errors['scale_monitoring_tag_name']}
          autoComplete='on'
          label={t('system:scaleMonitoringTagName')}
          value={formik.values['scale_monitoring_tag_name'] || ''}
        />
        <Input
          id='scale_monitoring_tag_value'
          name='scale_monitoring_tag_value'
          type='text'
          placeholder={t('system:scaleMonitoringTagValue')}
          onClick={(e) => resetError(e)}
          onChange={formik.handleChange}
          errMsg={formik.errors['scale_monitoring_tag_value']}
          autoComplete='on'
          label={t('system:scaleMonitoringTagValue')}
          value={formik.values['scale_monitoring_tag_value'] || ''}
        />
        <Input
          id='scale_on'
          name='scale_on'
          type='text'
          placeholder={t('system:scaleOn')}
          onClick={(e) => resetError(e)}
          onChange={formik.handleChange}
          errMsg={formik.errors['scale_on']}
          autoComplete='on'
          label={t('system:scaleOn')}
          value={formik.values['scale_on'] || ''}
        />
        <Input
          id='scale_out_resource'
          name='scale_out_resource'
          type='number'
          placeholder={t('system:scaleOutResource')}
          onClick={(e) => resetError(e)}
          onChange={formik.handleChange}
          errMsg={formik.errors['scale_out_resource']}
          autoComplete='on'
          label={t('system:scaleOutResource')}
          value={formik.values['scale_out_resource'] || ''}
        />
        <Input
          id='scale_in_resource'
          name='scale_in_resource'
          type='number'
          placeholder={t('system:scaleInResource')}
          onClick={(e) => resetError(e)}
          onChange={formik.handleChange}
          errMsg={formik.errors['scale_in_resource']}
          autoComplete='on'
          label={t('system:scaleInResource')}
          value={formik.values['scale_in_resource'] || ''}
        />
        <Input
          id='scale_out_limit_time'
          name='scale_out_limit_time'
          type='number'
          placeholder={t('system:scaleOutTimeLimit')}
          onClick={(e) => resetError(e)}
          onChange={formik.handleChange}
          errMsg={formik.errors['scale_out_limit_time']}
          autoComplete='on'
          label={t('system:scaleOutTimeLimit')}
          value={formik.values['scale_out_limit_time'] || ''}
        />
        <Input
          id='scale_ss_name'
          name='scale_ss_name'
          type='text'
          placeholder={t('system:scaleSsName')}
          onClick={(e) => resetError(e)}
          onChange={formik.handleChange}
          errMsg={formik.errors['scale_ss_name']}
          autoComplete='on'
          label={t('system:scaleSsName')}
          value={formik.values['scale_ss_name'] || ''}
        />
        <Input
          id='scale_key_name'
          name='scale_key_name'
          type='text'
          placeholder={t('system:scaleKeyName')}
          onClick={(e) => resetError(e)}
          onChange={formik.handleChange}
          errMsg={formik.errors['scale_key_name']}
          autoComplete='on'
          label={t('system:scaleKeyName')}
          value={formik.values['scale_key_name'] || ''}
        />
        <Select
          id='region'
          name='region'
          onClick={(e) => resetError(e)}
          onChange={formik.handleChange}
          errMsg={formik.errors['region']}
          autoComplete='on'
          label={t('system:region')}
          value={formik.values['region'] || ''}
        >
          <option value='' disabled hidden>
            {t('select')}
          </option>
          {REGION_TYPE.list.map((item) => {
            return (
              <Option key={item.code} value={item.code} label={item.code} />
            );
          })}
        </Select>
        <Input
          id='scale_security_group_ids'
          name='scale_security_group_ids'
          type='text'
          placeholder={t('system:scaleSecuritysGroupIds')}
          onClick={(e) => resetError(e)}
          onChange={formik.handleChange}
          errMsg={formik.errors['scale_security_group_ids']}
          autoComplete='on'
          label={t('system:scaleSecuritysGroupIds')}
          value={formik.values['scale_security_group_ids'] || ''}
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
    </article>
  );
};
export default Detail;
