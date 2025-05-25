/**
 * 执行控制器
 * 处理链上执行相关的业务逻辑
 */
const Proposal = require('../../models/Proposal');
const executionService = require('../../core/executionService');
const voteController = require('./voteController');
const auditService = require('../../core/auditService');
const { ethers } = require('ethers');

/**
 * 执行提案
 * @route POST /api/v1/execute/proposal/:proposalId
 */
exports.executeProposal = async (req, res) => {
  try {
    const { proposalId } = req.params;
    const { executor, executionParams } = req.body;
    
    // 检查提案是否存在
    const proposal = await Proposal.findOne({ id: proposalId });
    if (!proposal) {
      return res.status(404).json({
        status: 'error',
        message: '提案不存在'
      });
    }
    
    // 检查提案是否已结束
    const now = new Date();
    if (now < proposal.end) {
      return res.status(400).json({
        status: 'error',
        message: '提案投票尚未结束，无法执行'
      });
    }
    
    // 检查提案是否配置了执行策略
    if (!proposal.executionStrategy || proposal.executionStrategy.type === 'none') {
      return res.status(400).json({
        status: 'error',
        message: '提案未配置执行策略'
      });
    }
    
    // 获取投票结果
    const voteResultsResponse = await voteController.getVoteResults({ params: { proposalId } }, { 
      status: () => ({ 
        json: (data) => data 
      })
    });
    
    if (voteResultsResponse.status !== 'success') {
      return res.status(500).json({
        status: 'error',
        message: '获取投票结果失败'
      });
    }
    
    const voteResults = voteResultsResponse.data;
    
    // 执行提案
    const executionResult = await executionService.executeVotingResults(
      proposal,
      voteResults,
      executionParams
    );
    
    // 记录审计日志
    await auditService.logProposalExecuted(proposal, executionResult, executor);
    
    return res.status(200).json({
      status: 'success',
      message: '提案执行成功',
      data: {
        executionResult,
        proposal: {
          id: proposal.id,
          title: proposal.title
        },
        voteResults: {
          totalVotes: voteResults.votes,
          totalWeight: voteResults.totalWeight
        }
      }
    });
  } catch (error) {
    console.error('执行提案失败:', error);
    return res.status(500).json({
      status: 'error',
      message: '服务器内部错误',
      error: error.message
    });
  }
};

/**
 * 获取执行状态
 * @route GET /api/v1/execute/status/:txHash
 */
