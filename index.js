const Koa = require('koa')
const app = new Koa()
const mime = require('mime')
const fs = require('fs-extra')
const Path = require('path')
const Router = require('koa-router')

const router = new Router()

router.get('/', async (ctx, next) => {
    ctx.type = mime.getType('.html')

    const content = await fs.readFile(Path.resolve(__dirname, './index.html'), 'UTF-8')
    ctx.body = content
    next()
})
// 处理加载图片资源 - 强缓存
router.get(/\S*\.(jpe?g|png)$/, async (ctx, next) => {
    const { path } = ctx;
    ctx.type = mime.getType(path)

    const imagePath = Path.resolve(__dirname, `.${path}`)
    const imageBuffer = await fs.readFile(imagePath)

    // 同时存在，max-age 优先
    // max-age 设置 120s 内有效
    ctx.set('cache-control', 'max-age=120')
    // expires 设置 60s 内有效
    ctx.set('expires', new Date(Date.now() + 1 * 60 * 1000).toUTCString())

    ctx.body = imageBuffer

    await next();
})

// // 处理加载图片资源 - 协商缓存
// router.get(/\S*\.(jpe?g|png)$/, async (ctx, next) => {
//     const { path } = ctx;
//     ctx.type = mime.getType(path);
//
//     const imagePath = Path.resolve(__dirname, `.${path}`)
//     const imageStatus = await fs.stat(imagePath);
//     const lastModified = imageStatus.mtime.toGMTString();
//     const ifModifiedSince = ctx.request.headers['if-modified-since']
//
//     // 如果命中，返回状态304
//     if(ifModifiedSince === lastModified) {
//         ctx.status = 304
//     } else {
//         const imageBuffer = await fs.readFile(imagePath);
//         ctx.set('cache-control', 'no-cache')
//         ctx.set('last-modified', lastModified)
//         ctx.body = imageBuffer;
//     }
//
//     await next();
// });

// 处理 css 文件
router.get(/\S*\.css$/, async (ctx, next) => {
    const { path } = ctx;
    ctx.type = mime.getType(path);

    const content = await fs.readFile(Path.resolve(__dirname, `.${path}`), 'UTF-8');
    ctx.body = content;

    await next();
});


app.use(router.routes()).use(router.allowedMethods())

app.listen(5000, () => {
    console.log('http://localhost:5000')
})
