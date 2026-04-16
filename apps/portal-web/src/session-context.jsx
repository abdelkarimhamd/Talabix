import React from 'react';
import { createContext } from 'react';

const SessionContext = createContext(null);

export function SessionProvider({ children, session, api }) {
  return (
    <SessionContext.Provider value={{ session, api }}>
      {children}
    </SessionContext.Provider>
  );
}

export { SessionContext };
