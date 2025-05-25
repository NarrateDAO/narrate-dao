import React from 'react';
import { 
  Box, 
  Heading, 
  Text, 
  Badge, 
  Progress, 
  Stack, 
  HStack,
  Button,
  Tooltip,
  useColorModeValue,
  Flex,
  Link
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';

interface ProposalCardProps {
  proposal: {
    id: string;
    title: string;
    body: string;
    choices: string[];
    creator: string;
    start: string;
    end: string;
    status: 'pending' | 'active' | 'closed' | 'canceled';
    space: string;
    votingSystem?: string;
    results?: {
      [key: number]: number;
    };
  };
}

const ProposalCard: React.FC<ProposalCardProps> = ({ proposal }) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
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
  
  // 格式化时间
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // 格式化地址
  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  // 计算提案进度
  const calculateProgress = () => {
    const now = new Date();
    const start = new Date(proposal.start);
    const end = new Date(proposal.end);
    
    // 如果未开始
    if (now < start) return 0;
    // 如果已结束
    if (now > end) return 100;
    
    // 计算已经过去的时间占总时间的百分比
    const totalDuration = end.getTime() - start.getTime();
    const elapsedDuration = now.getTime() - start.getTime();
    return Math.round((elapsedDuration / totalDuration) * 100);
  };
  
  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      borderColor={borderColor}
      overflow="hidden"
      p={4}
      bg={cardBg}
      shadow="sm"
      transition="all 0.2s"
      _hover={{ shadow: 'md' }}
    >
      {/* 标题和状态 */}
      <Flex justifyContent="space-between" alignItems="center" mb={2}>
        <Heading as="h3" size="md" noOfLines={1} flex="1">
          {proposal.title}
        </Heading>
        <Badge colorScheme={getStatusColor(proposal.status)} ml={2}>
          {getStatusText(proposal.status)}
        </Badge>
      </Flex>
      
      {/* 描述 */}
      <Text fontSize="sm" color="gray.500" noOfLines={2} mb={3}>
        {proposal.body}
      </Text>
      
      {/* 时间信息 */}
      <Stack spacing={1} mb={3} fontSize="sm">
        <HStack>
          <Text fontWeight="bold">开始时间:</Text>
          <Text>{formatDate(proposal.start)}</Text>
        </HStack>
        <HStack>
          <Text fontWeight="bold">结束时间:</Text>
          <Text>{formatDate(proposal.end)}</Text>
        </HStack>
      </Stack>
      
      {/* 进度条 */}
      <Box mb={3}>
        <Progress 
          value={calculateProgress()} 
          colorScheme={proposal.status === 'canceled' ? 'red' : 'blue'} 
          size="sm" 
          borderRadius="full"
        />
      </Box>
      
      {/* 创建者和投票系统 */}
      <HStack justify="space-between" fontSize="xs" color="gray.500" mb={4}>
        <Tooltip label={proposal.creator}>
          <Text>创建者: {formatAddress(proposal.creator)}</Text>
        </Tooltip>
        <Text>DAO: {proposal.space}</Text>
      </HStack>
      
      {/* 操作按钮 */}
      <Flex justifyContent="flex-end">
        <Link as={RouterLink} to={`/proposals/${proposal.id}`} _hover={{ textDecoration: 'none' }}>
          <Button colorScheme="blue" size="sm">
            查看详情
          </Button>
        </Link>
      </Flex>
    </Box>
  );
};

export default ProposalCard; 