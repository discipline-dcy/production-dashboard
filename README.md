# 生产看板系统

在车间大屏上实时呈现各产线的生产进度。

## 快速开始

```bash
node server.js
```

然后浏览器打开 <http://localhost:3000>

## 项目结构

```
my-project/
├── server.js     后端服务：提供数据接口 + 托管页面
├── index.html    看板页面：每 3 秒调用一次接口刷新
├── .gitignore    Git 忽略规则
└── README.md     本文件
```

零依赖，只用 Node.js 内置模块，不需要 `npm install`。

## 接口说明

| 地址 | 方法 | 说明 |
|---|---|---|
| `/` | GET | 看板页面 |
| `/api/progress` | GET | 生产进度数据（JSON） |

返回数据格式：

```json
{
  "updatedAt": "2026-07-27T02:30:00.000Z",
  "shift": "白班",
  "summary": {
    "totalPlan": 6000,
    "totalActual": 4073,
    "rate": 67.9,
    "running": 3,
    "abnormal": 2
  },
  "lines": [
    {
      "id": 1,
      "name": "一号线 · 装配",
      "plan": 1200,
      "actual": 869,
      "rate": 72.4,
      "status": "运行中"
    }
  ]
}
```

产线状态取值：`运行中` / `已完成` / `待料` / `停机`

## 接入真实数据

目前是模拟数据。接真实数据只需要改 `server.js` 里的 `readProduction()`
这一个函数，前端页面不用做任何修改。

```js
function readProduction() {
  // 改成下面任意一种：
  //   查数据库：   const rows = await db.query('SELECT ...')
  //   调 MES 接口：const rows = await fetch('http://mes/api/progress')
  //   读 Excel：   const rows = parseExcel('D:/export/plan.xlsx')
}
```

## 设计说明

**状态不只靠颜色区分**
每种状态配了不同形状的图标（▶ ● ◆ ■）和文字标签。红绿色盲人群约占男性
8%，只用红/绿区分状态，这部分工人无法辨识。

**数据过期会明确报警**
连续 2 次拉取失败时弹出提示，并显示"当前是 X 秒前的旧数据"。看板最危险的
情况不是崩溃，而是服务已挂但屏幕仍显示旧数字，导致照着假数据做决策。

**暗色配色**
车间大屏长期通电常亮，暗色背景眩光小、夜班不刺眼，也能减轻屏幕烧屏。

## 部署注意

目标环境为 Windows Server 2012，但 Node.js 版本有硬性限制：

| Node 版本 | 最低系统要求 |
|---|---|
| 20 及以上 | Windows Server 2016 |
| 16 / 18 | Windows Server 2012 R2 |

部署前需确认服务器是 Server 2012 还是 2012 R2。若确认无法运行 Node，
可用 .NET Framework 4.8 或 Java 8 以相同架构重写后端，前端无需改动。

大屏为 MAXHUB 安卓设备，需确认其浏览器内核版本，必要时安装新版 Chrome。
