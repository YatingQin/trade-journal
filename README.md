# 交易复盘（Trade Journal）

个人使用的 A股 / 美股交易复盘网站：手工记账、关联策略、选择止盈止损原因，并按策略与账户统计盈亏、胜率。

## 本地开发（仅用于写代码调试）

需要 Node.js 18+。

```bash
# 初始化数据库（首次）
cd server
npm install
npm run init-db

# 启动后端（默认 http://localhost:3000）
npm run dev

# 另开终端启动前端（http://localhost:8088，已代理 /api）
cd ../web
npm install
npm run dev
```

默认登录：`admin` / `trade123`

也可在项目根目录：

```bash
npm install
npm run init-db
npm run dev
```

## 免费云端部署（电脑不用开机也能访问）

「免费托管」= 把网站放到云厂商服务器上，**不是跑在你本机**。手机、电脑用浏览器打开同一个网址即可。

推荐一条路径（最简单）：**Render 免费 Web Service + Docker**

1. 把本仓库推到 GitHub（需本机安装 Git）
2. 打开 [https://render.com](https://render.com) 注册
3. **New → Web Service**，连接该仓库
4. 选择 **Docker** 部署
5. 环境变量建议设置：
   - `APP_PASSWORD`：你的登录密码（首次初始化时生效）
   - `JWT_SECRET`：一串随机密钥
6. 部署完成后会得到类似 `https://xxx.onrender.com` 的网址

注意：Render 免费实例会休眠，冷启动可能要等几十秒；免费磁盘默认不持久，**重启后 SQLite 数据可能丢失**。个人长期使用建议：

- 在 Render 加持久磁盘挂载到 `/app/server/data`，或
- 改用 Railway / Fly.io 并挂载 volume

部署后请立刻修改默认密码（重新初始化数据库或自行改库）。

## 功能一览

- 多账户（A股 / 美股）
- 策略新增与交易关联
- 止盈 / 止损 / 其他离场原因
- 持仓与已平仓交易手工录入
- 按策略、账户、离场原因统计盈亏与胜率
- 响应式布局，手机可访问

## 技术栈

- 前端：Vue 3 + Vite + Vue Router + Pinia
- 后端：Express + SQLite（better-sqlite3）
- 鉴权：JWT（单用户）
