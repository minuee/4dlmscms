import React, { useState, lazy } from 'react';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { CATEGORY_UPDATE } from 'sets/constants';

import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { ReducerType } from '@/redux/reducer';
import { addCategory } from '@/redux/CMS/categorySlices';

import { excludeNe } from '@/utils/commonFn';
import {
  CategoryItemType,
  CategoryAllItemType,
} from '@/types/CMS/category/index';

const Button = lazy(() => import('comp/Button/Button'));
const Backdrop = lazy(() => import('comp/Backdrop/Backdrop'));
const Modal = lazy(() => import('comp/Modal/Modal'));

interface ItemProps {
  data: CategoryItemType;
  // list?: CategoryAllItemType;
  list?: Record<CategoryType, CategoryItemType[]>;
  setList?: (data) => void;
}

// 수정, 삭제 api 없음
const Item: React.FC<ItemProps> = ({ data, list, setList }: ItemProps) => {
  const history = useHistory();
  const { t } = useTranslation();

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const categoryData = useAppSelector(
    (state: ReducerType) => state.category.categoryList
  );

  const dispatch = useAppDispatch();

  // 클릭 이벤트(아이템 수정 이벤트와 같다)
  const handelClickItem = async () => {
    dispatch(addCategory({ ...categoryData, current: data }));
    // 페이지 이동
    history.push({ pathname: CATEGORY_UPDATE });
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

    return;
    // ? api 아직 안 나옴
    // deleteCategoryData(data.content_id, data._id, data.league_id);
  };

  const handelDeleteClick = (e) => {
    e.stopPropagation();
    // console.log(data.content_id);
    openModal();
  };

  // 삭제 모달을 여닫는 메소드들
  const closeModal = () => setIsModalOpen(false);
  const openModal = () => setIsModalOpen(true);

  ////////////////////////////////////////
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
        id={data._id}
        // data-solution-id={data.solution_id}
        className='intro-x cursor-pointer'
        onClick={handelClickItem}
      >
        <td>
          <div className='list__item__text' id={data._id}>
            {data[`${data.category_type}_id`]}
          </div>
        </td>

        <td>{data.category_type}</td>
        <td>
          {excludeNe(data.photo?.thumb?.small_url) ? (
            <img
              className='w-24'
              src={data.photo?.thumb?.small_url}
              alt='thumbnail'
              crossOrigin='anonymous'
            />
          ) : (
            <div className='thumb__skeleton'></div>
          )}
        </td>
        <td>
          <div className='list__item__text'>
            {excludeNe(data.name['en-US'])}
          </div>
          <br />
          <div className='cms__item__desc__wrapper'>
            <span className='cms__item__desc__text'>
              {excludeNe(data.desc['en-US'])}
            </span>
          </div>
        </td>
        <td>
          <div className='list__item__text'>
            {/* {data.updatedAt} */}
            {data.updatedAt.split('T')[0]}
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