exports.getExecutionStatus = async (req, res) => {
  try {
    const { txHash } = req.params;
    
    // 创建提供商
    const provider = new ethers.providers.JsonRpcProvider(
      process.env.INFURA_API_KEY 
        ? `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`
        : `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
    );
    
    // 获取交易收据
    const receipt = await provider.getTransactionReceipt(txHash);
    
    if (!receipt) {
      return res.status(200).json({
        status: 'success',
        data: {
          txHash,
          status: 'pending',
          message: '交易尚未被确认'
        }
      });
    }
    
    // 获取交易详情
    const transaction = await provider.getTransaction(txHash);
    
    // 构建响应
    const status = receipt.status === 1 ? 'success' : 'failed';
    const blockTimestamp = (await provider.getBlock(receipt.blockNumber)).timestamp;
    
    return res.status(200).json({
      status: 'success',
      data: {
        txHash,
        status,
        blockNumber: receipt.blockNumber,
        blockTimestamp,
        gasUsed: receipt.gasUsed.toString(),
        from: transaction.from,
        to: transaction.to,
        confirmations: receipt.confirmations,
        logs: receipt.logs.map(log => ({
          address: log.address,
          topics: log.topics,
          data: log.data
        }))
      }
    });
  } catch (error) {
    console.error('获取执行状态失败:', error);
    return res.status(500).json({
      status: 'error',
      message: '服务器内部错误',
      error: error.message
    });
  }
};

/**
 * 获取可用的执行策略
 * @route GET /api/v1/execute/strategies
 */
exports.getExecutionStrategies = async (req, res) => {
  try {
    // 返回支持的执行策略类型
    const strategies = [
      {
        id: 'none',
        name: '无执行',
        description: '不执行任何链上操作',
        params: []
      },
      {
        id: 'snapshot',
        name: 'Snapshot执行',
        description: '通过Snapshot API执行链上操作',
        params: [
          {
            name: 'contract',
            type: 'address',
            description: '目标合约地址'
          },
          {
            name: 'function',
            type: 'string',
            description: '要调用的函数名'
          }
        ]
      },
      {
        id: 'thirdweb',
        name: 'ThirdWeb执行',
        description: '通过ThirdWeb SDK执行链上操作',
        params: [
          {
            name: 'contractAddress',
            type: 'address',
            description: '目标合约地址'
          },
          {
            name: 'functionName',
            type: 'string',
            description: '要调用的函数名'
          },
          {
            name: 'functionParams',
            type: 'array',
            description: '函数参数配置',
            items: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: '参数名称'
                },
                type: {
                  type: 'string',
                  description: '参数类型'
                },
                value: {
                  type: 'string',
                  description: '参数值或特殊占位符'
                }
              }
            }
          }
        ]
      },
      {
        id: 'custom',
        name: '自定义执行',
        description: '通过自定义逻辑执行链上操作',
        params: [
          {
            name: 'config',
            type: 'object',
            description: '自定义配置对象'
          }
        ]
      }
    ];
    
    return res.status(200).json({
      status: 'success',
      data: { strategies }
    });
  } catch (error) {
    console.error('获取执行策略失败:', error);
    return res.status(500).json({
      status: 'error',
      message: '服务器内部错误',
      error: error.message
    });
  }
};

/**
 * 模拟执行
 * @route POST /api/v1/execute/simulation
 */
exports.simulateExecution = async (req, res) => {
  try {
    const { proposalId, executionParams } = req.body;
    
    // 检查提案是否存在
    const proposal = await Proposal.findOne({ id: proposalId });
    if (!proposal) {
      return res.status(404).json({
        status: 'error',
        message: '提案不存在'
      });
    }
    
    // 检查提案是否配置了执行策略
    if (!proposal.executionStrategy || proposal.executionStrategy.type === 'none') {
      return res.status(400).json({
        status: 'error',
        message: '提案未配置执行策略'
      });
    }
    
    // 获取投票结果
    const voteResultsResponse = await voteController.getVoteResults({ params: { proposalId } }, { 
      status: () => ({ 
        json: (data) => data 
      })
    });
    
    if (voteResultsResponse.status !== 'success') {
      return res.status(500).json({
        status: 'error',
        message: '获取投票结果失败'
      });
    }
    
    const voteResults = voteResultsResponse.data;
    
    // 根据执行策略类型生成模拟数据
    let simulationResult;
    
    switch (proposal.executionStrategy.type) {
      case 'snapshot': {
        // 模拟Snapshot执行
        simulationResult = {
          type: 'snapshot',
          contract: proposal.executionStrategy.data.contract,
          function: proposal.executionStrategy.data.function,
          estimatedGas: '150000', // 模拟估计
          voteResults: {
            totalVotes: voteResults.votes,
            totalWeight: voteResults.totalWeight,
            results: voteResults.results
          }
        };
        break;
      }
      
      case 'thirdweb': {
        // 模拟ThirdWeb执行
        const { contractAddress, functionName, functionParams } = proposal.executionStrategy.data;
        
        // 准备参数
        const params = functionParams.map(param => {
          if (param.value === '$VOTE_RESULTS') {
            return JSON.stringify(voteResults);
          }
          return param.value;
        });
        
        simulationResult = {
          type: 'thirdweb',
          contractAddress,
          functionName,
          params,
          estimatedGas: '200000', // 模拟估计
          voteResults: {
            totalVotes: voteResults.votes,
            totalWeight: voteResults.totalWeight,
            results: voteResults.results
          }
        };
        break;
      }
      
      default:
        simulationResult = {
          type: proposal.executionStrategy.type,
          message: '暂不支持此类型的模拟执行',
          voteResults: {
            totalVotes: voteResults.votes,
            totalWeight: voteResults.totalWeight,
            results: voteResults.results
          }
        };
    }
    
    return res.status(200).json({
      status: 'success',
      data: {
        simulation: simulationResult,
        proposal: {
          id: proposal.id,
          title: proposal.title
        }
      }
    });
  } catch (error) {
    console.error('模拟执行失败:', error);
    return res.status(500).json({
      status: 'error',
      message: '服务器内部错误',
      error: error.message
    });
  }
}; 