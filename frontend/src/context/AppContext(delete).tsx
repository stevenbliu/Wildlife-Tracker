// Description: This file defines the AppContext for managing application state in a React application.
// Lightweight alternative to Redux for state management.

import React, { createContext, useContext, useState } from "react";

export interface Family {
  id: string;
  name: string;
  herdId: string;
}

export interface Herd {
  id: string;
  name: string;
}

export interface AppState {
  selectedHerd: string | null;
  selectedFamily: string | null;
  selectedTime: number;
  setSelectedHerd: (id: string | null) => void;
  setSelectedFamily: (id: string | null) => void;
  setSelectedTime: (time: number) => void;
}

const AppContext = createContext<AppState | null>(null);

export const useAppContext = () => useContext(AppContext)!;

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedHerd, setSelectedHerd] = useState<string | null>(null);
  const [selectedFamily, setSelectedFamily] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<number>(0);

  return (
    <AppContext.Provider
      value={{ selectedHerd, selectedFamily, selectedTime, setSelectedHerd, setSelectedFamily, setSelectedTime }}
    >
      {children}
    </AppContext.Provider>
  );
};


