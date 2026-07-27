/**
 * 生产看板 —— 后端服务
 *
 * 只用 Node.js 内置模块，不需要 npm install，单文件即可运行：
 *     node server.js
 *
 * 对外提供两样东西：
 *   1. GET /              → 看板页面（index.html）
 *   2. GET /api/progress  → 生产进度数据（JSON 接口）
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

// ═══════════════════════════════════════════════════════════════
// 数据源
//
// 现在是模拟数据。真实项目里只需要改 readProduction() 这一个函数，
// 其它代码一律不用动 —— 这就是「中间加一层自己的后端」的价值：
//
//   · 直连数据库：const rows = await db.query('SELECT * FROM ...')
//   · 调 MES 接口：const rows = await fetch('http://mes/api/progress')
//   · 读 Excel：   const rows = parseExcel('D:/export/plan.xlsx')
//
// 前端页面永远只认 /api/progress 这一个地址，数据源怎么换都不影响它。
// ═══════════════════════════════════════════════════════════════

const lines = [
  { id: 1, name: '一号线 · 装配', plan: 1200, actual: 860,  status: '运行中' },
  { id: 2, name: '二号线 · 焊接', plan: 900,  actual: 742,  status: '运行中' },
  { id: 3, name: '三号线 · 喷涂', plan: 1500, actual: 1500, status: '已完成' },
  { id: 4, name: '四号线 · 总装', plan: 800,  actual: 310,  status: '待料'   },
  { id: 5, name: '五号线 · 包装', plan: 1000, actual: 455,  status: '运行中' },
  { id: 6, name: '六号线 · 检测', plan: 600,  actual: 180,  status: '停机'   },
];

// 让「运行中」的产线数字往前走，方便肉眼看到看板确实在实时刷新
function tick() {
  for (const line of lines) {
    if (line.status !== '运行中') continue;
    line.actual = Math.min(line.plan, line.actual + Math.floor(Math.random() * 15));
    if (line.actual >= line.plan) line.status = '已完成';
  }
}

function readProduction() {
  tick();

  const totalPlan   = lines.reduce((sum, l) => sum + l.plan, 0);
  const totalActual = lines.reduce((sum, l) => sum + l.actual, 0);

  return {
    updatedAt: new Date().toISOString(),
    shift: '白班',
    summary: {
      totalPlan,
      totalActual,
      rate: +(totalActual / totalPlan * 100).toFixed(1),
      running:  lines.filter(l => l.status === '运行中').length,
      abnormal: lines.filter(l => l.status === '停机' || l.status === '待料').length,
    },
    lines: lines.map(l => ({
      ...l,
      rate: +(l.actual / l.plan * 100).toFixed(1),
    })),
  };
}

// ═══════════════════════════════════════════════════════════════
// HTTP 服务
// ═══════════════════════════════════════════════════════════════

const server = http.createServer((req, res) => {
  // 简易日志：每个请求都记一行，方便排查问题
  console.log(`[${new Date().toLocaleTimeString('zh-CN')}] ${req.method} ${req.url}`);

  // ── 数据接口 ──
  if (req.url === '/api/progress') {
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',   // 允许跨域，避免前面讲过的 CORS 报错
      'Cache-Control': 'no-store',          // 看板数据要最新的，禁止浏览器缓存
    });
    res.end(JSON.stringify(readProduction()));
    return;
  }

  // ── 看板页面 ──
  if (req.url === '/' || req.url === '/index.html') {
    fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
      if (err) {
        console.error('读取 index.html 失败:', err.message);
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('500 服务器错误：找不到 index.html');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(data);
    });
    return;
  }

  // ── 其它地址一律 404 ──
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('404 Not Found');
});

server.listen(PORT, () => {
  console.log('─'.repeat(48));
  console.log('  生产看板已启动');
  console.log(`  看板页面：http://localhost:${PORT}`);
  console.log(`  数据接口：http://localhost:${PORT}/api/progress`);
  console.log('  按 Ctrl+C 停止');
  console.log('─'.repeat(48));
});
