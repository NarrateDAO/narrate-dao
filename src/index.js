const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

// 导入数据库连接
const connectDB = require('./config/database');

// 导入Swagger配置
const swagger = require('./config/swagger');

// 导入路由
const voteRoutes = require('./api/routes/voteRoutes');
const proposalRoutes = require('./api/routes/proposalRoutes');
const weightRoutes = require('./api/routes/weightRoutes');
const auditRoutes = require('./api/routes/auditRoutes');
const executionRoutes = require('./api/routes/executionRoutes');
const zkRoutes = require('./api/routes/zkRoutes');

// 连接数据库
connectDB();

// 创建Express应用
const app = express();

// 中间件
app.use(helmet()); // 安全HTTP头
app.use(cors()); // 允许跨域请求
app.use(express.json()); // 解析JSON请求体
app.use(morgan('dev')); // HTTP请求日志

// API文档路由
app.use('/api-docs', swagger.serve, swagger.setup);

// API路由
app.use('/api/v1/votes', voteRoutes);
app.use('/api/v1/proposals', proposalRoutes);
app.use('/api/v1/weights', weightRoutes);
app.use('/api/v1/audit', auditRoutes);
app.use('/api/v1/execute', executionRoutes);
app.use('/api/v1/zk', zkRoutes);

// 健康检查端点
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'NarrateDAO API正在运行',
    version: '0.1.0'
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: '找不到请求的资源'
  });
});

// 全局错误处理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    status: 'error',
    message: err.message || '服务器内部错误'
  });
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`NarrateDAO服务器正在端口${PORT}上运行`);
  console.log(`API文档可在 http://localhost:${PORT}/api-docs 访问`);
});

module.exports = app; // 导出用于测试 