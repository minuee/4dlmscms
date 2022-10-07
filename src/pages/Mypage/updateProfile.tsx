import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import { useTranslation } from 'react-i18next';
import ReactTooltip from 'react-tooltip';

import { PageLoaderModal } from 'comp/PageLoader/PageLoaderModal';

import {
  showNotification,
  validationSchema,
  classNames,
  returnIcon,
} from '@/utils/commonFn';

import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { ReducerType } from '@/redux/reducer';
import { addUser, User } from '@/redux/Auth/authSlices';

import defaultProfileImage from '@/assets/images/user/default-profile.jpg';

import { user_update } from '@/graphQL/mypage';
import { useCustomAxios } from '@/hooks/axios-hooks';

import Button from 'comp/Button/Button';
import Input from 'comp/Input/InputText';
import Select, { Option } from 'comp/Input/Select';

interface UpdateProfileProps {}

const UpdateProfile: React.FC<UpdateProfileProps> = (
  props: UpdateProfileProps
) => {
  const [mounted, setMounted] = useState<boolean>(false);
  const { t } = useTranslation();
  const user = useAppSelector(
    (state: ReducerType): User => state.users.authUser
  );
  const dispatch = useAppDispatch();

  const { isLoading, sendRequest } = useCustomAxios();

  // TODO: 나중에는 유저 프로필 사진을 initial state로 넣기
  const [profileImg, setProfileImg] = useState<string | null>(
    defaultProfileImage
  );

  // 프로필 파일 변경 메서드
  const handleFileOnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    document.querySelector('#profile_img').classList.add('fade-in');
    event.preventDefault();
    let reader = new FileReader();
    let file = event.target.files[0];
    reader.onloadend = () => {
      let csv = reader.result;
      if (typeof csv !== 'string') {
        csv = csv.toString();
      }

      setProfileImg(csv);
    };
    reader.readAsDataURL(file);
  };

  // 프로필 사진 초기화
  const resetProfileImg = () => {
    setProfileImg(defaultProfileImage);
  };

  useEffect(() => {
    if (mounted === false) setMounted(true);
  }, []);

  // 사진 바꿀 때 마다 미리보기 이미지 띄울 때 나오는 애니메이션 효과를 줌
  useEffect(() => {
    if (mounted) {
      setTimeout(() => {
        document.querySelector('#profile_img').classList.remove('fade-in');
      }, 1000);
    }
  }, [profileImg]);

  // ***** Formik logics
  type initialValues = {
    name?: String;
    phone?: String;
    language?: 'ko-KR' | 'en-US' | 'ja-JP' | string;
  };

  const validateForm = async (values) => {
    let errors: initialValues = {};
    const formSchema = validationSchema('UpdateProfileInfo');

    const nameError = await formSchema
      .pick(['name'])
      .validate({ name: values.name })
      .catch((err) => {
        showNotification(err.errors[0], 'error');
        return err.errors[0];
      });

    if (!nameError.name) errors.name = nameError;

    if (values.phone) {
      const phoneError = await formSchema
        .pick(['phone'])
        .validate({ phone: values.phone })
        .catch((err) => {
          showNotification(err.errors[0], 'error');
          return err.errors[0];
        });

      if (!phoneError.phone) errors.phone = phoneError;
    }
    const languageError = await formSchema
      .pick(['language'])
      .validate({ language: values.language })
      .catch((err) => {
        showNotification(err.errors[0], 'error');
        return err.errors[0];
      });

    if (!languageError.language) errors.language = languageError;

    return errors;
  };

  const resetError = (e) => {
    const name = e.target.name;
    formik.setErrors({ ...formik.errors, [name]: '' });
  };

  const formik = useFormik({
    initialValues: {
      name: user.name ? user.name : '',
      phone: user.phone ? user.phone : '',
      language: user.language ? user.language : '',
    },
    validate: validateForm,
    validateOnChange: false,
    validateOnBlur: false,
    onSubmit: async (values) => {
      //  서버에 업데이트 요청
      const data = {
        query: user_update,
        variables: {
          name: values.name,
          phone: values.phone,
          language: values.language,
        },
      };
      const options = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: user.token,
        },
      };

      try {
        const responseData = await sendRequest(
          '/gql/user',
          'post',
          data,
          options,
          'user_update',
          false
        );

        const userInfo = {
          ...user,
          name: values.name,
          phone: values.phone,
          language: values.language,
        };

        // 리덕스 정보 업데이트
        dispatch(addUser(userInfo));

        // TODO: 성공하면 페이지 이동하기? refresh? 로직 추가하기
      } catch (error) {
        console.log(error);
      }
    },
  });

  return (
    <>
      <div className='intro-y flex items-center mt-8'>
        <h2 className='text-lg font-medium mr-auto'>Update Profile</h2>
      </div>

      <div className='col-span-12 lg:col-span-8 xxl:col-span-9'>
        {/* <!-- BEGIN: Display Information --> */}
        <div className='intro-y box lg:mt-5'>
          <div className='flex items-center p-5 border-b border-dark-5'>
            <h2 className='font-medium text-base mr-auto'>
              Display Information
            </h2>

            <Button
              form='update-profile__form'
              type='submit'
              width='btn-max'
              size='btn-md'
              color='btn-primary'
            >
              Save
            </Button>
          </div>
          <div className='p-5'>
            <form onSubmit={formik.handleSubmit} id='update-profile__form'>
              <div className='flex xl:flex-row flex-col'>
                <div className='flex-1 xl:mt-0 xxl:flex xxl:flex-col xxl:justify-between'>
                  <div className='mb-5'>
                    <Input
                      id='update-profile__form-name'
                      name='name'
                      type='text'
                      placeholder='Name'
                      onClick={(e) => resetError(e)}
                      onChange={formik.handleChange}
                      errMsg={formik.errors.name}
                      label='Name'
                      noLabelMargin
                      autoComplete='on'
                      value={formik.values.name}
                    />
                    <div className='col-span-12 xxl:col-span-6'>
                      <Select
                        name='language'
                        id='update-profile__form--language'
                        onChange={formik.handleChange}
                        onClick={(e) => resetError(e)}
                        value={formik.values.language}
                        label='Language'
                      >
                        <Option value='en-US' label='English' />
                        <Option value='ko-KR' label='Korean' />
                        <Option value='ja-JP' label='Japanese' />
                      </Select>
                      <Input
                        id='update-profile__form--phone'
                        name='phone'
                        type='text'
                        placeholder='Phone Number'
                        onClick={(e) => resetError(e)}
                        onChange={formik.handleChange}
                        errMsg={formik.errors.phone}
                        label='Phone Number'
                        autoComplete='on'
                        value={formik.values.phone}
                      />
                    </div>
                  </div>
                </div>

                <div className='w-52 mx-auto xl:mr-0 xl:ml-6'>
                  <div className='border-2 border-dashed shadow-sm border-dark-5 rounded-md p-5'>
                    <div className='h-40 relative image-fit cursor-pointer zoom-in mx-auto'>
                      <img
                        id='profile_img'
                        className='rounded-md'
                        alt='profile image'
                        src={profileImg}
                      />
                      <div
                        title='Remove this profile photo?'
                        className='tooltip w-5 h-5 flex items-center justify-center absolute rounded-full text-white bg-theme-24 right-0 top-0 -mr-2 -mt-2'
                        onClick={resetProfileImg}
                      >
                        {returnIcon({
                          icon: 'X',
                          dataTip: t('user:removeProfileImg'),
                        })}
                        <ReactTooltip />
                      </div>
                    </div>
                    <div className='mx-auto cursor-pointer relative mt-5'>
                      <label
                        htmlFor='profileImg_input'
                        className='btn btn-primary w-full capitalize cursor-pointer'
                      >
                        change Photo
                      </label>
                      <input
                        id='profileImg_input'
                        type='file'
                        className='sr-only'
                        onChange={handleFileOnChange}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
      <PageLoaderModal isOpen={isLoading} />
    </>
  );
};
export default UpdateProfile;
