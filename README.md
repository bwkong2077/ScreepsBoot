# ScreepsBoot


## 介绍

本项目为在 [ScreepsCode](https://github.com/JesseTzh/ScreepsCode) 基础上全新重构的Screeps代码，旨在尽量实现自适应执行与任务驱动的设计架构。

## 架构设计

在运行逻辑上，本项目以 System 为入口，划分为三大模块，分别为：

1. System.boot(）

    负责统筹规划事宜，包括数据库的创建与修改、定时任务安排与触发以及复杂任务的下发等等。

2. System.work()

    游戏内真正活动的主要处理模块，所有的 Creep 与建筑自身的运行逻辑均在本模块执行。

3. System.end()

    主要进行一些次要的监视与收尾工作，例如调试所用的能量矿监测工具，以及将本tick内的警告信息以邮件形式发送。

## 特色模块

1.  [Log](./Log.js) 模块

一个简单易用的 Log 调试工具，在 [Log](https://github.com/zhpjy/screeps) 的基础上增加了一些快速输出的便利性方法，方便快速定位问题。

2. [Database](./Database.js) 模块

用于管理游戏中非持久性数据，例如房间、建筑、creep缓存队列等等。并在某种程度上相当于传统项目中的持久层框架，提供了访问 global 中所有数据的接口，以尽量减少直接操作缓存数据，提高系统的可读性与易维护性。

3. [creepTemplateGenerator](./creepTemplateGenerator.js) 模块

根据实时的房间能量状况生成 Creep 模板，正在规划重构。

## 使用说明
开箱即用，默认无需任何配置。

系统初次运行如报错，可尝试任意修改后保存重新运行。