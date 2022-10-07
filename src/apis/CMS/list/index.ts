import { useRestfulCustomAxios } from '@/hooks/axios-hooks-restful';

export const useCMSListRequest = () => {
  const { isLoading, sendRequest } = useRestfulCustomAxios();

  ///////////////////////////////////////////////
  // list
  ///////////////////////////////////////////////
  const getContentList = async (
    item: ItemOrderType = 'c',
    desc: OrderingType = 0,
    skip: number = 0,
    limit: number = 100
  ) => {
    const responseData = await sendRequest(
      `/content/list/content/${item}/${desc}?skip=${skip}&limit=${limit}`,
      'restful',
      'get',
      undefined,
      undefined,
      true,
      false
    );

    return responseData;
  };
  const getContentChildList = async (
    content_id: number,
    _id: string,
    item: ItemOrderType = 'c',
    desc: OrderingType = 0,
    skip: number = 0,
    limit: number = 100
  ) => {
    const responseData = await sendRequest(
      `/content/list/child_content/${content_id}/${item}/${desc}?skip=${skip}&limit=${limit}`,
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
  // item
  ///////////////////////////////////////////////

  const getData = async (content_id, _id) => {
    const responseData = await sendRequest(
      `/content/detail/content/${content_id}/${_id}`,
      'restful',
      'get',
      undefined,
      undefined,
      true,
      false
    );

    return responseData;
  };

  const deleteData = async (content_id, _id, league_id) => {
    const data = JSON.stringify({
      content_id,
      mid: _id,
    });
    const responseData = await sendRequest(
      `/content/one/${content_id}/${_id}?league_id=${league_id}`,
      'restful',
      'delete',
      undefined,
      data,
      false,
      false
    );

    return responseData;
  };

  return {
    getContentList,
    getContentChildList,
    getData,
    deleteData,
    isLoading,
  };
};
