import {
  createContext,
  useContext,
  useState,
  useEffect,
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

// Helper to get stored value from localStorage
const getStoredValue = <T,>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const stored = localStorage.getItem(key);
    if (stored === null) return defaultValue;
    return JSON.parse(stored) as T;
  } catch {
    return defaultValue;
  }
};

export function BankrollProvider({
  children,
}: {
  children: ReactNode;
}) {
  // Initialize state from localStorage
  const [currentBankroll, setCurrentBankrollState] = useState(() => 
    getStoredValue('vr_bankroll_current', 0)
  );
  const [startingBankroll, setStartingBankrollState] = useState(() => 
    getStoredValue('vr_bankroll_starting', 0)
  );
  const [strategy, setStrategyState] = useState<BankrollStrategy>(() => 
    getStoredValue('vr_bankroll_strategy', 'kelly')
  );
  const [kellyFraction, setKellyFractionState] = useState(() => 
    getStoredValue('vr_bankroll_kelly', '0.5')
  );
  const [flatBetAmount, setFlatBetAmountState] = useState(() => 
    getStoredValue('vr_bankroll_flat', '50')
  );
  const [percentageBet, setPercentageBetState] = useState(() => 
    getStoredValue('vr_bankroll_percentage', '2')
  );

  // Persist to localStorage when values change
  useEffect(() => {
    localStorage.setItem('vr_bankroll_current', JSON.stringify(currentBankroll));
  }, [currentBankroll]);

  useEffect(() => {
    localStorage.setItem('vr_bankroll_starting', JSON.stringify(startingBankroll));
  }, [startingBankroll]);

  useEffect(() => {
    localStorage.setItem('vr_bankroll_strategy', JSON.stringify(strategy));
  }, [strategy]);

  useEffect(() => {
    localStorage.setItem('vr_bankroll_kelly', JSON.stringify(kellyFraction));
  }, [kellyFraction]);

  useEffect(() => {
    localStorage.setItem('vr_bankroll_flat', JSON.stringify(flatBetAmount));
  }, [flatBetAmount]);

  useEffect(() => {
    localStorage.setItem('vr_bankroll_percentage', JSON.stringify(percentageBet));
  }, [percentageBet]);

  // Wrapper functions to update state
  const setCurrentBankroll = (amount: number | ((prev: number) => number)) => {
    setCurrentBankrollState(amount);
  };

  const setStartingBankroll = (amount: number) => {
    setStartingBankrollState(amount);
  };

  const setStrategy = (newStrategy: BankrollStrategy) => {
    setStrategyState(newStrategy);
  };

  const setKellyFraction = (fraction: string) => {
    setKellyFractionState(fraction);
  };

  const setFlatBetAmount = (amount: string) => {
    setFlatBetAmountState(amount);
  };

  const setPercentageBet = (percentage: string) => {
    setPercentageBetState(percentage);
  };

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
