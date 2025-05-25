/**
 * 审计API路由
 * 处理与审计日志相关的所有HTTP请求
 */
const express = require('express');
const router = express.Router();
const { param, query } = require('express-validator');

// 导入控制器
const auditController = require('../controllers/auditController');

// 中间件
const { validateRequest } = require('../middleware/validation');

/**
 * @swagger
 * /api/v1/audit/logs:
 *   get:
 *     summary: 获取审计日志
 *     description: 按条件查询系统审计日志
 *     tags: [审计服务]
 *     parameters:
 *       - in: query
 *         name: actionType
 *         schema:
 *           type: string
 *           enum: [proposal_created, vote_cast, proposal_executed, vote_weight_calculated, system_config_changed]
 *         description: 操作类型
 *       - in: query
 *         name: resourceType
 *         schema:
 *           type: string
 *           enum: [proposal, vote, system, weight]
 *         description: 资源类型
 *       - in: query
 *         name: actor
 *         schema:
 *           type: string
 *         description: 操作者地址
 *       - in: query
 *         name: resourceId
 *         schema:
 *           type: string
 *         description: 资源ID
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: 开始日期
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: 结束日期
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: 返回记录数量限制
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: 分页偏移量
 *     responses:
 *       200:
 *         description: 成功返回审计日志
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
router.get('/logs',
  [
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('限制必须是1-100之间的整数'),
    query('offset').optional().isInt({ min: 0 }).withMessage('偏移量必须是非负整数')
  ],
  validateRequest,
  auditController.getAuditLogs
);

/**
 * @swagger
 * /api/v1/audit/logs/{id}:
 *   get:
 *     summary: 获取特定审计日志
 *     description: 通过ID查询特定审计日志详情
 *     tags: [审计服务]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 审计日志ID
 *     responses:
 *       200:
 *         description: 成功返回审计日志详情
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: 审计日志不存在
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
router.get('/logs/:id',
  [
    param('id').notEmpty().withMessage('必须提供审计日志ID')
  ],
  validateRequest,
  auditController.getAuditLog
);

/**
 * @swagger
 * /api/v1/audit/proposal/{proposalId}:
 *   get:
 *     summary: 获取提案相关的审计日志
 *     description: 查询特定提案的所有审计日志
 *     tags: [审计服务]
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
 *           default: 50
 *         description: 返回记录数量限制
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: 分页偏移量
 *     responses:
 *       200:
 *         description: 成功返回提案审计日志
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
router.get('/proposal/:proposalId',
  [
    param('proposalId').notEmpty().withMessage('必须提供提案ID'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('限制必须是1-100之间的整数'),
    query('offset').optional().isInt({ min: 0 }).withMessage('偏移量必须是非负整数')
  ],
  validateRequest,
  auditController.getProposalAuditLogs
);

/**
 * @swagger
 * /api/v1/audit/voter/{voterAddress}:
 *   get:
 *     summary: 获取投票者相关的审计日志
 *     description: 查询特定投票者的所有审计日志
 *     tags: [审计服务]
 *     parameters:
 *       - in: path
 *         name: voterAddress
 *         required: true
 *         schema:
 *           type: string
 *         description: 投票者地址
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: 返回记录数量限制
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: 分页偏移量
 *     responses:
 *       200:
 *         description: 成功返回投票者审计日志
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
router.get('/voter/:voterAddress',
  [
    param('voterAddress').isEthereumAddress().withMessage('必须提供有效的以太坊地址'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('限制必须是1-100之间的整数'),
    query('offset').optional().isInt({ min: 0 }).withMessage('偏移量必须是非负整数')
  ],
  validateRequest,
  auditController.getVoterAuditLogs
);

/**
 * @swagger
 * /api/v1/audit/verify/{ipfsHash}:
 *   get:
 *     summary: 验证IPFS哈希的审计记录
 *     description: 验证IPFS上存储的审计记录与数据库记录是否一致
 *     tags: [审计服务]
 *     parameters:
 *       - in: path
 *         name: ipfsHash
 *         required: true
 *         schema:
 *           type: string
 *         description: IPFS哈希
 *     responses:
 *       200:
 *         description: 成功验证IPFS审计记录
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
router.get('/verify/:ipfsHash',
  [
    param('ipfsHash').notEmpty().withMessage('必须提供IPFS哈希')
  ],
  validateRequest,
  auditController.verifyIpfsAuditRecord
);

module.exports = router; 