# GoTab Personal - lpsoar 私有定制版

这是基于 upstream `dengxiwang/gotab-personal` 的个人自用 fork，目标是作为本地/LAN 新标签页服务。

## 本 fork 的定制

- 移除“每日宝藏”推荐模块和远程推荐接口调用。
- 移除 README 中的推广、捐赠、官网跳转和公开预览内容。
- 关闭注册入口：只保留登录，不开放新用户注册。
- 隐藏找回密码/邮箱验证码相关入口，当前实例不配置邮件服务。
- 移除登录页品牌外链和赞助/捐赠相关 UI 入口。
- 默认面向单用户使用：当前部署只允许既有账号登录。

## 当前部署方式

推荐使用 Docker Compose，并将 MySQL 数据放在 Docker named volume 中，避免 Windows/WSL bind mount 权限问题。

示例：

```yaml
services:
  gotab:
    image: lpsoar/gotab-custom:local
    ports:
      - "8099:8080"
    volumes:
      - ./uploads:/app/uploads
      - ./sourceStore:/app/sourceStore
      - ./config.toml:/app/config.toml
    restart: always
```

当前本机部署目录：

```text
E:\Apps\gotab
/mnt/e/Apps/gotab
```

访问地址：

```text
http://127.0.0.1:8099
```

## 构建本地镜像

```bash
docker build -t lpsoar/gotab-custom:local .
```

然后在部署目录执行：

```bash
docker compose up -d --no-build gotab
```

## 升级注意

上游前端静态资源带 hash 校验，后端二进制中也嵌入了资源 hash。修改 `web/assets/*` 后必须同步更新：

1. `web/hash-manifest.json`
2. `gotab-server-linux-amd64` 内嵌的旧 hash 字符串

否则容器启动后会因资源校验失败反复重启。

## 账户策略

本 fork 面向个人使用，不开放注册。用户账号通过初始化流程或数据库已有账号维护。当前线上实例已有管理员账号，后续不需要 SMTP 邮件服务。
