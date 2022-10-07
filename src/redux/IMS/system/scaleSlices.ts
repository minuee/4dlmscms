import { createSlice, PayloadAction } from '@reduxjs/toolkit';
// import { initialValues } from '@/pages/IMS/System/Detail/Scale/Detail';
import { ItemType } from '@/types/IMS/system/scale/index';

export const scale = createSlice({
  name: 'scale',
  initialState: {
    current: {} as ItemType,
    list: [] as ItemType[],
  },
  reducers: {
    setCurrent(state, action: PayloadAction<any>) {
      state.current = action.payload;
    },
    setList(state, action: PayloadAction<any>) {
      state.list = action.payload;
    },
    resetCurrent(state) {
      state.current = {} as ItemType;
    },
    resetList(state) {
      state.list = [] as ItemType[];
    },
  },
});

export const { setCurrent, setList, resetCurrent, resetList } = scale.actions;

export default scale.reducer;
