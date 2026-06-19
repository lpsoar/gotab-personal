# Gotab 新标签页私有化部署

### 特点

免费、清爽、功能齐全、可配置项多！

### 项目简介

Gotab 新标签页是 funtabs 新标签页的重构版本，由于之前的版本是刚自学之后的第一版，传参都是一层一层的写，后期接触到 redux，发觉已经改不动了，而且感觉大家更喜欢 itab,wetab 中的某些功能，但是做起来由于没有规划，已经是相当难受，所以重构了一下，本项目前端使用 Vite 脚手架构建，后端使用 golang 编写，得益于 golang 的特性，后端程序仅一个二进制文件。用于打造个性化浏览器新标签页、起始页、个人主页。

### 官网

[https://www.gotab.cn](https://www.gotab.cn)

### 在线预览

demo 地址：[https://test.gotab.cn](https://test.gotab.cn)，用户名：admin，密码：123456

### 准备工作

NAS 终端或云服务器或其他设备（没有云服务器或者需要购买云服务器的可以看下我的推广：[雨云服务器](https://www.rainyun.com/gotab_)，感谢您的支持）、mysql 数据库（版本 8.0+ ，用于存储网站信息，并不包含网站配置，配置是程序运行时在根目录创建的 config.toml ）

### 用户帮助

有任何问题，欢迎加群反馈交流，比较及时：QQ 群 727809499

## docker 部署

```
docker run -d \
  --name gotab-server \
  -p 8080:8080 \
  -e SERVER_PORT=8080 \
  -v $(pwd)/uploads:/app/uploads \
  -v $(pwd)/sourceStore:/app/sourceStore \
  --mount type=bind,source=$(pwd)/config.toml,target=/app/config.toml \
  --restart always \
  doxwant/gotab:latest
```

docker 部署最好进行文件目录映射，这样更新后数据不会丢失，主要是三个：
1、/uploads ，对应容器内的/app/uploads ，代表着用户上传的文件；
2、/sourceStore ，对应容器内的/app/sourceStore，代表着资源库的图标文件；
3、/config.toml，对应容器内的/app/config.toml，代表着程序的配置文件，如：mysql 设置、邮件服务器设置、网站标题等内容，请注意，这是一个单文件，而不是文件夹；

## 注意事项

（1）管理后台路径：管理员 - 我的 - 管理端，或者登陆后直接访问 /console 路径；

（2）后台设置的一些功能性开关，对应着/web/siteConfig.js 文件，已经做了版本缓存控制，如变更配置无效请检查服务缓存，其他需要注意缓存的文件为：html 结尾的，/background.js，以及/api/\*路径开头的；

（3）数据是跟着用户走的，不登录的情况下默认的只是在本地进行缓存。数据分为两类，一类是默认主页数据（管理员可以在个人中心右上角编辑默认主页数据，也可以在管理后台的功能开关中调整默认主页数据策略），另一类是用户数据；

## 使用说明

### 1. 部署准备

您需要一台能够运行可执行文件的服务器或主机（如 Linux 服务器）。由于后端程序 `gotab-server` 是一个 Go 编译后的静态二进制文件，因此无需安装 Go 环境即可运行，项目进行了多平台构建，建议部署时将对应平台后端程序重命名为 `gotab-server` 。

### 2. 部署步骤

- 将项目中的 `gotab-server` 后端程序和 `/web` 目录下的前端文件上传至服务器上的同一目录。

- 确保给 `gotab-server` 赋予可执行权限，例如在 Linux 上执行：

  ```bash
  chmod 0755 gotab-server
  ```

- 在服务器上启动程序：

  ```bash
  ./gotab-server
  ```

- 根据需要指定端口

  ```bash
  ./gotab-server -port=端口
  ```

### 3. 1panel 示例

- 克隆或下载项目，把 gotab-server 后端程序还有/web 目录下所有程序放到服务器上，注意要给 gotab-server 二进制文件可执行权限（0755）

- 点击网站 - 运行环境 - GO - 创建 Go 运行环境

- 输入自定义名称

- 选择运行目录（即：该项目文件所在的文件夹）

- 输入启动命令./gotab-server

- 确认

- 访问 ip+端口打开页面，首次将跳转到/install 安装引导页面，按要求输入内容即可

<img src="https://github.com/user-attachments/assets/de93184b-dc22-4aee-a98c-8316f5dcfef3" width="400" alt="1panel示例">

### 4. 宝塔示例

<img src="https://github.com/user-attachments/assets/16fada89-84d5-45e4-bafc-7761e8542f8a" width="400" alt="宝塔示例">

## 详细展示

> **页面预览**

![20250511193208](https://github.com/user-attachments/assets/9e9d7ce4-e63f-4ec6-a319-b3afb538fe83)

![20250511193251](https://github.com/user-attachments/assets/a6bc5871-80d5-412c-9b65-6345e563d5df)

![20250511193312](https://github.com/user-attachments/assets/a1b34288-b356-44b1-8789-3736db4eaa2e)

> **功能特性**

GoTab 新标签页是 funtabs 新标签页的全新升级版本，是您打造个人学习工作台的浏览器必备插件。简单、无广告、美观大气，超高自定义程度，满足您的各项要求！。

特色功能说明：

- 精美小组件

  ⚬ 独特的小组件设计让信息展示充满美感

  ⚬ 支持众多小组件供您自由选择！

- 聚合搜索

  ⚬ 聚合多个主流搜索引擎，支持一键快捷切换搜索

  ⚬ 搜索支持群搜模式，一次点击打开多个搜索页面

- 浏览器书签管理

  ⚬ 支持批量导入本地书签，方便一键管理

- 排序方式

  ⚬ 支持常规排序、交换位置排序以及自由拖拽多种方式

  ⚬ 相同大小的卡片交换位置，不影响其他卡片布局

  ⚬ 全屏自由拖拽，支持卡片放置在任意位置

  ⚬ 自由拖拽支持移动步长设置，可调整横向、纵向移动网格

- 卡片布局

  ⚬ 任意添加喜欢的卡片，卡片支持内网链接设置

  ⚬ 链接卡片支持纯图、文本、横向卡片、竖向卡片多种样式

  ⚬ 卡片名称支持字幕滚动样式

  ⚬ 分类切换支持滚动翻页、循环滚动等多种模式

  ⚬ 究极超自定义程度，等待您的探索

- 精美动画

  ⚬ 舒适的动画，让您切换自如，感受丝滑

- 双壁纸模式

  ⚬ 支持标准模式和简约模式双壁纸设置

  ⚬ 自定义自定义静态、动态、纯色以及渐变壁纸

  ⚬ 两种模式，两张壁纸，动态切换，随心所欲

- 简约模式

  ⚬ 点击时间一键切换极简模式，享受纯净壁纸界面

  ⚬ 简约模式支持文本设置等多种自定义选项

- 多端数据即时同步与备份

  ⚬ 支持时光机，数据安全不丢失

  ⚬ 支持多设备登录和即时数据同步

  ⚬ 支持数据本地备份，离线也能用

- 资源库

  ⚬ 内置精心整理的全球海量优质网站资源图标库

  ⚬ 支持提交分享您觉得不错的网站资源

- 迁移备份

  ⚬ 支持导入、导出本站数据，管理随心

  ⚬ 导入本地书签，一键添加省心省力

  ⚬ 支持他人标签页导出数据迁移至当前标签页

  ⚬ 不喜欢我们，也可以导出成浏览器书签通用格式

- 丝滑流畅的用户体验

  ⚬ 超快的打开响应速度

  ⚬ 丝滑流畅的动画效果

> **捐赠支持**

<div style="display:flex;flex-wrap:wrap;gap:12px;">

<img src="https://github.com/user-attachments/assets/7c379a17-475d-432f-944e-292f39e0e0ba" width="200" alt="微信支付二维码">

<img src="https://github.com/user-attachments/assets/e3681a43-aec3-4601-a1dd-272c83145e85" width="200" alt="支付宝二维码">

<img src="https://github.com/user-attachments/assets/3423b752-efbd-4fb4-b330-402276d645d1" width="200" alt="微信图片">

</div>
