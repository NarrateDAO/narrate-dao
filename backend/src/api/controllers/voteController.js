/**
 * 投票控制器
 * 处理投票相关的业务逻辑
 */
const Vote = require('../../models/Vote');
const Proposal = require('../../models/Proposal');
const signatureService = require('../../core/signatureService');
const weightService = require('../../core/weightService');
const ipfsService = require('../../core/ipfsService');
const auditService = require('../../core/auditService');

/**
 * 提交投票
 * @route POST /api/v1/votes
 */
exports.castVote = async (req, res) => {
  try {
    const { voter, proposalId, choice, signature, space } = req.body;
    
    // 1. 检查提案是否存在且在投票期内
    const proposal = await Proposal.findOne({ id: proposalId });
    if (!proposal) {
      return res.status(404).json({
        status: 'error',
        message: '提案不存在'
      });
    }
    
    // 检查提案状态
    const now = new Date();
    if (now < proposal.start || now > proposal.end) {
      return res.status(400).json({
        status: 'error',
        message: '提案不在投票期内'
      });
    }
    
    // 2. 检查用户是否已经投票
    const existingVote = await Vote.findOne({ proposalId, voter });
    if (existingVote) {
      return res.status(400).json({
        status: 'error',
        message: '用户已经对该提案投票'
      });
    }
    
    // 3. 验证签名
    const message = signatureService.createVoteMessage({
      voter,
      proposalId,
      choice,
      space,
      timestamp: req.body.timestamp || Math.floor(Date.now() / 1000)
    });
    
    const isValidSignature = await signatureService.verifyVoteSignature(message, signature);
    if (!isValidSignature) {
      return res.status(400).json({
        status: 'error',
        message: '签名验证失败'
      });
    }
    
    // 4. 计算投票权重
    const strategies = proposal.votingStrategies || [{ type: 'fixed-weight', params: { value: 1 } }];
    const weight = await weightService.calculateCombinedWeight(voter, strategies, proposal.snapshot);
    
    // 如果权重为0，则用户无权投票
    if (weight <= 0) {
      return res.status(403).json({
        status: 'error',
        message: '用户没有足够的投票权重'
      });
    }
    
    // 5. 存储投票数据到IPFS (可选)
    const voteData = {
      voter,
      proposalId,
      choice,
      weight,
      space,
      timestamp: message.timestamp,
      signature
    };
    
    let ipfsHash = null;
    try {
      ipfsHash = await ipfsService.storeOnIpfs(voteData);
    } catch (ipfsError) {
      console.error('IPFS存储失败，但继续处理投票:', ipfsError);
    }
    
    // 6. 创建投票记录
    const vote = new Vote({
      voter,
      proposalId,
      choice,
      weight,
      timestamp: new Date(message.timestamp * 1000),
      signature,
      message,
      ipfsHash
    });
    
    await vote.save();
    
    // 7. 记录审计日志
    await auditService.logVoteCast(vote);
    
    // 8. 返回成功响应
    return res.status(201).json({
      status: 'success',
      message: '投票已提交',
      data: {
        vote: {
          id: vote._id,
          voter,
          proposalId,
          choice,
          weight,
          timestamp: vote.timestamp,
          ipfsHash
        }
      }
    });
  } catch (error) {
    console.error('投票提交失败:', error);
    return res.status(500).json({
      status: 'error',
      message: '服务器内部错误',
      error: error.message
    });
  }
};

/**
 * 获取提案的所有投票
 * @route GET /api/v1/votes/:proposalId
 */
exports.getVotesByProposal = async (req, res) => {
  try {
    const { proposalId } = req.params;
    const { limit = 100, offset = 0, sort = 'timestamp', order = 'desc' } = req.query;
    
    // 构建排序对象
    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;
    
    // 查询投票
    const votes = await Vote.find({ proposalId })
      .sort(sortObj)
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .select('-message'); // 排除消息字段以减少响应大小
    
    // 获取投票总数
    const total = await Vote.countDocuments({ proposalId });
    
    return res.status(200).json({
      status: 'success',
      data: {
        votes,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      }
    });
  } catch (error) {
    console.error('获取提案投票失败:', error);
    return res.status(500).json({
      status: 'error',
      message: '服务器内部错误',
      error: error.message
    });
  }
};

