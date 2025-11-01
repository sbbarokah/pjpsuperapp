'use client'; // <-- WAJIB untuk Client Component

import PerfectScrollbar from 'react-perfect-scrollbar';
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link'; // <-- Ganti NavLink
import { usePathname } from 'next/navigation'; // <-- Ganti useLocation
import { toggleSidebar } from '@/store/themeConfigSlice'; // Sesuaikan path
import AnimateHeight from 'react-animate-height';
import { useState, useEffect } from 'react';
import { IRootState } from '@/store/store';

// Impor Ikon (sesuaikan path jika perlu)
import IconCaretsDown from '@/components/icon/IconCaretsDown';
import IconCaretDown from '@/components/icon/IconCaretDown';
import IconMenuDashboard from '@/components/icon/Menu/IconMenuDashboard';
import IconMenuUsers from '@/components/icon/Menu/IconMenuUsers';
import IconMenuCalendar from '@/components/icon/Menu/IconMenuCalendar';
import IconMenuComponents from '@/components/icon/Menu/IconMenuComponents';
import IconMenuDatatables from '@/components/icon/Menu/IconMenuDatatables';

const Sidebar = () => {
  const [currentMenu, setCurrentMenu] = useState<string>('');
  const themeConfig = useSelector((state: IRootState) => state.themeConfig);
  const semidark = useSelector((state: IRootState) => state.themeConfig.semidark);
  const pathname = usePathname(); // <-- Hook baru
  const dispatch = useDispatch();

  const toggleMenu = (value: string) => {
    setCurrentMenu((oldValue) => {
      return oldValue === value ? '' : value;
    });
  };

  useEffect(() => {
    // Logika untuk membuka submenu secara otomatis
    // berdasarkan route saat ini (pathname)
    if (pathname.startsWith('/master-data')) {
      setCurrentMenu('master-data');
    } else {
      // Anda bisa tambahkan 'else if' lain jika ada submenu lain
      // atau biarkan saja
    }
  }, [pathname]);

  useEffect(() => {
    // Menutup sidebar di mobile saat navigasi
    if (window.innerWidth < 1024 && themeConfig.sidebar) {
      dispatch(toggleSidebar());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]); // <-- Menggunakan pathname

  return (
    <div className={semidark ? 'dark' : ''}>
      <nav
        className={`sidebar fixed min-h-screen h-full top-0 bottom-0 w-[260px] shadow-[5px_0_25px_0_rgba(94,92,154,0.1)] z-50 transition-all duration-300 ${semidark ? 'text-white-dark' : ''
          }`}
      >
        <div className="bg-white dark:bg-black h-full">
          <div className="flex justify-between items-center px-4 py-3">
            <Link href="/" className="main-logo flex items-center shrink-0">
              <img className="w-8 ml-[5px] flex-none" src="/assets/images/logo.svg" alt="logo" />
              <span className="text-2xl ltr:ml-1.5 rtl:mr-1.5 font-semibold align-middle lg:inline dark:text-white-light">
                ADMIN
              </span>
            </Link>

            <button
              type="button"
              className="collapse-icon w-8 h-8 rounded-full flex items-center hover:bg-gray-500/10 dark:hover:bg-dark-light/10 dark:text-white-light transition duration-300 rtl:rotate-180"
              onClick={() => dispatch(toggleSidebar())}
            >
              <IconCaretsDown className="m-auto rotate-90" />
            </button>
          </div>
          <PerfectScrollbar className="h-[calc(100vh-80px)] relative">
            <ul className="relative font-semibold space-y-0.5 p-4 py-0">
              {/* Dashboard */}
              <li className="nav-item">
                <Link
                  href="/"
                  className={`nav-link group ${pathname === '/' ? 'active' : ''}`}
                >
                  <div className="flex items-center">
                    <IconMenuDashboard className="group-hover:!text-primary shrink-0" />
                    <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">Dashboard</span>
                  </div>
                </Link>
              </li>

              {/* Generus */}
              <li className="nav-item">
                <Link
                  href="/generus"
                  className={`nav-link group ${pathname.startsWith('/generus') ? 'active' : ''}`}
                >
                  <div className="flex items-center">
                    <IconMenuUsers className="group-hover:!text-primary shrink-0" />
                    <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">Generus</span>
                  </div>
                </Link>
              </li>

              {/* Presensi */}
              <li className="nav-item">
                <Link
                  href="/presensi"
                  className={`nav-link group ${pathname.startsWith('/presensi') ? 'active' : ''}`}
                >
                  <div className="flex items-center">
                    <IconMenuCalendar className="group-hover:!text-primary shrink-0" />
                    <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">Presensi</span>
                  </div>
                </Link>
              </li>

              {/* Sarana Prasarana */}
              <li className="nav-item">
                <Link
                  href="/sarana-prasarana"
                  className={`nav-link group ${pathname.startsWith('/sarana-prasarana') ? 'active' : ''}`}
                >
                  <div className="flex items-center">
                    <IconMenuComponents className="group-hover:!text-primary shrink-0" />
                    <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">Sarana Prasarana</span>
                  </div>
                </Link>
              </li>

              {/* Master Data (Submenu) */}
              <li className="menu nav-item">
                <button
                  type="button"
                  className={`${pathname.startsWith('/master-data') ? 'active' : ''} nav-link group w-full`}
                  onClick={() => toggleMenu('master-data')}
                >
                  <div className="flex items-center">
                    <IconMenuDatatables className="group-hover:!text-primary shrink-0" />
                    <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">Master Data</span>
                  </div>

                  <div className={currentMenu !== 'master-data' ? 'rtl:rotate-90 -rotate-90' : ''}>
                    <IconCaretDown />
                  </div>
                </button>

                <AnimateHeight duration={300} height={currentMenu === 'master-data' ? 'auto' : 0}>
                  <ul className="sub-menu text-gray-500">
                    <li>
                      <Link href="/master-data/daerah" className={pathname === '/master-data/daerah' ? 'active' : ''}>Daerah</Link>
                    </li>
                    <li>
                      <Link href="/master-data/desa" className={pathname === '/master-data/desa' ? 'active' : ''}>Desa</Link>
                    </li>
                    <li>
                      <Link href="/master-data/kelompok" className={pathname === '/master-data/kelompok' ? 'active' : ''}>Kelompok</Link>
                    </li>
                    <li>
                      <Link href="/master-data/kelas" className={pathname === '/master-data/kelas' ? 'active' : ''}>Kelas</Link>
                    </li>
                    <li>
                      <Link href="/master-data/materi" className={pathname === '/master-data/materi' ? 'active' : ''}>Materi</Link>
                    </li>
                    <li>
                      <Link href="/master-data/materi-kelas" className={pathname === '/master-data/materi-kelas' ? 'active' : ''}>Materi & Kelas</Link>
                    </li>
                  </ul>
                </AnimateHeight>
              </li>
            </ul>
          </PerfectScrollbar>
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;

