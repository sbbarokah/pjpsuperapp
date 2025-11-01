'use client'; // <-- FIX 1: WAJIB ditambahkan

import { Fragment, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleRTL, toggleTheme, toggleSidebar } from '../../store/themeConfigSlice';
import IconCalendar from '../icon/IconCalendar';
import IconEdit from '../icon/IconEdit';
import IconChatNotification from '../icon/IconChatNotification';
import IconXCircle from '../icon/IconXCircle';
import IconSun from '../icon/IconSun';
import IconMoon from '../icon/IconMoon';
import IconLaptop from '../icon/IconLaptop';
import IconInfoCircle from '../icon/IconInfoCircle';
import IconBellBing from '../icon/IconBellBing';
import IconUser from '../icon/IconUser';
import IconMail from '../icon/IconMail';
import IconLockDots from '../icon/IconLockDots';
import IconLogout from '../icon/IconLogout';
import Link from 'next/link'; // <-- FIX 2: Ganti 'react-router-dom'
import { usePathname } from 'next/navigation'; // <-- FIX 3: Ganti 'useLocation'
import { IRootState } from '@/store/store';
import IconMenu from '../icon/IconMenu';
// FIX 4: Impor Headless UI v2. Hapus 'Dropdown'.
import { Menu, MenuButton, MenuItems, MenuItem, Transition } from '@headlessui/react';

