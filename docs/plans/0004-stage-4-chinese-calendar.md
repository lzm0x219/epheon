# Epheon 第四阶段计划：中国历法

本文对应 `docs/rfcs/0001-architecture.md` 的“第四阶段：中国历法”。本文只维护阶段目标、边界和完成判定；任务状态、当前代码产出与执行顺序统一维护在 `docs/tasks/0004-stage-4-chinese-calendar-tasks.md`。

## 一、阶段目标

实现：

```txt
@epheon/calendars
@epheon/calendar-chinese
```

目标：

```txt
农历日期
闰月
干支
```

## 二、执行入口

本阶段的任务状态、关联代码与验证闭环见：

```txt
docs/tasks/0004-stage-4-chinese-calendar-tasks.md
```

## 三、当前阶段的执行顺序

第四阶段是当前主路径，按下面顺序推进即可：

1. 先把 `@epheon/calendar-chinese` 收口成稳定 API。
2. 再补农历结果 fixture 与边界测试。
3. 只有真的出现第二种历法实现时，再决定是否抽 `@epheon/calendars`。

## 四、当前应实现的最小切片

优先实现：

1. 给定 UTC 输入或 UTC 年份，返回可复核的农历月表。
2. 在月表结果上补月份编号、闰月标记、月首月末边界。
3. 在现有月序基础上补“给定时刻求农历日期”的最小查询函数。
4. 先只支持一个明确规则集，例如 `modern`，不要提前设计历史规则框架。

## 五、当前明确暂缓

这一阶段当前不该抢跑的内容：

- `@epheon/calendars` 统一抽象层。
- `@epheon/calendar-gregorian`、`@epheon/calendar-julian`。
- 大而全的历史规则支持。
- 术数用途的上层解释能力。

## 六、完成判定

第四阶段完成的标准不是“包名对齐架构图”，而是下面这个用户可用结果：

```txt
给定 UTC 输入与明确时区，
Epheon 可以稳定地返回：
农历日期、
闰月信息、
以及可复核的农历月序。
```

干支能力可以在农历日期稳定后继续补，不必阻塞当前最小收口。
