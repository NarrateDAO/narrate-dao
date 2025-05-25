import React from 'react';
import { Button, Text, HStack, useToast, Box } from '@chakra-ui/react';
import { useWeb3 } from '../context/Web3Context';

interface WalletButtonProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'solid' | 'outline' | 'ghost' | 'link';
  colorScheme?: string;
}

const WalletButton: React.FC<WalletButtonProps> = ({
  size = 'md',
  variant = 'solid',
  colorScheme = 'blue',
}) => {
  const { account, connect, disconnect, isConnecting, error } = useWeb3();
  const toast = useToast();

  // 处理连接错误
  React.useEffect(() => {
    if (error) {
      toast({
        title: '连接错误',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [error, toast]);

  // 格式化地址显示
  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // 渲染已连接状态
  if (account) {
    return (
      <HStack spacing={2}>
        <Button
          size={size}
          variant="outline"
          colorScheme="green"
          cursor="default"
          _hover={{ bg: 'transparent' }}
        >
          <Text>{formatAddress(account)}</Text>
        </Button>
        <Button
          size={size}
          variant={variant}
          colorScheme="red"
          onClick={disconnect}
        >
          断开连接
        </Button>
      </HStack>
    );
  }

  // 渲染未连接状态
  return (
    <Button
      size={size}
      variant={variant}
      colorScheme={colorScheme}
      onClick={connect}
      isLoading={isConnecting}
      loadingText="连接中..."
    >
      连接钱包
    </Button>
  );
};

export default WalletButton; 