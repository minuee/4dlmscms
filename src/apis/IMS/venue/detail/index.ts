import { useRestfulCustomAxios } from '@/hooks/axios-hooks-restful-ims';
import { ValueType } from '@/pages/IMS/Venue/Detail';

export const useVenueDetailRequest = () => {
  const { isLoading, sendRequest } = useRestfulCustomAxios();

  const getData = async (venueId: String, isTestPage: boolean) => {
    const data = JSON.stringify({
      id: venueId,
    });

    const responseData = await sendRequest(
      `/web/venue/getVenue`,
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
      `/web/venue/deleteVenue`,
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
    venue_id,
    values: ValueType,
    isTestPage: boolean
  ) => {
    // console.log({ values });
    // console.log({ venue_id });

    const data = JSON.stringify({
      venue_id,
      // city_id: values.city_id,
      country_id: values.country_id,
      description: values.description,
      event_name: values.event_name,
      event_yymm: values.event_yymm,
      name: values.name,
      // state_id: values.state_id,
      // timezone_name: values.timezone_name,
      // timezone_offset: values.timezone_offset,
    });

    const responseData = await sendRequest(
      `/web/venue/updateVenue`,
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
    const data = JSON.stringify({
      // city_id: values.city_id,
      country_id: values.country_id,
      description: values.description,
      event_name: values.event_name,
      event_yymm: values.event_yymm,
      name: values.name,
      // state_id: values.state_id,
      // timezone_name: values.timezone_name,
      // timezone_offset: values.timezone_offset,
    });
    const responseData = await sendRequest(
      `/web/venue/insertVenue`,
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
