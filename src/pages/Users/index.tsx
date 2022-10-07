import React, { useState, useEffect, useCallback, lazy } from 'react';
import { useTranslation } from 'react-i18next';

//import Pagination from '@/components/Pagination/Pagination';
import User, { UserProps } from '@/components/User/User';

import Button from '@/components/Button/Button';
import { PageLoaderModal } from 'comp/PageLoader/PageLoaderModal';
import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { ReducerType } from '@/redux/reducer';
import { User as USER, addUser } from '@/redux/Auth/authSlices';
import { user_all } from '@/graphQL/users';
import { useCustomAxios } from '@/hooks/axios-hooks';
import { returnIcon, getFutureDate } from '@/utils/commonFn';
import { TOKEN_EXPIRE } from '@/settings/constants';


const Backdrop = lazy(() => import('comp/Backdrop/Backdrop'));
const Modal = lazy(() => import('comp/Modal/Modal'));
const Register = lazy(() => import('./Register'));
const Update = lazy(() => import('./Update'));
const Reset = lazy(() => import('./ResetPassword'));

// 컴포넌트가 마운트 되었는지 여부를 나타내는 변수
let isMonted = false;
const USER_PER_PAGE = 6;

interface userProps {}

export interface UserModalType {
  isOpen: boolean;
  type: string;
}

interface ModalInfo {
  title: string;
  btnText: string;
}

export const ModalType = {
  CREATE_USER: 'C',
  UPDATE_USER: 'U',
  DELETE_USER: 'D',
  RESET_PASSWORD: 'R'
}

const Users = (props: userProps) => {
  const user = useAppSelector((state: ReducerType): USER => state.users.authUser);
  const [users, setUsers] = useState<Array<UserProps>>();
  const [isModalOpen, setIsModalOpen] = useState<UserModalType>({ isOpen: false, type: '' });
  const [modalInfo, setModalInfo] = useState<ModalInfo>({ title: '', btnText: '' });
  const [selectedUser, setSelectedUser] = useState<UserProps>();

  const { isLoading, sendRequest } = useCustomAxios();

  const { t } = useTranslation();

  const dispatch = useAppDispatch();

  const getData = async () => {
    const data = {
      query: user_all,
      variables: {},
    };
    const options = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `${user.token}`,
      },
    };
    try {
      const responseData = await sendRequest(
        '/gql/user',
        'post',
        data,
        options,
        'user_all',
        true
      );

      if(responseData?.token && responseData.token !== '') {
        const expiry = getFutureDate(TOKEN_EXPIRE);
        const updateUser = {
          ...user, 
          token: responseData?.token,
          tokenExpirationDate: expiry
        };
        dispatch(addUser(updateUser));
      }

      setUsers(responseData.data);
      
    } catch (error) {
      console.log(error);
    }
  };  

  const handleClickModalState = useCallback((e:React.MouseEvent<HTMLButtonElement>, isOpen: boolean, type: string, email?: string) => {
    //return async (e) => {
      e.preventDefault();

      let title = '';
      let btnText = '';
      let isSelectedUser = false;

      switch(type) {
        case ModalType.CREATE_USER:
          title = t('user:createUser');
          btnText = t('user:create');          
          break;
        case ModalType.UPDATE_USER:
          title = t('user:updateUser');
          btnText = t('user:update');
          if(email) isSelectedUser = true;
          break;
        case ModalType.DELETE_USER:
          title = t('user:deleteUser');
          btnText = t('user:delete');
          if(email) isSelectedUser = true;
          break;
        case ModalType.RESET_PASSWORD:
          title = t('user:resetPassword');
          btnText = t('user:reset');
          if(email) isSelectedUser = true;
          break;
        default:
          break;
      }  
      
      if(users && isSelectedUser) {
        const selectedUser = users.filter(user => user.email === email);
        if(selectedUser) {
          setSelectedUser(selectedUser[0]);
        }
      } else {
        setSelectedUser(null);
      }

      setModalInfo({title, btnText});
      setIsModalOpen({isOpen, type});
    //}
  }, [users]);  

  const handleClickModalClose = () => {
    setIsModalOpen({isOpen: false, type: ''});
    getData();
  }

  useEffect(() => {
    getData();
  }, []);

  // 이 코드가 pagination코드 아래에 있어야 첫 페이지 렌더링 시 불필요한 1페이지 요청을 하지 않는다.
  useEffect(() => {
    if (isMonted === false) {
      isMonted = true;
    }
  }, []);  

  return (
    <>
      <>
        <Backdrop isShow={isModalOpen.isOpen} />
        <Modal
          isShow={isModalOpen.isOpen}
          title={modalInfo.title}
          content={
            <div className='flex flex-col'> 
              { 
                isModalOpen.type === ModalType.CREATE_USER ?
                  <Register 
                    btnText={modalInfo.btnText} 
                    selectedUser={selectedUser}
                    handleClose={handleClickModalClose} 
                  />
                  :
                  isModalOpen.type === ModalType.RESET_PASSWORD ?
                    <Reset
                      btnText={modalInfo.btnText} 
                      selectedUser={selectedUser}
                      handleClose={handleClickModalClose}
                    />
                    :
                    <Update
                      type={isModalOpen.type} 
                      btnText={modalInfo.btnText} 
                      selectedUser={selectedUser}
                      handleClose={handleClickModalClose}
                    />                
              }
            </div>
          }
          type='info' 
          closeBtn={false}         
        >
          <Button color='btn-secondary' onClick={(e) => handleClickModalState(e, false, '')}>
            {t('user:close')}
          </Button>
        </Modal>
      </>
      <h2 className='mt-10 text-lg font-medium intro-y'>Users List</h2>
      <div className='list__body__wrapper'>
        <div className='flex flex-wrap items-center col-span-12 mt-2 intro-y sm:flex-nowrap'>
          <Button color='btn-primary' onClick={(e) => handleClickModalState(e, true, 'C')}>Add New User</Button>
          <button className='px-2 text-gray-300 btn box'>
            <span className='flex items-center justify-center w-5 h-5'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                className='w-5 h-5'
                viewBox='0 0 20 20'
                fill='currentColor'
              >
                <path
                  fillRule='evenodd'
                  d='M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z'
                  clipRule='evenodd'
                />
              </svg>
            </span>
          </button>
        </div>

        {
          users &&
          users.map((user, index) => {
            return (
              <User
                key={index}
                name={user.name}
                email={user.email}
                profileImg={user.profileImg}
                role={user.role}
                group={user.group}
                company={user.company}
                service_in_charge={user.service_in_charge}
                state={user.state}
                permission={user.permission}
                created_at={user.created_at}
                handleClickEvent={handleClickModalState}
              />
            );
          })
        }
      </div>
      <PageLoaderModal isOpen={isLoading} />
    </>
  );
};
export default Users;
