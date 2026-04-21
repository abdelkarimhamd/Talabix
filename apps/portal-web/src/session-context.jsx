import React from 'react';
import { createContext } from 'react';

const SessionContext = createContext(null);

export function SessionProvider({ api, children, session, switchActor }) {
  return (
    <SessionContext.Provider value={{ api, session, switchActor }}>
      {children}
    </SessionContext.Provider>
  );
}

export { SessionContext };
