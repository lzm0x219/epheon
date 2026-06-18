# Epheon 第三阶段计划：月球与朔望

本文对应 `docs/rfcs/0001-architecture.md` 的“第三阶段：月球与朔望”。本文只维护阶段目标、边界和完成判定；任务状态、当前代码产出与执行顺序统一维护在 `docs/tasks/0003-stage-3-moon-and-syzygy-tasks.md`。

## 一、阶段目标

实现：

```txt
@epheon/ephemerides-elp2000
@epheon/phenomena
```

目标：

```txt
求朔
求望
求月相
```

## 二、执行入口

本阶段的任务状态、关联代码与验证闭环见：

```txt
docs/tasks/0003-stage-3-moon-and-syzygy-tasks.md
```

## 三、阶段边界

第三阶段当前只承诺最小月球链路，不提前做下面这些扩展：

- 不提前补完整 ELP2000 系数展开。
- 不提前引入 JPL 星历。
- 不提前把所有月相、高阶事件或长期历表都塞进 `phenomena`。

## 四、后续只保留必要增量

第三阶段后续只接受两类工作：

1. 为第四阶段中国历法补足朔望查询稳定性和边界测试。
2. 当 fixture 或 conformance 证明当前月球精度不足时，再升级 provider 或数据来源。

## 五、完成判定

当前视为已完成最小目标。接下来它主要作为第四阶段的依赖层，而不是单独扩张的新任务面。
