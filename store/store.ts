// store/store.ts
import { combineReducers, configureStore } from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // defaults to localStorage for web

// Import Slices
import themeConfigSlice from './themeConfigSlice';
import qPackageSlice from './qPackageSlice'; // [BARU] Import slice keranjang soal

// --- Konfigurasi Redux Persist ---
const persistConfig = {
  key: 'root',
  storage,
  // [PENTING]: Tentukan reducer mana saja yang ingin disimpan ke localStorage.
  // Jika themeConfig juga perlu di-persist, tambahkan ke dalam array ini.
  whitelist: ['qPackage', 'themeConfig'],
};

// --- Gabungkan semua reducer ---
const rootReducer = combineReducers({
  themeConfig: themeConfigSlice,
  qPackage: qPackageSlice, // [BARU] Daftarkan reducer keranjang soal
});

// Bungkus rootReducer dengan persistReducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // Menonaktifkan peringatan serializableCheck khusus untuk action redux-persist
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type IRootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;