import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export const cms = createSlice({
  name: 'category',
  initialState: {
    categoryList: {} as any,
  },
  reducers: {
    addCategory(state, action: PayloadAction<any>) {
      state.categoryList = action.payload;
    },
    delCategory(state) {
      state.categoryList = {};
    },
  },
});

export const { addCategory, delCategory } = cms.actions;
export default cms.reducer;
