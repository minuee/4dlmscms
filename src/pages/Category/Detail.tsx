import React, { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useFormik } from 'formik';
import { useTranslation } from 'react-i18next';

import { showNotification, excludeNe } from '@/utils/commonFn';
import { useCMSCategoryDetailRequest } from '@/apis/category/detail/index';

import { CATEGORY, CMS_CATEGORY_TYPE } from 'sets/constants';

import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { ReducerType } from '@/redux/reducer';
import { addCategory } from '@/redux/CMS/categorySlices';

import { useValidation } from '@/hooks/validation-hooks';

import Input from 'comp/Input/InputText';
import Select, { Option } from 'comp/Input/Select';
import Button from 'comp/Button/Button';

interface IF {}

const CategoryCreate: React.FC<IF> = (props: IF) => {
  const { validateFormData } = useValidation();
  const { t } = useTranslation();
  const history = useHistory();

  const categoryData = useAppSelector(
    (state: ReducerType) => state.category.categoryList
  );

  const dispatch = useAppDispatch();
  const { submitCategoryInfo } = useCMSCategoryDetailRequest();

  useEffect(() => {
    // 수정일 경우 값 세팅
    if (!categoryData || !categoryData?.current) return;

    formik.setFieldValue(
      'category_type',
      categoryData.current.category_type,
      false
    );
    formik.setFieldValue('genre_id', categoryData.current.genre_id, false);
    formik.setFieldValue(
      'category_id',
      categoryData.current.category_id,
      false
    );
    formik.setFieldValue('league_id', categoryData.current.league_id, false);
    formik.setFieldValue('season_id', categoryData.current.season_id, false);
    formik.setFieldValue('round_id', categoryData.current.round_id, false);
    formik.setFieldValue('is_live', categoryData.current.is_live, false);

    for (const name in categoryData.current.name) {
      formik.setFieldValue(
        `name__${name}`,
        excludeNe(categoryData.current.name[name]),
        false
      );
    }

    for (const name in categoryData.current.sub_name) {
      formik.setFieldValue(
        `sub_name__${name}`,
        excludeNe(categoryData.current.sub_name[name]),
        false
      );
    }

    for (const name in categoryData.current.desc) {
      formik.setFieldValue(
        `desc__${name}`,
        excludeNe(categoryData.current.desc[name]),
        false
      );
    }
  }, []);

  // 뒤로가기
  const goBack = () => history.goBack();

  /* formik */
  const submitFormData = async (values) => {
    // console.log({ values });

    let totalErr = await validateFormData(
      [
        'name__zh-CN',
        'name__zh-TW',
        'name__ja-JP',
        'name__fr-FR',
        'name__de-DE',
        'name__es-ES',
        'sub_name__zh-CN',
        'sub_name__zh-TW',
        'sub_name__ja-JP',
        'sub_name__fr-FR',
        'sub_name__de-DE',
        'sub_name__es-ES',
        'desc__zh-CN',
        'desc__zh-TW',
        'desc__ja-JP',
        'desc__fr-FR',
        'desc__de-DE',
        'desc__es-ES',
        'video_type_id',
        'is_live',
        'start_time',
        'end_time',
        'package_id',
        'event_id',
        'genre_id',
        'category_id',
        'league_id',
        'season_id',
        'round_id',
      ],
      'CreateCMSCategoryInfo',
      values,
      'category'
    );

    // formik.setErrors(totalErr);
    if (!formik.values?.category_type) {
      formik.setFieldError('category_type', 'categoryTypeRequired');
      totalErr = { ...totalErr, category_type: 'categoryTypeRequired' };
      showNotification(t('cms:categoryTypeRequired'), 'error');
    }

    // // is_live가 true일 때 시작, 끝 시간 꼭 필요
    // if (formik.values.is_live) {
    //   if (!values.start_time) formik.setFieldError('start_time', 'required');
    //   if (!values.end_time) formik.setFieldError('end_time', 'required');
    // }

    // category type에 따른  예외처리
    switch (values.category_type) {
      case 'category':
        if (!values.genre_id) {
          formik.setFieldError('genre_id', 'genreIdRequired');
          totalErr = { ...totalErr, genre_id: 'genreIdRequired' };
          showNotification(t('cms:genreIdRequired'), 'error');
        }
        // else if(values?.genre_id<0){

        // }

        break;

      case 'league':
        if (!values.category_id) {
          formik.setFieldError('category_id', 'categoryIdRequired');
          totalErr = { ...totalErr, category_id: 'categoryIdRequired' };
          showNotification(t('cms:categoryIdRequired'), 'error');
        }
        if (!values.genre_id) {
          formik.setFieldError('genre_id', 'genreIdRequired');
          totalErr = { ...totalErr, genre_id: 'genreIdRequired' };
          showNotification(t('cms:genreIdRequired'), 'error');
        }

        break;
      case 'season':
        if (!values.category_id) {
          formik.setFieldError('category_id', 'categoryIdRequired');
          totalErr = { ...totalErr, category_id: 'categoryIdRequired' };
          showNotification(t('cms:categoryIdRequired'), 'error');
        }
        if (!values.league_id) {
          formik.setFieldError('league_id', 'leagueIdRequired');
          totalErr = { ...totalErr, league_id: 'leagueIdRequired' };
          showNotification(t('cms:leagueIdRequired'), 'error');
        }
        if (!values.genre_id) {
          formik.setFieldError('genre_id', 'genreIdRequired');
          totalErr = { ...totalErr, genre_id: 'genreIdRequired' };
          showNotification(t('cms:genreIdRequired'), 'error');
        }

        break;
      case 'round':
        if (!values.season_id) {
          formik.setFieldError('season_id', 'seasonIdRequired');
          totalErr = { ...totalErr, season_id: 'seasonIdRequired' };
          showNotification(t('cms:seasonIdRequired'), 'error');
        }
        if (!values.league_id) {
          formik.setFieldError('league_id', 'leagueIdRequired');
          totalErr = { ...totalErr, league_id: 'leagueIdRequired' };
          showNotification(t('cms:leagueIdRequired'), 'error');
        }
        if (!values.category_id) {
          formik.setFieldError('category_id', 'categoryIdRequired');
          totalErr = { ...totalErr, category_id: 'categoryIdRequired' };
          showNotification(t('cms:categoryIdRequired'), 'error');
        }
        if (!values.genre_id) {
          formik.setFieldError('genre_id', 'genreIdRequired');
          totalErr = { ...totalErr, genre_id: 'genreIdRequired' };
          showNotification(t('cms:genreIdRequired'), 'error');
        }

        break;

      default:
        break;
    }

    formik.setErrors(totalErr);

    // 에러가 있으면 저장요청을 하지 못하게 리턴한다.
    if (Object.keys(totalErr).length !== 0) return;

    let value = {};

    switch (values.category_type) {
      case 'category':
        value = {
          genre_id: Number(values.genre_id),
        };
        break;
      case 'league':
        value = {
          genre_id: Number(values.genre_id),
          category_id: Number(values.category_id),
        };
        break;
      case 'season':
        value = {
          genre_id: Number(values.genre_id),
          category_id: Number(values.category_id),
          league_id: Number(values.league_id),
        };
        break;

      case 'round':
        value = {
          genre_id: Number(values.genre_id),
          category_id: Number(values.category_id),
          league_id: Number(values.league_id),
          season_id: Number(values.season_id),
        };
        break;

      default:
        break;
    }

    const result = await submitCategoryInfo(
      formik.values.category_type,
      values,
      value
    );

    if (!result) return;
    // redux update
    dispatch(
      addCategory({
        ...categoryData,
        [formik.values.category_type]: [
          ...categoryData[formik.values.category_type],
          result,
        ],
      })
    );
    // 페이지 이동
    history.push(CATEGORY);
  };

  const formik = useFormik({
    initialValues: {
      category_type: '',
      genre_id: 0,
      category_id: 0,
      league_id: 0,
      season_id: 0,
      is_live: false,

      //////////////////////////////
      // 꼭 필요한 post정보
      'name__en-US': '',
      'name__ko-KR': '',
      'sub_name__en-US': '',
      'sub_name__ko-KR': '',
      'desc__en-US': '',
      'desc__ko-KR': '',
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

  ///////////////////////////////////////////
  return (
    <article className='mt-12 cms__basic'>
      <form className='cms__form' onSubmit={formik.handleSubmit}>
        <h1 className='text-xl font-extrabold'>
          CATEGORY{' '}
          {Object.keys(categoryData.current).length !== 0 ? 'UPDATE' : 'CREATE'}
        </h1>
        <h3>* : required</h3>
        <div className='mt-4'>
          {Object.keys(categoryData.current).length !== 0 && (
            <Input
              id='_id'
              name='_id'
              readonly
              type='text'
              onClick={(e) => resetError(e)}
              label={`${formik.values.category_type} ID`}
              transformDirection='intro-y'
              // noMarginTop
              value={formik.values[`${formik.values.category_type}_id`] || ''}
            />
          )}
          <div className='mt-4'>
            <label className='mt-3 capitalize'>Type</label>
            <Select
              name='category_type'
              id='category_type'
              onClick={(e) => resetError(e)}
              onChange={formik.handleChange}
              value={formik.values.category_type || ''}
              errMsg={formik.errors.category_type}
              disabled={Object.keys(categoryData.current).length !== 0}
            >
              <option value='' disabled hidden>
                {t('list:selectCategory')}
              </option>
              {CMS_CATEGORY_TYPE.map((item) => {
                return (
                  <Option
                    key={item.value}
                    value={item.value}
                    label={item.label}
                  />
                );
              })}
            </Select>
          </div>
          {/* ids */}
          {[
            'category',
            'league',
            'season',
            'round',
            categoryData?.current?.genre_id && 'genre',
          ].includes(formik.values.category_type) && (
            <Select
              name='genre_id'
              id='genre_id'
              onChange={formik.handleChange}
              onClick={(e) => resetError(e)}
              errMsg={formik.errors.genre_id}
              value={formik.values.genre_id || ''}
              label='genre'
              disabled={categoryData?.current?.category_type === 'genre'}
            >
              <option value='' disabled hidden>
                Select genre
              </option>
              {categoryData?.genre &&
                categoryData?.genre.map((genre) => {
                  return (
                    <Option
                      id={genre.genre_id}
                      key={genre.genre_id}
                      value={genre.genre_id}
                      label={`${genre.name['en-US']} (ID: ${genre.genre_id})`}
                    />
                  );
                })}
            </Select>
          )}

          {[
            'league',
            'season',
            'round',
            categoryData?.current?.category_id && 'category',
          ].includes(formik.values.category_type) && (
            <Select
              name='category_id'
              id='category_id'
              onChange={formik.handleChange}
              onClick={(e) => resetError(e)}
              errMsg={formik.errors.category_id}
              value={formik.values.category_id || ''}
              label='category'
              disabled={categoryData?.current?.category_type === 'category'}
            >
              <option value='' disabled hidden>
                Select category
              </option>
              {categoryData?.category &&
                categoryData?.category.map((category) => {
                  return (
                    <Option
                      id={category.category_id}
                      key={category.category_id}
                      value={category.category_id}
                      label={`${category.name['en-US']} (ID: ${category.category_id})`}
                    />
                  );
                })}
            </Select>
          )}

          {[
            'season',
            'round',
            categoryData?.current?.league_id && 'league',
          ].includes(formik.values.category_type) && (
            <Select
              name='league_id'
              id='league_id'
              onChange={formik.handleChange}
              onClick={(e) => resetError(e)}
              errMsg={formik.errors.league_id}
              value={formik.values.league_id || ''}
              label='league'
              disabled={categoryData?.current?.category_type === 'league'}
            >
              <option value='' disabled hidden>
                Select league
              </option>
              {categoryData?.league &&
                categoryData?.league.map((league) => {
                  return (
                    <Option
                      id={league.league_id}
                      key={league.league_id}
                      value={league.league_id}
                      label={`${league.name['en-US']} (ID: ${league.league_id})`}
                    />
                  );
                })}
            </Select>
          )}

          {['round', categoryData?.current?.season_id && 'season'].includes(
            formik.values.category_type
          ) && (
            <Select
              name='season_id'
              id='season_id'
              onChange={formik.handleChange}
              onClick={(e) => resetError(e)}
              errMsg={formik.errors.season_id}
              value={formik.values.season_id || ''}
              label='season'
              disabled={categoryData?.current?.category_type === 'season'}
            >
              <option value='' disabled hidden>
                Select season
              </option>
              {categoryData?.season &&
                categoryData?.season.map((season) => {
                  return (
                    <Option
                      id={season.season_id}
                      key={season.season_id}
                      value={season.season_id}
                      label={`${season.name['en-US']} (ID: ${season.season_id})`}
                    />
                  );
                })}
            </Select>
          )}

          {/* name */}
          <div className='mt-4'>
            <label className='mt-3 capitalize'>Title</label>
            <div className='flex flex-col mt-2 md:flex-row'>
              <div className='flex-1 md:mr-1'>
                <Input
                  id='name__en-US'
                  name='name__en-US'
                  type='text'
                  placeholder='title(at least 2 chars needed)'
                  onClick={(e) => resetError(e)}
                  onChange={formik.handleChange}
                  errMsg={formik.errors['name__en-US']}
                  label='*English'
                  autoComplete='on'
                  transformDirection='intro-y'
                  design='inputGroupHeader'
                  noMarginTop
                  value={formik.values['name__en-US'] || ''}
                />
              </div>
              <div className='flex-1 md:mr-1'>
                <Input
                  id='name__ko-KR'
                  name='name__ko-KR'
                  type='text'
                  placeholder='제목(최소 2자 이상)'
                  onClick={(e) => resetError(e)}
                  onChange={formik.handleChange}
                  errMsg={formik.errors['name__ko-KR']}
                  label='*Korean'
                  autoComplete='on'
                  transformDirection='intro-y'
                  design='inputGroupHeader'
                  noMarginTop
                  value={formik.values['name__ko-KR'] || ''}
                />
              </div>
            </div>
          </div>
          {/* /////////////////////////////////////////////////// */}
          {/* subtitle */}
          <div className='mt-4'>
            <label className='mt-3 capitalize'>Sub Title</label>
            <div className='flex flex-col mt-2 md:flex-row'>
              <div className='flex-1 md:mr-1'>
                <Input
                  id='sub_name__en-US'
                  name='sub_name__en-US'
                  type='text'
                  placeholder='sub title(at least 2 chars needed)'
                  onClick={(e) => resetError(e)}
                  onChange={formik.handleChange}
                  errMsg={formik.errors['sub_name__en-US']}
                  label='*English'
                  autoComplete='on'
                  transformDirection='intro-y'
                  design='inputGroupHeader'
                  noMarginTop
                  value={formik.values['sub_name__en-US'] || ''}
                />
              </div>
              <div className='flex-1 md:mr-1'>
                <Input
                  id='sub_name__ko-KR'
                  name='sub_name__ko-KR'
                  type='text'
                  placeholder='부제목(최소 2자 이상)'
                  onClick={(e) => resetError(e)}
                  onChange={formik.handleChange}
                  errMsg={formik.errors['sub_name__ko-KR']}
                  label='*Korean'
                  autoComplete='on'
                  transformDirection='intro-y'
                  design='inputGroupHeader'
                  noMarginTop
                  value={formik.values['sub_name__ko-KR'] || ''}
                />
              </div>
            </div>
          </div>
          {/* description */}
          <div className='mt-4'>
            <label className='mt-3 capitalize'>Description</label>
            <div className='flex flex-col mt-2 md:flex-row'>
              <div className='flex-1 md:mr-1'>
                <Input
                  id='desc__en-US'
                  name='desc__en-US'
                  type='text'
                  placeholder='description(at least 2 chars needed)'
                  onClick={(e) => resetError(e)}
                  onChange={formik.handleChange}
                  errMsg={formik.errors['desc__en-US']}
                  label='*English'
                  autoComplete='on'
                  transformDirection='intro-y'
                  design='inputGroupHeader'
                  noMarginTop
                  value={formik.values['desc__en-US'] || ''}
                />
              </div>
              <div className='flex-1 md:mr-1'>
                <Input
                  id='desc__ko-KR'
                  name='desc__ko-KR'
                  type='text'
                  placeholder='설명(최소 2자 이상)'
                  onClick={(e) => resetError(e)}
                  onChange={formik.handleChange}
                  errMsg={formik.errors['desc__ko-KR']}
                  label='*Korean'
                  autoComplete='on'
                  transformDirection='intro-y'
                  design='inputGroupHeader'
                  noMarginTop
                  value={formik.values['desc__ko-KR'] || ''}
                />
              </div>
            </div>
          </div>
        </div>

        {/* buttons */}
        <div className='flex items-center justify-center col-span-12 mt-5 btns-wrapper intro-y sm:justify-end'>
          <Button type='button' color='btn-secondary' onClick={goBack}>
            Cancel
          </Button>
          {Object.keys(categoryData.current).length === 0 && (
            <Button type='submit' color='btn-primary'>
              Save
            </Button>
          )}
        </div>
      </form>
    </article>
  );
};
export default CategoryCreate;
