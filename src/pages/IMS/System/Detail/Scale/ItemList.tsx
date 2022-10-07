import React, { useState, useEffect, lazy } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import {
  IMS_PAGES_PER_BLOCK,
  IMS_PAGING_COUNT,
  IS_IMS_TEST,
  PAGING_STRING,
  SYSTEM_CREATE_SCALE_CREATE,
  SYSTEM_CREATE_SCALE_UPDATE,
  SYSTEM_UPDATE_SCALE,
  SYSTEM_UPDATE_SCALE_CREATE,
  SYSTEM_UPDATE_SCALE_UPDATE,
  TEST_SYSTEM_CREATE_SCALE_CREATE,
  TEST_SYSTEM_CREATE_SCALE_UPDATE,
  TEST_SYSTEM_UPDATE_SCALE,
  TEST_SYSTEM_UPDATE_SCALE_CREATE,
  TEST_SYSTEM_UPDATE_SCALE_UPDATE,
} from 'sets/constants';

import { useScaleListRequest } from '@/apis/IMS/system/detail/scale/list';

import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { ReducerType } from '@/redux/reducer';
import { ItemType } from '@/types/IMS/system/scale/index';

import {
  setCurrent,
  setList as setReduxList,
  resetCurrent,
  resetList,
} from '@/redux/IMS/system/scaleSlices';

import Item from '../../component/ScaleItem';
import Button, { ButtonAdd } from 'comp/Button/Button';
import { PageLoaderModal } from 'comp/PageLoader/PageLoaderModal';
const Pagination = lazy(() => import('@/components/Pagination/Pagination'));

interface ItemListProps {}

export const ItemList: React.FC<ItemListProps> = ({}) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const history = useHistory();
  const location = useLocation();
  const pathName = location.pathname;
  const isTestPage = pathName.includes(IS_IMS_TEST);
  const compName =
    pathName.split('/')[3][0].toUpperCase() + pathName.split('/')[3].slice(1);

  const { getList, isLoading } = useScaleListRequest();
  const systemData = useAppSelector((state: ReducerType) => state.info.current);
  // const reduxListData = useAppSelector(
  //   (state: ReducerType) => state.scale.list
  // );

  const [list, setList] = useState<ItemType[]>([]);
  const [pagingInfo, setPagingInfo] = useState({
    pagingCount: IMS_PAGING_COUNT, // 몇 개씩 가져올지 결정
    totalCount: 0,
    totalPage: 0,
    currentPage: 1,
    currentCount: 0,
  });

  // ********************
  // paging
  // ********************
  const getListData = async (page: number) => {
    const result = await getList(
      isTestPage,
      systemData.id,
      page,
      pagingInfo.pagingCount,
      undefined
    );

    if (!result || !result.list) return;

    setList(result.list);
    dispatch(setReduxList(result.list));

    // paging 처리
    setPagingInfo((prev) => ({
      ...prev,
      totalCount: result.totalCount,
      totalPage: Math.ceil(result.totalCount / prev.pagingCount),
      currentPage: page ? page : prev.currentPage + 1,
      // 이제 서버에서 받은 데이터로 페이징하니까 아래 필요없는 듯
      currentCount: prev.currentCount + pagingInfo.pagingCount,
    }));
  };

  // 리스트를 받아온다.
  useEffect(() => {
    // 맨 처음 화면에 진입할 때에는 리스트를 모두 지우고,
    dispatch(resetList());

    // 페이지 첫 진입 시
    if (!location.search) {
      getListData(1);
      return;
    }

    const newPageNum = location.search.split(PAGING_STRING)[1];
    getListData(Number(newPageNum));
  }, [location.search]);

  // 페이지 바꿈 처리
  const handleChangePage = (page: number) => {
    // url 처리
    history.push(
      isTestPage
        ? `${TEST_SYSTEM_UPDATE_SCALE}?page=${page}`
        : `${SYSTEM_UPDATE_SCALE}?page=${page}`
    );

    getListData(page);
  };

  // 아이템 추가
  const handleAddEvent = () => {
    // 리덕스에 있는 데이터 초기화
    dispatch(resetCurrent());

    // history.push(
    //   pathName.includes('create')
    //     ? SYSTEM_CREATE_SCALE_CREATE
    //     : SYSTEM_UPDATE_SCALE_CREATE
    // );
    let nextPath;
    if (pathName.includes('create')) {
      nextPath = isTestPage
        ? TEST_SYSTEM_CREATE_SCALE_CREATE
        : SYSTEM_CREATE_SCALE_CREATE;

      // update
    } else {
      nextPath = isTestPage
        ? TEST_SYSTEM_UPDATE_SCALE_CREATE
        : SYSTEM_UPDATE_SCALE_CREATE;
    }

    // 페이지 이동
    history.push(nextPath);
  };

  ////////////////////////////////////////////////
  return (
    <>
      <section>
        <PageLoaderModal isOpen={isLoading} />

        <div className='list__header'>
          <h2 className='sr-only'>
            {compName} {t('list:list')}
          </h2>
        </div>
        <div className='list__body__wrapper'>
          <div className='list__body__wrapper__top'>
            <Button color={'btn-primary'} onClick={handleAddEvent}>
              {t('list:addNewScale')}
            </Button>
            <ButtonAdd onClick={handleAddEvent} />
          </div>

          <div className='table_wrapper--scroll'>
            <table className='table table-report -mt-2'>
              {list?.length !== 0 && (
                <thead>
                  <tr>
                    <th className='th--basic--uppercase'>{t('list:id')}</th>
                    <th className='th--basic--uppercase'>
                      {t('list:groupCount')}
                      <br />
                      {t('list:imageId')}
                      <br />
                      {t('list:instanceType')}
                      <br />
                      {t('list:instanceType2')}
                    </th>
                    <th className='th--basic--uppercase'>
                      {t('list:securityGroupIds')}
                    </th>
                    <th className='th--basic--uppercase'>
                      {t('list:subnetIds')}
                    </th>
                    <th className='th--basic--uppercase'>
                      {t('list:monitoringTag')}
                    </th>
                    <th className='th--basic--uppercase'>
                      {t('list:scaleOn')}
                      <br />
                      {t('list:scaleOutResource')}
                      <br />
                      {t('list:scaleInResource')}
                      <br />
                      {t('list:scaleOutTime')}
                    </th>
                    <th className='th--basic--uppercase'>
                      {t('list:scaleSsName')}
                      <br />
                      {t('list:region')}
                    </th>
                    <th className='th--basic--uppercase'>
                      {t('list:updatedAt')}
                    </th>
                    <th className='th--basic--uppercase'>
                      {t('list:registeredAt')}
                    </th>
                  </tr>
                </thead>
              )}

              <tbody>
                {list?.length === 0 ? (
                  <tr>
                    <td>
                      <span>{t('noData')}</span>
                    </td>
                  </tr>
                ) : (
                  list?.map((item) => {
                    return (
                      <Item
                        key={item.id}
                        data={item}
                        list={list}
                        setList={setList}
                      />
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
      {pagingInfo.totalPage > 1 && (
        <Pagination
          // key={location.search}
          totalPage={pagingInfo.totalPage}
          onClick={(page: number) => handleChangePage(page)}
          pagesPerBlock={IMS_PAGES_PER_BLOCK}
          currentPage={
            Number(location.search.split(PAGING_STRING)[1])
              ? Number(location.search.split(PAGING_STRING)[1])
              : 1
          }
        />
      )}
    </>
  );
};

export default ItemList;
