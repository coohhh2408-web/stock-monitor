import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
    },
  },
  server: {
    host: true,
    port: 5173,
    allowedHosts: true,
    proxy: {
      '/em-qt': {
        target: 'https://push2.eastmoney.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/em-qt/, ''),
      },
      '/em-his': {
        target: 'https://push2his.eastmoney.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/em-his/, ''),
      },
      '/em-kuaixun': {
        target: 'https://newsapi.eastmoney.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/em-kuaixun/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('referer', 'https://finance.eastmoney.com/')
            proxyReq.setHeader('origin', 'https://finance.eastmoney.com')
          })
        },
      },
      '/em-f10': {
        target: 'https://emweb.securities.eastmoney.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/em-f10/, ''),
      },
      '/sina-zhibo': {
        target: 'https://zhibo.sina.com.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/sina-zhibo/, ''),
      },
      '/wscn': {
        target: 'https://api.wallstreetcn.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/wscn/, ''),
      },
      '/wscn-one': {
        target: 'https://api-one-wscn.awtmt.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/wscn-one/, ''),
      },
      '/cls': {
        target: 'https://www.cls.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/cls/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('referer', 'https://www.cls.cn/')
            proxyReq.setHeader('origin', 'https://www.cls.cn')
          })
        },
      },
    },
  },
})
