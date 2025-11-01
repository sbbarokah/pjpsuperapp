import themeConfig from '@/app/theme.config';
import { createSlice } from '@reduxjs/toolkit';

// defaultState Anda sudah aman (statis)
const defaultState = {
  isDarkMode: false,
  mainLayout: 'app',
  theme: 'light',
  menu: 'vertical',
  layout: 'full',
  rtlClass: 'ltr',
  animation: '',
  navbar: 'navbar-sticky',
  locale: 'id',
  sidebar: false,
  pageTitle: '',
  languageList: [
    { code: 'en', name: 'English' },
    { code: 'id', name: 'Indonesia' },
  ],
  semidark: false,
};

// --- INI BAGIAN YANG DIPERBAIKI ---
// initialState SEKARANG STATIS. Ia mengambil nilai default dari
// themeConfig atau defaultState, BUKAN localStorage.
const initialState = {
  theme: themeConfig.theme,
  menu: themeConfig.menu,
  layout: themeConfig.layout,
  rtlClass: themeConfig.rtlClass,
  animation: themeConfig.animation,
  navbar: themeConfig.navbar,
  locale: themeConfig.locale,
  isDarkMode: defaultState.isDarkMode,
  sidebar: defaultState.sidebar,
  semidark: themeConfig.semidark,
  languageList: [
    { code: 'en', name: 'English' },
    { code: 'id', name: 'Indonesia' },
  ],
};
// --- AKHIR PERBAIKAN INITIALSTATE ---

const themeConfigSlice = createSlice({
  name: 'auth', // Anda mungkin ingin mengganti 'auth' menjadi 'themeConfig'
  initialState: initialState,
  reducers: {
    // --- SEMUA REDUCER DIBAWAH INI JUGA DIPERBAIKI ---
    // Kita bungkus semua API browser (localStorage, document, window)
    // dengan cek 'if (typeof window !== 'undefined')'

    toggleTheme(state, { payload }) {
      payload = payload || state.theme; // light | dark | system
      state.theme = payload;

      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', payload);
      }

      if (payload === 'system') {
        if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          state.isDarkMode = true;
        } else {
          state.isDarkMode = false;
        }
      } else if (payload === 'dark') {
        state.isDarkMode = true;
      } else {
        state.isDarkMode = false;
      }

      if (typeof window !== 'undefined') {
        if (state.isDarkMode) {
          document.querySelector('body')?.classList.add('dark');
        } else {
          document.querySelector('body')?.classList.remove('dark');
        }
      }
    },
    toggleMenu(state, { payload }) {
      payload = payload || state.menu; // vertical, collapsible-vertical, horizontal
      state.sidebar = false; // reset sidebar state
      if (typeof window !== 'undefined') {
        localStorage.setItem('menu', payload);
      }
      state.menu = payload;
    },
    toggleLayout(state, { payload }) {
      payload = payload || state.layout; // full, boxed-layout
      if (typeof window !== 'undefined') {
        localStorage.setItem('layout', payload);
      }
      state.layout = payload;
    },
    toggleRTL(state, { payload }) {
      payload = payload || state.rtlClass; // rtl, ltr
      if (typeof window !== 'undefined') {
        localStorage.setItem('rtlClass', payload);
      }
      state.rtlClass = payload;
      if (typeof window !== 'undefined') {
        document.querySelector('html')?.setAttribute('dir', state.rtlClass || 'ltr');
      }
    },
    toggleAnimation(state, { payload }) {
      payload = payload || state.animation;
      payload = payload?.trim();
      if (typeof window !== 'undefined') {
        localStorage.setItem('animation', payload);
      }
      state.animation = payload;
    },
    toggleNavbar(state, { payload }) {
      payload = payload || state.navbar; // navbar-sticky, navbar-floating, navbar-static
      if (typeof window !== 'undefined') {
        localStorage.setItem('navbar', payload);
      }
      state.navbar = payload;
    },
    toggleSemidark(state, { payload }) {
      payload = payload === true || payload === 'true' ? true : false;
      if (typeof window !== 'undefined') {
        localStorage.setItem('semidark', String(payload)); // Simpan sebagai string
      }
      state.semidark = payload;
    },
    toggleSidebar(state) {
      // Reducer ini aman, tidak ada API browser
      state.sidebar = !state.sidebar;
    },

    setPageTitle(state, { payload }) {
      if (typeof window !== 'undefined') {
        document.title = `${payload} | VRISTO - Admin Dashboard`; // Ganti judul
      }
    },
  },
});

export const { toggleTheme, toggleMenu, toggleLayout, toggleRTL, toggleAnimation, toggleNavbar, toggleSemidark, toggleSidebar, setPageTitle } = themeConfigSlice.actions;

export default themeConfigSlice.reducer;

