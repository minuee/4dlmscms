import React, {
  useState,
  useEffect,
  lazy,
  Dispatch,
  SetStateAction,
} from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import {
  IS_IMS_TEST,
  SYSTEM_CREATE_SCALE_CREATE,
  SYSTEM_CREATE_SCALE_UPDATE,
  SYSTEM_UPDATE_SCALE_CREATE,
  SYSTEM_UPDATE_SCALE_UPDATE,
  TEST_SYSTEM_CREATE_SCALE_CREATE,
  TEST_SYSTEM_CREATE_SCALE_UPDATE,
  TEST_SYSTEM_UPDATE_SCALE_CREATE,
  TEST_SYSTEM_UPDATE_SCALE_UPDATE,
} from 'sets/constants';

import { useScaleDetailRequest } from '@/apis/IMS/system/detail/scale/detail/index';

import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { ReducerType } from '@/redux/reducer';
import { ValueType } from '@/types/IMS/system/scale/index';

import {
  setCurrent,
  setList as setReduxList,
} from '@/redux/IMS/system/scaleSlices';

const Backdrop = lazy(() => import('comp/Backdrop/Backdrop'));
const Modal = lazy(() => import('comp/Modal/Modal'));
import Button, { ButtonEdit, ButtonDelete } from 'comp/Button/Button';
import { PageLoaderModal } from 'comp/PageLoader/PageLoaderModal';

/* 
  ITEM
   */

interface ItemProps {
  data: ValueType;
  list: ValueType[];
  setList: Dispatch<SetStateAction<ValueType[]>>;
}

export const Item: React.FC<ItemProps> = ({ data, list, setList }) => {
  const history = useHistory();
  const location = useLocation();
  const pathName = location.pathname;
  const isTestPage = pathName.includes(IS_IMS_TEST);

  const { t, i18n } = useTranslation();

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const dispatch = useAppDispatch();
  // const scaleData = useAppSelector((state: ReducerType) => state.scale.current);
  const reduxListData = useAppSelector(
    (state: ReducerType) => state.scale.list
  );

  const { isLoading, deleteData } = useScaleDetailRequest();

  // 클릭 이벤트(아이템 수정 이벤트와 같다)
  const handelClickItem = async () => {
    dispatch(setCurrent({ ...data }));
    // 페이지 이동
    // history.push(
    //   pathName.includes('create')
    //     ? SYSTEM_CREATE_SCALE_UPDATE
    //     : SYSTEM_UPDATE_SCALE_UPDATE
    // );
    let nextPath;
    if (pathName.includes('create')) {
      nextPath = isTestPage
        ? TEST_SYSTEM_CREATE_SCALE_UPDATE
        : SYSTEM_CREATE_SCALE_UPDATE;

      // update
    } else {
      nextPath = isTestPage
        ? TEST_SYSTEM_UPDATE_SCALE_UPDATE
        : SYSTEM_UPDATE_SCALE_UPDATE;
    }

    // 페이지 이동
    history.push(nextPath);
  };

  // 아이템 수정 이벤트
  const handelEditItem = (e) => {
    // e.stopPropagation();
    // ? 혹시 클릭, 수정 액션이 달라질 수도 있으므로 따로 메서드 만들어둠, 필요없으면 지울 것
    handelClickItem();
  };

  // 삭제
  const handelDeleteItem = async () => {
    // 모달 닫기
    closeModal();
    // 삭제 요청
    const result = await deleteData(data.id, isTestPage);
    if (!result) return;

    // 리스트 업데이트
    const updatedList = reduxListData.filter((item) => item.id !== data.id);
    setList(updatedList);
    dispatch(setReduxList(updatedList));
  };

  // '정말 삭제하시겠습니까?' 모달을 띄우는 메소드
  const handelDeleteClick = (e) => {
    e.stopPropagation();
    // console.log(data.contentid);
    openModal();
  };

  // 삭제 모달을 여닫는 메소드들
  const closeModal = () => setIsModalOpen(false);
  const openModal = () => setIsModalOpen(true);

  /////////////////////////////////////////////////////
  return (
    <>
      <PageLoaderModal isOpen={isLoading} />
      <>
        <Backdrop isShow={isModalOpen} onClick={closeModal} />
        <Modal
          isShow={isModalOpen}
          title={t('delete')}
          content={t('checkDelete')}
          type='danger'
          closeBtn
          onClose={closeModal}
        >
          <Button color='btn-danger' onClick={handelDeleteItem}>
            {t('delete')}
          </Button>
        </Modal>
      </>

      <tr id={data.id.toString()} className='intro-x cursor-pointer'>
        {/* id */}
        <td>
          <div className='font-medium whitespace-nowrap'>{data.id}</div>
        </td>

        {/* venue event code */}
        <td className='underline' onClick={handelClickItem}>
          <div className='font-medium whitespace-nowrap'>
            {data.scale_group_count}
          </div>
          <div className='font-medium whitespace-nowrap'>
            {data.scale_image_id}
          </div>
          <div className='font-medium whitespace-nowrap'>
            {data.scale_instance_type}
          </div>
          <div className='font-medium whitespace-nowrap'>
            {data.scale_instance_type2}
          </div>
        </td>

        <td>
          {data.scale_security_group_ids.split(',').map((item) => {
            return (
              <div key={item} className='font-medium whitespace-nowrap'>
                {item}
              </div>
            );
          })}
        </td>

        <td>
          {data.scale_subnet_ids.split(',').map((item) => {
            return (
              <div key={item} className='font-medium whitespace-nowrap'>
                {item}
              </div>
            );
          })}
        </td>

        <td>
          <div className='cms__item__desc__wrapper'>
            <span className='cms__item__desc__text'>
              {data.scale_monitoring_tag_name}
            </span>
            <span className='cms__item__desc__text'>
              {data.scale_monitoring_tag_value}
            </span>
          </div>
        </td>

        <td>
          <div className='cms__item__desc__wrapper'>
            <span className='cms__item__desc__text'>{data.scale_on}</span>
            <span className='cms__item__desc__text'>
              {data.scale_out_resource}
            </span>
            <span className='cms__item__desc__text'>
              {data.scale_in_resource}
            </span>
            <span className='cms__item__desc__text'>
              {data.scale_out_limit_time}
            </span>
          </div>
        </td>

        <td>
          <div className='cms__item__desc__wrapper'>
            <span className='cms__item__desc__text'>{data.scale_ss_name}</span>
            <span className='cms__item__desc__text'>{data.region}</span>
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

        <td className='table-report__action w-56'>
          <div className='flex justify-center items-center'>
            <ButtonEdit onClick={(e) => handelEditItem(e)} />
            <ButtonDelete onClick={(e) => handelDeleteClick(e)} />
          </div>
        </td>
      </tr>
    </>
  );
};

export default Item;
