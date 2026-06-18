# 第四阶段任务清单：中国历法

对应计划：`docs/plans/0004-stage-4-chinese-calendar.md`

## 任务总览

| ID    | 状态   | 任务                                | 主要输出                                 |
| ----- | ------ | ----------------------------------- | ---------------------------------------- |
| S4-T1 | 已完成 | 实现农历月段构建与最小闰月判定切片  | `packages/calendar-chinese/src/index.ts` |
| S4-T2 | 已完成 | 生成稳定的农历月表 API              | `packages/calendar-chinese/`             |
| S4-T3 | 已完成 | 提供给定时刻查询农历日期的最小 API  | `packages/calendar-chinese/`             |
| S4-T4 | 已完成 | 补月份编号、年界与日期映射规则      | `packages/calendar-chinese/`             |
| S4-T5 | 已完成 | 增补干支能力                        | `packages/calendar-chinese/`             |
| S4-T6 | 暂缓   | 抽象 `@epheon/calendars` 统一历法层 | 未来新 package                           |

## S4-T1：实现农历月段构建与最小闰月判定切片

状态：`已完成`

目标：

- 根据连续朔时刻切出农历月段。
- 把第一个无中气月段标记为闰月。

当前产出：

- `packages/calendar-chinese/src/index.ts`
- `packages/calendar-chinese/tests/lunar-months.test.ts`

完成条件：

- 连续朔时刻与中气输入可生成月段序列。
- 非递增输入会被拒绝。

## S4-T2：生成稳定的农历月表 API

状态：`已完成`

目标：

- 从“月段算法切片”提升到“可直接消费的农历月表”。
- 让调用方不用自己拼朔望与中气结果。

依赖：

- S2-T4
- S3-T3
- S4-T1

当前产出：

- `packages/calendar-chinese/src/index.ts`
- `packages/calendar-chinese/tests/lunar-months.test.ts`

完成条件：

- 给定 UTC 年份或查询窗口，可返回完整农历月表。
- 月表结果包含月份顺序、闰月标记与起止边界。

## S4-T3：提供给定时刻查询农历日期的最小 API

状态：`已完成`

目标：

- 对外提供“给定 UTC 时刻求农历日期”的稳定查询入口。

依赖：

- S4-T2

当前产出：

- `packages/calendar-chinese/src/index.ts`
- `packages/calendar-chinese/tests/lunar-months.test.ts`

完成条件：

- 返回值至少包含农历年、月、日与闰月标记。
- 年界与月界行为可被测试验证。

## S4-T4：补月份编号、年界与日期映射规则

状态：`已完成`

目标：

- 把当前月段结果补足为历法规则结果，而不只是区间数据。

依赖：

- S4-T2

当前产出：

- `packages/calendar-chinese/src/index.ts`
- `packages/calendar-chinese/tests/lunar-months.test.ts`

完成条件：

- 月份编号规则清晰。
- 闰月前后月序与年界映射有 fixture 支撑。

## S4-T5：增补干支能力

状态：`已完成`

目标：

- 在农历日期稳定后补纪年、纪月、纪日、纪时。

依赖：

- S4-T3
- S4-T4

当前产出：

- `packages/calendar-chinese/src/index.ts`
- `packages/calendar-chinese/tests/lunar-months.test.ts`
- `packages/calendar-chinese/README.md`

完成条件：

- 至少明确一个稳定规则集下的干支结果。
- 不把术数解释混入历法层。

当前结果：

- 提供 `ganzhiOf(...)`，返回纪年、纪月、纪日、纪时四柱。
- 当前固定使用一个最小 `modern` 规则切片：
  - 纪年按立春切换；
  - 纪月按十二节切换，立春起寅月；
  - 纪日按输入 offset 对应的本地民用日切换；
  - 纪时按本地时区的 23:00 子时起算。

## S4-T6：抽象 `@epheon/calendars` 统一历法层

状态：`暂缓`

目标：

- 只有在出现第二个真实历法实现后，再抽象统一历法接口。

进入条件：

- `@epheon/calendar-chinese` 已稳定对外。
- 确实存在第二种需要共享 API 的历法实现。
