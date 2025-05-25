/**
 * 执行服务
 * 处理投票结果的链上执行
 */
const { ethers } = require('ethers');
const axios = require('axios');

/**
 * 使用Snapshot API触发执行
 * @param {Object} proposalData - 提案数据
 * @param {Object} voteResults - 投票结果
 * @returns {Promise<Object>} 执行结果
 */
async function executeViaSnapshot(proposalData, voteResults) {
  try {
    // 获取Snapshot Hub URL
    const snapshotHubUrl = process.env.SNAPSHOT_HUB_URL || 'https://hub.snapshot.org';
    
    // 构建执行请求数据
    const executionData = {
      proposalId: proposalData.id,
      space: proposalData.space,
      execution: {
        type: 'standard',
        data: {
          ...proposalData.executionStrategy.data,
          voteResults
        }
      }
    };
    
    // 调用Snapshot API
    const response = await axios.post(
      `${snapshotHubUrl}/api/execution`, 
      executionData,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.SNAPSHOT_API_KEY
        }
      }
    );
    
    return {
      success: true,
      transactionHash: response.data.transactionHash,
      details: response.data
    };
  } catch (error) {
    console.error('Snapshot执行失败:', error);
    throw new Error('Snapshot执行失败: ' + error.message);
  }
}

/**
 * 使用ThirdWeb SDK直接触发智能合约执行
 * @param {Object} proposalData - 提案数据
 * @param {Object} voteResults - 投票结果
 * @returns {Promise<Object>} 执行结果
 */
async function executeViaThirdweb(proposalData, voteResults) {
  try {
    // 获取执行策略数据
    const { contractAddress, functionName, functionParams } = proposalData.executionStrategy.data;
    
    // 创建提供商和钱包
    const provider = new ethers.providers.JsonRpcProvider(
      process.env.INFURA_API_KEY 
        ? `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`
        : `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
    );
    
    // 注意：在生产环境中，私钥应该安全存储，这里只是示例
    // 实际应用可能需要使用HSM或KMS服务
    const wallet = new ethers.Wallet(process.env.EXECUTOR_PRIVATE_KEY, provider);
    
    // 创建合约接口
    const contract = new ethers.Contract(
      contractAddress,
      [
        `function ${functionName}(${functionParams.map(p => `${p.type} ${p.name}`).join(', ')}) external`
      ],
      wallet
    );
    
    // 准备参数并添加投票结果
    const params = functionParams.map(param => {
      if (param.value === '$VOTE_RESULTS') {
        return JSON.stringify(voteResults);
      }
      return param.value;
    });
    
    // 执行交易
    const tx = await contract[functionName](...params);
    const receipt = await tx.wait();
    
    return {
      success: true,
      transactionHash: receipt.transactionHash,
      details: receipt
    };
  } catch (error) {
    console.error('ThirdWeb执行失败:', error);
    throw new Error('ThirdWeb执行失败: ' + error.message);
  }
}

/**
 * 执行投票结果
 * @param {Object} proposalData - 提案数据
 * @param {Object} voteResults - 投票结果
 * @returns {Promise<Object>} 执行结果
 */
async function executeVotingResults(proposalData, voteResults) {
  // 检查提案是否配置了执行策略
  if (!proposalData.executionStrategy || proposalData.executionStrategy.type === 'none') {
    return {
      success: false,
      error: '提案未配置执行策略'
    };
  }
  
  // 根据执行策略类型选择执行方法
  switch (proposalData.executionStrategy.type) {
    case 'snapshot':
      return executeViaSnapshot(proposalData, voteResults);
    case 'thirdweb':
      return executeViaThirdweb(proposalData, voteResults);
    case 'custom':
      // 自定义执行逻辑（可扩展）
      throw new Error('自定义执行策略尚未实现');
    default:
      throw new Error(`未知的执行策略类型: ${proposalData.executionStrategy.type}`);
  }
}

module.exports = {
  executeVotingResults,
  executeViaSnapshot,
  executeViaThirdweb
}; 