import React, { useState } from 'react';
import { showNotification, excludeNe, classNames } from '@/utils/commonFn';
import { useTranslation } from 'react-i18next';

export const useCMSImageAndVideos = () => {
  const { t } = useTranslation();

  // 파일이 비디오인지, 이름에 .이 들어가지 않았는지를 확인하는 메서드
  const checkFileisValid = (e): boolean => {
    // checkFileTypeIsVideo
    const file = e.target.files?.item(0);

    if (!file) return false;

    const fileType = file.type.split('/')[0];
    const fileExtension = file.type.split('/')[1];

    if (fileType !== 'video') {
      showNotification(t('cms:PleaseUploadVideoFile'), 'error');
      return false;
    }

    if (fileExtension.toLowerCase() !== 'mp4') {
      showNotification(t('cms:PleaseUploadMP4File'), 'error');
      return false;
    }

    const fileName = file.name.split('.mp4')[0];

    // 파일명에 .이 들어가지 못하도록 한다.
    if (fileName.includes('.')) {
      showNotification(t('cms:videoFileNameMustNotIncludeDot'), 'error');
      return false;
    }

    return true;
  };

  const returnFileType = (e): string => {
    const file = e.target.files?.item(0);
    return file.type;
  };

  // 제출 부분

  return { checkFileisValid, returnFileType };
};
