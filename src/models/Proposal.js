/**
 * 提案模型
 * 存储投票提案信息
 */
const mongoose = require('mongoose');

const ProposalSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  body: {
    type: String,
    required: true
  },
  choices: {
    type: [String],
    required: true,
    validate: [
      array => array.length >= 2,
      '至少需要两个选项'
    ]
  },
  creator: {
    type: String,
    required: true,
    lowercase: true
  },
  start: {
    type: Date,
    required: true
  },
  end: {
    type: Date,
    required: true
  },
  snapshot: {
    type: Number,
    required: true
  },
  space: {
    type: String,
    required: true
  },
  votingSystem: {
    type: String,
    enum: ['single-choice', 'approval', 'ranked-choice', 'quadratic', 'weighted'],
    default: 'single-choice'
  },
  ipfsHash: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'closed', 'canceled'],
    default: 'pending'
  },
  executionStrategy: {
    type: {
      type: String,
      enum: ['none', 'snapshot', 'thirdweb', 'custom'],
      default: 'none'
    },
    data: {
      type: mongoose.Schema.Types.Mixed
    }
  },
  metadata: {
    type: Object
  },
  executionStatus: {
    executed: {
      type: Boolean,
      default: false
    },
    txHash: {
      type: String
    },
    executedAt: {
      type: Date
    },
    executor: {
      type: String,
      lowercase: true
    }
  },
  signature: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// 创建索引
ProposalSchema.index({ space: 1 });
ProposalSchema.index({ creator: 1 });
ProposalSchema.index({ start: 1 });
ProposalSchema.index({ end: 1 });
ProposalSchema.index({ status: 1 });

// 根据开始和结束时间更新状态的方法
ProposalSchema.methods.updateStatus = function() {
  const now = new Date();
  
  if (this.status === 'canceled') {
    return this.status;
  }
  
  if (now < this.start) {
    this.status = 'pending';
  } else if (now >= this.start && now <= this.end) {
    this.status = 'active';
  } else if (now > this.end) {
    this.status = 'closed';
  }
  
  return this.status;
};

module.exports = mongoose.model('Proposal', ProposalSchema); 