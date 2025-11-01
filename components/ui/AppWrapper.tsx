'use client'; // <-- Tandai sebagai Client Component

import { PropsWithChildren, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { IRootState } from '@/store/store';
import store from '@/store/store';
import {
  toggleRTL,
  toggleTheme,
  toggleMenu,
  toggleLayout,
  toggleAnimation,
  toggleNavbar,
  toggleSemidark,
} from '@/store/themeConfigSlice';

// Ini adalah implementasi App.tsx dari template Anda
function AppWrapper({ children }: PropsWithChildren) {
  const themeConfig = useSelector((state: IRootState) => state.themeConfig);
  const dispatch = useDispatch();

  useEffect(() => {
    // Kita hanya menjalankan kode ini di sisi client (browser)
    // dengan memeriksa 'typeof window !== "undefined"'.
    if (typeof window !== 'undefined') {
      dispatch(toggleTheme(localStorage.getItem('theme') || themeConfig.theme));
      dispatch(toggleMenu(localStorage.getItem('menu') || themeConfig.menu));
      dispatch(toggleLayout(localStorage.getItem('layout') || themeConfig.layout));
      dispatch(toggleRTL(localStorage.getItem('rtlClass') || themeConfig.rtlClass));
      dispatch(toggleAnimation(localStorage.getItem('animation') || themeConfig.animation));
      dispatch(toggleNavbar(localStorage.getItem('navbar') || themeConfig.navbar));
      dispatch(toggleSemidark(localStorage.getItem('semidark') || themeConfig.semidark));
    }
    // Kita hanya ingin menjalankan ini sekali saat mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`${(store.getState().themeConfig.sidebar && 'toggle-sidebar') || ''} ${themeConfig.menu} ${themeConfig.layout} ${themeConfig.rtlClass
        } main-section antialiased relative font-nunito text-sm font-normal`}
    >
      {children}
    </div>
  );
}

export default AppWrapper;
