import { useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { ReducerType } from '@/redux/reducer';
import { addCMS, delCMS } from '@/redux/CMS/cmsSlices';
// import { ToastContainer } from "react-toastify";
// import { showNotification } from '@/utils/commonFn';
import { MAX_CMS_STEP } from '@/settings/constants';

// let mounted: boolean = false;

export interface CMSProps {
  step: number;
  updateStep: (step: number) => void;
}

export const useCMS = () => {
  const cmsData = useAppSelector((state: ReducerType) => state.cms.cms);
  const [step, setStep] = useState<number>();
  const dispatch = useAppDispatch();

  const updateStep = (step: number) => {
    dispatch(addCMS({ ...cmsData, step }));
    setStep(step);
  };

  // update redux
  const updateCMSReduxData = (data, isUpdate, step?, contentUpdate?) => {
    // content 업데이트라면
    if (
      // cmsData?.content?._id === cmsData?._id ||
      contentUpdate
      //  ||
      // formik.values.have_parent === false
    ) {
      // console.log('redux content update');

      dispatch(
        addCMS({
          content: data,
          child_content_list: cmsData?.child_content_list
            ? cmsData?.child_content_list
            : [],
          ...data,
          step: isUpdate ? MAX_CMS_STEP : step ? step : cmsData.step,
        })
      );
      // 차일드 리스트 업데이트라면
    } else {
      // console.log('redux child update');
      const originalItem = cmsData.child_content_list?.find(
        (item) => item._id === data._id
      );

      // 기존에 있는 리스트라면
      if (originalItem) {
        const updatedItemIndex = cmsData.child_content_list?.indexOf(
          originalItem
        );
        // console.log({ updatedItemIndex });

        const copiedVodList = [...cmsData.child_content_list];
        copiedVodList[updatedItemIndex] = data;

        dispatch(
          addCMS({
            ...cmsData,
            child_content_list: [...copiedVodList],
            ...data,
            step: isUpdate ? MAX_CMS_STEP : step ? step : cmsData.step,
          })
        );

        // 새로 생성했다면 차일드 리스트에 추가
      } else {
        // console.log('redux child update 새로 생성');
        dispatch(
          addCMS({
            ...cmsData,
            child_content_list: [data, ...cmsData.child_content_list],
            ...data,
            step: isUpdate ? MAX_CMS_STEP : step ? step : cmsData.step,
          })
        );
      }
    }
  };

  const updateCMSChildListReduxData = (list) => {
    dispatch(
      addCMS({
        ...cmsData,
        child_content_list: list,
      })
    );
  };

  return { step, updateStep, updateCMSReduxData, updateCMSChildListReduxData };
};
