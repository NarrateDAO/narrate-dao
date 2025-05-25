/**
 * 认证中间件
 * 处理与Web3身份验证相关的逻辑
 */
const signatureService = require('../../core/signatureService');

/**
 * Web3身份验证中间件
 * 验证请求是否包含有效的Web3签名
 */
exports.authenticateWeb3 = async (req, res, next) => {
  try {
    const { signature } = req.body;
    const address = req.params.voter || req.body.voter || req.body.creator || req.body.executor;
    
    if (!signature) {
      return res.status(401).json({
        status: 'error',
        message: '未提供签名'
      });
    }
    
    if (!address) {
      return res.status(401).json({
        status: 'error',
        message: '无法确定签名者地址'
      });
    }
    
    // 获取需要签名的消息
    // 在实际实现中，这里需要根据请求类型构建特定的消息
    const message = {
      action: req.method,
      path: req.originalUrl,
      timestamp: Date.now()
    };
    
    // 验证签名
    const isValid = await signatureService.verifySignature(message, signature, address);
    
    if (!isValid) {
      return res.status(401).json({
        status: 'error',
        message: '签名验证失败'
      });
    }
    
    // 将已验证的地址添加到请求中
    req.authenticatedAddress = address.toLowerCase();
    
    next();
  } catch (error) {
    console.error('认证失败:', error);
    return res.status(401).json({
      status: 'error',
      message: '认证失败',
      error: error.message
    });
  }
};