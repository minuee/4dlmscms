import React, { useEffect, lazy } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useFormik } from 'formik';
import { useTranslation } from 'react-i18next';
import { iso31661 } from 'iso-3166';

import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { ReducerType } from '@/redux/reducer';
import { setCurrent, setList } from '@/redux/IMS/venue/venueSlices';

import { useValidation } from '@/hooks/validation-hooks';
import { useVenueDetailRequest } from '@/apis/IMS/venue/detail/index';

import { VENUE, IS_IMS_TEST } from '@/settings/constants';
import { ValueType } from '@/types/IMS/venue/index';

const Input = lazy(() => import('comp/Input/InputText'));
const Button = lazy(() => import('comp/Button/Button'));
const Select = lazy(() => import('comp/Input/Select'));
const PageLoaderModal = lazy(() => import('comp/PageLoader/PageLoaderModal'));
import { Option } from 'comp/Input/Select';

import { trimAllData } from '@/utils/commonFn';

interface IF {}

export const initialValues = {
  country_id: '',
  description: '',
  event_name: '',
  event_yymm: '',
  name: '',
  id: '',
  event_code: '',
};

const Detail: React.FC<IF> = (props: IF) => {
  const { validateFormData } = useValidation();
  const { t } = useTranslation();

  const history = useHistory();
  const location = useLocation();
  const pathName = location.pathname;
  const isTestPage = pathName.includes(IS_IMS_TEST);

  const { createData, updateData, isLoading } = useVenueDetailRequest();
  const venueData = useAppSelector((state: ReducerType) => state.venue.current);
  const venueListData = useAppSelector((state: ReducerType) => state.venue.list);
  const dispatch = useAppDispatch();

  // 뒤로가기
  const goBack = () => history.goBack();

  const submitFormData = async (values: ValueType) => {
    const totalErr = await validateFormData(
      [
        'id',
        'veneue_id',
        'event_code',
        'city_latitude',
        'city_longitude',
        'city_name',
        'comment',
        'state_name',
        'timezone_name',
        'timezone_offset',
        'updated_at',
      ],
      'CreateVenue',
      values,
      'venue'
    );
    formik.setErrors(totalErr);

    // 에러가 있으면 저장요청을 하지 못하게 리턴한다.
    if (Object.keys(totalErr).length !== 0) {
      return;
    }

    // 서버에 저장 요청
    const result = location.pathname.includes('update')
      ? await updateData(venueData.id, trimAllData(values), isTestPage)
      : await createData(trimAllData(values), isTestPage);

    if (!result) return;

    dispatch(setList([result, ...venueListData]));
    dispatch(setCurrent(result));
    history.push(VENUE);
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
    if (location.pathname.includes('create')) return;

    formik.setValues(venueData, false);
    formik.setFieldValue(
      'event_yymm',
      venueData.event_code.split('-')[0],
      false
    );
    let country_id = venueData.country_id.toString();
    if (country_id.length === 2) country_id = `0${country_id}`;
    formik.setFieldValue('country_id', country_id, false);
  }, []);

  return (
    <>
      <PageLoaderModal isOpen={isLoading} />

      <section className='cms__basic mt-12'>
        <form className='cms__form' onSubmit={formik.handleSubmit}>
          <h1 className='text-xl uppercase font-extrabold'>
            {t('venue:basicInfo')}
            {location.pathname.includes('update') ? 'UPDATE' : 'CREATE'}
          </h1>
          <h3>{t('asteriskIsRequired')}</h3>

          {/* name */}
          <Input
            id='name'
            name='name'
            type='text'
            placeholder={t('venue:name2CharPlaceholder')}
            onClick={(e) => resetError(e)}
            onChange={formik.handleChange}
            errMsg={formik.errors['name']}
            autoComplete='on'
            value={formik.values['name'] || ''}
            label={t('venue:nameLabelWithAsterisk')}
          />

          {/* country */}
          <Select
            id='country_id'
            name='country_id'
            label={t('venue:countryLabelWithAsterisk')}
            errMsg={formik.errors.country_id}
            onClick={resetError}
            value={formik.values.country_id || ''}
            onChange={formik.handleChange}
          >
            <option value='' disabled hidden>
              {t('select')}
            </option>
            {iso31661.map((country) => {
              return (
                <Option
                  key={country.alpha3}
                  value={country.numeric}
                  label={country.name}
                />
              );
            })}
          </Select>

          {/* Event Name */}
          <Input
            id='event_name'
            name='event_name'
            type='text'
            placeholder={t('venue:eventNamePlaceholder')}
            onClick={(e) => resetError(e)}
            onChange={formik.handleChange}
            errMsg={formik.errors['event_name']}
            autoComplete='on'
            label={t('venue:eventNameWithAsterisk')}
            value={formik.values['event_name'] || ''}
          />

          {/* event year and month */}
          <Input
            id='event_yymm'
            name='event_yymm'
            type='text'
            placeholder={t('venue:eventYymmPlaceholder')}
            onClick={(e) => resetError(e)}
            onChange={formik.handleChange}
            errMsg={formik.errors['event_yymm']}
            autoComplete='on'
            label={t('venue:eventYymmLabelWithAsterisk')}
            value={formik.values['event_yymm'] || ''}
          />

          {/* description */}
          <Input
            id='description'
            name='description'
            type='text'
            placeholder={t('venue:descriptionPlaceholder')}
            onClick={(e) => resetError(e)}
            onChange={formik.handleChange}
            errMsg={formik.errors['description']}
            autoComplete='on'
            label={t('venue:descriptionLabelWithAsterisk')}
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
