'use client';

import * as React from 'react';

import type { BlogusaurusHandlers } from './types';

const HandlersContext = React.createContext<BlogusaurusHandlers>({});

export function BlogusaurusHandlersProvider({
  handlers,
  children,
}: {
  handlers: BlogusaurusHandlers;
  children: React.ReactNode;
}) {
  // Keep a stable identity while always calling the latest handler.
  const ref = React.useRef(handlers);
  React.useEffect(() => {
    ref.current = handlers;
  });

  const stable = React.useMemo<BlogusaurusHandlers>(
    () => ({
      onSave: (p) => ref.current.onSave?.(p),
      onPublish: (p) => ref.current.onPublish?.(p),
      onChange: (p) => ref.current.onChange?.(p),
      onError: (e) => ref.current.onError?.(e),
      onUploadFile: (file, ctx) => {
        if (!ref.current.onUploadFile) {
          return Promise.reject(new Error('No onUploadFile handler provided'));
        }
        return ref.current.onUploadFile(file, ctx);
      },
    }),
    []
  );

  return (
    <HandlersContext.Provider value={stable}>
      {children}
    </HandlersContext.Provider>
  );
}

export const useBlogusaurusHandlers = () => React.useContext(HandlersContext);
