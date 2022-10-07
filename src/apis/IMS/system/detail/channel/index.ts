import { useRestfulCustomAxios } from '@/hooks/axios-hooks-restful';

const useChannelRequest = () => {
  const { isLoading, sendRequest } = useRestfulCustomAxios();

  const requestChannelIncludesGroups = async (system_id) => {
    const data = JSON.stringify({
      system_id,
    });

    const responseData = await sendRequest(
      `/web/channel/getChannelIncludeGroups4Cms`,
      'restful',
      'post',
      undefined,
      data,
      true,
      true
    );

    return responseData;
  };
  return {
    requestChannelIncludesGroups,
    isLoading,
  };
};

export default useChannelRequest;
