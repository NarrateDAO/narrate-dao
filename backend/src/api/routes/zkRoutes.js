/**
 * ZK API路由
 * 处理与零知识证明相关的所有HTTP请求
 */
const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');

// 导入控制器
const zkController = require('../controllers/zkController');

// 中间件
const { validateRequest } = require('../middleware/validation');

/**
 * @route GET /api/v1/zk/circuits
 * @desc 获取可用的ZK电路列表
 * @access Public
 */
router.get('/circuits', zkController.getAvailableCircuits);

/**
 * @route POST /api/v1/zk/verify
 * @desc 验证ZK证明
 * @access Public
 */
router.post('/verify',
  [
    body('proof').notEmpty().withMessage('必须提供证明'),
    body('publicInputs').isArray().withMessage('必须提供公共输入'),
    body('circuitId').notEmpty().withMessage('必须提供电路ID')
  ],
  validateRequest,
  zkController.verifyProof
);

/**
 * @route POST /api/v1/zk/identity/verify
 * @desc 验证身份证明
 * @access Public
 */
router.post('/identity/verify',
  [
    body('identityProof').notEmpty().withMessage('必须提供身份证明')
  ],
  validateRequest,
  zkController.verifyIdentity
);

/**
 * @route POST /api/v1/zk/vote/verify
 * @desc 验证匿名投票证明
 * @access Public
 */
router.post('/vote/verify',
  [
    body('voteProof').notEmpty().withMessage('必须提供投票证明'),
    body('proposalId').notEmpty().withMessage('必须提供提案ID')
  ],
  validateRequest,
  zkController.verifyAnonymousVote
);

/**
 * @route GET /api/v1/zk/verification-key/:circuitId
 * @desc 获取特定电路的验证密钥
 * @access Public
 */
router.get('/verification-key/:circuitId',
  [
    param('circuitId').notEmpty().withMessage('必须提供电路ID')
  ],
  validateRequest,
  zkController.getVerificationKey
);

module.exports = router;