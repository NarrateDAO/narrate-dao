import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  Flex,
  Button,
  Select,
  Input,
  HStack,
  Divider,
  InputGroup,
  InputLeftElement,
  Skeleton,
  Alert,
  AlertIcon,
  useColorModeValue,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { proposalApi } from '../services/api';
import ProposalCard from '../components/ProposalCard';

const ProposalsListPage: React.FC = () => {
  // 状态
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 筛选参数
  const [status, setStatus] = useState('all');
  const [space, setSpace] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sort, setSort] = useState('created');
  const [order, setOrder] = useState('desc');
  
  // 分页
  const [offset, setOffset] = useState(0);
  const [limit] = useState(12);
  const [hasMore, setHasMore] = useState(true);
  
  // 加载提案
  useEffect(() => {
    const fetchProposals = async () => {
      try {
        setLoading(true);
        
        // 准备查询参数
        const params: any = {
          limit,
          offset,
          sort,
          order,
        };
        
        // 添加可选参数
        if (status !== 'all') {
          params.status = status;
        }
        
        if (space) {
          params.space = space;
        }
        
        if (searchQuery) {
          params.search = searchQuery;
        }
        
        // 发送请求
        const response = await proposalApi.getProposals(params);
        
        // 更新状态
        if (offset === 0) {
          // 新查询，替换当前列表
          setProposals(response.data || []);
        } else {
          // 加载更多，追加到列表
          setProposals((prev) => [...prev, ...(response.data || [])]);
        }
        
        // 检查是否还有更多数据
        setHasMore((response.data || []).length === limit);
        
      } catch (err) {
        console.error('获取提案失败:', err);
        setError('获取提案列表失败，请稍后再试');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProposals();
  }, [limit, offset, sort, order, status, space, searchQuery]);
  
  // 重置筛选和分页
  const resetFilters = () => {
    setStatus('all');
    setSpace('');
    setSearchQuery('');
    setSort('created');
    setOrder('desc');
    setOffset(0);
  };
  
  // 加载更多
  const loadMore = () => {
    setOffset(offset + limit);
  };
  
  // 处理搜索
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setOffset(0); // 重置分页
  };
  
  return (
    <Container maxW="container.xl" py={10}>
      <Box mb={8}>
        <Heading as="h1" size="xl" mb={2}>
          提案列表
        </Heading>
        <Text color="gray.500">
          浏览和参与各种提案投票
        </Text>
      </Box>
      
      {/* 筛选控件 */}
      <Box
        bg={useColorModeValue('white', 'gray.800')}
        p={5}
        borderRadius="md"
        shadow="sm"
        mb={8}
        borderWidth="1px"
        borderColor={useColorModeValue('gray.200', 'gray.700')}
      >
        <form onSubmit={handleSearch}>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4} mb={4}>
            {/* 状态筛选 */}
            <Box>
              <Text mb={1} fontSize="sm" fontWeight="medium">
                状态
              </Text>
              <Select 
                value={status} 
                onChange={(e) => { setStatus(e.target.value); setOffset(0); }}
              >
                <option value="all">所有状态</option>
                <option value="pending">等待中</option>
                <option value="active">进行中</option>
                <option value="closed">已结束</option>
                <option value="canceled">已取消</option>
              </Select>
            </Box>
            
            {/* DAO空间筛选 */}
            <Box>
              <Text mb={1} fontSize="sm" fontWeight="medium">
                DAO空间
              </Text>
              <Input 
                placeholder="输入DAO空间" 
                value={space} 
                onChange={(e) => { setSpace(e.target.value); setOffset(0); }}
              />
            </Box>
            
            {/* 排序方式 */}
            <Box>
              <Text mb={1} fontSize="sm" fontWeight="medium">
                排序方式
              </Text>
              <Select 
                value={sort} 
                onChange={(e) => { setSort(e.target.value); setOffset(0); }}
              >
                <option value="created">创建时间</option>
                <option value="start">开始时间</option>
                <option value="end">结束时间</option>
              </Select>
            </Box>
            
            {/* 排序顺序 */}
            <Box>
              <Text mb={1} fontSize="sm" fontWeight="medium">
                排序顺序
              </Text>
              <Select 
                value={order} 
                onChange={(e) => { setOrder(e.target.value); setOffset(0); }}
              >
                <option value="desc">降序</option>
                <option value="asc">升序</option>
              </Select>
            </Box>
          </SimpleGrid>
          
          <Divider my={4} />
          
          <Flex 
            direction={{ base: 'column', md: 'row' }} 
            justify="space-between" 
            align={{ base: 'stretch', md: 'center' }}
            gap={4}
          >
            {/* 搜索框 */}
            <InputGroup maxW={{ base: '100%', md: '400px' }}>
              <InputLeftElement pointerEvents="none">
                🔍
              </InputLeftElement>
              <Input 
                placeholder="搜索提案..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </InputGroup>
            
            {/* 按钮组 */}
            <HStack spacing={4}>
              <Button 
                variant="outline" 
                onClick={resetFilters}
              >
                重置筛选
              </Button>
              <Button 
                colorScheme="blue" 
                type="submit"
              >
                应用筛选
              </Button>
              <Button 
                as={RouterLink} 
                to="/create" 
                colorScheme="teal"
              >
                创建提案
              </Button>
            </HStack>
          </Flex>
        </form>
      </Box>
      
      {/* 错误信息 */}
      {error && (
        <Alert status="error" mb={6} borderRadius="md">
          <AlertIcon />
          {error}
        </Alert>
      )}
      
      {/* 提案列表 */}
      {loading && proposals.length === 0 ? (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} height="300px" borderRadius="lg" />
          ))}
        </SimpleGrid>
      ) : proposals.length > 0 ? (
        <>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6} mb={8}>
            {proposals.map((proposal) => (
              <ProposalCard key={proposal.id} proposal={proposal} />
            ))}
          </SimpleGrid>
          
          {/* 加载更多按钮 */}
          {hasMore && (
            <Flex justify="center" mt={6}>
              <Button
                onClick={loadMore}
                isLoading={loading}
                loadingText="加载中..."
                colorScheme="blue"
                variant="outline"
              >
                加载更多
              </Button>
            </Flex>
          )}
        </>
      ) : (
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          没有找到符合条件的提案
        </Alert>
      )}
    </Container>
  );
};

export default ProposalsListPage;