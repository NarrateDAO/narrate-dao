/**
 * 验证中间件
 * 处理请求验证逻辑
 */
const { validationResult } = require('express-validator');

/**
 * 验证请求中间件
 * 使用express-validator验证请求参数
 */
exports.validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: '请求验证失败',
      errors: errors.array().map(error => ({
        field: error.param,
        message: error.msg
      }))
    });
  }
  
  next();
}; 