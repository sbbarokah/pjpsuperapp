// store/provider.tsx
'use client'; // Tandai sebagai Client Component

import { Provider } from 'react-redux';
import store, { persistor } from './store';
import { PropsWithChildren, Suspense } from 'react';
import { PersistGate } from 'redux-persist/integration/react';
import { Loader } from 'lucide-react';

export function StoreProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <PersistGate loading={<Loader />} persistor={persistor}>
        <Suspense fallback={<Loader />}>
          {children}
        </Suspense>
      </PersistGate>
    </Provider>
  )
}