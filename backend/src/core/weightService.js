/**
 * 权重服务
 * 处理不同投票权重计算策略
 */
const { ethers } = require('ethers');

// 创建Web3提供商
function getProvider() {
  const providerUrl = process.env.INFURA_API_KEY 
    ? `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`
    : `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`;
  
  return new ethers.providers.JsonRpcProvider(providerUrl);
}

/**
 * ERC20代币余额权重策略
 * @param {string} voterAddress - 投票者地址
 * @param {string} tokenAddress - ERC20代币合约地址
 * @param {number} blockNumber - 区块高度
 * @returns {Promise<number>} 权重值
 */
async function erc20BalanceOf(voterAddress, tokenAddress, blockNumber) {
  try {
    const provider = getProvider();
    
    // ERC20 ABI (简化版)
    const erc20Abi = [
      'function balanceOf(address owner) view returns (uint256)',
      'function decimals() view returns (uint8)'
    ];
    
    // 创建合约实例
    const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, provider);
    
    // 获取代币余额和小数位数
    const [balance, decimals] = await Promise.all([
      tokenContract.balanceOf(voterAddress, { blockTag: blockNumber }),
      tokenContract.decimals()
    ]);
    
    // 转换为人类可读的格式
    return parseFloat(ethers.utils.formatUnits(balance, decimals));
  } catch (error) {
    console.error('获取ERC20余额失败:', error);
    return 0;
  }
}

/**
 * ERC721 (NFT) 持有量权重策略
 * @param {string} voterAddress - 投票者地址
 * @param {string} nftAddress - NFT合约地址
 * @param {number} blockNumber - 区块高度
 * @returns {Promise<number>} 权重值 (NFT持有数量)
 */
async function erc721BalanceOf(voterAddress, nftAddress, blockNumber) {
  try {
    const provider = getProvider();
    
    // ERC721 ABI (简化版)
    const erc721Abi = [
      'function balanceOf(address owner) view returns (uint256)'
    ];
    
    // 创建合约实例
    const nftContract = new ethers.Contract(nftAddress, erc721Abi, provider);
    
    // 获取NFT持有数量
    const balance = await nftContract.balanceOf(voterAddress, { blockTag: blockNumber });
    
    return balance.toNumber();
  } catch (error) {
    console.error('获取NFT余额失败:', error);
    return 0;
  }
}

/**
 * 组合多种权重策略
 * @param {string} voterAddress - 投票者地址
 * @param {Array} strategies - 权重策略数组
 * @param {number} blockNumber - 区块高度
 * @returns {Promise<number>} 组合权重值
 */
async function calculateCombinedWeight(voterAddress, strategies, blockNumber) {
  try {
    // 确保地址格式正确
    const normalizedAddress = ethers.utils.getAddress(voterAddress);
    
    // 执行所有策略并获取权重
    const weights = await Promise.all(
      strategies.map(async (strategy) => {
        switch (strategy.type) {
          case 'erc20-balance-of':
            return erc20BalanceOf(normalizedAddress, strategy.params.token, blockNumber);
          case 'erc721-balance-of':
            return erc721BalanceOf(normalizedAddress, strategy.params.token, blockNumber);
          case 'fixed-weight':
            return strategy.params.value || 1;
          default:
            console.warn(`未知的权重策略类型: ${strategy.type}`);
            return 0;
        }
      })
    );
    
    // 根据策略组合方式计算最终权重
    switch (strategies.combineMethod || 'sum') {
      case 'sum':
        return weights.reduce((total, weight) => total + weight, 0);
      case 'average':
        return weights.reduce((total, weight) => total + weight, 0) / weights.length;
      case 'max':
        return Math.max(...weights);
      case 'min':
        return Math.min(...weights);
      case 'multiply':
        return weights.reduce((total, weight) => total * weight, 1);
      default:
        return weights.reduce((total, weight) => total + weight, 0);
    }
  } catch (error) {
    console.error('计算组合权重失败:', error);
    return 0;
  }
}

module.exports = {
  erc20BalanceOf,
  erc721BalanceOf,
  calculateCombinedWeight
}; 