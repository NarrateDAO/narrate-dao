import axios from 'axios';

// 创建axios实例
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器：添加认证信息等
api.interceptors.request.use(
  (config) => {
    // 可以在这里添加认证令牌等
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器：处理通用错误
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    console.error('API请求错误:', error.response || error);
    return Promise.reject(error);
  }
);

// 提案相关API
export const proposalApi = {
  // 获取提案列表
  getProposals: async (params?: any) => {
    return await api.get('/proposals', { params });
  },
  
  // 获取单个提案详情
  getProposal: async (id: string) => {
    return await api.get(`/proposals/${id}`);
  },
  
  // 创建新提案
  createProposal: async (proposalData: any) => {
    return await api.post('/proposals', proposalData);
  },
  
  // 取消提案
  cancelProposal: async (id: string) => {
    return await api.delete(`/proposals/${id}`);
  },
  
  // 执行提案
  executeProposal: async (id: string, executionData: any) => {
    return await api.post(`/proposals/${id}/execute`, executionData);
  },
};

// 投票相关API
export const voteApi = {
  // 提交投票
  submitVote: async (voteData: any) => {
    return await api.post('/votes', voteData);
  },
  
  // 获取提案的所有投票
  getVotes: async (proposalId: string, params?: any) => {
    return await api.get(`/votes/${proposalId}`, { params });
  },
  
  // 获取投票结果
  getResults: async (proposalId: string) => {
    return await api.get(`/votes/${proposalId}/results`);
  },
  
  // 获取特定用户对特定提案的投票
  getUserVote: async (proposalId: string, voter: string) => {
    return await api.get(`/votes/${proposalId}/${voter}`);
  },
  
  // 验证投票签名
  verifySignature: async (messageData: any) => {
    return await api.post('/votes/verify', messageData);
  },
  
  // 获取用户的所有投票
  getUserVotes: async (address: string, params?: any) => {
    return await api.get(`/votes/voter/${address}`, { params });
  },
};

// 权重服务API
export const weightApi = {
  // 计算用户投票权重
  calculateWeight: async (weightData: any) => {
    return await api.post('/weights/calculate', weightData);
  },
  
  // 获取可用的权重计算策略
  getStrategies: async () => {
    return await api.get('/weights/strategies');
  },
  
  // 获取ERC20代币余额
  getERC20Balance: async (tokenAddress: string, voterAddress: string, blockNumber?: number) => {
    const params = blockNumber ? { blockNumber } : undefined;
    return await api.get(`/weights/erc20/${tokenAddress}/${voterAddress}`, { params });
  },
  
  // 获取ERC721代币余额
  getERC721Balance: async (tokenAddress: string, voterAddress: string, blockNumber?: number) => {
    const params = blockNumber ? { blockNumber } : undefined;
    return await api.get(`/weights/erc721/${tokenAddress}/${voterAddress}`, { params });
  },
};

// 审计服务API
export const auditApi = {
  // 获取审计日志
  getLogs: async (params?: any) => {
    return await api.get('/audit/logs', { params });
  },
  
  // 获取特定审计日志
  getLog: async (id: string) => {
    return await api.get(`/audit/logs/${id}`);
  },
  
  // 获取提案相关的审计日志
  getProposalLogs: async (proposalId: string, params?: any) => {
    return await api.get(`/audit/proposal/${proposalId}`, { params });
  },
  
  // 获取投票者相关的审计日志
  getVoterLogs: async (voterAddress: string, params?: any) => {
    return await api.get(`/audit/voter/${voterAddress}`, { params });
  },
  
  // 验证IPFS哈希的审计记录
  verifyIPFS: async (ipfsHash: string) => {
    return await api.get(`/audit/verify/${ipfsHash}`);
  },
};

// 执行服务API
export const executeApi = {
  // 执行提案
  executeProposal: async (proposalId: string, executionData: any) => {
    return await api.post(`/execute/proposal/${proposalId}`, executionData);
  },
  
  // 获取执行状态
  getStatus: async (txHash: string) => {
    return await api.get(`/execute/status/${txHash}`);
  },
  
  // 获取可用的执行策略
  getStrategies: async () => {
    return await api.get('/execute/strategies');
  },
  
  // 模拟执行
  simulateExecution: async (simulationData: any) => {
    return await api.post('/execute/simulation', simulationData);
  },
};

// ZK服务API
export const zkApi = {
  // 获取可用的ZK电路列表
  getCircuits: async () => {
    return await api.get('/zk/circuits');
  },
  
  // 验证ZK证明
  verifyProof: async (proofData: any) => {
    return await api.post('/zk/verify', proofData);
  },
};

export default {
  proposalApi,
  voteApi,
  weightApi,
  auditApi,
  executeApi,
  zkApi,
}; 