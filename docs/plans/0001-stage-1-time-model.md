# Epheon 第一阶段计划：时间模型

本文对应 `docs/rfcs/0001-architecture.md` 的“第一阶段：时间模型”。本文只维护阶段目标、边界和完成判定；任务状态、当前代码产出与执行顺序统一维护在 `docs/tasks/0001-stage-1-time-model-tasks.md`。

## 一、阶段目标

实现：

```txt
@epheon/primitives
@epheon/temporal
```

目标：

```txt
稳定表达 Instant
支持 JD
支持 UTC / TT
支持 ΔT
```

## 二、执行入口

本阶段的任务状态、关联代码与验证闭环见：

```txt
docs/tasks/0001-stage-1-time-model-tasks.md
```

## 三、阶段边界

第一阶段已经明确收口，当前不再继续往这个阶段加新抽象。

保留边界：

- 公共入口只导出稳定值对象与 provider 类型。
- Gregorian 校验、UTC 解析、时间尺度纯函数等实现细节继续留在 `src/internal/`。
- `Result<T, E>` 继续作为可恢复错误模型，当前不补 `Maybe`、`Interval` 等额外基础类型。

## 四、后续只在必要时回补

第一阶段后续只接受被上层阶段明确逼出来的改动：

1. 当中国历法或天象求解需要新的基础值对象时，再补最小值类型。
2. 当现有时间尺度边界不足以支撑上层 API 时，再扩展 `temporal`。
3. 当 fixture 暴露出时间尺度或 UTC 输入边界缺口时，再补测试与校验。

## 五、完成判定

当前视为已完成，后续阶段默认直接依赖本阶段结果，不再把它作为主计划目标重复拆解。
