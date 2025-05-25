import React from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Alert,
  AlertIcon,
  useColorModeValue,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import ProposalForm from '../components/ProposalForm';
import { useWeb3 } from '../context/Web3Context';

const CreateProposalPage: React.FC = () => {
  const { account } = useWeb3();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  return (
    <Container maxW="container.lg" py={10}>
      {/* 面包屑导航 */}
      <Breadcrumb mb={6}>
        <BreadcrumbItem>
          <BreadcrumbLink as={RouterLink} to="/">首页</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink as={RouterLink} to="/proposals">提案</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink>创建提案</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>
      
      <Heading as="h1" size="xl" mb={2}>
        创建新提案
      </Heading>
      <Text color="gray.500" mb={6}>
        填写以下表单创建新的提案并收集投票
      </Text>
      
      {!account ? (
        <Alert status="warning" mb={6}>
          <AlertIcon />
          请先连接钱包以创建提案
        </Alert>
      ) : (
        <Box
          bg={bgColor}
          shadow="sm"
          borderRadius="md"
          border="1px"
          borderColor={borderColor}
          p={6}
        >
          <ProposalForm />
        </Box>
      )}
    </Container>
  );
};

export default CreateProposalPage; 