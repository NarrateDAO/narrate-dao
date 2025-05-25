/**
 * 签名服务
 * 处理EIP-712签名的验证和生成
 */
const { ethers } = require('ethers');

/**
 * 验证EIP-712签名
 * @param {Object} message - 被签名的消息
 * @param {string} signature - 签名字符串
 * @param {string} address - 签名者的地址
 * @returns {boolean} 签名是否有效
 */
const verifySignature = async (message, signature, address) => {
  try {
    // 使用ethers库验证签名
    // 注意：这是一个简化的实现，实际应用中需要完整的EIP-712实现
    
    // 将消息转换为字符串
    const messageString = typeof message === 'string' 
      ? message 
      : JSON.stringify(message);
    
    // 对于简单认证，我们可以使用verifyMessage
    const messageHash = ethers.utils.hashMessage(messageString);
    const recoveredAddress = ethers.utils.recoverAddress(messageHash, signature);
    
    // 检查恢复的地址是否与提供的地址匹配
    return recoveredAddress.toLowerCase() === address.toLowerCase();
  } catch (error) {
    console.error('签名验证失败:', error);
    return false;
  }
};

/**
 * 验证投票签名
 * @param {Object} vote - 投票数据
 * @param {string} signature - 投票签名
 * @returns {boolean} 签名是否有效
 */
const verifyVoteSignature = async (vote, signature) => {
  try {
    const domain = {
      name: 'NarrateDAO',
      version: '1',
      chainId: vote.chainId || 1,
      verifyingContract: vote.verifyingContract || ethers.constants.AddressZero
    };
    
    // EIP-712类型
    const types = {
      Vote: [
        { name: 'proposalId', type: 'string' },
        { name: 'choice', type: 'string' },
        { name: 'space', type: 'string' },
        { name: 'timestamp', type: 'uint64' }
      ]
    };
    
    // 构造消息
    const message = {
      proposalId: vote.proposalId,
      choice: typeof vote.choice === 'object' ? JSON.stringify(vote.choice) : vote.choice.toString(),
      space: vote.space,
      timestamp: vote.timestamp
    };
    
    // 计算EIP-712签名的消息哈希
    const messageHash = ethers.utils._TypedDataEncoder.hash(domain, types, message);
    
    // 恢复签名者地址
    const recoveredAddress = ethers.utils.recoverAddress(messageHash, signature);
    
    // 检查恢复的地址是否与投票者地址匹配
    return recoveredAddress.toLowerCase() === vote.voter.toLowerCase();
  } catch (error) {
    console.error('投票签名验证失败:', error);
    return false;
  }
};

/**
 * 生成签名消息
 * @param {string} action - 操作类型
 * @param {Object} data - 消息数据
 * @returns {Object} 消息对象
 */
const createSignatureMessage = (action, data) => {
  return {
    action,
    data,
    timestamp: Math.floor(Date.now() / 1000)
  };
};

/**
 * 创建投票消息
 * @param {Object} voteData - 投票数据
 * @returns {Object} 投票消息对象
 */
const createVoteMessage = (voteData) => {
  return {
    proposalId: voteData.proposalId,
    choice: voteData.choice,
    voter: voteData.voter,
    space: voteData.space,
    timestamp: voteData.timestamp || Math.floor(Date.now() / 1000)
  };
};

module.exports = {
  verifySignature,
  verifyVoteSignature,
  createSignatureMessage,
  createVoteMessage
}; 