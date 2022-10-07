import { useRestfulCustomAxios } from '@/hooks/axios-hooks-restful-ims';
import { ValueType } from '@/pages/IMS/System/Detail/Event/Detail';

export const useEventDetailRequest = () => {
  const { isLoading, sendRequest } = useRestfulCustomAxios();

//   const getData = async (id: number, isTestPage: boolean) => {
//     const data = JSON.stringify({
//       id,
//     });

//     const responseData = await sendRequest(
//       `/web/node/getNode`,
//       'restful',
//       'post',
//       undefined,
//       data,
//       true,
//       isTestPage
//     );

//     return responseData;
//   };

  // Pick<ValueType, 'id'>
//   const deleteData = async (id: number, isTestPage: boolean) => {
//     const data = JSON.stringify({
//       id,
//     });
//     const responseData = await sendRequest(
//       `/web/node/deleteNode`,
//       'restful',
//       'post',
//       undefined,
//       data,
//       false,
//       isTestPage
//     );

//     return responseData;
//   };

  const updateData = async (
    system_id: string,
    node_id: number,
    values: ValueType,
    isTestPage: boolean
  ) => {
    const data = JSON.stringify({
      system_id,
      event_id: values.id,
      content_id: values.content_id,
      name: values.name,
      description: values.description,
      live_status: values.live_status,
      is_public: values.is_public,
      status: values.status,
      banner: values.banner ? values.banner : '',
      scheduled_at: values.scheduled_at
    });

    const responseData = await sendRequest(
      `/web/event/updateEvent`,
      'restful',
      'post',
      undefined,
      data,
      false,
      isTestPage
    );

    // console.log({ responseData });

    return responseData;
  };

  const createData = async (
    system_id: string,
    values: ValueType,
    isTestPage: boolean
  ) => {
    const data = JSON.stringify({
      system_id,
      content_id: values.content_id,
      name: values.name,
      description: values.description,
      live_status: values.live_status,
      is_public: values.is_public,
      status: values.status ? values.status : 'CM0501',
      scheduled_at: values.scheduled_at.split('T').join(" "),
    });
    const responseData = await sendRequest(
      `/web/event/insertEvent`,
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
    // getData,
    updateData,
    // deleteData,
    isLoading,
  };
};
