# Epheon 第六阶段计划：兼容与工具

本文对应 `docs/rfcs/0001-architecture.md` 的“第六阶段：兼容与工具”。本文只维护阶段目标、边界和完成判定；任务状态、当前代码产出与执行顺序统一维护在 `docs/tasks/0006-stage-6-compatibility-and-tooling-tasks.md`。

## 一、阶段目标

实现：

```txt
@epheon/compat
@epheon/runtime
@epheon/cli
```

目标：

```txt
提升易用性
```

## 二、执行入口

本阶段的任务状态、关联代码与进入条件见：

```txt
docs/tasks/0006-stage-6-compatibility-and-tooling-tasks.md
```

## 三、进入条件

只有同时满足下面条件，才进入第六阶段：

1. 第四阶段已经给出稳定的中国历法公共 API。
2. 第五阶段已经给出足够可信的 fixture、conformance 与 benchmark 基线。
3. 已经出现明确的外部接入需求，而不是仓库内部预演。

## 四、当前预留的最小方向

进入这一阶段后，也先走最小版本：

1. `@epheon/cli` 先只提供少量只读查询命令。
2. `@epheon/compat` 只做明确需要的外部格式适配。
3. `@epheon/runtime` 只承载运行时装配，不抢占核心领域逻辑。

## 五、当前明确暂缓

这一阶段当前不该启动：

- Playground。
- Web 服务层。
- 未被真实需求证明的兼容层抽象。
- 为“未来可能需要”预建的大型运行时框架。

## 六、完成判定

在第四、五阶段完成之前，第六阶段统一视为暂缓，不进入当前开发主线。
