/**
 * ZK控制器
 * 处理与零知识证明相关的业务逻辑
 */
const zkService = require('../../core/zkService');

/**
 * 获取可用的ZK电路列表
 * @route GET /api/v1/zk/circuits
 */
exports.getAvailableCircuits = async (req, res) => {
  try {
    const circuits = await zkService.getAvailableCircuits();
    
    return res.status(200).json({
      status: 'success',
      data: { circuits }
    });
  } catch (error) {
    console.error('获取ZK电路列表失败:', error);
    return res.status(500).json({
      status: 'error',
      message: '服务器内部错误',
      error: error.message
    });
  }
};

/**
 * 验证ZK证明
 * @route POST /api/v1/zk/verify
 */
exports.verifyProof = async (req, res) => {
  try {
    const { proof, publicInputs, circuitId } = req.body;
    
    // 获取验证密钥
    const verifierKey = await zkService.getVerificationKey(circuitId);
    
    // 验证证明
    const isValid = await zkService.verifyProof(proof, publicInputs, verifierKey);
    
    return res.status(200).json({
      status: 'success',
      data: { valid: isValid }
    });
  } catch (error) {
    console.error('验证ZK证明失败:', error);
    return res.status(500).json({
      status: 'error',
      message: '服务器内部错误',
      error: error.message
    });
  }
};

/**
 * 验证身份证明
 * @route POST /api/v1/zk/identity/verify
 */
exports.verifyIdentity = async (req, res) => {
  try {
    const { identityProof } = req.body;
    
    const result = await zkService.verifyIdentity(identityProof);
    
    return res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    console.error('验证身份证明失败:', error);
    return res.status(500).json({
      status: 'error',
      message: '服务器内部错误',
      error: error.message
    });
  }
};

/**
 * 验证匿名投票证明
 * @route POST /api/v1/zk/vote/verify
 */
exports.verifyAnonymousVote = async (req, res) => {
  try {
    const { voteProof, proposalId } = req.body;
    
    const result = await zkService.verifyAnonymousVote(voteProof, proposalId);
    
    return res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    console.error('验证匿名投票失败:', error);
    return res.status(500).json({
      status: 'error',
      message: '服务器内部错误',
      error: error.message
    });
  }
};

/**
 * 获取验证密钥
 * @route GET /api/v1/zk/verification-key/:circuitId
 */
exports.getVerificationKey = async (req, res) => {
  try {
    const { circuitId } = req.params;
    
    const verificationKey = await zkService.getVerificationKey(circuitId);
    
    return res.status(200).json({
      status: 'success',
      data: { verificationKey }
    });
  } catch (error) {
    console.error('获取验证密钥失败:', error);
    return res.status(500).json({
      status: 'error',
      message: '服务器内部错误',
      error: error.message
    });
  }
};