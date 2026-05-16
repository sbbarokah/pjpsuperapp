// store/provider.tsx
'use client'; // Tandai sebagai Client Component

import { Provider } from 'react-redux';
import store, { persistor } from './store';
import { PropsWithChildren, Suspense } from 'react';
import { PersistGate } from 'redux-persist/integration/react';
import { Loader } from 'lucide-react';
import { LoadingScreen } from '@/components/ui/loading-indicator';

export function StoreProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <PersistGate loading={<LoadingScreen />} persistor={persistor}>
        <Suspense fallback={<LoadingScreen />}>
          {children}
        </Suspense>
      </PersistGate>
    </Provider>
  )
}