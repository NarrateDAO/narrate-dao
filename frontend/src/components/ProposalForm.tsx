import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  FormHelperText,
  Input,
  Textarea,
  VStack,
  HStack,
  IconButton,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useToast,
  Alert,
  AlertIcon,
  Text,
  Divider,
} from '@chakra-ui/react';
import { useWeb3 } from '../context/Web3Context';
import { signProposal } from '../utils/signatureUtils';
import { proposalApi } from '../services/api';

const ProposalForm: React.FC = () => {
  const { account, signer, chainId } = useWeb3();
  const toast = useToast();
  
  // 表单状态
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [choices, setChoices] = useState<string[]>(['同意', '反对', '弃权']);
  const [space, setSpace] = useState(''); // DAO空间
  const [votingSystem, setVotingSystem] = useState('single-choice');
  const [startIn, setStartIn] = useState(0); // 开始延迟（分钟）
  const [duration, setDuration] = useState(7 * 24 * 60); // 持续时间（分钟）
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 添加选项
  const addChoice = () => {
    setChoices([...choices, '']);
  };
  
  // 移除选项
  const removeChoice = (index: number) => {
    const newChoices = [...choices];
    newChoices.splice(index, 1);
    setChoices(newChoices);
  };
  
  // 更新选项
  const updateChoice = (index: number, value: string) => {
    const newChoices = [...choices];
    newChoices[index] = value;
    setChoices(newChoices);
  };
  
  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // 验证
    if (!account || !signer || !chainId) {
      setError('请先连接钱包');
      return;
    }
    
    if (!title.trim()) {
      setError('请输入提案标题');
      return;
    }
    
    if (!body.trim()) {
      setError('请输入提案内容');
      return;
    }
    
    if (!space.trim()) {
      setError('请输入DAO空间名称');
      return;
    }
    
    if (choices.length < 2) {
      setError('请至少添加两个选项');
      return;
    }
    
    if (choices.some(choice => !choice.trim())) {
      setError('选项内容不能为空');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // 计算开始和结束时间
      const now = Math.floor(Date.now() / 1000);
      const start = now + startIn * 60; // 转换为秒
      const end = start + duration * 60; // 转换为秒
      
      // 区块快照高度，这里简化为使用当前时间戳
      // 实际应用中应该从链上获取当前区块高度
      const snapshot = now;
      
      // 准备提案数据
      const proposalData = {
        title,
        body,
        choices,
        creator: account,
        start,
        end,
        snapshot,
        space,
        votingSystem,
      };
      
      // 签名提案
      const signature = await signProposal(signer, proposalData, chainId);
      
      // 提交提案
      await proposalApi.createProposal({
        ...proposalData,
        signature,
      });
      
      // 成功提示
      toast({
        title: '提案创建成功',
        description: '您的提案已成功提交',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // 重置表单
      setTitle('');
      setBody('');
      setChoices(['同意', '反对', '弃权']);
      setStartIn(0);
      setDuration(7 * 24 * 60);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '提案创建失败';
      setError(errorMessage);
      toast({
        title: '提案创建失败',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Box as="form" onSubmit={handleSubmit} width="100%">
      <VStack spacing={4} align="flex-start">
        {/* 提案标题 */}
        <FormControl isRequired>
          <FormLabel>提案标题</FormLabel>
          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="输入提案标题"
          />
        </FormControl>
        
        {/* 提案内容 */}
        <FormControl isRequired>
          <FormLabel>提案内容</FormLabel>
          <Textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="详细描述提案内容"
            minHeight="200px"
          />
          <FormHelperText>支持Markdown格式</FormHelperText>
        </FormControl>
        
        {/* DAO空间 */}
        <FormControl isRequired>
          <FormLabel>DAO空间</FormLabel>
          <Input
            value={space}
            onChange={e => setSpace(e.target.value)}
            placeholder="输入DAO空间标识符"
          />
        </FormControl>
        
        {/* 投票系统类型 */}
        <FormControl>
          <FormLabel>投票系统</FormLabel>
          <Select value={votingSystem} onChange={e => setVotingSystem(e.target.value)}>
            <option value="single-choice">单选投票</option>
            <option value="approval">多选投票</option>
            <option value="weighted">加权投票</option>
          </Select>
        </FormControl>
        
        <Divider />
        
        {/* 投票选项 */}
        <FormControl isRequired>
          <FormLabel>投票选项</FormLabel>
          <VStack spacing={2} align="stretch">
            {choices.map((choice, index) => (
              <HStack key={index}>
                <Input
                  value={choice}
                  onChange={e => updateChoice(index, e.target.value)}
                  placeholder={`选项 ${index + 1}`}
                />
                <IconButton
                  aria-label="移除选项"
                  icon={<Text>✕</Text>}
                  size="sm"
                  isDisabled={choices.length <= 2}
                  onClick={() => removeChoice(index)}
                />
              </HStack>
            ))}
          </VStack>
          <Button mt={2} size="sm" onClick={addChoice}>
            添加选项
          </Button>
        </FormControl>
        
        <Divider />
        
        {/* 投票时间设置 */}
        <HStack width="100%" spacing={4}>
          <FormControl>
            <FormLabel>开始延迟（分钟）</FormLabel>
            <NumberInput
              min={0}
              value={startIn}
              onChange={(_, value) => setStartIn(value)}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
            <FormHelperText>0表示立即开始</FormHelperText>
          </FormControl>
          
          <FormControl>
            <FormLabel>持续时间（分钟）</FormLabel>
            <NumberInput
              min={5}
              value={duration}
              onChange={(_, value) => setDuration(value)}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
            <FormHelperText>默认为7天</FormHelperText>
          </FormControl>
        </HStack>
        
        {/* 错误信息 */}
        {error && (
          <Alert status="error" borderRadius="md" width="100%">
            <AlertIcon />
            {error}
          </Alert>
        )}
        
        {/* 提交按钮 */}
        <Button
          type="submit"
          colorScheme="blue"
          isLoading={isSubmitting}
          loadingText="提交中..."
          isDisabled={!account}
          width="100%"
          size="lg"
          mt={2}
        >
          创建提案
        </Button>
        
        {/* 未连接钱包提示 */}
        {!account && (
          <Alert status="warning" borderRadius="md" width="100%">
            <AlertIcon />
            请先连接钱包以创建提案
          </Alert>
        )}
      </VStack>
    </Box>
  );
};

export default ProposalForm;