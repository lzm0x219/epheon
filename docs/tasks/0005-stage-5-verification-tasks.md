# 第五阶段任务清单：验证体系

对应计划：`docs/plans/0005-stage-5-verification.md`

## 任务总览

| ID    | 状态   | 任务                             | 主要输出                                                 |
| ----- | ------ | -------------------------------- | -------------------------------------------------------- |
| S5-T1 | 已完成 | 维护跨阶段标准样例目录           | `standards/`                                             |
| S5-T2 | 已完成 | 为中国历法补 fixture             | `standards/calendar-chinese/` 或等价目录                 |
| S5-T3 | 已完成 | 建立可运行的 conformance 入口    | `conformance/`                                           |
| S5-T4 | 已完成 | 建立最小 benchmark 入口          | `benchmarks/`                                            |
| S5-T5 | 已完成 | 明确数据来源、误差与更新规则文档 | `standards/README.md`、后续 conformance / benchmark 文档 |

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

状态：`已完成`

目标：

- 让 `conformance/` 从 README 骨架变成可运行验证入口。

依赖：

- S5-T2

当前产出：

- `conformance/calendar-chinese.test.ts`
- `conformance/vitest.config.ts`
- `conformance/README.md`
- 根 `package.json` 中的 `pnpm conformance` 入口

完成条件：

- 至少存在一条可以独立执行的跨实现或跨数据核对链路。
- 误差容忍度和数据来源在入口文档中明确。

当前结果：

- 提供 `pnpm conformance`，可独立执行中国历法 fixture 核对。
- 当前入口对照 `standards/calendar-chinese/lunar.json` 校验农历月表与农历日期结果。
- 入口文档已明确当前使用精确相等校验，以及样例 `basis` 为数据来源说明。

## S5-T4：建立最小 benchmark 入口

状态：`已完成`

目标：

- 给节气、朔望或农历月表生成建立主路径性能基线。

依赖：

- S4-T2

当前产出：

- `benchmarks/calendar-chinese.bench.ts`
- `benchmarks/vitest.config.ts`
- `benchmarks/README.md`
- 根 `package.json` 中的 `pnpm bench` 入口

完成条件：

- 至少存在一个可重复运行的基准用例。
- 不为早期 benchmark 引入复杂基础设施。

当前结果：

- 提供 `pnpm bench`，可独立运行性能基准。
- 当前覆盖三个主路径：年度节气求解、年度朔望扫描、年度农历月表。
- 每个路径覆盖 2023 / 2024 / 2025 三个典型年份。
- 使用 `vitest bench`，无需额外工具链。

## S5-T5：明确数据来源、误差与更新规则文档

状态：`已完成`

目标：

- 让 fixture、conformance 与 benchmark 都有明确来源、误差和更新约定。

当前产出：

- `standards/README.md`（数据来源与 tolerance 章节按三类领域补全）
- `conformance/README.md`（补全数据来源链路与交叉引用）
- `benchmarks/README.md`（补全交叉引用与数据集说明）
- dataset package 内的 dataset info 元信息（`@epheon/dataset-delta-t`、`@epheon/dataset-leap-seconds`）

完成条件：

- 中国历法样例加入后，同步补全来源与 tolerance 说明。
- conformance 与 benchmark 文档沿用同一套约定。

当前结果：

- `standards/README.md` 将 fixture 按三类领域（转换类/天象类/中国历法类）分别声明数据来源、参考依据与验证方式。
- 中国历法样例明确为合成样例（VSOP87 + ELP2000 + ΔT + 闰秒），离散字段精确相等，底层天象精度由 JPL Horizons 校准。
- conformance 与 benchmark 文档均通过交叉引用统一指向 `standards/README.md#数据来源`，形成单一事实来源。
