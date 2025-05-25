/**
 * 执行API路由
 * 处理与链上执行相关的所有HTTP请求
 */
const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');

// 导入控制器
const executionController = require('../controllers/executionController');

// 中间件
const { validateRequest } = require('../middleware/validation');
const { authenticateWeb3 } = require('../middleware/auth');

/**
 * @swagger
 * /api/v1/execute/proposal/{proposalId}:
 *   post:
 *     summary: 执行提案
 *     description: 将提案的投票结果执行到链上
 *     tags: [执行服务]
 *     security:
 *       - web3Signature: []
 *     parameters:
 *       - in: path
 *         name: proposalId
 *         required: true
 *         schema:
 *           type: string
 *         description: 提案ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - executor
 *               - signature
 *             properties:
 *               executor:
 *                 type: string
 *                 description: 执行者地址
 *               signature:
 *                 type: string
 *                 description: 执行者签名
 *               executionParams:
 *                 type: object
 *                 description: 额外的执行参数
 *     responses:
 *       200:
 *         description: 成功执行提案
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
 *       401:
 *         description: 身份验证失败
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
router.post('/proposal/:proposalId',
  [
    param('proposalId').notEmpty().withMessage('必须提供提案ID'),
    body('executor').isEthereumAddress().withMessage('必须提供有效的执行者地址'),
    body('signature').notEmpty().withMessage('必须提供有效的签名')
  ],
  validateRequest,
  authenticateWeb3,
  executionController.executeProposal
);

/**
 * @swagger
 * /api/v1/execute/status/{txHash}:
 *   get:
 *     summary: 获取执行状态
 *     description: 查询链上交易的执行状态
 *     tags: [执行服务]
 *     parameters:
 *       - in: path
 *         name: txHash
 *         required: true
 *         schema:
 *           type: string
 *         description: 交易哈希
 *     responses:
 *       200:
 *         description: 成功返回执行状态
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
router.get('/status/:txHash',
  [
    param('txHash').matches(/^0x[a-fA-F0-9]{64}$/).withMessage('必须提供有效的交易哈希')
  ],
  validateRequest,
  executionController.getExecutionStatus
);

/**
 * @swagger
 * /api/v1/execute/strategies:
 *   get:
 *     summary: 获取可用的执行策略
 *     description: 返回系统支持的所有执行策略类型
 *     tags: [执行服务]
 *     responses:
 *       200:
 *         description: 成功返回执行策略列表
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       500:
 *         description: 服务器内部错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/strategies', executionController.getExecutionStrategies);

/**
 * @swagger
 * /api/v1/execute/simulation:
 *   post:
 *     summary: 模拟执行
 *     description: 模拟执行提案但不提交链上交易
 *     tags: [执行服务]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - proposalId
 *             properties:
 *               proposalId:
 *                 type: string
 *                 description: 提案ID
 *               executionParams:
 *                 type: object
 *                 description: 额外的执行参数
 *     responses:
 *       200:
 *         description: 成功模拟执行
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
router.post('/simulation',
  [
    body('proposalId').notEmpty().withMessage('必须提供提案ID')
  ],
  validateRequest,
  executionController.simulateExecution
);

module.exports = router; 