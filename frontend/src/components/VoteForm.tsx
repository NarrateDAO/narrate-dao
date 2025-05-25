import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  FormHelperText,
  RadioGroup,
  Radio,
  CheckboxGroup,
  Checkbox,
  Stack,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Heading,
  Text,
  useToast,
  Alert,
  AlertIcon,
  HStack,
  Tooltip,
} from '@chakra-ui/react';
import { useWeb3 } from '../context/Web3Context';
import { signVote } from '../utils/signatureUtils';
import { voteApi } from '../services/api';

interface VoteFormProps {
  proposal: {
    id: string;
    title: string;
    choices: string[];
    space: string;
    votingSystem?: string;
    end: string;
  };
  onVoteSuccess?: () => void;
}

const VoteForm: React.FC<VoteFormProps> = ({ proposal, onVoteSuccess }) => {
  const { account, signer, chainId } = useWeb3();
  const toast = useToast();
  
  // 根据投票系统类型设置不同的状态
  const [singleChoice, setSingleChoice] = useState<number | null>(null);
  const [multipleChoices, setMultipleChoices] = useState<number[]>([]);
  const [weightedChoices, setWeightedChoices] = useState<{[key: number]: number}>({});
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const votingSystem = proposal.votingSystem || 'single-choice';
  const isEnded = new Date(proposal.end) < new Date();
  
  // 处理单选投票
  const handleSingleChoiceChange = (value: string) => {
    setSingleChoice(parseInt(value));
  };
  
  // 处理多选投票
  const handleMultipleChoiceChange = (values: string[]) => {
    setMultipleChoices(values.map(v => parseInt(v)));
  };
  
  // 处理加权投票的滑块变化
  const handleSliderChange = (index: number, value: number) => {
    setWeightedChoices({
      ...weightedChoices,
      [index]: value,
    });
  };
  
  // 提交投票
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!account || !signer || !chainId) {
      setError('请先连接钱包');
      return;
    }
    
    // 根据投票系统获取选择
    let choice;
    switch (votingSystem) {
      case 'single-choice':
        if (singleChoice === null) {
          setError('请选择一个选项');
          return;
        }
        choice = singleChoice;
        break;
      case 'approval':
        if (multipleChoices.length === 0) {
          setError('请至少选择一个选项');
          return;
        }
        choice = multipleChoices;
        break;
      case 'weighted':
        // 检查是否至少有一个权重大于0
        if (Object.keys(weightedChoices).length === 0 || 
            !Object.values(weightedChoices).some(weight => weight > 0)) {
          setError('请至少为一个选项分配权重');
          return;
        }
        // 检查总权重是否为1
        const totalWeight = Object.values(weightedChoices).reduce((sum, weight) => sum + weight, 0);
        if (Math.abs(totalWeight - 1) > 0.001) {
          setError('所有选项的权重总和必须等于1');
          return;
        }
        choice = weightedChoices;
        break;
      default:
        setError('不支持的投票系统类型');
        return;
    }
    
    try {
      setIsSubmitting(true);
      
      // 准备投票数据
      const voteData = {
        voter: account,
        proposalId: proposal.id,
        choice,
        space: proposal.space,
        timestamp: Math.floor(Date.now() / 1000),
      };
      
      // 签名投票
      const signature = await signVote(signer, voteData, chainId);
      
      // 提交投票
      await voteApi.submitVote({
        ...voteData,
        signature,
      });
      
      // 成功提示
      toast({
        title: '投票成功',
        description: '您的投票已成功提交',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // 重置表单
      setSingleChoice(null);
      setMultipleChoices([]);
      setWeightedChoices({});
      
      // 回调
      if (onVoteSuccess) {
        onVoteSuccess();
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '投票提交失败';
      setError(errorMessage);
      toast({
        title: '投票失败',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // 渲染不同类型的投票表单
  const renderVotingForm = () => {
    // 如果已结束，显示提示
    if (isEnded) {
      return (
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          该提案已结束投票
        </Alert>
      );
    }
    
    // 如果未连接钱包，显示提示
    if (!account) {
      return (
        <Alert status="warning" borderRadius="md">
          <AlertIcon />
          请先连接钱包以进行投票
        </Alert>
      );
    }
    
    // 根据投票系统类型渲染不同的表单
    switch (votingSystem) {
      case 'single-choice':
        return (
          <RadioGroup onChange={handleSingleChoiceChange} value={singleChoice?.toString() || ''}>
            <Stack spacing={3}>
              {proposal.choices.map((choice, index) => (
                <Radio key={index} value={index.toString()}>
                  {choice}
                </Radio>
              ))}
            </Stack>
          </RadioGroup>
        );
        
      case 'approval':
        return (
          <CheckboxGroup 
            onChange={handleMultipleChoiceChange} 
            value={multipleChoices.map(c => c.toString())}
          >
            <Stack spacing={3}>
              {proposal.choices.map((choice, index) => (
                <Checkbox key={index} value={index.toString()}>
                  {choice}
                </Checkbox>
              ))}
            </Stack>
          </CheckboxGroup>
        );
        
      case 'weighted':
        return (
          <Stack spacing={5}>
            {proposal.choices.map((choice, index) => (
              <Box key={index}>
                <FormControl>
                  <FormLabel mb={1}>{choice}</FormLabel>
                  <HStack>
                    <Slider
                      flex="1"
                      min={0}
                      max={1}
                      step={0.01}
                      value={weightedChoices[index] || 0}
                      onChange={(val) => handleSliderChange(index, val)}
                      colorScheme="blue"
                    >
                      <SliderTrack>
                        <SliderFilledTrack />
                      </SliderTrack>
                      <SliderThumb />
                    </Slider>
                    <Text w="60px" textAlign="right">
                      {(weightedChoices[index] || 0).toFixed(2)}
                    </Text>
                  </HStack>
                </FormControl>
              </Box>
            ))}
            <Text fontSize="sm" color="gray.500">
              总权重: {Object.values(weightedChoices).reduce((sum, w) => sum + w, 0).toFixed(2)}
            </Text>
          </Stack>
        );
        
      default:
        return (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            不支持的投票系统类型: {votingSystem}
          </Alert>
        );
    }
  };
  
  return (
    <Box as="form" onSubmit={handleSubmit}>
      <Heading size="md" mb={4}>投票</Heading>
      
      {/* 投票表单 */}
      <FormControl mb={6}>
        {renderVotingForm()}
        <FormHelperText>
          请根据您的偏好进行选择
        </FormHelperText>
      </FormControl>
      
      {/* 错误信息 */}
      {error && (
        <Alert status="error" mb={4} borderRadius="md">
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
        isDisabled={!account || isEnded}
        width="full"
      >
        提交投票
      </Button>
    </Box>
  );
};

export default VoteForm;