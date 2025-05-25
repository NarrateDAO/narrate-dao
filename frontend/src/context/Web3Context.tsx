import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import Web3Modal from 'web3modal';
import { InjectedConnector } from '@web3-react/injected-connector';
import { WalletConnectConnector } from '@web3-react/walletconnect-connector';

// 支持的链ID
const supportedChainIds = [1, 3, 4, 5, 42, 56, 97, 137, 80001];

// 注入连接器（MetaMask）
const injected = new InjectedConnector({
  supportedChainIds,
});

// WalletConnect连接器
const walletconnect = new WalletConnectConnector({
  rpc: {
    1: `https://mainnet.infura.io/v3/${process.env.REACT_APP_INFURA_ID || ''}`,
    3: `https://ropsten.infura.io/v3/${process.env.REACT_APP_INFURA_ID || ''}`,
    4: `https://rinkeby.infura.io/v3/${process.env.REACT_APP_INFURA_ID || ''}`,
    5: `https://goerli.infura.io/v3/${process.env.REACT_APP_INFURA_ID || ''}`,
    42: `https://kovan.infura.io/v3/${process.env.REACT_APP_INFURA_ID || ''}`,
  },
  bridge: 'https://bridge.walletconnect.org',
  qrcode: true,
});

interface Web3ContextType {
  account: string | null;
  provider: ethers.providers.Web3Provider | null;
  signer: ethers.Signer | null;
  chainId: number | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  isConnecting: boolean;
  error: Error | null;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

interface Web3ProviderProps {
  children: ReactNode;
}

export const Web3Provider: React.FC<Web3ProviderProps> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const connect = async () => {
    try {
      setIsConnecting(true);
      setError(null);

      const providerOptions = {
        injected: {
          package: null,
        },
        walletconnect: {
          package: WalletConnectConnector,
          options: {
            infuraId: process.env.REACT_APP_INFURA_ID,
          },
        },
      };

      const web3Modal = new Web3Modal({
        cacheProvider: true,
        providerOptions,
        theme: 'dark',
      });

      const instance = await web3Modal.connect();
      const web3Provider = new ethers.providers.Web3Provider(instance);
      const userSigner = web3Provider.getSigner();
      const userAccount = await userSigner.getAddress();
      const network = await web3Provider.getNetwork();

      setProvider(web3Provider);
      setSigner(userSigner);
      setAccount(userAccount);
      setChainId(network.chainId);

      // 监听账户变化
      instance.on('accountsChanged', (accounts: string[]) => {
        setAccount(accounts[0] || null);
      });

      // 监听链变化
      instance.on('chainChanged', (chainId: number) => {
        setChainId(chainId);
        window.location.reload();
      });
    } catch (err) {
      console.error('连接钱包失败:', err);
      setError(err instanceof Error ? err : new Error('连接钱包时发生未知错误'));
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setChainId(null);
    localStorage.removeItem('walletconnect');
    if (localStorage.getItem('WEB3_CONNECT_CACHED_PROVIDER')) {
      localStorage.removeItem('WEB3_CONNECT_CACHED_PROVIDER');
    }
  };

  // 自动连接缓存的提供者
  useEffect(() => {
    if (localStorage.getItem('WEB3_CONNECT_CACHED_PROVIDER')) {
      connect();
    }
  }, []);

  return (
    <Web3Context.Provider
      value={{
        account,
        provider,
        signer,
        chainId,
        connect,
        disconnect,
        isConnecting,
        error,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = (): Web3ContextType => {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3 必须在 Web3Provider 内部使用');
  }
  return context;
}; 