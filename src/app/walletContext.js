// WalletContext.js
import { createContext, useContext } from 'react';

const WalletContext = createContext({
  refetchWallet: () => {}
});

export const useWallet = () => useContext(WalletContext);
export default WalletContext;
