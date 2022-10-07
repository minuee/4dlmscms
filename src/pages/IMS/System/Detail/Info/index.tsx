import React, { lazy, useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useFormik } from 'formik';
import { useTranslation } from 'react-i18next';

import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { ReducerType } from '@/redux/reducer';
import { setCurrent, setList } from '@/redux/IMS/system/infoSlices';

import { useValidation } from '@/hooks/validation-hooks';
import { useSystemDetailRequest } from '@/apis/IMS/system/detail';
import { IS_IMS_TEST, SYSTEM, TEST_SYSTEM } from '@/settings/constants';

const Input = lazy(() => import('comp/Input/InputText'));
const Button = lazy(() => import('comp/Button/Button'));
const Toggle = lazy(() => import('@/components/Input/ToggleSlider'));
const Select = lazy(() => import('comp/Input/Select'));
import { Option } from 'comp/Input/Select';
import { PageLoaderModal } from 'comp/PageLoader/PageLoaderModal';
import {
  returnBoolean,
  returnImsBoolString,
  trimAllData,
} from '@/utils/commonFn';

interface IF {}

export const initialValues = {
  name: '',
  description: '',
  venue_id: '',
  fps: 0,
  width: 0,
  height: 0,
  is_extra: false,
  comment: '',
  // subinfo_updated_at: '',
  // country: '',
  //
  id: '',
};

const Detail: React.FC<IF> = (props: IF) => {
  const { validateFormData } = useValidation();
  const { t } = useTranslation();
  const history = useHistory();
  const location = useLocation();
  const pathName = location.pathname;
  const isTestPage = pathName.includes(IS_IMS_TEST);

  const { createData, updateData, isLoading } = useSystemDetailRequest();

  const infoData = useAppSelector((state: ReducerType) => state.info.current);
  const infoListData = useAppSelector((state: ReducerType) => state.info.list);
  const dispatch = useAppDispatch();

  const venueListData = useAppSelector(
    (state: ReducerType) => state.venue.list
  );

  useEffect(() => {
    // 수정 시 값을 세팅해준다.
    if (location.pathname.includes('create')) return;
    // console.log({ infoData });
    // console.log({ venueListData });

    formik.setValues(infoData, false);
    // isExtra
    const isExtra = returnBoolean(infoData?.is_extra);
    formik.setFieldValue('is_extra', isExtra, false);
  }, []);

  // 뒤로가기
  const goBack = () => history.goBack();

  const submitFormData = async (values: typeof initialValues) => {
    const totalErr = await validateFormData(
      [
        'id',
        'comment',
        'description',
        'fps',
        'width',
        'height',
        'is_extra',
        'updated_at',
      ],
      'CreateSystem',
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
      is_extra: returnImsBoolString(values.is_extra),
    };
    const result = location.pathname.includes('update')
      ? await updateData(infoData.id, data, isTestPage)
      : await createData(data, isTestPage);

    if (!result) return;
    // dispatch(
    //   setList([
    //     {
    //       ...values,
    //       id: result.id,
    //       registered_at: result.registeredAt,
    //     },
    //     ...infoListData,
    //   ])
    // );
    // TODO: 이미 있는 데이터면 수정해야 함
    dispatch(setList([...infoListData, { ...result }]));
    dispatch(setCurrent(result));

    history.push(isTestPage ? TEST_SYSTEM : SYSTEM);
  };

  const formik = useFormik({
    initialValues: {
      ...initialValues,
      venue_id: venueListData[0]?.id,
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

  return (
    <>
      <PageLoaderModal isOpen={isLoading} />

      <section className='cms__basic mt-12'>
        <form className='cms__form' onSubmit={formik.handleSubmit}>
          <h1 className='text-xl uppercase font-extrabold'>
            Info {location.pathname.includes('update') ? 'UPDATE' : 'CREATE'}
          </h1>
          <h3>* : required</h3>

          {/* name */}
          <Input
            id='name'
            name='name'
            type='text'
            placeholder='name'
            onClick={(e) => resetError(e)}
            onChange={formik.handleChange}
            errMsg={formik.errors['name']}
            autoComplete='on'
            value={formik.values['name'] || ''}
            label='* Name'
          />

          {/* venue id */}
          {/* TODO: select로 바꾸기 */}
          {/* <Input
            id='venue_id'
            name='venue_id'
            type='text'
            placeholder='venue id'
            onClick={(e) => resetError(e)}
            onChange={formik.handleChange}
            errMsg={formik.errors['venue_id']}
            autoComplete='on'
            value={formik.values['venue_id'] || ''}
            label='* venue id'
          /> */}

          <Select
            id='venue_id'
            name='venue_id'
            label='* Venue ID'
            errMsg={formik.errors.venue_id}
            onClick={resetError}
            value={formik.values.venue_id || venueListData[0].id}
            onChange={formik.handleChange}
          >
            {venueListData.map((venue) => {
              return (
                <Option
                  key={venue.id}
                  value={venue.id}
                  label={`${venue.name}(${venue.id})`}
                />
              );
            })}
          </Select>

          <Input
            id='description'
            name='description'
            type='text'
            placeholder='description'
            onClick={(e) => resetError(e)}
            onChange={formik.handleChange}
            errMsg={formik.errors['description']}
            autoComplete='on'
            label='Description'
            value={formik.values['description'] || ''}
          />

          <Input
            id='fps'
            name='fps'
            type='number'
            placeholder='FPS'
            onClick={(e) => resetError(e)}
            onChange={formik.handleChange}
            errMsg={formik.errors['fps']}
            autoComplete='on'
            label='FPS'
            value={formik.values['fps'] || ''}
          />

          <Input
            id='width'
            name='width'
            type='number'
            placeholder='width'
            onClick={(e) => resetError(e)}
            onChange={formik.handleChange}
            errMsg={formik.errors['width']}
            autoComplete='on'
            label='Width'
            value={formik.values['width'] || ''}
          />
          <Input
            id='height'
            name='height'
            type='number'
            placeholder='height'
            onClick={(e) => resetError(e)}
            onChange={formik.handleChange}
            errMsg={formik.errors['height']}
            autoComplete='on'
            label='height'
            value={formik.values['height'] || ''}
          />

          <Toggle
            label='Is extra'
            name='is_extra'
            checked={formik.values.is_extra || false}
            onChange={formik.handleChange}
          />

          <Input
            id='comment'
            name='comment'
            type='text'
            placeholder='comment'
            onClick={(e) => resetError(e)}
            onChange={formik.handleChange}
            errMsg={formik.errors['comment']}
            autoComplete='on'
            label='comment'
            value={formik.values['comment'] || ''}
          />

          {/* buttons */}
          <div className='btns-wrapper intro-y col-span-12 flex items-center justify-center sm:justify-end mt-5'>
            <Button type='button' color='btn-secondary' onClick={goBack}>
              Cancel
            </Button>
            <Button type='submit' color='btn-primary'>
              Save
            </Button>
          </div>
        </form>
      </section>
    </>
  );
};
export default Detail;
