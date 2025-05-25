/**
 * IPFS服务
 * 处理数据的IPFS存储和检索
 */
const { create } = require('ipfs-http-client');

// 创建IPFS客户端
function getIpfsClient() {
  // 判断是否提供了API密钥
  if (process.env.IPFS_API_KEY && process.env.IPFS_API_SECRET) {
    const auth = 'Basic ' + Buffer.from(
      process.env.IPFS_API_KEY + ':' + process.env.IPFS_API_SECRET
    ).toString('base64');
    
    return create({
      host: 'ipfs.infura.io',
      port: 5001,
      protocol: 'https',
      headers: {
        authorization: auth
      }
    });
  }
  
  // 无认证的客户端
  return create({
    url: process.env.IPFS_API_URL || 'https://ipfs.infura.io:5001/api/v0'
  });
}

/**
 * 存储数据到IPFS
 * @param {Object|string} data - 要存储的数据
 * @returns {Promise<string>} IPFS内容哈希 (CID)
 */
async function storeOnIpfs(data) {
  try {
    const ipfs = getIpfsClient();
    
    // 转换数据为JSON字符串
    const content = typeof data === 'string' 
      ? data 
      : JSON.stringify(data);
    
    // 添加到IPFS
    const result = await ipfs.add(Buffer.from(content));
    
    return result.path; // 返回CID
  } catch (error) {
    console.error('IPFS存储失败:', error);
    throw new Error('IPFS存储失败: ' + error.message);
  }
}

/**
 * 从IPFS获取数据
 * @param {string} cid - IPFS内容标识符 (CID)
 * @param {boolean} asJson - 是否将结果解析为JSON对象
 * @returns {Promise<Object|string>} 检索到的数据
 */
async function getFromIpfs(cid, asJson = true) {
  try {
    const ipfs = getIpfsClient();
    
    // 从IPFS获取内容
    const chunks = [];
    for await (const chunk of ipfs.cat(cid)) {
      chunks.push(chunk);
    }
    
    // 组合所有块并转换为字符串
    const content = Buffer.concat(chunks).toString();
    
    // 如果需要，将内容解析为JSON
    return asJson ? JSON.parse(content) : content;
  } catch (error) {
    console.error('IPFS检索失败:', error);
    throw new Error('IPFS检索失败: ' + error.message);
  }
}

/**
 * 批量存储多个数据到IPFS
 * @param {Array<Object|string>} dataArray - 数据数组
 * @returns {Promise<Array<string>>} IPFS内容哈希数组
 */
async function storeBatchOnIpfs(dataArray) {
  try {
    const results = await Promise.all(
      dataArray.map(data => storeOnIpfs(data))
    );
    return results;
  } catch (error) {
    console.error('IPFS批量存储失败:', error);
    throw new Error('IPFS批量存储失败: ' + error.message);
  }
}

/**
 * 获取IPFS访问链接
 * @param {string} cid - IPFS内容标识符
 * @returns {string} 可访问的IPFS链接
 */
function getIpfsGatewayUrl(cid) {
  return `https://ipfs.io/ipfs/${cid}`;
}

module.exports = {
  storeOnIpfs,
  getFromIpfs,
  storeBatchOnIpfs,
  getIpfsGatewayUrl
}; 