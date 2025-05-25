import React, { ReactNode } from 'react';
import {
  Box,
  Flex,
  HStack,
  Link,
  IconButton,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
  useColorModeValue,
  Stack,
  useColorMode,
  Container,
  Heading,
  Text,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import WalletButton from './WalletButton';

interface NavLinkProps {
  children: ReactNode;
  to: string;
}

const NavLink = ({ children, to }: NavLinkProps) => (
  <Link
    as={RouterLink}
    px={2}
    py={1}
    rounded={'md'}
    _hover={{
      textDecoration: 'none',
      bg: useColorModeValue('gray.200', 'gray.700'),
    }}
    to={to}
  >
    {children}
  </Link>
);

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { colorMode, toggleColorMode } = useColorMode();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  return (
    <Box minH="100vh">
      <Box
        bg={useColorModeValue('white', 'gray.900')}
        borderBottom={1}
        borderStyle={'solid'}
        borderColor={useColorModeValue('gray.200', 'gray.700')}
        px={4}
      >
        <Flex h={16} alignItems={'center'} justifyContent={'space-between'}>
          <HStack spacing={8} alignItems={'center'}>
            <Box>
              <Heading size="md" as={RouterLink} to="/" _hover={{ textDecoration: 'none' }}>
                NarrateDAO
              </Heading>
            </Box>
            <HStack
              as={'nav'}
              spacing={4}
              display={{ base: 'none', md: 'flex' }}
            >
              <NavLink to="/proposals">提案</NavLink>
              <NavLink to="/create">创建提案</NavLink>
              <NavLink to="/about">关于</NavLink>
            </HStack>
          </HStack>
          <Flex alignItems={'center'}>
            <Stack direction={'row'} spacing={7}>
              <Button onClick={toggleColorMode}>
                {colorMode === 'light' ? '🌙' : '☀️'}
              </Button>
              <WalletButton />
            </Stack>
          </Flex>
        </Flex>
      </Box>

      <Container maxW="container.xl" py={6}>
        {children}
      </Container>
      
      <Box
        as="footer"
        bg={useColorModeValue('gray.50', 'gray.900')}
        color={useColorModeValue('gray.700', 'gray.200')}
        mt="auto"
        py={6}
        borderTop={1}
        borderStyle={'solid'}
        borderColor={useColorModeValue('gray.200', 'gray.700')}
      >
        <Container maxW="container.xl">
          <Flex
            direction={{ base: 'column', md: 'row' }}
            justify="space-between"
            align="center"
          >
            <Text>© {new Date().getFullYear()} NarrateDAO. 保留所有权利。</Text>
            <HStack mt={{ base: 4, md: 0 }} spacing={4}>
              <Link href="https://github.com/NarrateDAO/narrate-dao" isExternal>
                GitHub
              </Link>
              <Link href="#" isExternal>
                文档
              </Link>
              <Link href="#" isExternal>
                API
              </Link>
            </HStack>
          </Flex>
        </Container>
      </Box>
    </Box>
  );
};

export default Layout; 