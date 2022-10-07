import React, {
  useState,
  useRef,
  useEffect,
  useReducer,
  useContext,
} from 'react';
import { useLocation } from 'react-router-dom';

import { useFormik } from 'formik';
import { useTranslation } from 'react-i18next';

import { useCMSTagRequest } from '@/apis/CMS/tags';
import { useAccordion } from '@/hooks/accordion-hooks';

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
import { CMSContext } from 'cont/cms';

import Input from 'comp/Input/InputText';
import Button from 'comp/Button/Button';
import { IS_CHILD } from '@/settings/constants';

interface IF {
  cmsData: TotalItemType;
}

const Tags: React.FC<IF> = (props: IF) => {
  const { cmsData } = props;
  const location = useLocation();
  const pathName = location.pathname;
  const isChildContent = pathName.includes(IS_CHILD) ? true : false;

  const { t } = useTranslation();
  const { updateStep, isUpdate } = useContext(CMSContext);

  // const cmsData = useAppSelector((state: ReducerType) => state.cms.cms);
  // updated redux
  // const cmsData = useAppSelector((state: ReducerType) =>
  //   isChildContent ? state.content.childCurrent : state.content.parentCurrent
  // );
  const dispatch = useAppDispatch();

  const { submitData } = useCMSTagRequest();
  const { updateCMSReduxData } = useCMS();

  const {
    isShowAccordion,
    handleToggleAccordionView,
    returnUpDownIcon,
    setisShowAccordion,
  } = useAccordion();

  const initialStatus = {
    'en-US': [],
    'ko-KR': [],
    'zh-CN': [],
    'zh-TW': [],
    'ja-JP': [],
    'fr-FR': [],
    'de-DE': [],
    'es-ES': [],
  };
  const wrapperRef = useRef<HTMLElement | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const reducer = (state, action) => {
    switch (action.type) {
      case 'addTag':
        return {
          ...state,
          [action.name]: [...state[action.name], action.value],
        };
      case 'deleteTag':
        const updatedList = state[action.name].filter(
          (tag, index) => index !== action.value
        );

        return {
          ...state,
          [action.name]: [...updatedList],
        };
      case 'dragTag':
        return {
          ...state,
          [action.name]: [...action.value],
        };
      default:
        return state;
    }
  };

  const [tagState, dispatchTagState] = useReducer(reducer, initialStatus);

  useEffect(() => {
    !isUpdate && wrapperRef.current?.scrollIntoView({ behavior: 'smooth' });
    isUpdate && setisShowAccordion(false);
  }, []);

  useEffect(() => {
    // 수정일 경우 값 세팅
    if (!cmsData || !isUpdate) return;

    for (const lang in cmsData.tag) {
      cmsData.tag[lang].map((t) => {
        const tag = {
          id: t,
          text: t,
        };

        dispatchTagState({
          type: 'addTag',
          name: lang,
          value: tag,
        });
      });
    }
  }, []);

  // 태그 정보에서 텍스트 값만(아이디 제외) 리턴하는 메소드
  const getTexts = (objArr: { id: string; text: string }[]): string[] => {
    const textArr = objArr.map((tag) => {
      return tag.text;
    });

    return textArr;
  };

  const handleAddition = (tag, id) => {
    dispatchTagState({ type: 'addTag', name: id, value: tag });
  };

  const handleDelete = (i, id) => {
    dispatchTagState({ type: 'deleteTag', name: id, value: i });
  };

  const handleDrag = (tag, currPos, newPos, id) => {
    const newTags = tagState[id].slice();

    newTags.splice(currPos, 1);
    newTags.splice(newPos, 0, tag);

    // re-render
    dispatchTagState({ type: 'dragTag', name: id, value: newTags });
  };

  const handleOnKeyDown = (e, lang) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!e.target.value.trim()) return;
      handleAddition(
        {
          text: (e.target as HTMLInputElement).value,
          id: (e.target as HTMLInputElement).value,
        },
        lang
      );
      (e.target as HTMLInputElement).value = '';
    }
  };

  //////////////////////////////////////////////////////////////
  /* formik */
  const submitFormData = async () => {
    setIsLoading(true);

    const values = {
      'en-US': getTexts(tagState['en-US']),
      'ko-KR': getTexts(tagState['ko-KR']),
      'zh-CN': getTexts(tagState['zh-CN']),
      'zh-TW': getTexts(tagState['zh-TW']),
      'ja-JP': getTexts(tagState['ja-JP']),
      'fr-FR': getTexts(tagState['fr-FR']),
      'de-DE': getTexts(tagState['de-DE']),
      'es-ES': getTexts(tagState['es-ES']),
    };

    // 서버 저장 요청
    const result = await submitData(
      values,
      cmsData.content_id,
      cmsData._id,
      cmsData.league_id
    );
    // .catch((err) => console.log(err.message));

    // console.log({ result });
    setIsLoading(false);

    // 서버 요청 성공 시에만 리덕스 업데이트
    if (!result) return;
    // updateCMSReduxData(result, isUpdate, 5, !result.have_parent);

    // updated redux
    // new redux 로직 update
    // current 정보 업데이트
    dispatch(
      isChildContent ? setChildCurrent(result) : setParentCurrent(result)
    );

    // list내의 정보 업데이트
    dispatch(
      isChildContent ? updateChildContent(result) : updateParentContent(result)
    );

    // context update
    !isUpdate && updateStep(5);
  };

  const formik = useFormik({
    initialValues: {
      title: '',
      description: '',
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

  ///////////////////////////////////////////////////////////
  return (
    <article className='mt-12' ref={wrapperRef}>
      <form className='cms__form' onSubmit={formik.handleSubmit}>
        {/* Accordion header */}
        <div className='flex justify-between'>
          <div className='flex flex-col'>
            <h1 className='text-xl font-extrabold'>{t('cms:tags')}</h1>
          </div>
          <button type='button' onClick={handleToggleAccordionView}>
            {returnUpDownIcon(isShowAccordion)}
          </button>
        </div>

        {/* Accordion body(main) */}
        <div className={isShowAccordion ? '' : 'hidden'}>
          <h3>{t('cms:asteriskIsRequired')}</h3>
          <h4 className='mt-2 font-bold'>{t('cms:pressEnterToAddTag')}</h4>
          <div className='flex flex-col mt-2 md:flex-row'>
            <div className='flex-1 md:mr-1'>
              <Input
                name='tag_en-US'
                placeholder=''
                design='inputGroupHeader'
                label={t('cms:englishLabel')}
                onClick={(e) => resetError(e)}
                onChange={formik.handleChange}
                errMsg={formik.errors['tag_en-US']}
                onKeyDown={(e) => handleOnKeyDown(e, 'en-US')}
              />

              <div className='tags__wrapper'>
                {tagState['en-US'].map((tag, idx) => {
                  return (
                    <span
                      key={idx + tag + 'en-US'}
                      className='tag-wrapper ReactTags__tag cursor-move'
                      draggable
                    >
                      {tag.text}
                      <button
                        className='ReactTags__remove'
                        type='button'
                        onClick={() => handleDelete(idx, 'en-US')}
                      >
                        x
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
            <div className='flex-1 md:mr-1'>
              <Input
                name='tag_ko-KR'
                placeholder=''
                design='inputGroupHeader'
                label={t('cms:koreanLabel')}
                onClick={(e) => resetError(e)}
                onChange={formik.handleChange}
                errMsg={formik.errors['tag_ko-KR']}
                onKeyDown={(e) => handleOnKeyDown(e, 'ko-KR')}
              />

              <div className='tags__wrapper'>
                {tagState['ko-KR'].map((tag, idx) => {
                  return (
                    <span
                      key={idx + tag + 'ko-KR'}
                      className='tag-wrapper ReactTags__tag cursor-move'
                      draggable
                    >
                      {tag.text}
                      <button
                        className='ReactTags__remove'
                        type='button'
                        onClick={() => handleDelete(idx, 'ko-KR')}
                      >
                        x
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
          {/*  */}
          <div className='flex flex-col mt-2 md:flex-row'>
            <div className='flex-1 md:mr-1'>
              <Input
                name='tag_zh-CN'
                placeholder=''
                design='inputGroupHeader'
                label={t('cms:ChineseSimplifiedLabel')}
                onClick={(e) => resetError(e)}
                onChange={formik.handleChange}
                errMsg={formik.errors['tag_zh-CN']}
                onKeyDown={(e) => handleOnKeyDown(e, 'zh-CN')}
              />

              <div className='tags__wrapper'>
                {tagState['zh-CN'].map((tag, idx) => {
                  return (
                    <span
                      key={idx + tag + 'zh-CN'}
                      className='tag-wrapper ReactTags__tag cursor-move'
                      draggable
                    >
                      {tag.text}
                      <button
                        className='ReactTags__remove'
                        type='button'
                        onClick={() => handleDelete(idx, 'zh-CN')}
                      >
                        x
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
            <div className='flex-1 md:mr-1'>
              <Input
                name='tag_zh-TW'
                design='inputGroupHeader'
                label={t('cms:ChineseTraditionalLabel')}
                placeholder=''
                onClick={(e) => resetError(e)}
                onChange={formik.handleChange}
                errMsg={formik.errors['tag_zh-TW']}
                onKeyDown={(e) => handleOnKeyDown(e, 'zh-TW')}
              />

              <div className='tags__wrapper'>
                {tagState['zh-TW'].map((tag, idx) => {
                  return (
                    <span
                      key={idx + tag + 'zh-TW'}
                      className='tag-wrapper ReactTags__tag cursor-move'
                      draggable
                    >
                      {tag.text}
                      <button
                        className='ReactTags__remove'
                        type='button'
                        onClick={() => handleDelete(idx, 'zh-TW')}
                      >
                        x
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          <div className='flex flex-col mt-2 md:flex-row'>
            <div className='flex-1 md:mr-1'>
              <Input
                name='tag_ja-JP'
                placeholder=''
                design='inputGroupHeader'
                label={t('cms:JapaneseLabel')}
                onClick={(e) => resetError(e)}
                onChange={formik.handleChange}
                errMsg={formik.errors['tag_ja-JP']}
                onKeyDown={(e) => handleOnKeyDown(e, 'ja-JP')}
              />

              <div className='tags__wrapper'>
                {tagState['ja-JP'].map((tag, idx) => {
                  return (
                    <span
                      key={idx + tag + 'ja-JP'}
                      className='tag-wrapper ReactTags__tag cursor-move'
                      draggable
                    >
                      {tag.text}
                      <button
                        className='ReactTags__remove'
                        type='button'
                        onClick={() => handleDelete(idx, 'ja-JP')}
                      >
                        x
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
            <div className='flex-1 md:mr-1'>
              <Input
                name='tag_fr-FR'
                placeholder=''
                design='inputGroupHeader'
                label={t('cms:FrenchLabel')}
                onClick={(e) => resetError(e)}
                onChange={formik.handleChange}
                errMsg={formik.errors['tag_fr-FR']}
                onKeyDown={(e) => handleOnKeyDown(e, 'fr-FR')}
              />

              <div className='tags__wrapper'>
                {tagState['fr-FR'].map((tag, idx) => {
                  return (
                    <span
                      key={idx + tag + 'fr-FR'}
                      className='tag-wrapper ReactTags__tag cursor-move'
                      draggable
                    >
                      {tag.text}
                      <button
                        className='ReactTags__remove'
                        type='button'
                        onClick={() => handleDelete(idx, 'fr-FR')}
                      >
                        x
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
          <div className='flex flex-col mt-2 md:flex-row'>
            <div className='flex-1 md:mr-1'>
              <Input
                name='tag_de-DE'
                placeholder=''
                design='inputGroupHeader'
                label={t('cms:GermanLabel')}
                onClick={(e) => resetError(e)}
                onChange={formik.handleChange}
                errMsg={formik.errors['tag_de-DE']}
                onKeyDown={(e) => handleOnKeyDown(e, 'de-DE')}
              />

              <div className='tags__wrapper'>
                {tagState['de-DE'].map((tag, idx) => {
                  return (
                    <span
                      key={idx + tag + 'de-DE'}
                      className='tag-wrapper ReactTags__tag cursor-move'
                      draggable
                    >
                      {tag.text}
                      <button
                        className='ReactTags__remove'
                        type='button'
                        onClick={() => handleDelete(idx, 'de-DE')}
                      >
                        x
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
            <div className='flex-1 md:mr-1'>
              <Input
                name='tag_es-ES'
                placeholder=''
                design='inputGroupHeader'
                label={t('cms:SpanishLabel')}
                onClick={(e) => resetError(e)}
                onChange={formik.handleChange}
                errMsg={formik.errors['tag_es-ES']}
                onKeyDown={(e) => handleOnKeyDown(e, 'es-ES')}
              />

              <div className='tags__wrapper'>
                {tagState['es-ES'].map((tag, idx) => {
                  return (
                    <span
                      key={idx + tag + 'es-ES'}
                      className='tag-wrapper ReactTags__tag cursor-move'
                      draggable
                    >
                      {tag.text}
                      <button
                        className='ReactTags__remove'
                        type='button'
                        onClick={() => handleDelete(idx, 'es-ES')}
                      >
                        x
                      </button>
                    </span>
                  );
                })}
              </div>
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
export default Tags;
