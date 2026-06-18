# 第五阶段任务清单：验证体系

对应计划：`docs/plans/0005-stage-5-verification.md`

## 任务总览

| ID    | 状态   | 任务                             | 主要输出                                                 |
| ----- | ------ | -------------------------------- | -------------------------------------------------------- |
| S5-T1 | 已完成 | 维护跨阶段标准样例目录           | `standards/`                                             |
| S5-T2 | 已完成 | 为中国历法补 fixture             | `standards/calendar-chinese/` 或等价目录                 |
| S5-T3 | 待开始 | 建立可运行的 conformance 入口    | `conformance/`                                           |
| S5-T4 | 待开始 | 建立最小 benchmark 入口          | `benchmarks/`                                            |
| S5-T5 | 进行中 | 明确数据来源、误差与更新规则文档 | `standards/README.md`、后续 conformance / benchmark 文档 |

## S5-T1：维护跨阶段标准样例目录

状态：`已完成`

目标：

- 让 primitives、temporal、reference、solar 与 lunar 都有可复核样例。
- 让标准样例成为实现与测试之间的稳定桥梁。

当前产出：

- `standards/primitives/`
- `standards/temporal/`
- `standards/reference/`
- `standards/solar/`
- `standards/lunar/`
- `standards/calendar-chinese/`

完成条件：

- 中国历法样例补齐后，`standards/` 才算覆盖当前核心链路。

## S5-T2：为中国历法补 fixture

状态：`已完成`

目标：

- 把农历月序、闰月年和已知历日结果固化为样例。

依赖：

- S4-T2
- S4-T3

当前产出：

- `standards/calendar-chinese/lunar.json`
- `packages/calendar-chinese/tests/lunar-months.test.ts`
- `standards/README.md`

完成条件：

- 至少覆盖一个闰月年。
- 至少覆盖年界和月界样例。

当前结果：

- 固化了 2023 闰二月窗口样例。
- 固化了 2024 春节前后年界样例。
- 固化了 2023 闰二月切换前后月界历日样例。

## S5-T3：建立可运行的 conformance 入口

状态：`待开始`

目标：

- 让 `conformance/` 从 README 骨架变成可运行验证入口。

依赖：

- S5-T2

完成条件：

- 至少存在一条可以独立执行的跨实现或跨数据核对链路。
- 误差容忍度和数据来源在入口文档中明确。

## S5-T4：建立最小 benchmark 入口

状态：`待开始`

目标：

- 给节气、朔望或农历月表生成建立主路径性能基线。

依赖：

- S4-T2

完成条件：

- 至少存在一个可重复运行的基准用例。
- 不为早期 benchmark 引入复杂基础设施。

## S5-T5：明确数据来源、误差与更新规则文档

状态：`进行中`

目标：

- 让 fixture、conformance 与 benchmark 都有明确来源、误差和更新约定。

当前产出：

- `standards/README.md`
- dataset package 内的 dataset info 元信息

完成条件：

- 中国历法样例加入后，同步补全来源与 tolerance 说明。
- conformance 与 benchmark 文档沿用同一套约定。
