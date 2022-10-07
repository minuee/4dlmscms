import React, { useState, lazy, Dispatch, SetStateAction } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import {
  IS_IMS_TEST,
  SYSTEM_CREATE_EVENT_CREATE,
  SYSTEM_UPDATE_EVENT_CREATE,
  SYSTEM_UPDATE_EVENT_UPDATE, 
} from 'sets/constants';

// import { useNodeDetailRequest } from '@/apis/IMS/system/detail/node/detail';

import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { ReducerType } from '@/redux/reducer';
import { ItemType, ValueType } from '@/types/IMS/system/event/index';

import {
  setCurrent,
  setList as setReduxList,
} from '@/redux/IMS/system/eventSlices';

const Button = lazy(() => import('comp/Button/Button'));
const Backdrop = lazy(() => import('comp/Backdrop/Backdrop'));
const Modal = lazy(() => import('comp/Modal/Modal'));
import { ButtonEdit, ButtonDelete } from 'comp/Button/Button';
import { PageLoaderModal } from 'comp/PageLoader/PageLoaderModal';

interface ItemProps {
  data: ItemType;
  list: ItemType[];
  setList: Dispatch<SetStateAction<ValueType[]>>;
}

export const Item: React.FC<ItemProps> = ({ data, list, setList }) => {
  const history = useHistory();
  const location = useLocation();
  const pathName = location.pathname;
  const isTestPage = pathName.includes(IS_IMS_TEST);

  const { t } = useTranslation();

  // const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const dispatch = useAppDispatch();
  // const reduxListData = useAppSelector((state: ReducerType) => state.node.list);

  // const { deleteData, isLoading } = useNodeDetailRequest();

  // 클릭 이벤트(아이템 수정 이벤트와 같다)
  const handleClickItem = async () => {
    dispatch(setCurrent({ ...data }));

    let nextPath;
    if (pathName.includes('create')) {
      nextPath = isTestPage ? SYSTEM_CREATE_EVENT_CREATE : SYSTEM_CREATE_EVENT_CREATE;
      // update
    } else {
      nextPath = isTestPage ? SYSTEM_UPDATE_EVENT_UPDATE : SYSTEM_UPDATE_EVENT_UPDATE;
    }

    // 페이지 이동
    history.push(nextPath);
  };

  // 아이템 수정 이벤트
  const handelEditItem = (e) => {
    // e.stopPropagation();
    // ? 혹시 클릭, 수정 액션이 달라질 수도 있으므로 따로 메서드 만들어둠, 필요없으면 지울 것
    handleClickItem();
  };

  // // 삭제
  // const handelDeleteItem = async () => {
  //   // 모달 닫기
  //   closeModal();
  //   const result = await deleteData(data.id, isTestPage);
  //   if (!result) return;
  //   // 리스트 업데이트
  //   const updatedList = reduxListData.filter((item) => item.id !== data.id);
  //   setList(updatedList);
  //   dispatch(setReduxList(updatedList));
  // };

  // // '정말 삭제하시겠습니까?' 모달을 띄우는 메소드
  // const handelDeleteClick = (e) => {
  //   e.stopPropagation();
  //   openModal();
  // };

  // // 삭제 모달을 여닫는 메소드들
  // const closeModal = () => setIsModalOpen(false);
  // const openModal = () => setIsModalOpen(true);

  //////////////////////////////////////////////////////////////////
  return (
    <>
      {/* <PageLoaderModal isOpen={isLoading} />
      <>
        <Backdrop isShow={isModalOpen} onClick={closeModal} />
        <Modal
          isShow={isModalOpen}
          title={t('list:delete')}
          content={t('list:checkDelete')}
          type='danger'
          closeBtn
          onClose={closeModal}
        >
          <Button color='btn-danger' onClick={handelDeleteItem}>
            {t('list:delete')}
          </Button>
        </Modal>
      </> */}

      <tr id={data.id.toString()} className='cursor-pointer intro-x'>
        {/* id */}
        <td>
          <div className='font-medium whitespace-nowrap'>{data.id}</div>
        </td>

        {/* content id */}
        <td>
          <div className='font-medium whitespace-nowrap'>{data.content_id}</div>
        </td>

        {/* name */}
        <td>          
          <div 
            className='font-medium whitespace-nowrap underline'
            onClick={handleClickItem}
          >
            {data.name}</div>
        </td>

        {/* description */}
        <td>
          <div className='cms__item__desc__wrapper'>
            <span className='cms__item__desc__text'>{data.description}</span>
          </div>
        </td>
        {/* live Status */}
        <td>
          <div className='cms__item__desc__wrapper'>
            <span className='cms__item__desc__text'>{data.live_status_name}</span>            
          </div>
        </td>
        {/* IS PUBLIC */}
        <td>
          <div className='cms__item__desc__wrapper'>
            <span className='cms__item__desc__text'>{data.is_public_name}</span>
          </div>
        </td>

        <td>
          <div className='cms__item__desc__wrapper'>
            <span className='cms__item__desc__text'>{data.status_name}</span>
          </div>
        </td>

        <td>
          <div className='font-medium whitespace-nowrap'>
            {data.scheduled_at?.split('.')[0].split('T').join(" ")}
          </div>
        </td>

        <td>
          <div className='font-medium whitespace-nowrap'>
            {data.updated_at?.split('T')[0]}
          </div>
        </td>

        <td>
          <div className='font-medium whitespace-nowrap'>
            {data.registered_at.split('T')[0]}
          </div>
        </td>

        <td className='w-56 table-report__action'>
          <div className='flex items-center justify-center'>
            <ButtonEdit onClick={(e) => handelEditItem(e)} />
            {/* <ButtonDelete onClick={(e) => handelDeleteClick(e)} /> */}
          </div>
        </td>
      </tr>
    </>
  );
};

export default Item;
