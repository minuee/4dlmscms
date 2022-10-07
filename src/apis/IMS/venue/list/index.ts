import { useRestfulCustomAxios } from '@/hooks/axios-hooks-restful-ims';

export const useVenueListRequest = () => {
  const { isLoading, sendRequest } = useRestfulCustomAxios();

  ///////////////////////////////////////////////
  // list
  ///////////////////////////////////////////////
  const getList = async (
    isTestPage: boolean,
    pageNo: number = 1,
    pageSize: number = 100,
    sortColumn: string = 'id'
  ) => {
    // return new Promise((resolve, reject) => {
    //   resolve('success');
    // });

    const data = JSON.stringify({
      isDecending: false,
      pageNo,
      pageSize,
      sortColumn,
    });

    const responseData = await sendRequest(
      `/web/venue/listVenue`,
      'restful',
      'post',
      undefined,
      data,
      true,
      isTestPage
    );

    return responseData;
  };

  const requestExcelImport = async (
    file: File,
    venue_id: string,
    system_id: string,
    venueDelete: string
  ) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('venue_id', venue_id)
    formData.append('system_id', system_id);
    formData.append('venueDelete', venueDelete);

    const responseData = await sendRequest(
      `/web/venue/upLoadIMSExcel`,
      'restful',
      'post',
      undefined,
      formData,
      false,
      false
    );

    return responseData;
  };

  return {
    getList,
    requestExcelImport,
    isLoading,
  };
};
