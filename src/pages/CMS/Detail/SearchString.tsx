import React, { useState, useRef, useEffect, useContext } from 'react';
import { useLocation } from 'react-router-dom';

import { useFormik } from 'formik';
import { useTranslation } from 'react-i18next';

import { excludeNe } from '@/utils/commonFn';
import { useCMSSearchStringRequest } from '@/apis/CMS/searchString';

import { useCMS } from '@/hooks/cms-hooks';
import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { ReducerType } from '@/redux/reducer';
// new redux data
import {
  setParentCurrent,
  setChildCurrent,
  updateChildContent,
  updateParentContent,
} from '@/redux/CMS/contentSlices';

import { useAccordion } from '@/hooks/accordion-hooks';

import { CMSContext } from 'cont/cms';

import Input from 'comp/Input/InputText';
import Button from 'comp/Button/Button';
import { IS_CHILD } from '@/settings/constants';

interface IF {
  cmsData: TotalItemType;
}

const SearchString: React.FC<IF> = (props: IF) => {
  const { cmsData } = props;

  const location = useLocation();
  const pathName = location.pathname;
  const isChildContent = pathName.includes(IS_CHILD) ? true : false;

  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { updateStep, isUpdate, changeIsUpdate } = useContext(CMSContext);
  const wrapperRef = useRef<HTMLElement | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // const cmsData = useAppSelector((state: ReducerType) => state.cms.cms);
  // updated redux
  // const cmsData = useAppSelector((state: ReducerType) =>
  //   isChildContent ? state.content.childCurrent : state.content.parentCurrent
  // );

  const { submitData } = useCMSSearchStringRequest();
  const { updateCMSReduxData } = useCMS();
  const {
    isShowAccordion,
    handleToggleAccordionView,
    setisShowAccordion,
    returnUpDownIcon,
  } = useAccordion();

  useEffect(() => {
    !isUpdate && wrapperRef.current?.scrollIntoView({ behavior: 'smooth' });
    isUpdate && setisShowAccordion(false);
  }, []);

  useEffect(() => {
    // 수정일 경우 값 세팅
    if (!cmsData || !isUpdate) return;
    // if (!cmsData) {
    //   changeIsUpdate(true);
    //   updateStep(5);
    //   return;
    // }

    for (const lang in cmsData.search_string) {
      formik.setFieldValue(lang, excludeNe(cmsData.search_string[lang]), false);
    }
  }, []);

  //////////////////////////////////////////////////////////////
  /* formik */
  const submitFormData = async (values: SearchStringValueType) => {
    setIsLoading(true);
    const trimedValues = {
      'en-US': values['en-US'],
      'ko-KR': values['ko-KR'],
      'zh-CN': values['zh-CN'],
      'zh-TW': values['zh-TW'],
      'ja-JP': values['ja-JP'],
      'fr-FR': values['fr-FR'],
      'de-DE': values['de-DE'],
      'es-ES': values['es-ES'],
    };

    // 서버 저장 요청
    const result = await submitData(
      trimedValues,
      cmsData.content_id,
      cmsData._id,
      cmsData.league_id
    );
    setIsLoading(false);

    // 서버 요청 성공 시에만 리덕스 업데이트
    if (!result) return;
    // updateCMSReduxData(result, isUpdate, 5, !result.have_parent);

    // new redux 로직 update
    // current 정보 업데이트
    dispatch(
      isChildContent ? setChildCurrent(result) : setParentCurrent(result)
    );

    // list내의 정보 업데이트
    dispatch(
      isChildContent ? updateChildContent(result) : updateParentContent(result)
    );
  };

  const formik = useFormik({
    initialValues: {
      'en-US': '',
      'ko-KR': '',
      'zh-CN': '',
      'zh-TW': '',
      'ja-JP': '',
      'fr-FR': '',
      'de-DE': '',
      'es-ES': '',
    },
    // validate: null,
    onSubmit: submitFormData,
    validateOnChange: false,
    validateOnBlur: false,
  });

  const resetError = (e) => {
    const name = e.target.name;
    formik.setErrors({ ...formik.errors, [name]: '' });
  };

  ////////////////////////////////////////////////////////////
  return (
    <article className='mt-12' ref={wrapperRef}>
      <form className='cms__form' onSubmit={formik.handleSubmit}>
        {/* Accordion header */}
        <div className='flex justify-between'>
          <div className='flex flex-col'>
            <h1 className='text-xl font-extrabold'>{t('cms:searchString')}</h1>
          </div>
          <button type='button' onClick={handleToggleAccordionView}>
            {returnUpDownIcon(isShowAccordion)}
          </button>
        </div>

        {/* Accordion body(main) */}
        <div className={isShowAccordion ? '' : 'hidden'}>
          <h3>{t('cms:asteriskIsRequired')}</h3>
          <div className='flex flex-col mt-2 md:flex-row'>
            <div className='flex-1 md:mr-1'>
              <Input
                id='en-US'
                name='en-US'
                type='text'
                placeholder={t('cms:searchStringPlaceholder')}
                onClick={(e) => resetError(e)}
                onChange={formik.handleChange}
                errMsg={formik.errors['en-US']}
                label={t('cms:englishLabel')}
                autoComplete='on'
                transformDirection='intro-y'
                design='inputGroupHeader'
                noMarginTop
                value={formik.values['en-US'] || ''}
              />
            </div>
            <div className='flex-1 md:mr-1'>
              <Input
                // id='ko-KR'
                name='ko-KR'
                type='text'
                placeholder={t('cms:searchStringPlaceholder')}
                onClick={(e) => resetError(e)}
                onChange={formik.handleChange}
                errMsg={formik.errors['ko-KR']}
                label={t('cms:koreanLabel')}
                autoComplete='on'
                transformDirection='intro-y'
                design='inputGroupHeader'
                noMarginTop
                value={formik.values['ko-KR'] || ''}
              />
            </div>
          </div>
          {/*  */}
          <div className='flex flex-col mt-2 md:flex-row'>
            <div className='flex-1 md:mr-1'>
              <Input
                id='zh-CN'
                name='zh-CN'
                type='text'
                placeholder={t('cms:searchStringPlaceholder')}
                onClick={(e) => resetError(e)}
                onChange={formik.handleChange}
                errMsg={formik.errors['zh-CN']}
                label={t('cms:ChineseSimplifiedLabel')}
                autoComplete='on'
                transformDirection='intro-y'
                design='inputGroupHeader'
                noMarginTop
                value={formik.values['zh-CN'] || ''}
              />
            </div>
            <div className='flex-1 md:mr-1'>
              <Input
                id='zh-TW'
                name='zh-TW'
                type='text'
                placeholder={t('cms:searchStringPlaceholder')}
                onClick={(e) => resetError(e)}
                onChange={formik.handleChange}
                errMsg={formik.errors['zh-TW']}
                label={t('cms:ChineseTraditionalLabel')}
                autoComplete='on'
                transformDirection='intro-y'
                design='inputGroupHeader'
                noMarginTop
                value={formik.values['zh-TW'] || ''}
              />
            </div>
          </div>
          <div className='flex flex-col mt-2 md:flex-row'>
            <div className='flex-1 md:mr-1'>
              <Input
                id='ja-JP'
                name='ja-JP'
                type='text'
                placeholder={t('cms:searchStringPlaceholder')}
                onClick={(e) => resetError(e)}
                onChange={formik.handleChange}
                errMsg={formik.errors['ja-JP']}
                label={t('cms:JapaneseLabel')}
                autoComplete='on'
                transformDirection='intro-y'
                design='inputGroupHeader'
                noMarginTop
                value={formik.values['ja-JP'] || ''}
              />
            </div>
            <div className='flex-1 md:mr-1'>
              <Input
                id='fr-FR'
                name='fr-FR'
                type='text'
                placeholder={t('cms:searchStringPlaceholder')}
                onClick={(e) => resetError(e)}
                onChange={formik.handleChange}
                errMsg={formik.errors['fr-FR']}
                label={t('cms:FrenchLabel')}
                autoComplete='on'
                transformDirection='intro-y'
                design='inputGroupHeader'
                noMarginTop
                value={formik.values['fr-FR'] || ''}
              />
            </div>
          </div>
          <div className='flex flex-col mt-2 md:flex-row'>
            <div className='flex-1 md:mr-1'>
              <Input
                id='de-DE'
                name='de-DE'
                type='text'
                placeholder={t('cms:searchStringPlaceholder')}
                onClick={(e) => resetError(e)}
                onChange={formik.handleChange}
                errMsg={formik.errors['de-DE']}
                label={t('cms:GermanLabel')}
                autoComplete='on'
                transformDirection='intro-y'
                design='inputGroupHeader'
                noMarginTop
                value={formik.values['de-DE'] || ''}
              />
            </div>
            <div className='flex-1 md:mr-1'>
              <Input
                id='es-ES'
                name='es-ES'
                type='text'
                placeholder={t('cms:searchStringPlaceholder')}
                onClick={(e) => resetError(e)}
                onChange={formik.handleChange}
                errMsg={formik.errors['es-ES']}
                label={t('cms:SpanishLabel')}
                autoComplete='on'
                transformDirection='intro-y'
                design='inputGroupHeader'
                noMarginTop
                value={formik.values['es-ES'] || ''}
              />
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
  );
};
export default SearchString;
