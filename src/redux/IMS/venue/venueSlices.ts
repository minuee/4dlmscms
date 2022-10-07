import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { initialValues } from '@/pages/IMS/Venue/Detail';
import { ItemType } from '@/types/IMS/venue/index';

export const venue = createSlice({
  name: 'venue',
  initialState: {
    current: initialValues,
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
      state.current = initialValues;
    },
    resetList(state) {
      state.list = [] as ItemType[];
    },
  },
});

export const { setCurrent, setList, resetCurrent, resetList } = venue.actions;

export default venue.reducer;
