/**
 * 投票模型
 * 存储用户投票记录
 */
const mongoose = require('mongoose');

const VoteSchema = new mongoose.Schema({
  voter: {
    type: String,
    required: true,
    lowercase: true
  },
  proposalId: {
    type: String,
    required: true
  },
  choice: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  weight: {
    type: Number,
    required: true,
    min: 0
  },
  signature: {
    type: String,
    required: true
  },
  space: {
    type: String,
    required: true
  },
  timestamp: {
    type: Number,
    default: () => Math.floor(Date.now() / 1000)
  },
  ipfsHash: {
    type: String
  },
  metadata: {
    type: Object
  }
}, {
  timestamps: true
});

// 创建索引
VoteSchema.index({ proposalId: 1 });
VoteSchema.index({ voter: 1 });
VoteSchema.index({ space: 1 });
VoteSchema.index({ proposalId: 1, voter: 1 }, { unique: true });

// 格式化选择选项的方法
VoteSchema.methods.formatChoice = function() {
  const { choice } = this;
  
  // 单选
  if (typeof choice === 'number') {
    return { [choice]: 1 };
  }
  
  // 多选
  if (Array.isArray(choice)) {
    return choice.reduce((acc, option) => {
      acc[option] = 1;
      return acc;
    }, {});
  }
  
  // 已经是对象格式
  return choice;
};

module.exports = mongoose.model('Vote', VoteSchema); 