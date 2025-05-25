/**
 * Swagger配置
 * 定义API文档和交互测试接口
 */
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

// 加载Swagger YAML文件
const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'));

module.exports = {
  serve: swaggerUi.serve,
  setup: swaggerUi.setup(swaggerDocument, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'NarrateDAO API文档',
  }),
  spec: swaggerDocument,
}; 