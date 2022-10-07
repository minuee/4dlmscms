import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export const content = createSlice({
  name: 'content',
  initialState: {
    parentCurrent: {} as TotalItemType,
    parentList: [] as TotalItemType[],
    //
    childCurrent: {} as TotalItemType,
    childList: [] as TotalItemType[],
  },
  reducers: {
    setParentCurrent(state, action: PayloadAction<TotalItemType>) {
      state.parentCurrent = action.payload;
    },
    setParentList(state, action: PayloadAction<TotalItemType[]>) {
      state.parentList = action.payload;
    },
    resetParentCurrent(state) {
      state.parentCurrent = {} as TotalItemType;
      // list 안의 있는 내용도 업데이트  -> 이건 별도로 호출해서 하기
    },
    resetParentList(state) {
      state.parentList = [] as TotalItemType[];
    },
    //
    addParentContent(state, action: PayloadAction<TotalItemType>) {
      state.parentList = [action.payload, ...state.parentList];
    },
    updateParentContent(state, action: PayloadAction<TotalItemType>) {
      const updatedItem = state.parentList.find(
        (item) => item._id === action.payload._id
      );
      const updatedItemIndex = state.parentList.indexOf(updatedItem);
      const copiedList = [...state.parentList];
      copiedList[updatedItemIndex] = action.payload;
      state.parentList = copiedList;
    },
    deleteParentContent(state, action: PayloadAction<TotalItemType>) {
      const updatedList = state.parentList.filter(
        (item) => item._id !== action.payload._id
      );
      state.parentList = updatedList;
    },
    ////////////////////////
    setChildCurrent(state, action: PayloadAction<TotalItemType>) {
      state.childCurrent = action.payload;
    },
    setChildList(state, action: PayloadAction<TotalItemType[]>) {
      state.childList = action.payload;
    },
    resetChildCurrent(state) {
      state.childCurrent = {} as TotalItemType;
    },
    resetChildList(state) {
      state.childList = [] as TotalItemType[];
    },
    //
    addChildContent(state, action: PayloadAction<TotalItemType>) {
      state.childList = [action.payload, ...state.childList];
    },
    updateChildContent(state, action: PayloadAction<TotalItemType>) {
      const updatedItem = state.childList.find(
        (item) => item._id === action.payload._id
      );
      const updatedItemIndex = state.childList.indexOf(updatedItem);
      const copiedList = [...state.childList];
      copiedList[updatedItemIndex] = action.payload;
      state.childList = copiedList;
    },
    deleteChildContent(state, action: PayloadAction<TotalItemType>) {
      const updatedList = state.childList.filter(
        (item) => item._id !== action.payload._id
      );
      state.childList = updatedList;
    },
  },
});

export const {
  setParentCurrent,
  setParentList,
  resetParentCurrent,
  resetParentList,
  //
  addParentContent,
  updateParentContent,
  deleteParentContent,
  //////////////////
  setChildCurrent,
  setChildList,
  resetChildCurrent,
  resetChildList,
  //
  addChildContent,
  updateChildContent,
  deleteChildContent,
} = content.actions;
export default content.reducer;
