'use client';

import * as React from 'react';

/**
 * Where popovers, menus, tooltips and dialogs render. BlogusaurusThemeProvider
 * sets this to its own root so portaled UI inherits the scoped theme
 * (CSS variables + dark mode class). `undefined` falls back to document.body.
 */
const PortalContainerContext = React.createContext<HTMLElement | undefined>(
  undefined
);

export const PortalContainerProvider = PortalContainerContext.Provider;

export const usePortalContainer = () => React.useContext(PortalContainerContext);
