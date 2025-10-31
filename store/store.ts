// store/store.ts
import { combineReducers, configureStore } from '@reduxjs/toolkit';
import themeConfigSlice from './themeConfigSlice';

const rootReducer = combineReducers({
    themeConfig: themeConfigSlice,
});

const store = configureStore({
    reducer: rootReducer,
});

export type IRootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;