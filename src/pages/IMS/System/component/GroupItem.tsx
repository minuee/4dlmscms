import React, { useState, lazy, Dispatch, SetStateAction } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { IS_IMS_TEST } from 'sets/constants';

import { useGroupDetailRequest } from '@/apis/IMS/system/detail/group/detail';

import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { ReducerType } from '@/redux/reducer';
import {
  setCurrent,
  setList as setReduxList,
} from '@/redux/IMS/system/groupSlices';

import {
  ValueType,
  ClickedItemValueType,
} from '@/types/IMS/system/group/index';

const Button = lazy(() => import('comp/Button/Button'));
const Backdrop = lazy(() => import('comp/Backdrop/Backdrop'));
const Modal = lazy(() => import('comp/Modal/Modal'));

interface ItemProps {
  data: ValueType;
  list: ValueType[];
  setList: Dispatch<SetStateAction<ValueType[]>>;
  onClick: (p: number, d: ClickedItemValueType) => void;
}

export const Item: React.FC<ItemProps> = ({ data, list, setList, onClick }) => {
  const history = useHistory();
  const location = useLocation();
  const pathName = location.pathname;
  const isTestPage = pathName.includes(IS_IMS_TEST);

  const { t, i18n } = useTranslation();

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const dispatch = useAppDispatch();
  const reduxListData = useAppSelector(
    (state: ReducerType) => state.group.list
  );

  const { deleteData, getOtherGroupData, isLoading } = useGroupDetailRequest();

  const requestOtherData = async () => {
    const result = await getOtherGroupData(data.id, isTestPage);
    if (!result) return;
    // console.log({ result });

    return result;
    // TODO: 해당 데이터도 클릭드 데이터로 넘기기
  };

  // 클릭 이벤트(아이템 수정 이벤트와 같다)
  const handelClickItem = async () => {
    dispatch(setCurrent({ ...data }));

    // other info도 요청하여 받는다.
    const otherData = await requestOtherData();
    // console.log({ otherData });

    // 슬라이더를 연다.
    onClick(data.id, { ...data, ...otherData });
  };

  // 아이템 수정 이벤트
  const handelEditItem = (e) => {
    // e.stopPropagation();
    // handelClickItem();
  };

  // 삭제
  const handelDeleteItem = async () => {
    // 모달 닫기
    closeModal();

    return; // 우선 주석처리(api가 아직 안 나옴)
    const result = await deleteData(data.id, isTestPage);
    if (!result) return;
    // 리스트 업데이트
    const updatedList = reduxListData.filter((item) => item.id !== data.id);
    setList(updatedList);
    dispatch(setReduxList(updatedList));
  };

  const handelDeleteClick = (e) => {
    e.stopPropagation();
    // console.log(data.contentid);
    openModal();
  };

  // 삭제 모달을 여닫는 메소드들
  const closeModal = () => setIsModalOpen(false);
  const openModal = () => setIsModalOpen(true);

  // info modal을 닫는 메서드

  ////////////////////////////////////////////////////
  return (
    <>
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
      </>

      <tr
        id={data.id.toString()}
        className='intro-x cursor-pointer table__item'
      >
        {/* id */}
        <td>
          <div
            className='font-medium whitespace-nowrap'
            id={data.id.toString()}
          >
            {data.id}
          </div>
        </td>

        <td>
          <div className='cms__item__desc__wrapper'>
            <span className='cms__item__desc__text'>{data.group_index}</span>
          </div>
        </td>

        <td>
          <div
            className='font-medium whitespace-nowrap underline'
            onClick={handelClickItem}
          >
            {data.name}
          </div>
        </td>

        <td>
          <div className='cms__item__desc__wrapper'>
            <span className='cms__item__desc__text'>{data.view_type}</span>
          </div>
        </td>

        <td>
          <div className='cms__item__desc__wrapper'>
            <span className='cms__item__desc__text'>{data.description}</span>
          </div>
        </td>

        <td>
          <div className='cms__item__desc__wrapper'>
            <span className='cms__item__desc__text'>{data.type}</span>
          </div>
        </td>
        <td>
          <div className='cms__item__desc__wrapper'>
            <span className='cms__item__desc__text'>
              {data.is_external_group}
            </span>
          </div>
        </td>

        <td>
          <div className='cms__item__desc__wrapper'>
            <span className='cms__item__desc__text'>
              {data.default_channel_index}
            </span>
          </div>
        </td>

        <td>
          <div className='font-medium whitespace-nowrap'>
            {data.default_audio_index}
          </div>
        </td>

        <td>
          <div className='cms__item__desc__wrapper'>
            <span className='cms__item__desc__text'>
              {data.is_default_group}
            </span>
          </div>
        </td>
        <td>
          <div className='cms__item__desc__wrapper'>
            <span className='cms__item__desc__text'>{data.is_interactive}</span>
          </div>
        </td>

        <td>
          <div className='cms__item__desc__wrapper'>
            <span className='cms__item__desc__text'>{data.is_replay}</span>
          </div>
        </td>

        <td>
          <div className='cms__item__desc__wrapper'>
            <span className='cms__item__desc__text'>{data.is_timemachine}</span>
          </div>
        </td>

        <td>
          <div className='cms__item__desc__wrapper'>
            <span className='cms__item__desc__text'>{data.is_pdview}</span>
          </div>
        </td>

        <td>
          <div className='font-medium whitespace-nowrap'>
            {data.updated_at?.split('T')[0]}
          </div>
        </td>

        <td>
          <div className='font-medium whitespace-nowrap'>
            {data.registered_at?.split('T')[0]}
          </div>
        </td>

        {/* <td className='table-report__action w-56'>
            <div className='flex justify-center items-center'>
              <ButtonEdit onClick={(e) => handelEditItem(e)} />
              <ButtonDelete onClick={(e) => handelDeleteClick(e)} />
            </div>
          </td> */}
      </tr>
    </>
  );
};

export default Item;
