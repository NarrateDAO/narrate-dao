/**
 * 权重API路由
 * 处理与投票权重计算相关的所有HTTP请求
 */
const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');

// 导入控制器
const weightController = require('../controllers/weightController');

// 中间件
const { validateRequest } = require('../middleware/validation');

/**
 * @swagger
 * /api/v1/weights/calculate:
 *   post:
 *     summary: 计算用户投票权重
 *     description: 根据提供的策略计算特定用户的投票权重
 *     tags: [权重服务]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - voterAddress
 *               - strategies
 *             properties:
 *               voterAddress:
 *                 type: string
 *                 description: 投票者的以太坊地址
 *               strategies:
 *                 type: array
 *                 description: 权重计算策略数组
 *                 items:
 *                   type: object
 *                   required:
 *                     - type
 *                     - params
 *                   properties:
 *                     type:
 *                       type: string
 *                       enum: [erc20-balance-of, erc721-balance-of, fixed-weight]
 *                       description: 策略类型
 *                     params:
 *                       type: object
 *                       description: 策略参数
 *               blockNumber:
 *                 type: integer
 *                 description: 区块高度（可选，默认为最新区块）
 *     responses:
 *       200:
 *         description: 成功计算权重
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
router.post('/calculate',
  [
    body('voterAddress').isEthereumAddress().withMessage('必须提供有效的以太坊地址'),
    body('strategies').isArray().withMessage('必须提供策略数组'),
    body('blockNumber').optional().isInt({ min: 0 }).withMessage('区块高度必须是非负整数')
  ],
  validateRequest,
  weightController.calculateWeight
);

/**
 * @swagger
 * /api/v1/weights/strategies:
 *   get:
 *     summary: 获取可用的权重计算策略
 *     description: 返回系统支持的所有权重计算策略类型
 *     tags: [权重服务]
 *     responses:
 *       200:
 *         description: 成功返回策略列表
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
router.get('/strategies', weightController.getStrategies);

/**
 * @swagger
 * /api/v1/weights/erc20/{tokenAddress}/{voterAddress}:
 *   get:
 *     summary: 获取ERC20代币余额
 *     description: 查询特定用户的ERC20代币余额
 *     tags: [权重服务]
 *     parameters:
 *       - in: path
 *         name: tokenAddress
 *         required: true
 *         schema:
 *           type: string
 *         description: ERC20代币合约地址
 *       - in: path
 *         name: voterAddress
 *         required: true
 *         schema:
 *           type: string
 *         description: 用户地址
 *       - in: query
 *         name: blockNumber
 *         schema:
 *           type: integer
 *         description: 区块高度（可选，默认为最新区块）
 *     responses:
 *       200:
 *         description: 成功返回代币余额
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
router.get('/erc20/:tokenAddress/:voterAddress',
  [
    param('tokenAddress').isEthereumAddress().withMessage('必须提供有效的代币合约地址'),
    param('voterAddress').isEthereumAddress().withMessage('必须提供有效的用户地址'),
    query('blockNumber').optional().isInt({ min: 0 }).withMessage('区块高度必须是非负整数')
  ],
  validateRequest,
  weightController.getErc20Balance
);

/**
 * @swagger
 * /api/v1/weights/erc721/{tokenAddress}/{voterAddress}:
 *   get:
 *     summary: 获取ERC721代币余额
 *     description: 查询特定用户的ERC721代币（NFT）持有数量
 *     tags: [权重服务]
 *     parameters:
 *       - in: path
 *         name: tokenAddress
 *         required: true
 *         schema:
 *           type: string
 *         description: ERC721代币合约地址
 *       - in: path
 *         name: voterAddress
 *         required: true
 *         schema:
 *           type: string
 *         description: 用户地址
 *       - in: query
 *         name: blockNumber
 *         schema:
 *           type: integer
 *         description: 区块高度（可选，默认为最新区块）
 *     responses:
 *       200:
 *         description: 成功返回NFT持有数量
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
router.get('/erc721/:tokenAddress/:voterAddress',
  [
    param('tokenAddress').isEthereumAddress().withMessage('必须提供有效的NFT合约地址'),
    param('voterAddress').isEthereumAddress().withMessage('必须提供有效的用户地址'),
    query('blockNumber').optional().isInt({ min: 0 }).withMessage('区块高度必须是非负整数')
  ],
  validateRequest,
  weightController.getErc721Balance
);

module.exports = router; 