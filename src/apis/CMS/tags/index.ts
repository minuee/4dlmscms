import { useRestfulCustomAxios } from '@/hooks/axios-hooks-restful';

export const useCMSTagRequest = () => {
  const { isLoading, sendRequest } = useRestfulCustomAxios();

  const submitData = async (
    values: TagValueType,
    content_id,
    _id,
    league_id
  ) => {
    const responseData = await sendRequest(
      `/content/meta/tag/${content_id}/${_id}?league_id=${league_id}`,
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
