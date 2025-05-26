/**
 * ZK服务 (Zero-Knowledge)
 * 提供与ZK-SNARKs兼容的API接口，为未来引入隐私保护的身份验证和投票方案奠定基础
 * 
 * 注意: 这是一个预留接口，MVP阶段仅提供基础框架
 */

const snarkjs = require('snarkjs');
const fs = require('fs').promises;
const path = require('path');

/**
 * 验证ZK证明
 * @param {Object} verifierKey - 验证密钥
 * @param {Array} publicSignals - 公共输入
 * @param {Object} proof - ZK证明对象
 * @returns {Promise<boolean>} 证明是否有效
 */
async function verifyProof(verifierKey, publicSignals, proof) {
  try {
    const isValid = await snarkjs.groth16.verify(verifierKey, publicSignals, proof);
    return isValid;
  } catch (error) {
    console.error('Error verifying ZK proof:', error);
    return false;
  }
}

/**
 * 生成用于验证ZK证明的验证密钥
 * @param {string} circuit - 电路标识符
 * @returns {Promise<Object|null>} 验证密钥对象，或在出错时返回null
 */
async function getVerificationKey(circuit) {
  try {
    const filePath = path.join(__dirname, '..', 'zk_keys', `${circuit}.vkey.json`);
    const data = await fs.readFile(filePath, 'utf8');
    const verificationKey = JSON.parse(data);
    return verificationKey;
  } catch (error) {
    console.error(`Error reading or parsing verification key for circuit ${circuit}:`, error);
    return null;
  }
}

/**
 * 验证身份证明
 * @param {Object} identityProof - 身份证明对象
 * @returns {Promise<Object>} 验证结果
 */
async function verifyIdentity(identityProof) {
  try {
    // 1. Retrieve the verification key
    const verificationKey = await getVerificationKey("identity_circuit");

    // 2. Handle case where key is not retrieved
    if (!verificationKey) {
      console.error('Failed to retrieve verification key for identity_circuit');
      return { valid: false, error: "Failed to retrieve verification key" };
    }

    // 3. Validate input structure
    if (!identityProof || !identityProof.proof || !identityProof.publicSignals) {
      console.error('Invalid identityProof structure:', identityProof);
      return { valid: false, error: "Invalid identityProof structure" };
    }

    // 4. Call verifyProof
    const isProofValid = await verifyProof(verificationKey, identityProof.publicSignals, identityProof.proof);

    // 5. Return based on proof validity
    if (isProofValid) {
      return {
        valid: true,
        attributes: {
          membershipValid: true, // Hardcoded as per requirement
          communityRole: 'member' // Hardcoded as per requirement
        }
      };
    } else {
      return { valid: false, error: "Invalid identity proof" };
    }

  } catch (error) {
    console.error('An unexpected error occurred during identity verification:', error);
    return { valid: false, error: "An unexpected error occurred during identity verification" };
  }
}

/**
 * 验证匿名投票证明
 * @param {Object} voteProof - 投票证明对象
 * @param {string} proposalId - 提案ID
 * @returns {Promise<Object>} 验证结果
 */
async function verifyAnonymousVote(voteProof, proposalId) {
  try {
    // 1. Retrieve the verification key
    const verificationKey = await getVerificationKey("anonymous_vote_circuit");

    // 2. Handle case where key is not retrieved
    if (!verificationKey) {
      console.error('Failed to retrieve verification key for anonymous_vote_circuit');
      return { valid: false, error: "Failed to retrieve verification key" };
    }

    // 3. Validate input structure
    if (!voteProof || !voteProof.proof || !voteProof.publicSignals) {
      console.error('Invalid voteProof structure:', voteProof);
      return { valid: false, error: "Invalid voteProof structure" };
    }

    // 4. Call verifyProof
    const isProofValid = await verifyProof(verificationKey, voteProof.publicSignals, voteProof.proof);

    // 5. Handle invalid proof
    if (!isProofValid) {
      return { valid: false, error: "Invalid vote proof" };
    }

    // 6. Perform placeholder checks for eligibility and double-voting
    // For eligibility:
    console.log(`Placeholder: Eligibility check passed for proposalId: ${proposalId}`);
    const isEligible = true; // Placeholder

    // For double-voting:
    console.log(`Placeholder: Double-voting check passed for proposalId: ${proposalId}`);
    const notDuplicate = true; // Placeholder

    return {
      valid: true,
      eligible: isEligible,
      notDuplicate: notDuplicate
    };

  } catch (error) {
    console.error('An unexpected error occurred during anonymous vote verification:', error);
    return { valid: false, error: "An unexpected error occurred during anonymous vote verification" };
  }
}

/**
 * 获取ZK电路信息
 * @returns {Promise<Array>} 可用电路列表
 */
async function getAvailableCircuits() {
  const zkKeysDir = path.join(__dirname, '..', 'zk_keys');
  try {
    const files = await fs.readdir(zkKeysDir);
    const circuitFiles = files.filter(file => file.endsWith('.vkey.json'));

    return circuitFiles.map(file => {
      const circuitId = file.replace('.vkey.json', '');
      // Convert snake_case to Title Case for the name
      const circuitName = circuitId
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      return {
        id: circuitId,
        name: circuitName,
        description: `Placeholder description for ${circuitName}`,
        status: 'available'
      };
    });
  } catch (error) {
    if (error.code === 'ENOENT') {
      // Directory doesn't exist, which is a valid case for returning an empty array
      console.log(`zk_keys directory not found at ${zkKeysDir}. Returning empty list of circuits.`);
    } else {
      // Other errors
      console.error('Error reading zk_keys directory:', error);
    }
    return [];
  }
}

/**
 * 生成ZK证明（客户端SDK使用）
 * @param {string} circuitId - 电路ID
 * @param {Object} privateInputs - 私有输入
 * @param {Array} publicInputs - 公共输入
 * @returns {Promise<Object|null>} 生成的证明和公共输入，或在出错时返回null
 */
async function generateProof(circuitId, privateInputs, publicInputs) {
  try {
    const basePath = path.join(__dirname, '..', 'zk_keys', circuitId);
    const wasmPath = `${basePath}.wasm`;
    const zkeyPath = `${basePath}.zkey`;

    // Log the paths for debugging
    console.log(`Generating proof for circuit ${circuitId} with WASM: ${wasmPath}, ZKEY: ${zkeyPath}`);
    console.log(`Private inputs:`, privateInputs); // Be cautious logging private inputs in a real app

    // Check if files exist (optional, but good for debugging)
    // fs.access is used here to check file existence before snarkjs tries to use them.
    // This can provide clearer error messages if files are missing.
    try {
      await fs.access(wasmPath);
      await fs.access(zkeyPath);
    } catch (fileError) {
      console.error(`Error accessing WASM/ZKEY files for circuit ${circuitId}:`, fileError);
      throw new Error(`WASM or ZKEY file not found for circuit ${circuitId}. Searched for ${wasmPath} and ${zkeyPath}`);
    }
    
    const { proof, publicSignals: generatedPublicSignals } = await snarkjs.groth16.fullProve(
      privateInputs, 
      wasmPath, 
      zkeyPath
    );

    // As per subtask: return the passed publicInputs as publicSignals
    return { 
      proof: proof, 
      publicSignals: publicInputs // Using passed publicInputs as requested
    };

  } catch (error) {
    console.error(`Error generating ZK proof for circuit ${circuitId}:`, error);
    return null;
  }
}

module.exports = {
  verifyProof,
  getVerificationKey,
  verifyIdentity,
  verifyAnonymousVote,
  getAvailableCircuits,
  generateProof
}; 