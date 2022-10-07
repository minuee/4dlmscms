import { useRestfulCustomAxios } from '@/hooks/axios-hooks-restful-ims';
import { ValueType } from '@/pages/IMS/System/Detail/Info';

export const useSystemDetailRequest = () => {
  const { isLoading, sendRequest } = useRestfulCustomAxios();

  const getData = async (id: String, isTestPage: boolean) => {
    const data = JSON.stringify({
      id,
    });

    const responseData = await sendRequest(
      `/web/system/getSystem`,
      'restful',
      'post',
      undefined,
      data,
      true,
      isTestPage
    );

    return responseData;
  };

  const deleteData = async (id: string, isTestPage: boolean) => {
    const data = JSON.stringify({
      id,
    });
    const responseData = await sendRequest(
      `/web/system/deleteSystem`,
      'restful',
      'post',
      undefined,
      data,
      false,
      isTestPage
    );

    return responseData;
  };

  const updateData = async (
    system_id,
    values: ValueType,
    isTestPage: boolean
  ) => {
    const data = JSON.stringify({
      system_id,
      name: values.name,
      description: values.description,
      venue_id: values.venue_id,
      fps: values.fps,
      width: values.width,
      height: values.height,
      is_extra: values.is_extra,
      comment: values.comment,
    });

    const responseData = await sendRequest(
      `/web/system/updateSystem`,
      'restful',
      'post',
      undefined,
      data,
      false,
      isTestPage
    );

    return responseData;
  };

  const createData = async (values: ValueType, isTestPage: boolean) => {
    // console.log({ values });

    const data = JSON.stringify({
      name: values.name,
      description: values.description,
      venue_id: values.venue_id,
      fps: values.fps,
      width: values.width,
      height: values.height,
      is_extra: values.is_extra,
      comment: values.comment,
    });
    const responseData = await sendRequest(
      `/web/system/insertSystem`,
      'restful',
      'post',
      undefined,
      data,
      false,
      isTestPage
    );

    return responseData;
  };

  return {
    createData,
    getData,
    updateData,
    deleteData,
    isLoading,
  };
};
