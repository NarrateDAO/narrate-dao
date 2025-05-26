/**
 * 签名服务
 * 处理EIP-712签名的验证和生成
 */
const { ethers } = require('ethers');

/**
 * 验证EIP-712签名 (Generic EIP-712 verifier)
 * This function verifies a signature produced according to the EIP-712 standard.
 * EIP-712 is a standard for hashing and signing of typed structured data as opposed to just byte strings.
 *
 * @param {Object} domain - The EIP-712 domain separator object.
 *   Typically includes fields like:
 *   - name: The user readable name of signing domain, i.e. the name of the DApp or platform.
 *   - version: The current major version of the signing domain.
 *   - chainId: The EIP-155 chain ID of the network where the contract is deployed.
 *   - verifyingContract: The address of the contract that will verify the signature.
 * @param {Object} types - An object describing the structure of the typed data.
 *   It maps type names to arrays of { name: string, type: string } objects.
 *   Example: { Person: [{ name: 'name', type: 'string' }, { name: 'wallet', type: 'address' }] }
 *   The primary type (e.g., 'Mail', 'Permit') must be present as a key in this object.
 * @param {Object} value - The actual message payload object, conforming to the structure defined in `types`.
 *   This is the data that was signed by the user.
 * @param {string} signature - The signature string (e.g., "0x...") produced by the user's wallet.
 * @param {string} expectedAddress - The Ethereum address of the signer that is expected to have produced the signature.
 * @returns {Promise<boolean>} True if the signature is valid and matches the expected address, false otherwise.
 */
const verifySignature = async (domain, types, value, signature, expectedAddress) => {
  try {
    // EIP-712 specifies how to encode and hash structured data.
    // _TypedDataEncoder.hash is the function ethers.js provides to compute the EIP-712 hash.
    const typedDataHash = ethers.utils._TypedDataEncoder.hash(domain, types, value);
    
    // Recover the address from the signature and the hash.
    // The recoverAddress function takes the digest (hash) that was signed, and the signature.
    const recoveredAddress = ethers.utils.recoverAddress(typedDataHash, signature);
    
    // Compare the recovered address with the expected signer's address.
    // It's good practice to compare them in a case-insensitive manner.
    return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
  } catch (error) {
    console.error('EIP-712 Signature verification failed:', error);
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