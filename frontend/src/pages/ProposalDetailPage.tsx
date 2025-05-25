import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  Text,
  Badge,
  Divider,
  HStack,
  VStack,
  Flex,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Progress,
  SimpleGrid,
  Button,
  Alert,
  AlertIcon,
  Skeleton,
  useColorModeValue,
  Link,
  useToast,
  Tab,
  Tabs,
  TabList,
  TabPanel,
  TabPanels,
} from '@chakra-ui/react';
import { proposalApi, voteApi, executeApi } from '../services/api';
import VoteForm from '../components/VoteForm';
import { useWeb3 } from '../context/Web3Context';

const ProposalDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { account, signer, chainId } = useWeb3();
  const toast = useToast();
  
  const [proposal, setProposal] = useState<any>(null);
  const [votes, setVotes] = useState<any[]>([]);
  const [results, setResults] = useState<any>(null);
  const [userVote, setUserVote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [executionStatus, setExecutionStatus] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  
  // 背景颜色
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // 获取提案详情
  useEffect(() => {
    const fetchProposalDetails = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const response = await proposalApi.getProposal(id);
        setProposal(response.data);
        
        // 获取投票结果
        const resultsResponse = await voteApi.getResults(id);
        setResults(resultsResponse.data);
        
        // 获取提案的投票
        const votesResponse = await voteApi.getVotes(id, { limit: 100 });
        setVotes(votesResponse.data || []);
        
        // 获取用户的投票（如果已连接钱包）
        if (account) {
          try {
            const userVoteResponse = await voteApi.getUserVote(id, account);
            setUserVote(userVoteResponse.data);
          } catch (error) {
            // 用户可能尚未投票
            console.log('用户尚未投票或获取投票失败');
          }
        }
      } catch (error) {
        console.error('获取提案详情失败:', error);
        toast({
          title: '获取提案失败',
          description: '无法加载提案详情，请稍后再试',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchProposalDetails();
  }, [id, account, toast]);
  
  // 处理投票成功
  const handleVoteSuccess = async () => {
    // 刷新投票结果和用户投票状态
    if (!id) return;
    
    try {
      // 获取最新投票结果
      const resultsResponse = await voteApi.getResults(id);
      setResults(resultsResponse.data);
      
      // 获取提案的最新投票
      const votesResponse = await voteApi.getVotes(id, { limit: 100 });
      setVotes(votesResponse.data || []);
      
      // 获取用户的最新投票
      if (account) {
        const userVoteResponse = await voteApi.getUserVote(id, account);
        setUserVote(userVoteResponse.data);
      }
    } catch (error) {
      console.error('刷新投票数据失败:', error);
    }
  };
  
  // 执行提案
  const executeProposal = async () => {
    if (!id || !account || !signer || !chainId) {
      toast({
        title: '执行失败',
        description: '请先连接钱包',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    try {
      setIsExecuting(true);
      
      // 准备执行数据
      const executionData = {
        executor: account,
        signature: 'TODO: 实现执行签名', // 实际应用中需要签名
      };
      
      // 执行提案
      const response = await executeApi.executeProposal(id, executionData);
      
      // 更新状态
      setExecutionStatus('success');
      
      toast({
        title: '执行成功',
        description: '提案已成功执行',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // 刷新提案状态
      const updatedProposal = await proposalApi.getProposal(id);
      setProposal(updatedProposal.data);
      
    } catch (error) {
      console.error('执行提案失败:', error);
      setExecutionStatus('failed');
      
      toast({
        title: '执行失败',
        description: error instanceof Error ? error.message : '执行提案时发生错误',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsExecuting(false);
    }
  };
  
  // 格式化时间
  const formatDate = (dateStr: string | number) => {
    const date = typeof dateStr === 'number' 
      ? new Date(dateStr * 1000) 
      : new Date(dateStr);
    
    return date.toLocaleDateString('zh-CN', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // 获取状态徽章颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'yellow';
      case 'active': return 'green';
      case 'closed': return 'blue';
      case 'canceled': return 'red';
      default: return 'gray';
    }
  };
  
  // 获取状态显示文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '等待中';
      case 'active': return '进行中';
      case 'closed': return '已结束';
      case 'canceled': return '已取消';
      default: return '未知状态';
    }
  };
  
  // 计算投票进度条
  const calculateVoteProgress = (choiceIndex: number) => {
    if (!results || !results.scores || !results.scoresTotal) return 0;
    return (results.scores[choiceIndex] / results.scoresTotal) * 100;
  };
  
  // 获取投票数量文本
  const getVoteCountText = (choiceIndex: number) => {
    if (!results || !results.votes) return '0票';
    return `${results.votes[choiceIndex] || 0}票`;
  };
  
  // 获取投票权重文本
  const getVoteWeightText = (choiceIndex: number) => {
    if (!results || !results.scores) return '0';
    return results.scores[choiceIndex]?.toFixed(2) || '0';
  };
  
  // 获取总投票权重百分比
  const getVotePercentage = (choiceIndex: number) => {
    if (!results || !results.scores || !results.scoresTotal) return '0%';
    const percentage = (results.scores[choiceIndex] / results.scoresTotal) * 100;
    return `${percentage.toFixed(2)}%`;
  };
  
  // 是否可以执行提案
  const canExecute = () => {
    if (!proposal) return false;
    
    return (
      proposal.status === 'closed' && 
      proposal.executionStrategy?.type !== 'none' &&
      account && // 用户已连接钱包
      !executionStatus // 尚未尝试执行
    );
  };
  
  // 是否显示投票表单
  const shouldShowVoteForm = () => {
    if (!proposal) return false;
    
    return (
      proposal.status === 'active' && // 提案活跃
      !userVote && // 用户尚未投票
      account // 用户已连接钱包
    );
  };
  
  // 渲染加载状态
  if (loading) {
    return (
      <Container maxW="container.lg" py={10}>
        <Skeleton height="200px" mb={6} />
        <Skeleton height="100px" mb={6} />
        <Skeleton height="300px" />
      </Container>
    );
  }
  
  // 如果提案不存在
  if (!proposal) {
    return (
      <Container maxW="container.lg" py={10}>
        <Alert status="error">
          <AlertIcon />
          提案不存在或已被删除
        </Alert>
      </Container>
    );
  }
  
  return (
    <Container maxW="container.lg" py={10}>
      {/* 提案标题和状态 */}
      <Box mb={6}>
        <HStack spacing={4} mb={2}>
          <Heading as="h1" size="xl">
            {proposal.title}
          </Heading>
          <Badge colorScheme={getStatusColor(proposal.status)}>
            {getStatusText(proposal.status)}
          </Badge>
        </HStack>
        <Text color="gray.500">
          创建于 {formatDate(proposal.createdAt)}
        </Text>
      </Box>
      
      {/* 提案内容 */}
      <Box
        bg={cardBg}
        shadow="sm"
        borderRadius="md"
        border="1px"
        borderColor={borderColor}
        p={6}
        mb={6}
      >
        <Text whiteSpace="pre-wrap">{proposal.body}</Text>
      </Box>
      
      {/* 投票选项和结果 */}
      <Tabs variant="enclosed" mb={6}>
        <TabList>
          <Tab>投票结果</Tab>
          <Tab>投票记录</Tab>
          <Tab>执行详情</Tab>
        </TabList>
        
        <TabPanels>
          {/* 投票结果面板 */}
          <TabPanel>
            <Box>
              {proposal.choices.map((choice: string, index: number) => (
                <Box key={index} mb={4}>
                  <Flex justify="space-between" mb={2}>
                    <Text>{choice}</Text>
                    <Text>{getVotePercentage(index)}</Text>
                  </Flex>
                  <Progress
                    value={calculateVoteProgress(index)}
                    colorScheme="blue"
                    borderRadius="full"
                  />
                  <Flex justify="space-between" mt={1}>
                    <Text fontSize="sm" color="gray.500">
                      {getVoteCountText(index)}
                    </Text>
                    <Text fontSize="sm" color="gray.500">
                      {getVoteWeightText(index)} 权重
                    </Text>
                  </Flex>
                </Box>
              ))}
            </Box>
          </TabPanel>
          
          {/* 投票记录面板 */}
          <TabPanel>
            <Box>
              {votes.map((vote: any) => (
                <Box
                  key={vote.id}
                  p={4}
                  mb={2}
                  bg={cardBg}
                  borderRadius="md"
                  border="1px"
                  borderColor={borderColor}
                >
                  <Flex justify="space-between">
                    <Text>
                      {vote.voter.slice(0, 6)}...{vote.voter.slice(-4)}
                    </Text>
                    <Text>
                      {typeof vote.choice === 'number'
                        ? proposal.choices[vote.choice]
                        : '多选投票'}
                    </Text>
                  </Flex>
                  <Text fontSize="sm" color="gray.500">
                    {formatDate(vote.timestamp)}
                  </Text>
                </Box>
              ))}
            </Box>
          </TabPanel>
          
          {/* 执行详情面板 */}
          <TabPanel>
            <Box>
              {proposal.executionStrategy && proposal.executionStrategy.type !== 'none' ? (
                <>
                  <Heading as="h3" size="md" mb={4}>
                    执行策略
                  </Heading>
                  <Text mb={4}>
                    类型: {proposal.executionStrategy.type}
                  </Text>
                  {canExecute() && (
                    <Button
                      colorScheme="blue"
                      onClick={executeProposal}
                      isLoading={isExecuting}
                    >
                      执行提案
                    </Button>
                  )}
                </>
              ) : (
                <Alert status="info">
                  <AlertIcon />
                  该提案不需要执行
                </Alert>
              )}
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>
      
      {/* 投票表单 */}
      {shouldShowVoteForm() && (
        <Box
          bg={cardBg}
          shadow="sm"
          borderRadius="md"
          border="1px"
          borderColor={borderColor}
          p={6}
        >
          <VoteForm
            proposal={proposal}
            onVoteSuccess={handleVoteSuccess}
          />
        </Box>
      )}
    </Container>
  );
};

export default ProposalDetailPage; 