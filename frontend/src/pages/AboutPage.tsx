import React from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  SimpleGrid,
  Icon,
  Divider,
  Link,
  useColorModeValue,
} from '@chakra-ui/react';

const AboutPage: React.FC = () => {
  const boxBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  return (
    <Container maxW="container.lg" py={10}>
      <VStack spacing={8} align="stretch">
        <Box textAlign="center">
          <Heading as="h1" size="2xl" mb={4}>
            关于 NarrateDAO
          </Heading>
          <Text fontSize="xl" maxW="container.md" mx="auto">
            最小信任、高性能、可审计的去中心化投票解决方案
          </Text>
        </Box>
        
        <Divider />
        
        <Box>
          <Heading as="h2" size="lg" mb={4}>
            我们的使命
          </Heading>
          <Text fontSize="md" lineHeight="tall">
            NarrateDAO 旨在提供一个即插即用的核心投票引擎，处理投票的签名、验证、计权、存储和审计，并能安全地触发链上执行。
            我们致力于成为投票领域的"乐高积木"，专注于提供市场上稀缺的、高可信度的核心投票能力。
          </Text>
        </Box>
        
        <Box
          bg={boxBg}
          p={6}
          borderRadius="lg"
          borderWidth="1px"
          borderColor={borderColor}
        >
          <Heading as="h2" size="lg" mb={6}>
            核心功能
          </Heading>
          
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
            <VStack align="start" spacing={3}>
              <Heading as="h3" size="md">
                链下签名投票
              </Heading>
              <Text>
                允许用户使用 Web3 钱包对提案进行链下签名投票，避免高昂的 Gas 费用。
                通过 EIP-712 签名标准确保投票的真实性和不可篡改性。
              </Text>
            </VStack>
            
            <VStack align="start" spacing={3}>
              <Heading as="h3" size="md">
                可配置的投票权重系统
              </Heading>
              <Text>
                根据用户的链上资产灵活计算投票权重，支持 ERC-20、ERC-721 和其他自定义权重计算策略。
                可轻松配置多种投票系统，包括单选投票、多选投票和加权投票。
              </Text>
            </VStack>
            
            <VStack align="start" spacing={3}>
              <Heading as="h3" size="md">
                ZK 身份验证接口
              </Heading>
              <Text>
                为隐私保护的身份验证和投票方案提供技术基础，使用零知识证明技术保护用户隐私，
                同时确保投票有效性和唯一性。
              </Text>
            </VStack>
            
            <VStack align="start" spacing={3}>
              <Heading as="h3" size="md">
                链上执行触发器
              </Heading>
              <Text>
                在链下投票达成共识后，安全触发链上行动，实现无缝集成。
                支持多种执行策略，包括直接合约调用、多签钱包提交和时间锁定执行。
              </Text>
            </VStack>
          </SimpleGrid>
        </Box>
        
        <Box>
          <Heading as="h2" size="lg" mb={4}>
            技术架构
          </Heading>
          <Text mb={4}>
            NarrateDAO 采用模块化设计，主要包含以下组件：
          </Text>
          
          <VStack align="start" spacing={4} pl={4}>
            <Box>
              <Heading as="h3" size="md" mb={2}>
                核心服务层
              </Heading>
              <Text pl={4}>
                - 签名服务 (signatureService)<br />
                - 权重计算服务 (weightService)<br />
                - IPFS 存储服务 (ipfsService)<br />
                - 执行服务 (executionService)<br />
                - 审计服务 (auditService)<br />
                - ZK 服务 (zkService)
              </Text>
            </Box>
            
            <Box>
              <Heading as="h3" size="md" mb={2}>
                API 层
              </Heading>
              <Text>
                RESTful API 接口，用于与前端或其他服务交互，提供完整的 Swagger/OpenAPI 文档。
              </Text>
            </Box>
            
            <Box>
              <Heading as="h3" size="md" mb={2}>
                数据模型层
              </Heading>
              <Text>
                定义了提案、投票和审计日志等核心数据结构，确保数据的一致性和完整性。
              </Text>
            </Box>
          </VStack>
        </Box>
        
        <Divider />
        
        <Box textAlign="center">
          <Heading as="h2" size="lg" mb={4}>
            联系我们
          </Heading>
          <Text mb={4}>
            如果您有任何问题或建议，欢迎通过以下方式联系我们：
          </Text>
          
          <VStack spacing={2}>
            <Text>
              <strong>GitHub:</strong>{' '}
              <Link href="https://github.com/NarrateDAO/narrate-dao" isExternal color="blue.500">
                https://github.com/NarrateDAO/narrate-dao
              </Link>
            </Text>
            <Text>
              <strong>邮箱:</strong>{' '}
              <Link href="mailto:contact@narratedao.com" color="blue.500">
                contact@narratedao.com
              </Link>
            </Text>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
};

export default AboutPage; 