# AIQTP Redirect Pages

Deploy these to free hosting services to create redirect URLs to aiqtp.com.

## Quick Deploy Instructions

### 1. Netlify (yourname.netlify.app)
```bash
cd netlify
npx netlify-cli deploy --prod
```
Or drag & drop the `netlify` folder at [app.netlify.com/drop](https://app.netlify.com/drop)

### 2. Vercel (yourname.vercel.app)
```bash
cd vercel
npx vercel --prod
```
Or import via [vercel.com/new](https://vercel.com/new)

### 3. GitHub Pages (yourname.github.io)
1. Create new repo on GitHub
2. Upload contents of `github-pages` folder
3. Go to Settings → Pages → Enable

### 4. Cloudflare Pages (yourname.pages.dev)
1. Go to [pages.cloudflare.com](https://pages.cloudflare.com)
2. Create project → Upload `cloudflare-pages` folder

### 5. Surge.sh (yourname.surge.sh)
```bash
cd surge
npx surge
```

### 6. Render (yourname.onrender.com)
1. Go to [render.com](https://render.com)
2. New → Static Site → Upload `render` folder

## Suggested Subdomain Names
- aiqtp-trading.netlify.app
- quantum-trader.vercel.app
- ai-trading-bot.pages.dev
- crypto-signals-pro.surge.sh
- defi-analytics.onrender.com
- smart-portfolio.netlify.app
- algo-trading-ai.vercel.app
- market-intelligence.pages.dev
