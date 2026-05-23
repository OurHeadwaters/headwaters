import { createContext, useContext, useState, ReactNode } from 'react';
import { HeadwatersInterpretResult } from '@workspace/api-client-react';

interface IntakeState {
  dump: string;
  setDump: (dump: string) => void;
  landDump: string;
  setLandDump: (landDump: string) => void;
  interpretResult: HeadwatersInterpretResult | null;
  setInterpretResult: (result: HeadwatersInterpretResult | null) => void;
  clear: () => void;
}

const IntakeContext = createContext<IntakeState | undefined>(undefined);

export function IntakeProvider({ children }: { children: ReactNode }) {
  const [dump, setDump] = useState('');
  const [landDump, setLandDump] = useState('');
  const [interpretResult, setInterpretResult] = useState<HeadwatersInterpretResult | null>(null);

  const clear = () => {
    setDump('');
    setLandDump('');
    setInterpretResult(null);
  };

  return (
    <IntakeContext.Provider value={{ dump, setDump, landDump, setLandDump, interpretResult, setInterpretResult, clear }}>
      {children}
    </IntakeContext.Provider>
  );
}

export function useIntake() {
  const context = useContext(IntakeContext);
  if (context === undefined) {
    throw new Error('useIntake must be used within an IntakeProvider');
  }
  return context;
}
