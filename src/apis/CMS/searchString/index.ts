import { useRestfulCustomAxios } from '@/hooks/axios-hooks-restful';

export const useCMSSearchStringRequest = () => {
  const { isLoading, sendRequest } = useRestfulCustomAxios();

  const submitData = async (values, content_id, _id, league_id) => {
    const responseData = await sendRequest(
      `/content/meta/search_string/${content_id}/${_id}?league_id=${league_id}`,
      'restful',
      'put',
      undefined,
      JSON.stringify(values),
      false,
      false
    );

    return responseData;
  };

  return { submitData, isLoading };
};
