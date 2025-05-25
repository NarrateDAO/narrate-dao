# NarrateDAO

<div align="right">
  <a href="#chinese-readme">中文</a> | <a href="#english-readme">English</a>
</div>

<h2 id="chinese-readme">中文版 README</h2>

## 最小信任的去中心化投票解决方案

NarrateDAO 是一个最小信任、高性能、可审计的去中心化投票后端解决方案。它专注于提供一个即插即用的核心投票引擎，处理投票的签名、验证、计权、存储和审计，并能安全地触发链上执行。

## 核心功能

- **链下签名投票**: 允许用户使用 Web3 钱包对提案进行链下签名投票，避免高昂的 Gas 费用
- **可配置的投票权重系统**: 根据用户的链上资产灵活计算投票权重
- **ZK 身份验证接口**: 为隐私保护的身份验证和投票方案提供技术基础
- **链上执行触发器**: 在链下投票达成共识后，安全触发链上行动

## 技术架构

NarrateDAO 采用模块化设计，主要包含以下组件：

- **核心服务层**: 
  - 签名服务 (signatureService)
  - 权重计算服务 (weightService)
  - IPFS 存储服务 (ipfsService)
  - 执行服务 (executionService)
  - 审计服务 (auditService)
  - ZK 服务 (zkService)

- **API 层**: RESTful API 接口，用于与前端或其他服务交互

- **数据模型层**: 定义了提案、投票和审计日志等核心数据结构

## 快速开始

### 环境要求

- Node.js v14+
- MongoDB v4+
- Infura/Alchemy API 密钥 (用于与以太坊交互)
- IPFS 节点或 Infura IPFS API (用于存储数据)

### 安装

1. 克隆仓库

```bash
git clone https://github.com/NarrateDAO/narrate-dao.git
cd narrate-dao
```

2. 安装依赖

```bash
npm install
```

3. 配置环境变量

复制 `.env.example` 文件为 `.env` 并填写相应配置

```bash
cp .env.example .env
```

4. 启动开发服务器

```bash
npm run dev
```

## API 文档

### 投票 API

- `POST /api/v1/votes`: 提交新投票
- `GET /api/v1/votes/:proposalId`: 获取提案的所有投票
- `GET /api/v1/votes/:proposalId/results`: 获取提案的投票结果
- `GET /api/v1/votes/:proposalId/:voter`: 获取特定用户对特定提案的投票
- `POST /api/v1/votes/verify`: 验证投票签名

### 提案 API

- `POST /api/v1/proposals`: 创建新提案
- `GET /api/v1/proposals`: 获取提案列表
- `GET /api/v1/proposals/:id`: 获取特定提案详情
- `DELETE /api/v1/proposals/:id`: 取消提案
- `POST /api/v1/proposals/:id/execute`: 执行提案

### ZK API (预留)

- `GET /api/v1/zk/circuits`: 获取可用的 ZK 电路列表
- `POST /api/v1/zk/verify`: 验证 ZK 证明
- `POST /api/v1/zk/identity/verify`: 验证身份证明
- `POST /api/v1/zk/vote/verify`: 验证匿名投票证明

## 与现有解决方案的对比

NarrateDAO 不追求成为另一个包罗万象的治理平台，而是致力于成为投票领域的"乐高积木"，专注于提供市场上稀缺的、高可信度的核心投票能力。

- 与链上治理框架相比: 零 Gas 消耗，同时保持高度可审计性
- 与链下投票平台相比: 提供更灵活的 API 和更底层的"签名投票引擎"
- 与中心化投票工具相比: 最小信任模型，依赖签名和 IPFS 审计

## 贡献指南

欢迎通过 Issues 和 Pull Requests 贡献代码和想法。

## 许可证

MIT

---

<h2 id="english-readme">English README</h2>

## Minimally Trusted Decentralized Voting Solution

NarrateDAO is a minimally trusted, high-performance, auditable decentralized voting backend solution. It focuses on providing a plug-and-play core voting engine that handles signature, verification, weight calculation, storage, and auditing of votes, and can safely trigger on-chain execution.

## Core Features

- **Off-chain Signature Voting**: Allows users to vote on proposals with off-chain signatures using Web3 wallets, avoiding high Gas fees
- **Configurable Voting Weight System**: Flexibly calculates voting weights based on users' on-chain assets
- **ZK Identity Interface**: Provides technical foundation for privacy-preserving identity verification and voting schemes
- **On-chain Execution Trigger**: Safely triggers on-chain actions after off-chain voting consensus is reached

## Technical Architecture

NarrateDAO adopts a modular design, mainly consisting of the following components:

- **Core Service Layer**: 
  - Signature Service (signatureService)
  - Weight Calculation Service (weightService)
  - IPFS Storage Service (ipfsService)
  - Execution Service (executionService)
  - Audit Service (auditService)
  - ZK Service (zkService)

- **API Layer**: RESTful API interfaces for interaction with frontend or other services

- **Data Model Layer**: Defines core data structures such as proposals, votes, and audit logs

## Quick Start

### Requirements

- Node.js v14+
- MongoDB v4+
- Infura/Alchemy API key (for Ethereum interaction)
- IPFS node or Infura IPFS API (for data storage)

### Installation

1. Clone the repository

```bash
git clone https://github.com/NarrateDAO/narrate-dao.git
cd narrate-dao
```

2. Install dependencies

```bash
npm install
```

3. Configure environment variables

Copy the `.env.example` file to `.env` and fill in the corresponding configurations

```bash
cp .env.example .env
```

4. Start the development server

```bash
npm run dev
```

## API Documentation

### Voting API

- `POST /api/v1/votes`: Submit a new vote
- `GET /api/v1/votes/:proposalId`: Get all votes for a proposal
- `GET /api/v1/votes/:proposalId/results`: Get voting results for a proposal
- `GET /api/v1/votes/:proposalId/:voter`: Get a specific user's vote for a specific proposal
- `POST /api/v1/votes/verify`: Verify vote signature

### Proposal API

- `POST /api/v1/proposals`: Create a new proposal
- `GET /api/v1/proposals`: Get proposal list
- `GET /api/v1/proposals/:id`: Get specific proposal details
- `DELETE /api/v1/proposals/:id`: Cancel a proposal
- `POST /api/v1/proposals/:id/execute`: Execute a proposal

### ZK API (Reserved)

- `GET /api/v1/zk/circuits`: Get list of available ZK circuits
- `POST /api/v1/zk/verify`: Verify ZK proof
- `POST /api/v1/zk/identity/verify`: Verify identity proof
- `POST /api/v1/zk/vote/verify`: Verify anonymous vote proof

## Comparison with Existing Solutions

NarrateDAO does not seek to become another all-encompassing governance platform, but rather strives to be the "LEGO building blocks" in the voting field, focusing on providing scarce, highly credible core voting capabilities in the market.

- Compared to on-chain governance frameworks: Zero Gas consumption while maintaining high auditability
- Compared to off-chain voting platforms: Provides more flexible APIs and a lower-level "signature voting engine"
- Compared to centralized voting tools: Minimal trust model, relying on signatures and IPFS auditing

## Contribution Guidelines

Contributions of code and ideas through Issues and Pull Requests are welcome.

## License

MIT 