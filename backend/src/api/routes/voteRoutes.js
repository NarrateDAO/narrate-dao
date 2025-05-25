/**
 * 投票API路由
 * 处理与投票相关的所有HTTP请求
 */
const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');

// 导入控制器
const voteController = require('../controllers/voteController');

// 中间件
const { validateRequest } = require('../middleware/validation');
const { authenticateWeb3 } = require('../middleware/auth');

/**
 * @swagger
 * /api/v1/votes:
 *   post:
 *     summary: 提交投票
 *     description: 提交一个新的投票到指定提案
 *     tags: [投票]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - voter
 *               - proposalId
 *               - choice
 *               - signature
 *               - space
 *             properties:
 *               voter:
 *                 type: string
 *                 description: 投票者的以太坊地址
 *               proposalId:
 *                 type: string
 *                 description: 提案ID
 *               choice:
 *                 oneOf:
 *                   - type: integer
 *                     description: 选择的选项索引（单选）
 *                   - type: array
 *                     items:
 *                       type: integer
 *                     description: 选择的选项索引数组（多选）
 *                   - type: object
 *                     description: 选项权重映射（加权投票）
 *               signature:
 *                 type: string
 *                 description: EIP-712签名
 *               space:
 *                 type: string
 *                 description: DAO空间标识符
 *               timestamp:
 *                 type: integer
 *                 description: 投票时间戳（可选，默认为当前时间）
 *     responses:
 *       201:
 *         description: 投票成功提交
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: 请求验证失败
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: 服务器内部错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/',
  [
    body('voter').isEthereumAddress().withMessage('必须提供有效的以太坊地址'),
    body('proposalId').notEmpty().withMessage('必须提供提案ID'),
    body('choice').notEmpty().withMessage('必须提供投票选择'),
    body('signature').notEmpty().withMessage('必须提供有效的签名'),
    body('space').notEmpty().withMessage('必须提供空间ID')
  ],
  validateRequest,
  voteController.castVote
);

/**
 * @swagger
 * /api/v1/votes/{proposalId}:
 *   get:
 *     summary: 获取提案的所有投票
 *     description: 查询特定提案的所有投票记录
 *     tags: [投票]
 *     parameters:
 *       - in: path
 *         name: proposalId
 *         required: true
 *         schema:
 *           type: string
 *         description: 提案ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: 返回记录数量限制
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: 分页偏移量
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: timestamp
 *         description: 排序字段
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: 排序方向
 *     responses:
 *       200:
 *         description: 成功返回投票列表
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: 请求验证失败
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: 服务器内部错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:proposalId',
  [
    param('proposalId').notEmpty().withMessage('必须提供提案ID')
  ],
  validateRequest,
  voteController.getVotesByProposal
);

/**
 * @swagger
 * /api/v1/votes/voter/{address}:
 *   get:
 *     summary: 获取用户的所有投票
 *     description: 查询特定用户的所有投票记录
 *     tags: [投票]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: 用户的以太坊地址
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: 返回记录数量限制
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: 分页偏移量
 *     responses:
 *       200:
 *         description: 成功返回投票列表
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: 请求验证失败
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: 服务器内部错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/voter/:address',
  [
    param('address').isEthereumAddress().withMessage('必须提供有效的以太坊地址')
  ],
  validateRequest,
  voteController.getVotesByVoter
);

/**
 * @swagger
 * /api/v1/votes/{proposalId}/results:
 *   get:
 *     summary: 获取提案的投票结果
 *     description: 查询特定提案的投票结果统计
 *     tags: [投票]
 *     parameters:
 *       - in: path
 *         name: proposalId
 *         required: true
 *         schema:
 *           type: string
 *         description: 提案ID
 *     responses:
 *       200:
 *         description: 成功返回投票结果
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: 请求验证失败
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: 服务器内部错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:proposalId/results',
  [
    param('proposalId').notEmpty().withMessage('必须提供提案ID')
  ],
  validateRequest,
  voteController.getVoteResults
);

/**
 * @swagger
 * /api/v1/votes/{proposalId}/{voter}:
 *   get:
 *     summary: 获取特定用户对特定提案的投票
 *     description: 查询用户对特定提案的投票记录
 *     tags: [投票]
 *     parameters:
 *       - in: path
 *         name: proposalId
 *         required: true
 *         schema:
 *           type: string
 *         description: 提案ID
 *       - in: path
 *         name: voter
 *         required: true
 *         schema:
 *           type: string
 *         description: 投票者的以太坊地址
 *     responses:
 *       200:
 *         description: 成功返回投票记录
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: 投票记录不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: 服务器内部错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:proposalId/:voter',
  [
    param('proposalId').notEmpty().withMessage('必须提供提案ID'),
    param('voter').isEthereumAddress().withMessage('必须提供有效的以太坊地址')
  ],
  validateRequest,
  voteController.getVote
);

/**
 * @swagger
 * /api/v1/votes/{proposalId}/{voter}:
 *   delete:
 *     summary: 取消投票
 *     description: 取消用户对特定提案的投票（如果提案仍在进行中且发送者是投票者）
 *     tags: [投票]
 *     security:
 *       - web3Signature: []
 *     parameters:
 *       - in: path
 *         name: proposalId
 *         required: true
 *         schema:
 *           type: string
 *         description: 提案ID
 *       - in: path
 *         name: voter
 *         required: true
 *         schema:
 *           type: string
 *         description: 投票者的以太坊地址
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - signature
 *             properties:
 *               signature:
 *                 type: string
 *                 description: 投票者的签名，用于验证身份
 *     responses:
 *       200:
 *         description: 成功取消投票
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: 请求验证失败或提案已结束
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: 签名验证失败
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: 投票记录不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: 服务器内部错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:proposalId/:voter',
  [
    param('proposalId').notEmpty().withMessage('必须提供提案ID'),
    param('voter').isEthereumAddress().withMessage('必须提供有效的以太坊地址'),
    body('signature').notEmpty().withMessage('必须提供有效的签名')
  ],
  validateRequest,
  authenticateWeb3,
  voteController.cancelVote
);

/**
 * @swagger
 * /api/v1/votes/verify:
 *   post:
 *     summary: 验证投票签名
 *     description: 验证投票签名是否有效
 *     tags: [投票]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *               - signature
 *             properties:
 *               message:
 *                 type: object
 *                 description: 被签名的原始消息
 *               signature:
 *                 type: string
 *                 description: EIP-712签名
 *     responses:
 *       200:
 *         description: 成功验证签名
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: 请求验证失败
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: 服务器内部错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/verify',
  [
    body('message').notEmpty().withMessage('必须提供签名消息'),
    body('signature').notEmpty().withMessage('必须提供签名')
  ],
  validateRequest,
  voteController.verifyVoteSignature
);

module.exports = router; 