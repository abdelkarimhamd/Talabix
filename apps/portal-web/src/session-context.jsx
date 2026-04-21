import React from 'react';
import { createContext } from 'react';

const SessionContext = createContext(null);

export function SessionProvider({
  api,
  children,
  logout,
  session,
  switchActor,
}) {
  return (
    <SessionContext.Provider value={{ api, logout, session, switchActor }}>
      {children}
    </SessionContext.Provider>
  );
}

export { SessionContext };
