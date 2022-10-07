import React, { useState, useContext, lazy } from 'react';
import ReactDOM from 'react-dom';

import { useFormik } from 'formik';
import { useTranslation } from 'react-i18next';
import ReactTooltip from 'react-tooltip';

import { classNames, IsJsonString, showNotification } from '@/utils/commonFn';
import { useCMSLiveAndVodRequest } from '@/apis/CMS/liveAndVod';

import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { useCMS } from '@/hooks/cms-hooks';
import {
  setParentCurrent,
  setChildCurrent,
  updateParentContent,
  addParentContent,
  updateChildContent,
  addChildContent,
} from '@/redux/CMS/contentSlices';

import { usePlayInfoHooks } from '@/hooks/CMS/usePlayInfo-hooks';
import { CMSContext } from 'cont/cms';
import { useValidation } from '@/hooks/validation-hooks';

import Input, { Textarea } from 'comp/Input/InputText';
import Select, { Option } from 'comp/Input/Select';

const Button = lazy(() => import('comp/Button/Button'));
const Modal = lazy(() => import('comp/Modal/Modal'));

const SPORT_SELECTION = [
  { value: 1, label: 'baseball' },
  { value: 2, label: 'Soccer' },
  { value: 3, label: 'ice hockey' },
  { value: 4, label: 'Basekeball' },
  { value: 5, label: 'Volleyball' },
  { value: 6, label: 'Taekwondo' },
  { value: 7, label: 'Golf' },
  { value: 8, label: 'Judo' },
  { value: 9, label: 'Tennis' },
  { value: 10, label: 'Football' },
];
interface IF extends Onclick {
  isShow?: boolean;
  onClose?: () => void;
  onCloseAndGetValue?: (param) => void;
  data?: any;
  type?: string;
  _id?: string;
  content_id?: string;
  league_id?: string;
  idx?: number;
}
export const InfoInputs: React.FC<IF> = (props: IF) => {
  const { t } = useTranslation();
  const { validateFormData } = useValidation();
  const dispatch = useAppDispatch();
  const { isUpdate } = useContext(CMSContext);

  const { updatePlayInfo } = useCMSLiveAndVodRequest();
  const {
    playInfoData,
    handleResetPlayInfoValues,
    handleSetPlayInfoValues,
    handleUpdatePlayInfoValues,
  } = usePlayInfoHooks();

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // const dispatch = useAppDispatch();

  const submitFormData = async (values) => {
    let totalErr = await validateFormData(
      ['etc'],
      'createCMSLiveObjInfo',
      values,
      'cms'
    );

    if (IsJsonString(values.etc) === false) {
      formik.setFieldError('etc', 'etcNotJson');
      showNotification(t('cms:etcNotJson'), 'error');
      totalErr = { ...totalErr, etc: 'etcNotJson' };
    }

    formik.setErrors(totalErr);

    if (Object.keys(totalErr).length !== 0) return;

    const result = await updatePlayInfo(
      values,
      props.type,
      props.content_id,
      props._id,
      props.league_id
    );

    // 서버 요청 성공 시에만 리덕스 업데이트
    if (!result) return;

    // updated redux
    dispatch(result.have_parent ? setChildCurrent(result) : setParentCurrent(result));

    // new redux 로직 update
    if (result.have_parent) {
      dispatch(isUpdate ? updateChildContent(result) : addChildContent(result));
    } else {
      dispatch(isUpdate ? updateParentContent(result) : addParentContent(result));
    }
    returnValues();
  };

  const formik = useFormik({
    initialValues: props.data ? props.data : handleUpdatePlayInfoValues(props.data, 'unSaved'),
    validate: null,
    onSubmit: submitFormData,
    validateOnChange: false,
    validateOnBlur: false,
  });

  const resetError = (e) => {
    const name = e.target.name;
    formik.setErrors({ ...formik.errors, [name]: '' });
  };

  const returnValues = () => props.onCloseAndGetValue(formik.values);

  return ReactDOM.createPortal(
    <>      
      <Modal
        isShow={isModalOpen}
        title='Close Modal'
        content={<span>{t('UnsavedInfoWillGone')} <br />{t('pleaseCheckBeforeClose')}</span>}
        type='warning'
        closeBtn
        onClose={() => setIsModalOpen(false)}
      >
        <Button
          color='btn-secondary'
          onClick={() => {
            setIsModalOpen(false);
            props.onClose();
          }}
        >
          Close Modal
        </Button>
      </Modal>      
      <article>
        <form className={classNames`${props.isShow ? 'cms__form--modal' : 'invisible-and-take-no-space'}`} onSubmit={formik.handleSubmit}>
          <h1 className='text-xl font-extrabold'>Play Info</h1>
          <h3>* : required</h3>
          <div className='inputs'>
            <Input
              id='home_team_score'
              name='home_team_score'
              type='number'
              placeholder='home team score'
              onClick={(e) => resetError(e)}
              onChange={formik.handleChange}
              errMsg={formik.errors.home_team_score}
              label='*home team score'
              autoComplete='on'
              transformDirection='intro-y'
              value={formik.values.home_team_score || 0}
            />

            <Input
              id='away_team_score'
              name='away_team_score'
              type='number'
              placeholder='away team score'
              onClick={(e) => resetError(e)}
              onChange={formik.handleChange}
              errMsg={formik.errors.away_team_score}
              label='*away team score'
              autoComplete='on'
              transformDirection='intro-y'
              value={formik.values.away_team_score || 0}
            />

            {/* for baseball */}
            {/* 무조건 3글자 */}
            {formik.values.sport === '1' && (
              <>
                <div data-tip='e.g) 100(when player is at 1st base)'>
                  <Input
                    id='extra_1_str'
                    name='extra_1_str'
                    type='text'
                    placeholder='e.g) 100(when player is at 1st base)'
                    onClick={(e) => resetError(e)}
                    onChange={formik.handleChange}
                    errMsg={formik.errors.extra_1_str}
                    label='*Base status'
                    autoComplete='on'
                    transformDirection='intro-y'
                    value={formik.values.extra_1_str || ''}
                  />
                </div>
                <ReactTooltip />
              </>
            )}

            {/* ///////////////////////////////////////// */}
            <Input
              id='present_round'
              name='present_round'
              type='text'
              placeholder='present round'
              onClick={(e) => resetError(e)}
              onChange={formik.handleChange}
              errMsg={formik.errors.present_round}
              label='*present round'
              autoComplete='on'
              transformDirection='intro-y'
              value={formik.values.present_round || ''}
            />
            <Input
              id='present_quarter'
              name='present_quarter'
              type='number'
              placeholder='present quarter'
              onClick={(e) => resetError(e)}
              onChange={formik.handleChange}
              errMsg={formik.errors.present_quarter}
              label='*present quarter'
              autoComplete='on'
              transformDirection='intro-y'
              value={formik.values.present_quarter || 0}
            />

            {/* ////////////////////////// */}

            <Select
              name='sport'
              id='sport'
              onChange={formik.handleChange}
              onClick={(e) => resetError(e)}
              errMsg={formik.errors.sport}
              value={formik.values.sport || ''}
              label='*sport'
            >
              <option value='' disabled hidden>Select sport</option>
              {SPORT_SELECTION?.map((sport) => {
                return (
                  <Option
                    key={sport.value}
                    value={sport.value}
                    label={sport.label}
                  />
                );
              })}
            </Select>
            <Select
              name='play_type'
              id='play_type'
              onChange={formik.handleChange}
              onClick={(e) => resetError(e)}
              errMsg={formik.errors.play_type}
              value={formik.values.play_type || ''}
              label='*play type'
            >
              <option value='' disabled hidden>Select play type</option>
              <Option value='1' label='팀대항전(Team match)' />
              <Option value='2' label='팀종합(Team total)' />
              <Option value='3' label='개인대항전(Individual competition)' />
              <Option value='4' label='개인종합(Individual total)' />
            </Select>
            <Input
              id='detail_url'
              name='detail_url'
              type='text'
              placeholder='detail url'
              onClick={(e) => resetError(e)}
              onChange={formik.handleChange}
              errMsg={formik.errors.detail_url}
              label='*detail url'
              autoComplete='on'
              transformDirection='intro-y'
              value={formik.values.detail_url || ''}
            />
            <Input
              id='api_url'
              name='api_url'
              type='text'
              placeholder='example: http://mlb.com'
              onClick={(e) => resetError(e)}
              onChange={formik.handleChange}
              errMsg={formik.errors.api_url}
              label='api url'
              autoComplete='on'
              transformDirection='intro-y'
              value={formik.values.api_url || ''}
            />

            {/* ///////////////////////////////////////////////////////// */}
            <div className='mt-4'>
              <label className='capitalize mt-3'>Home Team Name</label>
              <div className='flex flex-col mt-2 md:flex-row'>
                <div className='flex-1 md:mr-1'>
                  <Input
                    id='home_team_name__en-US'
                    name='home_team_name__en-US'
                    type='text'
                    placeholder=''
                    onClick={(e) => resetError(e)}
                    onChange={formik.handleChange}
                    errMsg={formik.errors['home_team_name__en-US']}
                    label='*English'
                    autoComplete='on'
                    transformDirection='intro-y'
                    design='inputGroupHeader'
                    noMarginTop
                    value={formik.values['home_team_name__en-US'] || ''}
                  />
                </div>
                <div className='flex-1 md:mr-1'>
                  <Input
                    id='home_team_name__ko-KR'
                    name='home_team_name__ko-KR'
                    type='text'
                    placeholder=''
                    onClick={(e) => resetError(e)}
                    onChange={formik.handleChange}
                    errMsg={formik.errors['home_team_name__ko-KR']}
                    label='*Korean'
                    autoComplete='on'
                    transformDirection='intro-y'
                    design='inputGroupHeader'
                    noMarginTop
                    value={formik.values['home_team_name__ko-KR'] || ''}
                  />
                </div>
              </div>
            </div>

            <div className='mt-4'>
              <label className='capitalize mt-3'>Home Team Nickname</label>
              <div className='flex flex-col mt-2 md:flex-row'>
                <div className='flex-1 md:mr-1'>
                  <Input
                    id='home_team_nickname__en-US'
                    name='home_team_nickname__en-US'
                    type='text'
                    placeholder=''
                    onClick={(e) => resetError(e)}
                    onChange={formik.handleChange}
                    errMsg={formik.errors['home_team_nickname__en-US']}
                    label='*English'
                    autoComplete='on'
                    transformDirection='intro-y'
                    design='inputGroupHeader'
                    noMarginTop
                    value={formik.values['home_team_nickname__en-US'] || ''}
                  />
                </div>
                <div className='flex-1 md:mr-1'>
                  <Input
                    id='home_team_nickname__ko-KR'
                    name='home_team_nickname__ko-KR'
                    type='text'
                    placeholder=''
                    onClick={(e) => resetError(e)}
                    onChange={formik.handleChange}
                    errMsg={formik.errors['home_team_nickname__ko-KR']}
                    label='*Korean'
                    autoComplete='on'
                    transformDirection='intro-y'
                    design='inputGroupHeader'
                    noMarginTop
                    value={formik.values['home_team_nickname__ko-KR'] || ''}
                  />
                </div>
              </div>
            </div>

            {/* ////////////////////////////////////////////////////////////////////// */}
            {/* away */}
            <div className='mt-4'>
              <label className='capitalize mt-3'>Away Team Name</label>
              <div className='flex flex-col mt-2 md:flex-row'>
                <div className='flex-1 md:mr-1'>
                  <Input
                    id='away_team_name__en-US'
                    name='away_team_name__en-US'
                    type='text'
                    placeholder=''
                    onClick={(e) => resetError(e)}
                    onChange={formik.handleChange}
                    errMsg={formik.errors['away_team_name__en-US']}
                    label='*English'
                    autoComplete='on'
                    transformDirection='intro-y'
                    design='inputGroupHeader'
                    noMarginTop
                    value={formik.values['away_team_name__en-US'] || ''}
                  />
                </div>
                <div className='flex-1 md:mr-1'>
                  <Input
                    id='away_team_name__ko-KR'
                    name='away_team_name__ko-KR'
                    type='text'
                    placeholder=''
                    onClick={(e) => resetError(e)}
                    onChange={formik.handleChange}
                    errMsg={formik.errors['away_team_name__ko-KR']}
                    label='*Korean'
                    autoComplete='on'
                    transformDirection='intro-y'
                    design='inputGroupHeader'
                    noMarginTop
                    value={formik.values['away_team_name__ko-KR'] || ''}
                  />
                </div>
              </div>
            </div>

            <div className='mt-4'>
              <label className='capitalize mt-3'>Away Team Nickname</label>
              <div className='flex flex-col mt-2 md:flex-row'>
                <div className='flex-1 md:mr-1'>
                  <Input
                    id='away_team_nickname__en-US'
                    name='away_team_nickname__en-US'
                    type='text'
                    placeholder=''
                    onClick={(e) => resetError(e)}
                    onChange={formik.handleChange}
                    errMsg={formik.errors['away_team_nickname__en-US']}
                    label='*English'
                    autoComplete='on'
                    transformDirection='intro-y'
                    design='inputGroupHeader'
                    noMarginTop
                    value={formik.values['away_team_nickname__en-US'] || ''}
                  />
                </div>
                <div className='flex-1 md:mr-1'>
                  <Input
                    id='away_team_nickname__ko-KR'
                    name='away_team_nickname__ko-KR'
                    type='text'
                    placeholder=''
                    onClick={(e) => resetError(e)}
                    onChange={formik.handleChange}
                    errMsg={formik.errors['away_team_nickname__ko-KR']}
                    label='*Korean'
                    autoComplete='on'
                    transformDirection='intro-y'
                    design='inputGroupHeader'
                    noMarginTop
                    value={formik.values['away_team_nickname__ko-KR'] || ''}
                  />
                </div>
              </div>
            </div>

            <Input
              id='home_team_icon'
              name='home_team_icon'
              type='text'
              placeholder=''
              onClick={(e) => resetError(e)}
              onChange={formik.handleChange}
              errMsg={formik.errors.home_team_icon}
              label='*home team icon'
              autoComplete='on'
              transformDirection='intro-y'
              value={formik.values.home_team_icon || ''}
            />
            <Input
              id='away_team_icon'
              name='away_team_icon'
              type='text'
              placeholder=''
              onClick={(e) => resetError(e)}
              onChange={formik.handleChange}
              errMsg={formik.errors.away_team_icon}
              label='*away team icon'
              autoComplete='on'
              transformDirection='intro-y'
              value={formik.values.away_team_icon || ''}
            />

            <Textarea
              rows={10}
              id='etc'
              name='etc'
              type='text'
              placeholder=''
              onClick={(e) => resetError(e)}
              onChange={formik.handleChange}
              errMsg={formik.errors['etc']}
              label='*etc'
              autoComplete='on'
              transformDirection='intro-y'
              value={formik.values['etc'] || ''}
            />
          </div>

          {/* buttons */}
          <div className='btns-wrapper intro-y col-span-12 flex items-center justify-center sm:justify-end mt-5'>
            <Button
              type='button'
              color='btn-secondary'
              onClick={() => setIsModalOpen(true)}
            >
              Cancel
            </Button>
            <Button type='submit' color='btn-primary'>
              Save
            </Button>
          </div>
        </form>
      </article>
    </>,
    document.getElementById('modal-hook')
  );
};
export default InfoInputs;
