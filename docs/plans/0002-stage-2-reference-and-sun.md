# Epheon 第二阶段计划：参考系与太阳

本文对应 `docs/rfcs/0001-architecture.md` 的“第二阶段：参考系与太阳”。本文只维护阶段目标、边界和完成判定；任务状态、当前代码产出与执行顺序统一维护在 `docs/tasks/0002-stage-2-reference-and-sun-tasks.md`。

## 一、阶段目标

实现：

```txt
@epheon/reference
@epheon/ephemerides
@epheon/ephemerides-vsop87
```

目标：

```txt
计算太阳黄经
求二十四节气
```

## 二、执行入口

本阶段的任务状态、关联代码与验证闭环见：

```txt
docs/tasks/0002-stage-2-reference-and-sun-tasks.md
```

## 三、阶段边界

第二阶段当前已经收口到“最小太阳链路可用”，但不继续提前扩展：

- 不提前补完整 VSOP87 行星族。
- 不提前拆 `dataset-vsop87`，除非系数体积、更新或许可真的成为问题。
- 不为了未来可能的 frame 扩展而开放过度可配置的参考系构造。

## 四、后续只保留必要增量

第二阶段后续只需要为上层阶段提供稳定支撑：

1. 如果中国历法或 conformance 证明当前太阳精度不足，再补更高精度 provider。
2. 如果节气求解暴露出 frame 或 precision 边界问题，再修正抽象层。
3. 如果公共 API 需要更稳定的太阳查询入口，再在现有包内补最小 helper，不新增平行抽象。

## 五、完成判定

当前视为已完成。除非 fixture 或上层结果证明它不够用，否则不把第二阶段重新打开成大规模任务。
