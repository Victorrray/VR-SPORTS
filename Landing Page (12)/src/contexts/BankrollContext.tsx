import {
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react";

type BankrollStrategy = 'flat' | 'kelly' | 'percentage';

interface BankrollContextType {
  currentBankroll: number;
  setCurrentBankroll: (amount: number | ((prev: number) => number)) => void;
  startingBankroll: number;
  setStartingBankroll: (amount: number) => void;
  strategy: BankrollStrategy;
  setStrategy: (strategy: BankrollStrategy) => void;
  kellyFraction: string;
  setKellyFraction: (fraction: string) => void;
  flatBetAmount: string;
  setFlatBetAmount: (amount: string) => void;
  percentageBet: string;
  setPercentageBet: (percentage: string) => void;
}

const BankrollContext = createContext<
  BankrollContextType | undefined
>(undefined);

export function BankrollProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [currentBankroll, setCurrentBankroll] = useState(0);
  const [startingBankroll, setStartingBankroll] = useState(0);
  const [strategy, setStrategy] = useState<BankrollStrategy>('kelly');
  const [kellyFraction, setKellyFraction] = useState('0.5');
  const [flatBetAmount, setFlatBetAmount] = useState('50');
  const [percentageBet, setPercentageBet] = useState('2');

  return (
    <BankrollContext.Provider
      value={{
        currentBankroll,
        setCurrentBankroll,
        startingBankroll,
        setStartingBankroll,
        strategy,
        setStrategy,
        kellyFraction,
        setKellyFraction,
        flatBetAmount,
        setFlatBetAmount,
        percentageBet,
        setPercentageBet,
      }}
    >
      {children}
    </BankrollContext.Provider>
  );
}

export function useBankroll() {
  const context = useContext(BankrollContext);
  if (context === undefined) {
    throw new Error(
      "useBankroll must be used within a BankrollProvider",
    );
  }
  return context;
}
