import React, { useState, useEffect, useContext, lazy } from 'react';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCMSListRequest } from '@/apis/CMS/list/index';
import { CMS_CONTENT, CMS_CONTENT_CREATE, CMS_PAGING_COUNT, PAGING_STRING } from 'sets/constants';

import { useAppDispatch } from '@/redux/hooks';
import { delCMS } from '@/redux/CMS/cmsSlices';
import { setParentList, resetParentCurrent } from '@/redux/CMS/contentSlices';
import { CMSContext } from 'cont/cms';
import Button, { ButtonAdd } from 'comp/Button/Button';
import Item from './component/ParentContentItem';

const PageLoaderModal = lazy(() => import('comp/PageLoader/PageLoaderModal'));
const Pagination = lazy(() => import('@/components/Pagination/PaginationBackAndForth'));

function ItemList () {
  const { updateStep, changeIsUpdate } = useContext(CMSContext);
  const { t } = useTranslation();

  const history = useHistory();

  const dispatch = useAppDispatch();
  const { getContentList } = useCMSListRequest();

  const [list, setList] = useState([]);
  const [pagingInfo, setPagingInfo] = useState({
    pagingCount: CMS_PAGING_COUNT, // 몇 개씩 가져올지 결정
    totalCount: 0,
    totalPage: 0,
    currentPage: 1,
    currentCount: 0,
  });

  const [isReady, setIsReady] = useState<boolean>(false);

  // ********************
  // paging
  // ********************
  useEffect(() => {
    // list 페이지므로 parentCurrent를 리셋한다.
    dispatch(resetParentCurrent());
    // 페이지 첫 진입 시
    if (!location.search) {
      getAndSetParentData('c', 1, 0, pagingInfo.pagingCount, 1);
      return;
    }

    const newPageNum = Number(location.search.split(PAGING_STRING)[1]);
    getAndSetParentData('c', 1, (newPageNum - 1) * pagingInfo.pagingCount, pagingInfo.pagingCount, newPageNum);
  }, [location.search]);

  const goNextPage = () => {
    if (pagingInfo.totalPage !== 0 && pagingInfo.totalPage === pagingInfo.currentPage) return;
    history.push(`${CMS_CONTENT}${PAGING_STRING}${pagingInfo.currentPage + 1}`);
  };

  const goPrevPage = () => {
    if (pagingInfo.currentPage === 1) return; 
    history.push(`${CMS_CONTENT}${PAGING_STRING}${pagingInfo.currentPage - 1}`);
  };

  const getAndSetParentData = async (
    item: ItemOrderType,
    desc: OrderingType,
    skip: number,
    limit: number,
    page?: number
  ) => {
    const result = await getContentList(item, desc, skip, limit);    
    // 추가 데이터를 로드하지 않는 상태로 전환
    if (!result) {
      return;
    }
    setIsReady(true);
    setList(result);
    dispatch(setParentList(result));

    // 결과가 요청 수 보다 적으면 마지막 요청이라고 판단한다.
    // if (result.length < pagingInfo.pagingCount) setIsAllFetched(true);

    setPagingInfo((prev) => ({
      ...prev,
      currentPage: page ? page : prev.currentPage + 1,
      currentCount: result.length,
      totalPage:
        result.length < pagingInfo.pagingCount
          ? prev.currentPage + 1
          : prev.totalPage,
    }));
  };

  const handleAddEvent = () => {
    // 리덕스에 있는 데이터 초기화
    dispatch(delCMS());
    dispatch(resetParentCurrent());
    // create 이므로 처음 스텝들부터(베이직 인포 저장)진행한다.
    updateStep(0);
    // create 이므로
    changeIsUpdate(false);
    // 페이지 이동
    history.push({ pathname: CMS_CONTENT_CREATE });
  };

  return isReady ? (
    <>
      <div className='list__header'>
        <h2 className='list__header__text'>
          {`Content ${t('list:list')}`}
        </h2>
      </div>
      <div className='list__body__wrapper'>
        <div className='list__body__wrapper__top'>
          <Button color={'btn-primary'} onClick={handleAddEvent}>
            {t('list:addNewContent')}
          </Button>
          <ButtonAdd onClick={handleAddEvent} />
        </div>

        <div className='table_wrapper--scroll'>
          <table className='table -mt-2 table-report'>
            {list?.length !== 0 && (
              <thead>
                <tr>
                  <th className='th--basic'>{t('list:id')}</th>
                  <th className='th--basic'>{t('list:package')}</th>
                  <th className='th--basic'>{t('list:thumbnail')}</th>
                  <th className='th--basic'>{t('list:title')}</th>
                  <th className='th--basic'></th>
                  <th className='th--basic'>{t('list:startTime')}</th>
                  <th>{t('list:endTime')}</th>
                </tr>
              </thead>
            )}

            <tbody>
              {list?.length === 0 ? (
                <tr>
                  <td>
                    <span>{t('list:noContent')}</span>
                  </td>
                </tr>
              ) : (
                list?.map((item) => {
                  return (
                    item && (
                      <Item
                        key={item._id}
                        data={item}
                        list={list}
                        setList={setList}
                      />
                    )
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      <Pagination onClickPrev={goPrevPage} onClickNext={goNextPage} />
    </>
  ) : (
    <PageLoaderModal isOpen={!isReady} />
  );
};

export default ItemList;
