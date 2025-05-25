/**
 * 审计控制器
 * 处理审计日志相关的业务逻辑
 */
const AuditLog = require('../../models/AuditLog');
const auditService = require('../../core/auditService');
const ipfsService = require('../../core/ipfsService');

/**
 * 获取审计日志
 * @route GET /api/v1/audit/logs
 */
exports.getAuditLogs = async (req, res) => {
  try {
    const { 
      actionType, 
      resourceType, 
      actor, 
      resourceId,
      fromDate,
      toDate,
      limit = 50, 
      offset = 0 
    } = req.query;
    
    // 构建查询条件
    const query = {};
    if (actionType) query.actionType = actionType;
    if (resourceType) query.resourceType = resourceType;
    if (actor) query.actor = actor.toLowerCase();
    if (resourceId) query.resourceId = resourceId;
    
    // 添加日期范围过滤
    if (fromDate || toDate) {
      query.timestamp = {};
      if (fromDate) query.timestamp.$gte = new Date(fromDate);
      if (toDate) query.timestamp.$lte = new Date(toDate);
    }
    
    // 查询审计日志
    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit));
    
    // 获取总记录数
    const total = await AuditLog.countDocuments(query);
    
    return res.status(200).json({
      status: 'success',
      data: {
        logs,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      }
    });
  } catch (error) {
    console.error('获取审计日志失败:', error);
    return res.status(500).json({
      status: 'error',
      message: '服务器内部错误',
      error: error.message
    });
  }
};

/**
 * 获取特定审计日志
 * @route GET /api/v1/audit/logs/:id
 */
exports.getAuditLog = async (req, res) => {
  try {
    const { id } = req.params;
    
    const log = await AuditLog.findById(id);
    
    if (!log) {
      return res.status(404).json({
        status: 'error',
        message: '未找到审计日志'
      });
    }
    
    return res.status(200).json({
      status: 'success',
      data: { log }
    });
  } catch (error) {
    console.error('获取审计日志失败:', error);
    return res.status(500).json({
      status: 'error',
      message: '服务器内部错误',
      error: error.message
    });
  }
};

/**
 * 获取提案相关的审计日志
 * @route GET /api/v1/audit/proposal/:proposalId
 */
exports.getProposalAuditLogs = async (req, res) => {
  try {
    const { proposalId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    // 查询与提案相关的审计日志
    const logs = await AuditLog.find({ 
      resourceType: 'proposal',
      resourceId: proposalId
    })
      .sort({ timestamp: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit));
    
    // 获取总记录数
    const total = await AuditLog.countDocuments({ 
      resourceType: 'proposal',
      resourceId: proposalId
    });
    
    return res.status(200).json({
      status: 'success',
      data: {
        logs,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      }
    });
  } catch (error) {
    console.error('获取提案审计日志失败:', error);
    return res.status(500).json({
      status: 'error',
      message: '服务器内部错误',
      error: error.message
    });
  }
};

/**
 * 获取投票者相关的审计日志
 * @route GET /api/v1/audit/voter/:voterAddress
 */
exports.getVoterAuditLogs = async (req, res) => {
  try {
    const { voterAddress } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    // 查询与投票者相关的审计日志
    const logs = await AuditLog.find({ 
      actor: voterAddress.toLowerCase()
    })
      .sort({ timestamp: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit));
    
    // 获取总记录数
    const total = await AuditLog.countDocuments({ 
      actor: voterAddress.toLowerCase()
    });
    
    return res.status(200).json({
      status: 'success',
      data: {
        logs,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      }
    });
  } catch (error) {
    console.error('获取投票者审计日志失败:', error);
    return res.status(500).json({
      status: 'error',
      message: '服务器内部错误',
      error: error.message
    });
  }
};

/**
 * 验证IPFS哈希的审计记录
 * @route GET /api/v1/audit/verify/:ipfsHash
 */
exports.verifyIpfsAuditRecord = async (req, res) => {
  try {
    const { ipfsHash } = req.params;
    
    // 查找使用此IPFS哈希的审计记录
    const dbRecord = await AuditLog.findOne({ ipfsHash });
    
    if (!dbRecord) {
      return res.status(404).json({
        status: 'error',
        message: '未找到使用此IPFS哈希的审计记录'
      });
    }
    
    // 从IPFS获取数据
    const ipfsData = await ipfsService.getFromIpfs(ipfsHash);
    
    // 比较IPFS数据与数据库记录
    const verification = {
      ipfsHash,
      dbRecord: {
        id: dbRecord._id,
        actionType: dbRecord.actionType,
        actor: dbRecord.actor,
        resourceType: dbRecord.resourceType,
        resourceId: dbRecord.resourceId,
        timestamp: dbRecord.timestamp
      },
      ipfsData,
      matches: {
        actionType: dbRecord.actionType === ipfsData.actionType,
        actor: dbRecord.actor === ipfsData.actor,
        resourceType: dbRecord.resourceType === ipfsData.resourceType,
        resourceId: dbRecord.resourceId === ipfsData.resourceId,
        // 时间戳可能有细微差异，因此这里检查时间戳是否在可接受的范围内
        timestamp: Math.abs(new Date(dbRecord.timestamp) - new Date(ipfsData.timestamp)) < 60000 // 允许1分钟的误差
      }
    };
    
    // 判断整体匹配结果
    verification.isValid = Object.values(verification.matches).every(match => match === true);
    
    return res.status(200).json({
      status: 'success',
      data: { verification }
    });
  } catch (error) {
    console.error('验证IPFS审计记录失败:', error);
    return res.status(500).json({
      status: 'error',
      message: '服务器内部错误',
      error: error.message
    });
  }
}; 