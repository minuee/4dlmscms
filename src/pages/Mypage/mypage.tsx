import React, { useState, useEffect, useRef } from 'react';

import { useAppSelector } from '@/redux/hooks';
import { ReducerType } from '@/redux/reducer';
import { User } from '@/redux/Auth/authSlices';

import defaultProfileImage from '@/assets/images/user/default-profile.jpg';

// import { classNames } from "@/utils/commonFn";
// import { useViewpager } from '@/hooks/viewpager-hooks';

let mounted = false;
// TODO: usermy로 정보 받아와서 뿌리고 리덕스에 저장하기
interface IF {}

const Mypage: React.FC<IF> = (props: IF) => {
  const user = useAppSelector(
    (state: ReducerType): User => state.users.authUser
  );

  // TODO: 나중에는 유저 프로필 사진을 initial state로 넣기
  const [profileImg, setProfileImg] = useState<string>(defaultProfileImage);

  // const { viewPager, setViewPagerHandler } = useViewpager();

  useEffect(() => {
    if (!mounted) mounted = true;
    // console.log(user);
    // console.log(user.token);
  }, []);

  return (
    <section className='px-5 pt-5'>
      <h1 className='sr-only'>my page</h1>

      {/* profile Info starts */}
      <div className='intro-y box px-5 pt-5 mt-5'>
        <div className='flex flex-col lg:flex-row border-b border-gray-200 dark:border-dark-5 pb-5 -mx-5'>
          <div className='flex flex-1 px-5 items-center justify-center lg:justify-start'>
            <div className='w-20 h-20 sm:w-24 sm:h-24 flex-none lg:w-32 lg:h-32 image-fit relative'>
              <img
                alt='profile image'
                className='rounded-full image-fit'
                src={profileImg}
              />
              {/* <label
                htmlFor='profileImg_input'
                className=' cursor-pointer absolute mb-1 mr-1 flex items-center justify-center bottom-0 right-0 bg-theme-17 rounded-full p-2'
              >
                <input
                  id='profileImg_input'
                  type='file'
                  className='sr-only'
                  onChange={fileOnChangeHandler}
                />
                <FontAwesomeIcon icon={faCamera} inverse />
              </label> */}
            </div>
            <div className='ml-5'>
              <div className='w-24 sm:w-40 truncate sm:whitespace-normal font-medium text-lg'>
                {user.name}
              </div>
              <div className='text-gray-600'>{user.role}</div>
            </div>
          </div>
          <div className='mt-6 lg:mt-0 flex-1 dark:text-gray-300 px-5 border-l border-r border-gray-200 dark:border-dark-5 border-t lg:border-t-0 pt-5 lg:pt-0'>
            <div className='font-medium text-center lg:text-left lg:mt-3'>
              Contact Details
            </div>
            <div className='flex flex-col justify-center items-center lg:items-start mt-4'>
              <div className='truncate sm:whitespace-normal flex items-center'>
                {/* <FontAwesomeIcon icon={faEnvelope} className='w-4 h-4 mr-2' /> */}
                {user.email}
              </div>
            </div>
          </div>
          <div className='mt-6 lg:mt-0 flex-1 px-5 border-t lg:border-0 border-gray-200 dark:border-dark-5 pt-5 lg:pt-0'>
            <div className='font-medium text-center lg:text-left lg:mt-5'>
              Sales Growth
            </div>
            <div className='flex items-center justify-center lg:justify-start mt-2'>
              <div className='mr-4 w-20 flex items-center'>
                USP:
                <span className='pl-3 font-medium text-theme-10'>+23%</span>
              </div>
              <div className=''></div>
            </div>
            <div className='flex items-center justify-center lg:justify-start'>
              <div className='mr-2 w-20 flex'>
                STP:
                <span className='ml-3 font-medium text-theme-24'>-2%</span>
              </div>
              <div className='w-3/4 overflow-auto'></div>
            </div>
          </div>
        </div>
        <div
          className='nav nav-tabs flex-col sm:flex-row justify-center lg:justify-start'
          role='tablist'
        >
          <span
            id='mypageMainDashboard'
            className='mypage_viewpager--main cursor-pointer py-4 sm:mr-8 active'
            role='tab'
            aria-selected='false'
            // onClick={() => {
            //   setViewPagerHandler('mypageMain', 'mypageMainDashboard')
            // }}
          >
            Dashboard
          </span>
          <span
            id='mypageMainAccount'
            className='mypage_viewpager--main cursor-pointer py-4 sm:mr-8 '
            role='tab'
            aria-selected='false'
            // onClick={() => {
            //   setViewPagerHandler('mypageMain', 'mypageMainAccount')
            // }}
          >
            Account & Profile
          </span>
          <span
            id='mypageMainActivities'
            // href="/"
            className='mypage_viewpager--main cursor-pointer py-4 sm:mr-8'
            role='tab'
            aria-selected='false'
            // onClick={() => {
            //   setViewPagerHandler('mypageMain', 'mypageMainActivities')
            // }}
          >
            Activities
          </span>
          <span
            id='mypageMainTasks'
            // href="/"
            className='mypage_viewpager--main cursor-pointer py-4 sm:mr-8'
            role='tab'
            aria-selected='false'
            // onClick={() => {
            //   setViewPagerHandler('mypageMain', 'mypageMainTasks')
            // }}
          >
            Tasks
          </span>
        </div>
      </div>
      {/* profile info ends */}
    </section>
  );
};
export default Mypage;
