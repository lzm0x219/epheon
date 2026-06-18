# 第三阶段任务清单：月球与朔望

对应计划：`docs/plans/0003-stage-3-moon-and-syzygy.md`

## 任务总览

| ID    | 状态   | 任务                            | 主要输出                                                                |
| ----- | ------ | ------------------------------- | ----------------------------------------------------------------------- |
| S3-T1 | 已完成 | 提供 Delta-T 与闰秒数据包       | `packages/dataset-delta-t/`、`packages/dataset-leap-seconds/`、RFC 0008 |
| S3-T2 | 已完成 | 实现最小月亮位置与黄经 provider | `packages/ephemerides-elp2000/`                                         |
| S3-T3 | 已完成 | 实现朔望与月相求解              | `packages/phenomena/src/lunar-phases.ts`、RFC 0007                      |
| S3-T4 | 已完成 | 建立 lunar fixture 与测试闭环   | `standards/lunar/`、对应 tests                                          |

## S3-T1：提供 Delta-T 与闰秒数据包

状态：`已完成`

目标：

- 提供最小但可注入的 Delta-T 与 leap second provider。
- 避免把外部时间尺度数据写死进核心算法包。

当前产出：

- `packages/dataset-delta-t/src/index.ts`
- `packages/dataset-leap-seconds/src/index.ts`
- `packages/dataset-delta-t/tests/delta-t.test.ts`
- `packages/dataset-leap-seconds/tests/leap-seconds.test.ts`

完成条件：

- 数据覆盖范围、元信息和 provider 工厂已经明确。
- 超出覆盖范围时走结构化错误。

## S3-T2：实现最小月亮位置与黄经 provider

状态：`已完成`

目标：

- 提供当前历法链路够用的月亮地心黄经与位置能力。
- 让朔望求解不依赖未来的高精度实现。

当前产出：

- `packages/ephemerides-elp2000/src/index.ts`
- `packages/ephemerides-elp2000/tests/moon-provider.test.ts`

完成条件：

- 对 bootstrap 朔望样例能保持可接受误差。
- 不提前补完整 ELP2000 理论展开。

## S3-T3：实现朔望与月相求解

状态：`已完成`

目标：

- 基于日月黄经差求新月、满月与月相事件。
- 让第四阶段中国历法能够直接复用结果。

当前产出：

- `packages/phenomena/src/lunar-phases.ts`
- `packages/phenomena/tests/lunar-phases.test.ts`

完成条件：

- 已知新月与满月样例能在显式 tolerance 内通过。
- 搜索窗口与非法输入边界有测试覆盖。

## S3-T4：建立 lunar fixture 与测试闭环

状态：`已完成`

目标：

- 为月相与朔望能力补最小可复核样例。
- 让第三阶段有独立验证闭环。

当前产出：

- `standards/lunar/phases.json`
- 月亮 provider 与月相求解相关测试

完成条件：

- 至少能覆盖 bootstrap 新月 / 满月样例。
- fixture 可直接驱动 provider 与 phenomena 两层测试。
