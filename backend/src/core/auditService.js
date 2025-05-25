/**
 * 审计服务
 * 处理系统关键操作的审计日志记录
 */
const AuditLog = require('../models/AuditLog');
const ipfsService = require('./ipfsService');

/**
 * 记录审计日志
 * @param {string} actionType - 操作类型
 * @param {string} actor - 执行者地址
 * @param {string} resourceType - 资源类型
 * @param {string} resourceId - 资源ID
 * @param {Object} data - 操作详细数据
 * @param {boolean} storeOnIpfs - 是否存储到IPFS
 * @returns {Promise<Object>} 创建的审计日志
 */
async function logAction(actionType, actor, resourceType, resourceId, data, storeOnIpfs = true) {
  try {
    let ipfsHash = null;
    
    // 如果需要，将数据存储到IPFS
    if (storeOnIpfs) {
      ipfsHash = await ipfsService.storeOnIpfs({
        actionType,
        actor,
        resourceType,
        resourceId,
        data,
        timestamp: new Date().toISOString()
      });
    }
    
    // 创建审计日志记录
    const auditLog = new AuditLog({
      actionType,
      actor,
      resourceType,
      resourceId,
      data,
      ipfsHash
    });
    
    // 保存到数据库
    await auditLog.save();
    
    return auditLog;
  } catch (error) {
    console.error('记录审计日志失败:', error);
    // 即使审计日志记录失败，也不应该中断主流程
    // 但应该记录错误并通知管理员
    return null;
  }
}

/**
 * 记录提案创建
 * @param {Object} proposal - 提案对象
 * @param {string} creator - 创建者地址
 * @returns {Promise<Object>} 审计日志记录
 */
async function logProposalCreated(proposal, creator) {
  return logAction(
    'proposal_created',
    creator,
    'proposal',
    proposal.id,
    {
      title: proposal.title,
      choices: proposal.choices,
      start: proposal.start,
      end: proposal.end,
      snapshot: proposal.snapshot,
      space: proposal.space
    }
  );
}

/**
 * 记录投票行为
 * @param {Object} vote - 投票对象
 * @returns {Promise<Object>} 审计日志记录
 */
async function logVoteCast(vote) {
  return logAction(
    'vote_cast',
    vote.voter,
    'vote',
    `${vote.proposalId}-${vote.voter}`,
    {
      proposalId: vote.proposalId,
      choice: vote.choice,
      weight: vote.weight,
      timestamp: vote.timestamp
    }
  );
}

/**
 * 记录提案执行
 * @param {Object} proposal - 提案对象
 * @param {Object} executionResult - 执行结果
 * @param {string} executor - 执行者地址
 * @returns {Promise<Object>} 审计日志记录
 */
async function logProposalExecuted(proposal, executionResult, executor) {
  return logAction(
    'proposal_executed',
    executor,
    'proposal',
    proposal.id,
    {
      executionStrategy: proposal.executionStrategy,
      result: executionResult,
      timestamp: new Date().toISOString()
    }
  );
}

/**
 * 记录投票权重计算
 * @param {string} voter - 投票者地址
 * @param {string} proposalId - 提案ID
 * @param {number} weight - 计算的权重值
 * @param {Array} strategies - 使用的权重策略
 * @returns {Promise<Object>} 审计日志记录
 */
async function logWeightCalculation(voter, proposalId, weight, strategies) {
  return logAction(
    'vote_weight_calculated',
    voter,
    'weight',
    `${proposalId}-${voter}`,
    {
      proposalId,
      weight,
      strategies,
      timestamp: new Date().toISOString()
    }
  );
}

/**
 * 查询特定资源的审计历史
 * @param {string} resourceType - 资源类型
 * @param {string} resourceId - 资源ID
 * @returns {Promise<Array>} 审计日志记录数组
 */
async function getResourceAuditHistory(resourceType, resourceId) {
  return AuditLog.find({ resourceType, resourceId })
    .sort({ timestamp: -1 })
    .exec();
}

module.exports = {
  logAction,
  logProposalCreated,
  logVoteCast,
  logProposalExecuted,
  logWeightCalculation,
  getResourceAuditHistory
}; 