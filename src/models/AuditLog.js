/**
 * 审计日志模型
 * 记录系统中的关键操作
 */
const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  actionType: {
    type: String,
    required: true,
    enum: [
      'proposal_created',
      'proposal_canceled',
      'proposal_executed',
      'vote_cast',
      'vote_canceled',
      'vote_weight_calculated',
      'system_config_changed'
    ]
  },
  actor: {
    type: String,
    required: true,
    lowercase: true
  },
  resourceType: {
    type: String,
    required: true,
    enum: ['proposal', 'vote', 'system', 'weight']
  },
  resourceId: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  data: {
    type: Object
  },
  ipfsHash: {
    type: String
  },
  signature: {
    type: String
  }
}, {
  timestamps: true
});

// 创建索引
AuditLogSchema.index({ actionType: 1 });
AuditLogSchema.index({ actor: 1 });
AuditLogSchema.index({ resourceType: 1, resourceId: 1 });
AuditLogSchema.index({ timestamp: -1 });

module.exports = mongoose.model('AuditLog', AuditLogSchema); 