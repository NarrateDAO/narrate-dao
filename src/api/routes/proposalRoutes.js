/**
 * 提案API路由
 * 处理与提案相关的所有HTTP请求
 */
const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');

// 导入控制器
const proposalController = require('../controllers/proposalController');

// 中间件
const { validateRequest } = require('../middleware/validation');
const { authenticateWeb3 } = require('../middleware/auth');

/**
 * @route POST /api/v1/proposals
 * @desc 创建一个新提案
 * @access Public (需要Web3签名)
 */
router.post('/',
  [
    body('title').notEmpty().withMessage('必须提供提案标题'),
    body('body').notEmpty().withMessage('必须提供提案内容'),
    body('choices').isArray({ min: 2 }).withMessage('必须提供至少两个选项'),
    body('creator').isEthereumAddress().withMessage('必须提供有效的创建者地址'),
    body('start').isISO8601().withMessage('开始时间必须是有效的ISO日期'),
    body('end').isISO8601().withMessage('结束时间必须是有效的ISO日期'),
    body('snapshot').isInt({ min: 0 }).withMessage('快照高度必须是非负整数'),
    body('space').notEmpty().withMessage('必须提供空间ID'),
    body('signature').notEmpty().withMessage('必须提供有效的签名')
  ],
  validateRequest,
  proposalController.createProposal
);

/**
 * @route GET /api/v1/proposals
 * @desc 获取提案列表
 * @access Public
 */
router.get('/',
  [
    query('space').optional(),
    query('status').optional().isIn(['all', 'pending', 'active', 'closed', 'canceled']),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
    query('sort').optional().isIn(['created', 'start', 'end']),
    query('order').optional().isIn(['asc', 'desc'])
  ],
  validateRequest,
  proposalController.getProposals
);

/**
 * @route GET /api/v1/proposals/:id
 * @desc 获取特定提案的详细信息
 * @access Public
 */
router.get('/:id',
  [
    param('id').notEmpty().withMessage('必须提供提案ID')
  ],
  validateRequest,
  proposalController.getProposal
);

/**
 * @route DELETE /api/v1/proposals/:id
 * @desc 取消提案 (如果提案尚未开始且发送者是创建者)
 * @access Public (需要Web3签名)
 */
router.delete('/:id',
  [
    param('id').notEmpty().withMessage('必须提供提案ID'),
    body('signature').notEmpty().withMessage('必须提供有效的签名'),
    body('creator').isEthereumAddress().withMessage('必须提供有效的创建者地址')
  ],
  validateRequest,
  authenticateWeb3,
  proposalController.cancelProposal
);

/**
 * @route POST /api/v1/proposals/:id/execute
 * @desc 执行提案 (如果提案已结束且有执行策略)
 * @access Public (可能需要特定权限)
 */
router.post('/:id/execute',
  [
    param('id').notEmpty().withMessage('必须提供提案ID'),
    body('executor').optional().isEthereumAddress().withMessage('必须提供有效的执行者地址'),
    body('signature').optional().notEmpty().withMessage('可能需要提供有效的签名')
  ],
  validateRequest,
  proposalController.executeProposal
);

/**
 * @route GET /api/v1/proposals/space/:spaceId
 * @desc 获取特定空间的提案
 * @access Public
 */
router.get('/space/:spaceId',
  [
    param('spaceId').notEmpty().withMessage('必须提供空间ID'),
    query('status').optional().isIn(['all', 'pending', 'active', 'closed', 'canceled']),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 })
  ],
  validateRequest,
  proposalController.getProposalsBySpace
);

/**
 * @route GET /api/v1/proposals/creator/:address
 * @desc 获取特定创建者的提案
 * @access Public
 */
router.get('/creator/:address',
  [
    param('address').isEthereumAddress().withMessage('必须提供有效的以太坊地址'),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 })
  ],
  validateRequest,
  proposalController.getProposalsByCreator
);

module.exports = router; 