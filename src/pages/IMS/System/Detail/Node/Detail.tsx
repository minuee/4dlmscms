import React, { useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useFormik } from 'formik';
import { useTranslation } from 'react-i18next';

import { useValidation } from '@/hooks/validation-hooks';
import { useNodeDetailRequest } from '@/apis/IMS/system/detail/node/detail';
import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { ReducerType } from '@/redux/reducer';
import { setCurrent, setList } from '@/redux/IMS/system/nodeSlices';

import {
  IS_IMS_TEST,
  SYSTEM_CREATE_NODE,
  SYSTEM_UPDATE_NODE,
  TEST_SYSTEM_CREATE_NODE,
  TEST_SYSTEM_UPDATE_NODE,
} from '@/settings/constants';
import {
  returnBoolean,
  returnImsBoolString,
  trimAllData,
  trimAllWhitespace,
} from '@/utils/commonFn';

import {
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
  public_ip: '',
  public_port: undefined,
  private_ip: '',
  private_port: undefined,
  node_type: NODE_TYPE.list[0].code,
  is_origin: false,
  domain: '',
  region: '',
  // region_name: '',
  instance_id: '',
  initial_state: '',
  initial_state_code: '',
  state: '',
  state_name: '',
  // is_auto_scale_out: false,
  ls_type: LS_TYPE.list[0].code,
  ml_type: ML_TYPE.list[0].code,
  deploy_type: DEPLOY_TYPE.list[0].code,
  parent_node_id: undefined,
  //
  id: undefined,
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

  const { createData, updateData, isLoading } = useNodeDetailRequest();
  const systemData = useAppSelector((state: ReducerType) => state.info.current);
  const nodeData = useAppSelector((state: ReducerType) => state.node.current);
  const nodeListData = useAppSelector((state: ReducerType) => state.node.list);
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
        'is_origin',
        'is_auto_scale_out',
        'node_type',
        'parent_node_id',
        'public_ip',
        'public_port',
        'private_ip',
        'private_port',
        'domain',
        'region',
        // 'region_name',
        'instance_id',
        'initial_state',
        'state',
        'state_name',
        'ls_type',
        'ml_type',
        'deploy_type',
        'parent_node_id',
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
      is_origin: returnImsBoolString(values.is_origin),
      public_ip: trimAllWhitespace(values.public_ip),
      private_ip: trimAllWhitespace(values.private_ip),
      // is_auto_scale_out: returnImsBoolString(values.is_auto_scale_out),
    };
    const result = isUpdate
      ? await updateData(systemData.id, nodeData.id, data, isTestPage)
      : await createData(systemData.id, data, isTestPage);

    // console.log({ result });

    if (!result) return;
    // dispatch(setList([...nodeListData, { ...values, id: result.id }]));
    dispatch(setList([...nodeListData, { ...result }]));
    dispatch(setCurrent(result));

    let nextPath;
    // update일 경우
    if (location.pathname.split('system')[1].includes('update')) {
      nextPath = isTestPage ? TEST_SYSTEM_UPDATE_NODE : SYSTEM_UPDATE_NODE;

      // create일 경우
    } else {
      nextPath = isTestPage ? TEST_SYSTEM_CREATE_NODE : SYSTEM_CREATE_NODE;
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

    // console.log({ nodeData });

    formik.setValues(nodeData, false);
    // node type
    const nodeType = NODE_TYPE.list.find(
      (item) => item.name === nodeData?.node_type
    )?.code;
    formik.setFieldValue('node_type', nodeType, false);
    // ls type
    const lsType = LS_TYPE.list.find(
      (item) => item.code === nodeData?.ls_type
    )?.code;
    formik.setFieldValue('ls_type', lsType, false);
    // ml type
    const mlType = ML_TYPE.list.find(
      (item) => item.code === nodeData?.ml_type
    )?.code;
    formik.setFieldValue('ml_type', mlType, false);
    // deploy type
    const deployType = DEPLOY_TYPE.list.find(
      (item) => item.code === nodeData?.deploy_type
    )?.code;
    formik.setFieldValue('deploy_type', deployType, false);

    // is origin
    const isOrigin = returnBoolean(nodeData?.is_origin);
    formik.setFieldValue('is_origin', isOrigin, false);

    // instance state
    const instanceState = INSTANCE_STATUS_TYPE.list.find(
      (item) => item.name.toLowerCase() === nodeData?.initial_state
    )?.code;
    formik.setFieldValue('initial_state', instanceState, false);

    // state
    const state = NODE_STATUS_TYPE.list.find(
      (item) => item.name.toLowerCase() === nodeData?.state_name
    )?.code;
    formik.setFieldValue('state', state, false);

    // is_auto_scale_out -> 제외하기
    // const isAutoScaleOut = returnBoolean(nodeData?.is_auto_scale_out);
    // formik.setFieldValue('is_auto_scale_out', isAutoScaleOut, false);
  }, []);

  ///////////////////////////////////////////
  return (
    <article className='cms__basic mt-12'>
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
        <Input
          id='public_ip'
          name='public_ip'
          type='text'
          placeholder={t('system:publicIp')}
          onClick={(e) => resetError(e)}
          onChange={formik.handleChange}
          errMsg={formik.errors['public_ip']}
          autoComplete='on'
          label={t('system:publicIp')}
          value={formik.values['public_ip'] || ''}
        />
        <Input
          id='public_port'
          name='public_port'
          type='number'
          placeholder={t('system:publicPort')}
          onClick={(e) => resetError(e)}
          onChange={formik.handleChange}
          errMsg={formik.errors['public_port']}
          autoComplete='on'
          label={t('system:publicPort')}
          value={formik.values['public_port'] || ''}
        />
        <Input
          id='private_ip'
          name='private_ip'
          type='text'
          placeholder={t('system:privateIp')}
          onClick={(e) => resetError(e)}
          onChange={formik.handleChange}
          errMsg={formik.errors['private_ip']}
          autoComplete='on'
          label={t('system:privateIp')}
          value={formik.values['private_ip'] || ''}
        />

        <Input
          id='private_port'
          name='private_port'
          type='number'
          placeholder={t('system:privatePort')}
          onClick={(e) => resetError(e)}
          onChange={formik.handleChange}
          errMsg={formik.errors['private_port']}
          autoComplete='on'
          label={t('system:privatePort')}
          value={formik.values['private_port'] || ''}
        />

        {/* <Input
          id='node_type'
          name='node_type'
          type='text'
          placeholder='node type'
          onClick={(e) => resetError(e)}
          onChange={formik.handleChange}
          errMsg={formik.errors['node_type']}
          autoComplete='on'
          label='node type'
          value={formik.values['node_type'] || ''}
        /> */}

        <Select
          id='node_type'
          name='node_type'
          onClick={(e) => resetError(e)}
          onChange={formik.handleChange}
          errMsg={formik.errors['node_type']}
          autoComplete='on'
          label={t('system:nodeType')}
          value={formik.values['node_type'] || ''}
        >
          <option value='' disabled hidden>
            {t('select')}
          </option>
          {NODE_TYPE.list.map((item) => {
            return (
              <Option key={item.code} value={item.code} label={item.name} />
            );
          })}
        </Select>

        <Toggle
          label={t('system:isOrigin')}
          name='is_origin'
          checked={formik.values.is_origin || false}
          onChange={formik.handleChange}
          tabIndex={0}
        />

        <Input
          id='domain'
          name='domain'
          type='text'
          placeholder={t('system:domain')}
          onClick={(e) => resetError(e)}
          onChange={formik.handleChange}
          errMsg={formik.errors['domain']}
          autoComplete='on'
          label={t('system:domain')}
          value={formik.values['domain'] || ''}
        />

        {/* <Input
          id='region'
          name='region'
          type='text'
          placeholder='region'
          onClick={(e) => resetError(e)}
          onChange={formik.handleChange}
          errMsg={formik.errors['region']}
          autoComplete='on'
          label='region'
          value={formik.values['region'] || ''}
        /> */}
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

        {/* <Input
          id='region_name'
          name='region_name'
          type='text'
          placeholder='region name'
          onClick={(e) => resetError(e)}
          onChange={formik.handleChange}
          errMsg={formik.errors['region_name']}
          autoComplete='on'
          label='region name'
          value={formik.values['region_name'] || ''}
        /> */}
        <Input
          id='instance_id'
          name='instance_id'
          type='text'
          placeholder={t('system:instanceId')}
          onClick={(e) => resetError(e)}
          onChange={formik.handleChange}
          errMsg={formik.errors['instance_id']}
          autoComplete='on'
          label={t('system:instanceId')}
          value={formik.values['instance_id'] || ''}
        />
        {/* <Input
          id='initial_state'
          name='initial_state'
          type='text'
          placeholder='instance state'
          onClick={(e) => resetError(e)}
          onChange={formik.handleChange}
          errMsg={formik.errors['initial_state']}
          autoComplete='on'
          label='instance state'
          value={formik.values['initial_state'] || ''}
        /> */}
        <Select
          id='initial_state'
          name='initial_state'
          onClick={(e) => resetError(e)}
          onChange={formik.handleChange}
          errMsg={formik.errors['initial_state']}
          label={t('system:instanceState')}
          value={formik.values['initial_state'] || ''}
        >
          <option value='' disabled hidden>
            {t('select')}
          </option>
          {INSTANCE_STATUS_TYPE.list.map((item) => {
            return (
              <Option key={item.code} value={item.code} label={item.name} />
            );
          })}
        </Select>
        {/* <Input
          id='state'
          name='state'
          type='text'
          placeholder='state'
          onClick={(e) => resetError(e)}
          onChange={formik.handleChange}
          errMsg={formik.errors['state']}
          autoComplete='on'
          label='state'
          value={formik.values['state'] || ''}
        /> */}
        <Select
          id='state'
          name='state'
          onClick={(e) => resetError(e)}
          onChange={formik.handleChange}
          errMsg={formik.errors['state']}
          label={t('system:state')}
          value={formik.values['state'] || ''}
        >
          <option value='' disabled hidden>
            {t('select')}
          </option>
          {NODE_STATUS_TYPE.list.map((item) => {
            return (
              <Option key={item.code} value={item.code} label={item.name} />
            );
          })}
        </Select>

        {/* <Toggle
          label='is auto scale out'
          name='is_auto_scale_out'
          checked={formik.values.is_auto_scale_out || false}
          onChange={formik.handleChange}
        /> */}

        <Select
          id='ls_type'
          name='ls_type'
          onClick={(e) => resetError(e)}
          onChange={formik.handleChange}
          errMsg={formik.errors['ls_type']}
          label={t('system:lsType')}
          value={formik.values['ls_type'] || ''}
        >
          <option value='' disabled hidden>
            {t('select')}
          </option>
          {LS_TYPE.list.map((item) => {
            return (
              <Option key={item.code} value={item.code} label={item.name} />
            );
          })}
        </Select>
        <Select
          id='ml_type'
          name='ml_type'
          onClick={(e) => resetError(e)}
          onChange={formik.handleChange}
          errMsg={formik.errors['ml_type']}
          autoComplete='on'
          label={t('system:mlType')}
          value={formik.values['ml_type'] || ''}
        >
          <option value='' disabled hidden>
            {t('select')}
          </option>
          {ML_TYPE.list.map((item) => {
            return (
              <Option key={item.code} value={item.code} label={item.desc} />
            );
          })}
        </Select>
        <Select
          id='deploy_type'
          name='deploy_type'
          onClick={(e) => resetError(e)}
          onChange={formik.handleChange}
          errMsg={formik.errors['deploy_type']}
          autoComplete='on'
          label={t('system:deployType')}
          value={formik.values['deploy_type'] || ''}
        >
          <option value='' disabled hidden>
            {t('select')}
          </option>
          {DEPLOY_TYPE.list.map((item) => {
            return (
              <Option key={item.code} value={item.code} label={item.name} />
            );
          })}
        </Select>
        <Input
          id='parent_node_id'
          name='parent_node_id'
          type='number'
          placeholder={t('system:parentNodeId')}
          onClick={(e) => resetError(e)}
          onChange={formik.handleChange}
          errMsg={formik.errors['parent_node_id']}
          autoComplete='on'
          label={t('system:parentNodeId')}
          value={formik.values['parent_node_id'] || ''}
        />

        {/* buttons */}
        <div className='btns-wrapper  col-span-12 flex items-center justify-center sm:justify-end mt-5'>
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
