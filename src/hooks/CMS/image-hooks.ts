import { useCMSVideosAndImagesRequest } from '@/apis/CMS/videosAndImages';
import { excludeNe } from '@/utils/commonFn';
import { ImageSizeType } from '@/pages/CMS/Detail/VideosAndImages/Images';
// url 있다 -> 저장되어있는 상태
// 이미지도 삭제 배열 따로 가지고 있어야 함
// url && delArr -> 삭제
// url && imagesInfo -> 수정
//
// !url && imagesInfo -> 추가
// !url && delArr -> 무시
// !url && !imagesInfo -> 무시
// !url && delArr -> 무시
// !url && !delArr -> 무시

export const useCMSImages = () => {
  const {requestSavePicture, requestDeletePictureOrVideo} = useCMSVideosAndImagesRequest();
  const imagesPromiseList = {
    // 초기 값
    arr: { save: [], del: [] },
    arrStr: [],
    cmsData: '',
    imagesInfo: '',
    delArr: '',
    initCmsData(_cmsData) {
      this.cmsData = _cmsData;
      return this;
    },
    initImagesInfo(_imagesInfo) {
      this.imagesInfo = _imagesInfo;
      return this;
    },
    initDelArr(_delArr) {
      this.delArr = _delArr;
      return this;
    },
    initArr(_arr) {
      this.arr = _arr;
      return this;
    },
    initArrStr(_arrStr) {
      this.arrStr = _arrStr;
      return this;
    },
    
    filterSave: function () {
      for (const key in this.cmsData?.photo) {
        if (key.toLowerCase() === 'bucket_name') continue;

        for (const keySmall in this.cmsData?.photo?.[key]) {          
          // Large_url, Large 이렇게 한 이미지에 두 개의 키값이 있어서
          // 두 번 체크 안 하도록 url이 붙은 키 값은 리턴한다.
          if (keySmall.includes('url')) continue;
          // 서버에서는 'Large' 이렇게 키값을 사용해서 로어케이스로 바꿔준다.
          const keySmallLowerCase = keySmall.toLowerCase();
          // url 있는데 delArr에 있음 -> 삭제
          if (excludeNe(this.cmsData?.photo?.[key]?.[keySmall]) && this.delArr.includes(`${key}_${keySmallLowerCase}`)) {
            // 삭제
            this.arr.del.push(
              requestDeletePictureOrVideo(
                this.cmsData.content_id,
                this.cmsData._id,
                this.cmsData.league_id,
                `${key}_${keySmallLowerCase}`
              )
            );

            // string 배열에도 푸쉬(나중에 실패 시 어떤 요청이 실패했는지 알려주기 위해)
            this.arrStr.push(`${key}_${keySmallLowerCase}Delete`);
          }
          // cmsData에는 저장된 url 없는데 imageInfo에 있음 -> 추가
          if (
            !excludeNe(this.cmsData?.photo?.[key]?.[keySmall]) &&
            this.imagesInfo?.[`${key}_${keySmallLowerCase}`]
          ) {
            // 추가
            this.arr.save.push(
              requestSavePicture(
                this.imagesInfo[`${key}_${keySmallLowerCase}`],
                keySmallLowerCase as ImageSizeType,
                key as ImageUploadType,
                this.cmsData.content_id,
                this.cmsData._id,
                this.cmsData.league_id
              )
            );

            // string 배열에도 푸쉬(나중에 실패 시 어떤 요청이 실패했는지 알려주기 위해)
            this.arrStr.push(`${key}_${keySmallLowerCase}Save`);
          }
          // url 있는데 imageInfo에 있음 -> 수정
          if (
            excludeNe(this.cmsData?.photo?.[key]?.[keySmall]) &&
            this.imagesInfo?.[`${key}_${keySmallLowerCase}`]
          ) {
            // 수정(업로드 요청)
            this.arr.save.push(
              requestSavePicture(
                this.imagesInfo[`${key}_${keySmallLowerCase}`],
                keySmallLowerCase as ImageSizeType, // size
                key as ImageUploadType, // type
                this.cmsData.content_id,
                this.cmsData._id,
                this.cmsData.league_id
              )
            );

            // string 배열에도 푸쉬(나중에 실패 시 어떤 요청이 실패했는지 알려주기 위해)
            this.arrStr.push(`${key}_${keySmallLowerCase}Update`);
          }
        }
      }

      return this;
    },
    filterUpdate: function () {
      return this;
    },

    filterDelete: function () {
      return this;
    },
  };

  return { imagesPromiseList };
};