/**
 * 获取用户的所有投票
 * @route GET /api/v1/votes/voter/:address
 */
exports.getVotesByVoter = async (req, res) => {
  try {
    const { address } = req.params;
    const { limit = 100, offset = 0 } = req.query;
    
    // 查询投票
    const votes = await Vote.find({ voter: address.toLowerCase() })
      .sort({ timestamp: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .select('-message'); // 排除消息字段以减少响应大小
    
    // 获取投票总数
    const total = await Vote.countDocuments({ voter: address.toLowerCase() });
    
    return res.status(200).json({
      status: 'success',
      data: {
        votes,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      }
    });
  } catch (error) {
    console.error('获取用户投票失败:', error);
    return res.status(500).json({
      status: 'error',
      message: '服务器内部错误',
      error: error.message
    });
  }
};

/**
 * 获取提案的投票结果
 * @route GET /api/v1/votes/:proposalId/results
 */
exports.getVoteResults = async (req, res) => {
  try {
    const { proposalId } = req.params;
    
    // 查询提案
    const proposal = await Proposal.findOne({ id: proposalId });
    if (!proposal) {
      return res.status(404).json({
        status: 'error',
        message: '提案不存在'
      });
    }
    
    // 查询所有投票
    const votes = await Vote.find({ proposalId });
    
    // 初始化结果对象
    let results = {};
    
    // 根据投票系统类型计算结果
    switch (proposal.votingSystem) {
      case 'single-choice': {
        // 初始化选项
        proposal.choices.forEach((choice, index) => {
          results[index + 1] = 0;
        });
        
        // 累计投票权重
        votes.forEach(vote => {
          const choiceIndex = parseInt(vote.choice);
          if (results[choiceIndex] !== undefined) {
            results[choiceIndex] += vote.weight;
          }
        });
        break;
      }
      
      case 'approval': {
        // 初始化选项
        proposal.choices.forEach((choice, index) => {
          results[index + 1] = 0;
        });
        
        // 累计投票权重 (多选)
        votes.forEach(vote => {
          const choices = Array.isArray(vote.choice) ? vote.choice : [vote.choice];
          choices.forEach(choiceIndex => {
            if (results[choiceIndex] !== undefined) {
              results[choiceIndex] += vote.weight;
            }
          });
        });
        break;
      }
      
      case 'ranked-choice': {
        // 排序选择需要更复杂的算法，这里简化为首选项计数
        proposal.choices.forEach((choice, index) => {
          results[index + 1] = 0;
        });
        
        votes.forEach(vote => {
          // 假设choice是一个排序数组，如[3,1,2]表示第3个选项排第1，第1个选项排第2...
          const firstChoice = Array.isArray(vote.choice) && vote.choice.length > 0 
            ? vote.choice[0] 
            : vote.choice;
            
          if (results[firstChoice] !== undefined) {
            results[firstChoice] += vote.weight;
          }
        });
        break;
      }
      
      case 'quadratic': {
        // 二次方投票
        proposal.choices.forEach((choice, index) => {
          results[index + 1] = 0;
        });
        
        votes.forEach(vote => {
          // 假设choice是一个对象，如{1: 3, 2: 2}表示选项1投3票，选项2投2票
          if (typeof vote.choice === 'object' && !Array.isArray(vote.choice)) {
            Object.entries(vote.choice).forEach(([choiceIndex, voteCount]) => {
              if (results[choiceIndex] !== undefined) {
                // 二次方投票公式：cost = votes^2, votes = sqrt(cost)
                results[choiceIndex] += Math.sqrt(voteCount) * vote.weight;
              }
            });
          }
        });
        break;
      }
      
      case 'weighted': {
        // 加权投票
        proposal.choices.forEach((choice, index) => {
          results[index + 1] = 0;
        });
        
        votes.forEach(vote => {
          // 假设choice是一个对象，如{1: 0.7, 2: 0.3}表示选项1权重0.7，选项2权重0.3
          if (typeof vote.choice === 'object' && !Array.isArray(vote.choice)) {
            Object.entries(vote.choice).forEach(([choiceIndex, weight]) => {
              if (results[choiceIndex] !== undefined) {
                results[choiceIndex] += weight * vote.weight;
              }
            });
          }
        });
        break;
      }
      
      default: {
        // 默认单选
        proposal.choices.forEach((choice, index) => {
          results[index + 1] = 0;
        });
        
        votes.forEach(vote => {
          const choiceIndex = parseInt(vote.choice);
          if (results[choiceIndex] !== undefined) {
            results[choiceIndex] += vote.weight;
          }
        });
      }
    }
    
    // 计算总投票数和权重
    const votesCount = votes.length;
    const totalWeight = votes.reduce((sum, vote) => sum + vote.weight, 0);
    
    // 格式化结果
    const formattedResults = {
      votes: votesCount,
      totalWeight,
      results,
      choices: proposal.choices,
      votingSystem: proposal.votingSystem
    };
    
    return res.status(200).json({
      status: 'success',
      data: formattedResults
    });
  } catch (error) {
    console.error('获取投票结果失败:', error);
    return res.status(500).json({
      status: 'error',
      message: '服务器内部错误',
      error: error.message
    });
  }
};

/**
 * 获取特定用户对特定提案的投票
 * @route GET /api/v1/votes/:proposalId/:voter
 */
exports.getVote = async (req, res) => {
  try {
    const { proposalId, voter } = req.params;
    
    const vote = await Vote.findOne({ proposalId, voter: voter.toLowerCase() })
      .select('-message'); // 排除消息字段以减少响应大小
    
    if (!vote) {
      return res.status(404).json({
        status: 'error',
        message: '未找到投票记录'
      });
    }
    
    return res.status(200).json({
      status: 'success',
      data: { vote }
    });
  } catch (error) {
    console.error('获取投票失败:', error);
    return res.status(500).json({
      status: 'error',
      message: '服务器内部错误',
      error: error.message
    });
  }
};

/**
 * 取消投票
 * @route DELETE /api/v1/votes/:proposalId/:voter
 */
exports.cancelVote = async (req, res) => {
  try {
    const { proposalId, voter } = req.params;
    const { signature } = req.body;
    
    // 检查提案是否存在且在投票期内
    const proposal = await Proposal.findOne({ id: proposalId });
    if (!proposal) {
      return res.status(404).json({
        status: 'error',
        message: '提案不存在'
      });
    }
    
    // 检查提案状态
    const now = new Date();
    if (now > proposal.end) {
      return res.status(400).json({
        status: 'error',
        message: '提案投票已结束，无法取消投票'
      });
    }
    
    // 检查投票是否存在
    const vote = await Vote.findOne({ proposalId, voter: voter.toLowerCase() });
    if (!vote) {
      return res.status(404).json({
        status: 'error',
        message: '未找到投票记录'
      });
    }
    
    // 验证签名 (确保请求者是投票者本人)
    // 实际应用中这里应该有完整的签名验证逻辑
    
    // 删除投票
    await Vote.deleteOne({ _id: vote._id });
    
    // 记录审计日志
    await auditService.logAction(
      'vote_cancelled',
      voter.toLowerCase(),
      'vote',
      `${proposalId}-${voter.toLowerCase()}`,
      {
        proposalId,
        timestamp: new Date().toISOString()
      }
    );
    
    return res.status(200).json({
      status: 'success',
      message: '投票已取消'
    });
  } catch (error) {
    console.error('取消投票失败:', error);
    return res.status(500).json({
      status: 'error',
      message: '服务器内部错误',
      error: error.message
    });
  }
};

/**
 * 验证投票签名
 * @route POST /api/v1/votes/verify
 */
exports.verifyVoteSignature = async (req, res) => {
  try {
    const { message, signature } = req.body;
    
    const isValid = await signatureService.verifyVoteSignature(message, signature);
    
    return res.status(200).json({
      status: 'success',
      data: { valid: isValid }
    });
  } catch (error) {
    console.error('验证签名失败:', error);
    return res.status(500).json({
      status: 'error',
      message: '服务器内部错误',
      error: error.message
    });
  }
}; 