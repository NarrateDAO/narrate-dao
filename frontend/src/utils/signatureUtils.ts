import { ethers } from 'ethers';

/**
 * EIP-712 类型定义
 */
const EIP712Domain = [
  { name: 'name', type: 'string' },
  { name: 'version', type: 'string' },
  { name: 'chainId', type: 'uint256' },
  { name: 'verifyingContract', type: 'address' },
];

// 投票类型定义
const VoteType = [
  { name: 'voter', type: 'address' },
  { name: 'proposalId', type: 'string' },
  { name: 'choice', type: 'string' }, // 使用字符串表示以支持多种投票格式
  { name: 'space', type: 'string' },
  { name: 'timestamp', type: 'uint256' },
];

// 提案类型定义
const ProposalType = [
  { name: 'title', type: 'string' },
  { name: 'body', type: 'string' },
  { name: 'choices', type: 'string[]' },
  { name: 'creator', type: 'address' },
  { name: 'start', type: 'uint256' },
  { name: 'end', type: 'uint256' },
  { name: 'snapshot', type: 'uint256' },
  { name: 'space', type: 'string' },
];

/**
 * 获取域数据
 */
const getDomainData = (chainId: number) => {
  return {
    name: 'NarrateDAO',
    version: '1',
    chainId,
    verifyingContract: '0x0000000000000000000000000000000000000000', // 可替换为实际验证合约地址
  };
};

/**
 * 签署投票消息
 * @param signer - 以太坊签名者
 * @param voteData - 投票数据
 * @param chainId - 链ID
 * @returns 签名
 */
export const signVote = async (
  signer: ethers.Signer,
  voteData: {
    voter: string;
    proposalId: string;
    choice: any;
    space: string;
    timestamp?: number;
  },
  chainId: number
): Promise<string> => {
  // 确保timestamp存在
  const timestamp = voteData.timestamp || Math.floor(Date.now() / 1000);
  
  // 将choice转换为字符串
  const choiceStr = typeof voteData.choice === 'object' 
    ? JSON.stringify(voteData.choice) 
    : voteData.choice.toString();
  
  const domain = getDomainData(chainId);
  
  const message = {
    voter: voteData.voter,
    proposalId: voteData.proposalId,
    choice: choiceStr,
    space: voteData.space,
    timestamp,
  };
  
  // 使用EIP-712签名
  const signature = await (signer as any)._signTypedData(
    domain,
    { Vote: VoteType },
    message
  );
  
  return signature;
};

/**
 * 签署提案创建消息
 * @param signer - 以太坊签名者
 * @param proposalData - 提案数据
 * @param chainId - 链ID
 * @returns 签名
 */
export const signProposal = async (
  signer: ethers.Signer,
  proposalData: {
    title: string;
    body: string;
    choices: string[];
    creator: string;
    start: number;
    end: number;
    snapshot: number;
    space: string;
  },
  chainId: number
): Promise<string> => {
  const domain = getDomainData(chainId);
  
  const message = {
    title: proposalData.title,
    body: proposalData.body,
    choices: proposalData.choices,
    creator: proposalData.creator,
    start: proposalData.start,
    end: proposalData.end,
    snapshot: proposalData.snapshot,
    space: proposalData.space,
  };
  
  // 使用EIP-712签名
  const signature = await (signer as any)._signTypedData(
    domain,
    { Proposal: ProposalType },
    message
  );
  
  return signature;
};

/**
 * 验证消息签名
 * @param message - 原始消息
 * @param signature - 签名
 * @param expectedSigner - 预期签名者地址
 * @param chainId - 链ID
 * @returns 签名是否有效
 */
export const verifySignature = (
  message: any,
  signature: string,
  expectedSigner: string,
  chainId: number
): boolean => {
  try {
    const domain = getDomainData(chainId);
    
    // 确定消息类型
    let types;
    let primaryType;
    
    if ('proposalId' in message) {
      types = { Vote: VoteType };
      primaryType = 'Vote';
    } else if ('choices' in message) {
      types = { Proposal: ProposalType };
      primaryType = 'Proposal';
    } else {
      throw new Error('未知的消息类型');
    }
    
    // 恢复签名者地址
    const recoveredAddress = ethers.utils.verifyTypedData(
      domain,
      types,
      message,
      signature
    );
    
    // 检查恢复的地址是否匹配预期签名者
    return recoveredAddress.toLowerCase() === expectedSigner.toLowerCase();
  } catch (error) {
    console.error('验证签名失败:', error);
    return false;
  }
}; 