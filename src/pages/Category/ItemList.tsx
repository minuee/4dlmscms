import React, { useState, useEffect, lazy } from 'react';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { CATEGORY_CREATE, CMS_CATEGORY_TYPE } from 'sets/constants';

import { useCMSCategoryRequest } from '@/apis/category/list/index';

import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { ReducerType } from '@/redux/reducer';
import { addCategory, delCategory } from '@/redux/CMS/categorySlices';

import Item from './component/Item';
import Button, { ButtonAdd } from 'comp/Button/Button';
import Select, { Option } from 'comp/Input/Select';
import { PageLoaderModal } from 'comp/PageLoader/PageLoaderModal';

interface ItemListProps {}

// type CategoryType = 'category' | 'genre' | 'round' | 'season' | 'league';
// type ItemOrderType = 'c' | 'u' | 'lst' | 'cti';

const compName = 'category';

export const ItemList: React.FC<ItemListProps> = ({}) => {
  const { t } = useTranslation();

  const history = useHistory();

  const categoryData = useAppSelector(
    (state: ReducerType) => state.category.categoryList
  );

  const { getAllCategories } = useCMSCategoryRequest();

  const [categoryList, setCategoryList] = useState({
    category: [],
    genre: [],
    league: [],
    round: [],
    season: [],
    all: [],
  });
  const [categoryAllList, setCategoryAllList] = useState([]);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const addType = (type: CategoryType, arr) => {
    const newArrWithType = arr?.map((item) => {
      return { ...item, category_type: type };
    });

    return newArrWithType;
  };

  const getAllCategoryData = async () => {
    const [
      categoryResult,
      genreResult,
      leagueResult,
      roundResult,
      seasonResult,
    ] = await getAllCategories();
    setIsReady(true);

    const allList = [
      ...addType('category', categoryResult ? categoryResult : []),
      ...addType('genre', genreResult ? genreResult : []),
      ...addType('league', leagueResult ? leagueResult : []),
      ...addType('round', roundResult ? roundResult : []),
      ...addType('season', seasonResult ? seasonResult : []),
    ];

    setCategoryAllList(allList);

    setCategoryList({
      category: addType('category', categoryResult ? categoryResult : []),
      genre: addType('genre', genreResult ? genreResult : []),
      league: addType('league', leagueResult ? leagueResult : []),
      round: addType('round', roundResult ? roundResult : []),
      season: addType('season', seasonResult ? seasonResult : []),
      all: allList,
    });

    dispatch(
      addCategory({
        category: categoryResult ? categoryResult : [],
        genre: genreResult ? genreResult : [],
        league: leagueResult ? leagueResult : [],
        round: roundResult ? roundResult : [],
        season: seasonResult ? seasonResult : [],
        all: allList,
        current: {},
      })
    );
  };

  // cms 리스트를 받아온다.
  useEffect(() => {
    dispatch(delCategory());
    getAllCategoryData();
  }, []);

  const dispatch = useAppDispatch();

  const filterCategoryList = (e) => {
    setSelectedCategory(e.target.value);
    const type = e.target.value;
    setCategoryAllList(categoryList[type]);
  };

  // 아이템 추가
  const handleAddEvent = () => {
    // 리덕스에 있는 데이터 초기화
    dispatch(addCategory({ ...categoryData, current: {} }));
    history.push({ pathname: CATEGORY_CREATE });
  };

  //////////////////////////////////////////////////////////
  return isReady ? (
    <>
      <div className='list__header'>
        <h2 className='list__header__text'>{`${compName} ${t(
          'list:list'
        )}`}</h2>
      </div>
      <div className='list__body__wrapper'>
        <div className='list__body__wrapper__top'>
          <div className='flex flex-1'>
            <Button color={'btn-primary'} onClick={handleAddEvent}>
              {t('list:addNewCategory')}
            </Button>
            <ButtonAdd onClick={handleAddEvent} />
          </div>

          <Select
            noMarginTop
            name='csmSelect'
            id='csmSelect'
            onChange={(e) => filterCategoryList(e)}
            value={selectedCategory || ''}
          >
            <option value='' disabled hidden>
              {t('list:selectCategory')}
            </option>
            {CMS_CATEGORY_TYPE.map((item) => {
              return (
                <Option
                  key={item.value}
                  value={item.value}
                  label={item.label}
                />
              );
            })}
          </Select>
        </div>

        <div className='table_wrapper--scroll'>
          <table className='table table-report -mt-2'>
            {categoryAllList?.length !== 0 && (
              <thead>
                <tr>
                  <th className='th--basic'>{t('list:id')}</th>
                  <th className='th--basic'>{t('list:type')}</th>
                  <th className='th--basic'>{t('list:image')}</th>
                  <th className='th--basic'>
                    {t('list:title')}
                    <br />
                    {t('list:description')}
                  </th>
                  <th className='th--basic'>{t('list:updatedAt')}</th>
                </tr>
              </thead>
            )}

            <tbody>
              {categoryAllList?.length === 0 ? (
                <tr>
                  <td>
                    <span>{t('list:noData')}</span>
                  </td>
                </tr>
              ) : (
                categoryAllList?.map((item) => {
                  return (
                    <Item
                      key={item._id}
                      data={item}
                      list={categoryList}
                      setList={setCategoryList}
                    />
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  ) : (
    <PageLoaderModal isOpen={!isReady} />
  );
};

export default ItemList;
