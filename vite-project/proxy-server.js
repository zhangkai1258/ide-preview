const express = require('express')
const { createProxyMiddleware } = require('http-proxy-middleware')
const cors = require('cors')

const app = express()
const PORT = 3001

// 启用CORS
app.use(cors())

// 代理到你的IDE服务器
app.use('/ide', createProxyMiddleware({
  target: 'http://gitlib.aiyouthlab.com',
  changeOrigin: true,
  pathRewrite: {
    '^/ide': '', // 移除/ide前缀
  },
  onProxyReq: (proxyReq, req, res) => {
    // 移除X-Frame-Options头
    proxyReq.removeHeader('X-Frame-Options')
    proxyReq.removeHeader('Content-Security-Policy')
  },
  onProxyRes: (proxyRes, req, res) => {
    // 移除响应中的X-Frame-Options头
    delete proxyRes.headers['x-frame-options']
    delete proxyRes.headers['content-security-policy']
    
    // 添加允许iframe嵌入的头
    proxyRes.headers['X-Frame-Options'] = 'ALLOWALL'
  }
}))

app.listen(PORT, () => {
  console.log(`代理服务器运行在 http://localhost:${PORT}`)
  console.log(`IDE代理地址: http://localhost:${PORT}/ide/-/ide/project/zhangkai/test-vscode/edit/master/-/`)
})
