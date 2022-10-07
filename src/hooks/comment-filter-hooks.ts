import {
  convertTimeToNumber,
  createFuzzyMatcher,
  getLocalDate,
} from '@/utils/commonFn';

export const useFilterComment = () => {
  const commentList = {
    // 초기 값
    arr: [],
    initArr(_arr) {
      this.arr = _arr;
      return this;
    },
    checkString: function (_string, _compareStringField) {
      const checkSpecialChar = /[~!@#$%^&*()_+|<>?:{}]/;
      const checkEngAndNum = /^[a-zA-Z0-9]*$/;
      if (!_string.trim()) return this;
      const result = this.arr.filter((item) => {
        // 영어랑 숫자 등 들어가면 그냥 includes로 체크
        if (checkEngAndNum.test(_string) || checkSpecialChar.test(_string))
          return item[_compareStringField].includes(_string);

        const regex = createFuzzyMatcher(_string);
        return regex.test(item[_compareStringField]);
      });

      if (result) this.arr = result;
      return this;
    },
    // checkSameDate: function (_numDate: number) {
    //   const strDate = getLocalDate(_numDate).toLowerCase().split('t')[0];
    //   return strDate;
    // },
    // 각각의 항목에서 해당하면 필터, 안 하면 그냥 기존에 받은 값 리턴 이렇게 진행하기
    filterDateStart: function (_startDate) {
      if (!_startDate) return this;
      const dateNumber = convertTimeToNumber(new Date(_startDate));

      const result = this.arr.filter((item) => {
        const strDate = getLocalDate(item.created_at)
          .toLowerCase()
          .split('t')[0];
        return item.created_at >= dateNumber || _startDate === strDate;
      });
      if (result) this.arr = result;
      return this;
    },
    filterDateEnd: function (_endDate) {
      if (!_endDate) return this;
      const dateNumber = convertTimeToNumber(new Date(_endDate));

      const result = this.arr.filter((item) => {
        const strDate = getLocalDate(item.created_at)
          .toLowerCase()
          .split('t')[0];
        return item.created_at <= dateNumber || _endDate === strDate;
      });
      if (result) this.arr = result;
      return this;
    },
    filterNickname: function (_nickname) {
      this.checkString(_nickname, 'nickname');
      return this;
    },
    filterEmail: function (_email) {
      this.checkString(_email, 'email');
      return this;
    },
    filterContentId: function (_parentId, _contentId) {
      if (!_parentId && !_contentId) return this;
      let filter = _contentId ? _contentId : _parentId;

      const result = this.arr.filter((item) => {
        return item.content_id === filter;
      });
      if (result) this.arr = result;
      return this;
    },
    filterContent: function (_content) {
      this.checkString(_content, 'reply_text');
      return this;
    },
    filterStatus: function (_status) {
      if (!_status || _status === 'ALL') return this;
      const result = this.arr.filter((item) => {
        // console.log(item.status.toLowerCase(), _status.toLowerCase());

        return item.reply_report_state.toLowerCase() === _status.toLowerCase();
      });

      if (result) this.arr = result;
      return this;
    },
    filterCheckedStatus: function (_status) {
      if (!_status || _status === 'ALL') return this;
      const result = this.arr.filter((item) => {
        return item.admin_check_state.toLowerCase() === _status.toLowerCase();
      });

      if (result) this.arr = result;
      return this;
    },
  };

  return { commentList };
};
