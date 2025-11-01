// components/ui/Dropdown.tsx (Versi Headless UI)
'use client';

import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';

// Anda bisa membuat props lebih spesifik, misal:
interface DropdownProps {
  button: React.ReactNode;
  children: React.ReactNode;
  btnClassName?: string;
}

export default function Dropdown({ button, children, btnClassName }: DropdownProps) {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className={btnClassName}>
          {button}
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800">
          <div className="py-1">
            {/* Headless UI akan secara otomatis mengubah `children` 
              menjadi `Menu.Item`. Jika `children` adalah 
              array komponen, ini bekerja otomatis.
              Atau, Anda bisa mengharapkan children sudah dibungkus `Menu.Item` 
              dari komponen parent.
            */}
            {children}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}

// Contoh penggunaan di Header.tsx:
/*
<Dropdown button={<>Tombol</>}>
    <Menu.Item>
        {({ active }) => (
            <a
                href="#"
                className={`${active ? 'bg-gray-100' : ''} block px-4 py-2 text-sm text-gray-700`}
            >
                Profil
            </a>
        )}
    </Menu.Item>
    <Menu.Item>
        ...
    </Menu.Item>
</Dropdown>
*/