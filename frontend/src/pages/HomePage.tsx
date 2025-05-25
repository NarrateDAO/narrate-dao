import React, { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  SimpleGrid,
  Container,
  Divider,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Skeleton,
  useColorModeValue,
  Image,
  Link,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { proposalApi, voteApi } from '../services/api';
import ProposalCard from '../components/ProposalCard';
import { useWeb3 } from '../context/Web3Context';

const HomePage: React.FC = () => {
  const { account } = useWeb3();
  const [activeProposals, setActiveProposals] = useState<any[]>([]);
  const [userVotes, setUserVotes] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalProposals: 0,
    totalVotes: 0,
    activeProposals: 0,
  });
  const [loading, setLoading] = useState(true);
  
  // 卡片背景色
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // 获取活跃提案
  useEffect(() => {
    const fetchActiveProposals = async () => {
      try {
        setLoading(true);
        const response = await proposalApi.getProposals({
          status: 'active',
          limit: 6,
        });
        setActiveProposals(response.data || []);
        
        // 获取统计数据
        // 在实际应用中，这应该是一个单独的API端点
        const allProposalsResponse = await proposalApi.getProposals({
          limit: 1,
        });
        
        setStats({
          totalProposals: allProposalsResponse.data?.total || 0,
          totalVotes: allProposalsResponse.data?.totalVotes || 0,
          activeProposals: allProposalsResponse.data?.activeCount || 0,
        });
      } catch (error) {
        console.error('获取提案失败:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchActiveProposals();
  }, []);
  
  // 获取用户投票
  useEffect(() => {
    const fetchUserVotes = async () => {
      if (!account) return;
      
      try {
        const response = await voteApi.getUserVotes(account, {
          limit: 3,
        });
        setUserVotes(response.data || []);
      } catch (error) {
        console.error('获取用户投票失败:', error);
      }
    };
    
    if (account) {
      fetchUserVotes();
    }
  }, [account]);
  
  return (
    <Container maxW="container.xl" py={10}>
      {/* 英雄区域 */}
      <Box
        p={10}
        borderRadius="lg"
        bg={useColorModeValue('blue.50', 'blue.900')}
        mb={10}
      >
        <VStack spacing={5} align="center" textAlign="center">
          <Heading as="h1" size="2xl">
            最小信任的去中心化投票解决方案
          </Heading>
          <Text fontSize="xl" maxW="3xl">
            NarrateDAO 是一个最小信任、高性能、可审计的去中心化投票后端解决方案。它专注于提供一个即插即用的核心投票引擎，处理投票的签名、验证、计权、存储和审计，并能安全地触发链上执行。
          </Text>
          <HStack spacing={4}>
            <Button
              as={RouterLink}
              to="/proposals"
              colorScheme="blue"
              size="lg"
            >
              浏览提案
            </Button>
            <Button
              as={RouterLink}
              to="/create"
              colorScheme="teal"
              size="lg"
              variant="outline"
            >
              创建提案
            </Button>
          </HStack>
        </VStack>
      </Box>
      
      {/* 统计数据 */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={10}>
        <Stat
          px={{ base: 4, md: 8 }}
          py="5"
          bg={cardBg}
          shadow="base"
          borderRadius="lg"
          border="1px"
          borderColor={borderColor}
        >
          <StatLabel fontSize="lg">总提案数</StatLabel>
          <StatNumber fontSize="3xl">{stats.totalProposals}</StatNumber>
          <StatHelpText>自平台上线以来</StatHelpText>
        </Stat>
        <Stat
          px={{ base: 4, md: 8 }}
          py="5"
          bg={cardBg}
          shadow="base"
          borderRadius="lg"
          border="1px"
          borderColor={borderColor}
        >
          <StatLabel fontSize="lg">总投票数</StatLabel>
          <StatNumber fontSize="3xl">{stats.totalVotes}</StatNumber>
          <StatHelpText>所有提案的投票总计</StatHelpText>
        </Stat>
        <Stat
          px={{ base: 4, md: 8 }}
          py="5"
          bg={cardBg}
          shadow="base"
          borderRadius="lg"
          border="1px"
          borderColor={borderColor}
        >
          <StatLabel fontSize="lg">活跃提案</StatLabel>
          <StatNumber fontSize="3xl">{stats.activeProposals}</StatNumber>
          <StatHelpText>当前正在进行中的提案</StatHelpText>
        </Stat>
      </SimpleGrid>
      
      {/* 活跃提案 */}
      <Box mb={10}>
        <Heading as="h2" size="lg" mb={4}>
          活跃提案
        </Heading>
        <Divider mb={6} />
        
        {loading ? (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} height="300px" borderRadius="lg" />
            ))}
          </SimpleGrid>
        ) : activeProposals.length > 0 ? (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {activeProposals.map((proposal) => (
              <ProposalCard key={proposal.id} proposal={proposal} />
            ))}
          </SimpleGrid>
        ) : (
          <Text textAlign="center" fontSize="lg" py={10}>
            当前没有活跃的提案。
            <Link as={RouterLink} to="/create" color="blue.500" ml={2}>
              创建一个新提案？
            </Link>
          </Text>
        )}
        
        {activeProposals.length > 0 && (
          <Box textAlign="center" mt={6}>
            <Button as={RouterLink} to="/proposals" colorScheme="blue" variant="outline">
              查看所有提案
            </Button>
          </Box>
        )}
      </Box>
      
      {/* 用户投票 */}
      {account && (
        <Box mb={10}>
          <Heading as="h2" size="lg" mb={4}>
            您的最近投票
          </Heading>
          <Divider mb={6} />
          
          {userVotes.length > 0 ? (
            <VStack spacing={4} align="stretch">
              {userVotes.map((vote) => (
                <Box
                  key={vote.id}
                  p={4}
                  borderRadius="md"
                  bg={cardBg}
                  borderWidth="1px"
                  borderColor={borderColor}
                >
                  <HStack justify="space-between">
                    <VStack align="start" spacing={1}>
                      <Text fontWeight="bold">{vote.proposal.title}</Text>
                      <Text fontSize="sm">
                        您的选择: {
                          typeof vote.choice === 'number' 
                            ? vote.proposal.choices[vote.choice] 
                            : '多选'
                        }
                      </Text>
                    </VStack>
                    <Link as={RouterLink} to={`/proposals/${vote.proposal.id}`}>
                      <Button size="sm" colorScheme="blue" variant="outline">
                        查看详情
                      </Button>
                    </Link>
                  </HStack>
                </Box>
              ))}
            </VStack>
          ) : (
            <Text textAlign="center" fontSize="lg" py={10}>
              您还没有参与任何投票。
              <Link as={RouterLink} to="/proposals" color="blue.500" ml={2}>
                浏览提案
              </Link>
            </Text>
          )}
        </Box>
      )}
      
      {/* 核心功能 */}
      <Box mb={10}>
        <Heading as="h2" size="lg" mb={4}>
          核心功能
        </Heading>
        <Divider mb={6} />
        
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={10}>
          <Box>
            <Heading as="h3" size="md" mb={3}>
              链下签名投票
            </Heading>
            <Text>
              允许用户使用 Web3 钱包对提案进行链下签名投票，避免高昂的 Gas 费用。
            </Text>
          </Box>
          
          <Box>
            <Heading as="h3" size="md" mb={3}>
              可配置的投票权重系统
            </Heading>
            <Text>
              根据用户的链上资产灵活计算投票权重，支持多种权重计算策略。
            </Text>
          </Box>
          
          <Box>
            <Heading as="h3" size="md" mb={3}>
              ZK 身份验证接口
            </Heading>
            <Text>
              为隐私保护的身份验证和投票方案提供技术基础，保护用户隐私。
            </Text>
          </Box>
          
          <Box>
            <Heading as="h3" size="md" mb={3}>
              链上执行触发器
            </Heading>
            <Text>
              在链下投票达成共识后，安全触发链上行动，实现无缝集成。
            </Text>
          </Box>
        </SimpleGrid>
      </Box>
    </Container>
  );
};

export default HomePage; 