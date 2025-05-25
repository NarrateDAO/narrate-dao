/**
 * 数据库配置
 * 连接MongoDB数据库
 */
const mongoose = require('mongoose');

// 连接数据库
const connectDB = async () => {
  try {
    // 在开发环境中，如果没有配置数据库连接字符串，使用内存模式
    if (process.env.NODE_ENV === 'development' && !process.env.MONGODB_URI) {
      console.log('开发环境：使用内存模式，不连接真实数据库');
      
      // 模拟连接成功
      mongoose.connection.emit('connected');
      return;
    }
    
    // 使用环境变量中的连接字符串或默认本地MongoDB
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/narrate-dao',
      {
        useNewUrlParser: true,
        useUnifiedTopology: true
      }
    );
    
    console.log(`MongoDB连接成功: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB连接失败: ${error.message}`);
    
    // 在开发环境中允许继续运行，生产环境则退出进程
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    } else {
      console.log('开发环境：跳过数据库连接，部分功能可能不可用');
    }
  }
};

module.exports = connectDB; 