const Header = () => {
  const pathname = usePathname(); // <-- FIX 3: Ganti 'useLocation'

  useEffect(() => {
    // FIX 3.1: Ganti 'window.location.pathname' dengan hook 'pathname'
    const selector = document.querySelector('ul.horizontal-menu a[href="' + pathname + '"]');
    if (selector) {
      selector.classList.add('active');
      const all: any = document.querySelectorAll('ul.horizontal-menu .nav-link.active');
      for (let i = 0; i < all.length; i++) {
        all[0]?.classList.remove('active');
      }
      const ul: any = selector.closest('ul.sub-menu');
      if (ul) {
        let ele: any = ul.closest('li.menu').querySelectorAll('.nav-link');
        if (ele) {
          ele = ele[0];
          setTimeout(() => {
            ele?.classList.add('active');
          });
        }
      }
    }
  }, [pathname]); // <-- FIX 3.2: Ganti dependensi 'location'

  const isRtl = useSelector((state: IRootState) => state.themeConfig.rtlClass) === 'rtl' ? true : false;

  const themeConfig = useSelector((state: IRootState) => state.themeConfig);
  const dispatch = useDispatch();

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      profile: 'user-profile.jpeg',
      message: '<strong class="text-sm mr-1">John Doe</strong>invite you to <strong>Prototyping</strong>',
      time: '45 min ago',
    },
    {
      id: 2,
      profile: 'profile-34.jpeg',
      message: '<strong class="text-sm mr-1">Adam Nolan</strong>mentioned you to <strong>UX Basics</strong>',
      time: '9h Ago',
    },
    {
      id: 3,
      profile: 'profile-16.jpeg',
      message: '<strong class="text-sm mr-1">Anna Morgan</strong>Upload a file',
      time: '9h Ago',
    },
  ]);

  const removeNotification = (value: number) => {
    setNotifications(notifications.filter((user) => user.id !== value));
  };

  return (
    <header className={`z-40 ${themeConfig.semidark && themeConfig.menu === 'horizontal' ? 'dark' : ''}`}>
      <div className="shadow-sm">
        <div className="relative bg-white flex w-full items-center px-5 py-2.5 dark:bg-black">
          <div className="horizontal-logo flex lg:hidden justify-between items-center ltr:mr-2 rtl:ml-2">
            {/* FIX 5: Ganti 'to' menjadi 'href' */}
            <Link href="/" className="main-logo flex items-center shrink-0">
              <img className="w-8 ltr:-ml-1 rtl:-mr-1 inline" src="/assets/images/logo.svg" alt="logo" />
              <span className="text-2xl ltr:ml-1.5 rtl:mr-1.5  font-semibold  align-middle hidden md:inline dark:text-white-light transition-all duration-300">VRISTO</span>
            </Link>
            <button
              type="button"
              className="collapse-icon flex-none dark:text-[#d0d2d6] hover:text-primary dark:hover:text-primary flex lg:hidden ltr:ml-2 rtl:mr-2 p-2 rounded-full bg-white-light/40 dark:bg-dark/40 hover:bg-white-light/90 dark:hover:bg-dark/60"
              onClick={() => {
                dispatch(toggleSidebar());
              }}
            >
              <IconMenu className="w-5 h-5" />
            </button>
          </div>

          <div className="ltr:mr-2 rtl:ml-2 hidden sm:block">
            <ul className="flex items-center space-x-2 rtl:space-x-reverse dark:text-[#d0d2d6]">
              <li>
                {/* FIX 5: Ganti 'to' menjadi 'href' */}
                <Link href="/apps/calendar" className="block p-2 rounded-full bg-white-light/40 dark:bg-dark/40 hover:text-primary hover:bg-white-light/90 dark:hover:bg-dark/60">
                  <IconCalendar />
                </Link>
              </li>
              <li>
                {/* FIX 5: Ganti 'to' menjadi 'href' */}
                <Link href="/apps/todolist" className="block p-2 rounded-full bg-white-light/40 dark:bg-dark/40 hover:text-primary hover:bg-white-light/90 dark:hover:bg-dark/60">
                  <IconEdit />
                </Link>
              </li>
              <li>
                {/* FIX 5: Ganti 'to' menjadi 'href' */}
                <Link href="/apps/chat" className="block p-2 rounded-full bg-white-light/40 dark:bg-dark/40 hover:text-primary hover:bg-white-light/90 dark:hover:bg-dark/60">
                  <IconChatNotification />
                </Link>
              </li>
            </ul>
          </div>
          <div className="sm:flex-1 ltr:sm:ml-0 ltr:ml-auto sm:rtl:mr-0 rtl:mr-auto flex items-center space-x-1.5 lg:space-x-2 rtl:space-x-reverse dark:text-[#d0d2d6]">
            <div>
              {/* ... (logika tombol tema - ini sudah benar) ... */}
              {themeConfig.theme === 'light' ? (
                <button
                  className={'flex items-center p-2 rounded-full bg-white-light/40 dark:bg-dark/40 hover:text-primary hover:bg-white-light/90 dark:hover:bg-dark/60'}
                  onClick={() => dispatch(toggleTheme('dark'))}
                >
                  <IconSun />
                </button>
              ) : null}
              {themeConfig.theme === 'dark' && (
                <button
                  className={'flex items-center p-2 rounded-full bg-white-light/40 dark:bg-dark/40 hover:text-primary hover:bg-white-light/90 dark:hover:bg-dark/60'}
                  onClick={() => dispatch(toggleTheme('system'))}
                >
                  <IconMoon />
                </button>
              )}
              {themeConfig.theme === 'system' && (
                <button
                  className={'flex items-center p-2 rounded-full bg-white-light/40 dark:bg-dark/40 hover:text-primary hover:bg-white-light/90 dark:hover:bg-dark/60'}
                  onClick={() => dispatch(toggleTheme('light'))}
                >
                  <IconLaptop />
                </button>
              )}
            </div>

            {/* FIX 6: Ganti Dropdown Notifikasi ke Headless UI v2 */}
            <div className="dropdown shrink-0">
              <Menu as="div" className="relative inline-block">
                <MenuButton className="relative block p-2 rounded-full bg-white-light/40 dark:bg-dark/40 hover:text-primary hover:bg-white-light/90 dark:hover:bg-dark/60">
                  <span>
                    <IconBellBing />
                    <span className="flex absolute w-3 h-3 ltr:right-0 rtl:left-0 top-0">
                      <span className="animate-ping absolute ltr:-left-[3px] rtl:-right-[3px] -top-[3px] inline-flex h-full w-full rounded-full bg-success/50 opacity-75"></span>
                      <span className="relative inline-flex rounded-full w-[6px] h-[6px] bg-success"></span>
                    </span>
                  </span>
                </MenuButton>

                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <MenuItems className="absolute z-50 mt-2 w-[300px] sm:w-[350px] origin-top-right ltr:right-0 rtl:left-0 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800">
                    <ul className="!py-0 text-dark dark:text-white-dark divide-y dark:divide-white/10">
                      <li>
                        <div className="flex items-center px-4 py-2 justify-between font-semibold">
                          <h4 className="text-lg">Notification</h4>
                          {notifications.length ? <span className="badge bg-primary/80">{notifications.length} New</span> : ''}
                        </div>
                      </li>
                      {notifications.length > 0 ? (
                        <>
                          {notifications.map((notification) => {
                            return (
                              <li key={notification.id} className="dark:text-white-light/90">
                                <div className="group flex items-center px-4 py-2">
                                  <div className="grid place-content-center rounded">
                                    <div className="w-12 h-12 relative">
                                      <img className="w-12 h-12 rounded-full object-cover" alt="profile" src={`/assets/images/${notification.profile}`} />
                                      <span className="bg-success w-2 h-2 rounded-full block absolute right-[6px] bottom-0"></span>
                                    </div>
                                  </div>
                                  <div className="ltr:pl-3 rtl:pr-3 flex flex-auto">
                                    <div className="ltr:pr-3 rtl:pl-3">
                                      <h6
                                        dangerouslySetInnerHTML={{
                                          __html: notification.message,
                                        }}
                                      ></h6>
                                      <span className="text-xs block font-normal dark:text-gray-500">{notification.time}</span>
                                    </div>
                                    <button
                                      type="button"
                                      className="ltr:ml-auto rtl:mr-auto text-neutral-300 hover:text-danger opacity-0 group-hover:opacity-100"
                                      onClick={() => removeNotification(notification.id)}
                                    >
                                      <IconXCircle />
                                    </button>
                                  </div>
                                </div>
                              </li>
                            );
                          })}
                          <li>
                            <div className="p-4">
                              {/* Bungkus tombol aksi dengan MenuItem */}
                              <MenuItem>
                                <button className="btn btn-primary block w-full btn-small data-[active]:ring-2 data-[active]:ring-blue-300">
                                  Read All Notifications
                                </button>
                              </MenuItem>
                            </div>
                          </li>
                        </>
                      ) : (
                        <li>
                          <button type="button" className="!grid place-content-center hover:!bg-transparent text-lg min-h-[200px] w-full">
                            <div className="mx-auto ring-4 ring-primary/30 rounded-full mb-4 text-primary">
                              <IconInfoCircle fill={true} className="w-10 h-10" />
                            </div>
                            No data available.
                          </button>
                        </li>
                      )}
                    </ul>
                  </MenuItems>
                </Transition>
              </Menu>
            </div>

            {/* FIX 7: Perbarui Dropdown Profil ke Headless UI v2 (dari v1) */}
            <div className="dropdown shrink-0 flex">
              <Menu as="div" className="relative inline-block">
                <MenuButton className="relative group block">
                  <img className="w-9 h-9 rounded-full object-cover saturate-50 group-hover:saturate-100" src="/assets/images/user-profile.jpeg" alt="userProfile" />
                </MenuButton>

                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <MenuItems className="absolute z-50 mt-2 text-dark dark:text-white-dark !py-0 w-[230px] font-semibold dark:text-white-light/90 origin-top-right ltr:right-0 rtl:left-0 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800">
                    <div className="border-b border-white-light dark:border-white-light/10">
                      <div className="flex items-center px-4 py-4">
                        <img className="rounded-md w-10 h-10 object-cover" src="/assets/images/user-profile.jpeg" alt="userProfile" />
                        <div className="ltr:pl-4 rtl:pr-4 truncate">
                          <h4 className="text-base">
                            John Doe
                            <span className="text-xs bg-success-light rounded text-success px-1 ltr:ml-2 rtl:ml-2">Pro</span>
                          </h4>
                          <button type="button" className="text-black/60 hover:text-primary dark:text-dark-light/60 dark:hover:text-white">
                            johndoe@gmail.com
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="py-1">
                      {/* Ganti Menu.Item + render prop ke MenuItem + data-[active] */}
                      <MenuItem>
                        <Link
                          href="/users/profile" // <-- Ganti 'to' menjadi 'href'
                          className="flex items-center w-full px-4 py-2 text-sm data-[active]:bg-gray-100 data-[active]:dark:bg-gray-700 dark:hover:text-white"
                        >
                          <IconUser className="w-4.5 h-4.5 ltr:mr-2 rtl:ml-2 shrink-0" />
                          Profile
                        </Link>
                      </MenuItem>
                      <MenuItem>
                        <Link
                          href="/apps/mailbox" // <-- Ganti 'to' menjadi 'href'
                          className="flex items-center w-full px-4 py-2 text-sm data-[active]:bg-gray-100 data-[active]:dark:bg-gray-700 dark:hover:text-white"
                        >
                          <IconMail className="w-4.5 h-4.5 ltr:mr-2 rtl:ml-2 shrink-0" />
                          Inbox
                        </Link>
                      </MenuItem>
                      <MenuItem>
                        <Link
                          href="/auth/boxed-lockscreen" // <-- Ganti 'to' menjadi 'href'
                          className="flex items-center w-full px-4 py-2 text-sm data-[active]:bg-gray-100 data-[active]:dark:bg-gray-700 dark:hover:text-white"
                        >
                          <IconLockDots className="w-4.5 h-4.5 ltr:mr-2 rtl:ml-2 shrink-0" />
                          Lock Screen
                        </Link>
                      </MenuItem>
                    </div>

                    <div className="border-t border-white-light dark:border-white-light/10 py-1">
                      <MenuItem>
                        <Link
                          href="/auth/boxed-signin" // <-- Ganti 'to' menjadi 'href'
                          className="flex items-center w-full px-4 py-2 text-sm text-danger data-[active]:bg-gray-100 data-[active]:dark:bg-gray-700"
                        >
                          <IconLogout className="w-4.5 h-4.5 ltr:mr-2 rtl:ml-2 rotate-90 shrink-0" />
                          Sign Out
                        </Link>
                      </MenuItem>
                    </div>
                  </MenuItems>
                </Transition>
              </Menu>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
