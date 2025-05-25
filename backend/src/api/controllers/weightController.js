/**
 * 权重控制器
 * 处理投票权重计算相关的业务逻辑
 */
const weightService = require('../../core/weightService');

/**
 * 计算用户投票权重
 * @route POST /api/v1/weights/calculate
 */
exports.calculateWeight = async (req, res) => {
  try {
    const { voterAddress, strategies, blockNumber } = req.body;
    
    const weight = await weightService.calculateCombinedWeight(
      voterAddress, 
      strategies, 
      blockNumber || 'latest'
    );
    
    return res.status(200).json({
      status: 'success',
      data: {
        weight,
        voterAddress,
        blockNumber: blockNumber || 'latest'
      }
    });
  } catch (error) {
    console.error('计算权重失败:', error);
    return res.status(500).json({
      status: 'error',
      message: '服务器内部错误',
      error: error.message
    });
  }
};

/**
 * 获取可用的权重计算策略
 * @route GET /api/v1/weights/strategies
 */
exports.getStrategies = async (req, res) => {
  try {
    // 返回支持的策略类型
    const strategies = [
      {
        id: 'erc20-balance-of',
        name: 'ERC20代币余额',
        description: '根据ERC20代币余额计算权重',
        params: [
          {
            name: 'token',
            type: 'address',
            description: 'ERC20代币合约地址'
          }
        ]
      },
      {
        id: 'erc721-balance-of',
        name: 'ERC721代币持有量',
        description: '根据NFT持有数量计算权重',
        params: [
          {
            name: 'token',
            type: 'address',
            description: 'ERC721代币合约地址'
          }
        ]
      },
      {
        id: 'fixed-weight',
        name: '固定权重',
        description: '为每个投票者分配固定权重',
        params: [
          {
            name: 'value',
            type: 'number',
            description: '固定权重值',
            default: 1
          }
        ]
      }
    ];
    
    return res.status(200).json({
      status: 'success',
      data: { strategies }
    });
  } catch (error) {
    console.error('获取策略失败:', error);
    return res.status(500).json({
      status: 'error',
      message: '服务器内部错误',
      error: error.message
    });
  }
};

/**
 * 获取ERC20代币余额
 * @route GET /api/v1/weights/erc20/:tokenAddress/:voterAddress
 */
exports.getErc20Balance = async (req, res) => {
  try {
    const { tokenAddress, voterAddress } = req.params;
    const { blockNumber } = req.query;
    
    const balance = await weightService.erc20BalanceOf(
      voterAddress, 
      tokenAddress, 
      blockNumber || 'latest'
    );
    
    return res.status(200).json({
      status: 'success',
      data: {
        balance,
        voterAddress,
        tokenAddress,
        blockNumber: blockNumber || 'latest'
      }
    });
  } catch (error) {
    console.error('获取ERC20余额失败:', error);
    return res.status(500).json({
      status: 'error',
      message: '服务器内部错误',
      error: error.message
    });
  }
};

/**
 * 获取ERC721代币余额
 * @route GET /api/v1/weights/erc721/:tokenAddress/:voterAddress
 */
exports.getErc721Balance = async (req, res) => {
  try {
    const { tokenAddress, voterAddress } = req.params;
    const { blockNumber } = req.query;
    
    const balance = await weightService.erc721BalanceOf(
      voterAddress, 
      tokenAddress, 
      blockNumber || 'latest'
    );
    
    return res.status(200).json({
      status: 'success',
      data: {
        balance,
        voterAddress,
        tokenAddress,
        blockNumber: blockNumber || 'latest'
      }
    });
  } catch (error) {
    console.error('获取ERC721余额失败:', error);
    return res.status(500).json({
      status: 'error',
      message: '服务器内部错误',
      error: error.message
    });
  }
}; 