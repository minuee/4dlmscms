import { useRestfulCustomAxios } from '@/hooks/axios-hooks-restful';

export const useCMSCategoryRequest = () => {
  const { sendRequest } = useRestfulCustomAxios();

  ///////////////////////////////////////////////
  // item
  ///////////////////////////////////////////////
  const getCategoryData = async (
    type: CategoryType,
    itemOrder: ItemOrderType,
    order: 0 | 1
  ) => {
    // try {
    const responseData = await sendRequest(
      `/content/list/${type}/${itemOrder}/${order}`,
      'restful',
      'get',
      undefined,
      undefined,
      true,
      false
    );

    return responseData;
  };

  ///////////////////////////////////////////////
  // list
  ///////////////////////////////////////////////
  const getAllCategories = async () => {
    try {
      const [
        categoryResult,
        genreResult,
        leagueResult,
        roundResult,
        seasonResult,
      ] = await Promise.allSettled([
        getCategoryData('category', 'c', 0),
        getCategoryData('genre', 'c', 0),
        getCategoryData('league', 'c', 0),
        getCategoryData('round', 'c', 0),
        getCategoryData('season', 'c', 0),
      ]);

      return [
        categoryResult?.value,
        genreResult?.value,
        leagueResult?.value,
        roundResult?.value,
        seasonResult?.value,
      ];
    } catch (e) {
      
    }
  };

  return { getCategoryData, getAllCategories };
};
