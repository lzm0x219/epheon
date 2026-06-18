# 第二阶段任务清单：参考系与太阳

对应计划：`docs/plans/0002-stage-2-reference-and-sun.md`

## 任务总览

| ID    | 状态   | 任务                                          | 主要输出                                   |
| ----- | ------ | --------------------------------------------- | ------------------------------------------ |
| S2-T1 | 已完成 | 定义坐标、参考系与位置值对象                  | `packages/reference/`、RFC 0005            |
| S2-T2 | 已完成 | 定义星历 provider 抽象协议                    | `packages/ephemerides/`、RFC 0006          |
| S2-T3 | 已完成 | 实现最小太阳位置与黄经 provider               | `packages/ephemerides-vsop87/`             |
| S2-T4 | 已完成 | 基于太阳黄经实现二十四节气求解                | `packages/phenomena/src/solar-terms.ts`    |
| S2-T5 | 已完成 | 建立第二阶段 solar / reference fixture 与测试 | `standards/reference/`、`standards/solar/` |

## S2-T1：定义坐标、参考系与位置值对象

状态：`已完成`

目标：

- 提供 `ReferenceFrame`、`Body`、`Origin`、`Distance`、`SphericalCoordinates` 与 `Position`。
- 把几何语义从数学原语里独立出来。

当前产出：

- `packages/reference/src/index.ts`
- `packages/reference/tests/reference.test.ts`

完成条件：

- 公共 API 可以稳定表达参考系、原点和球面坐标。
- 笛卡尔转换留在 internal，不进入主入口。

## S2-T2：定义星历 provider 抽象协议

状态：`已完成`

目标：

- 提供 `EphemerisProvider`、`EphemerisOptions`、`Precision` 与结构化错误。
- 让后续太阳、月亮实现共享同一抽象边界。

当前产出：

- `packages/ephemerides/src/index.ts`
- `packages/ephemerides/tests/ephemerides.test.ts`

完成条件：

- provider 默认 frame 与 precision 规则清晰。
- 实现包的错误可以收敛到统一错误模型。

## S2-T3：实现最小太阳位置与黄经 provider

状态：`已完成`

目标：

- 提供最小太阳地心黄经与位置计算。
- 支撑节气求解与后续历法链路。

当前产出：

- `packages/ephemerides-vsop87/src/index.ts`
- `packages/ephemerides-vsop87/tests/solar-provider.test.ts`

完成条件：

- 至少支持当前节气链路所需的 frame 与 precision。
- 不提前扩展为完整行星星历系统。

## S2-T4：基于太阳黄经实现二十四节气求解

状态：`已完成`

目标：

- 按黄经目标求一年 24 个节气。
- 输出稳定的事件时刻与目标黄经。

当前产出：

- `packages/phenomena/src/solar-terms.ts`
- `packages/phenomena/tests/solar-terms.test.ts`

完成条件：

- 2024、2025 bootstrap 节气样例能通过显式 tolerance 验证。
- 结果按时间顺序输出完整 24 项。

## S2-T5：建立第二阶段 solar / reference fixture 与测试

状态：`已完成`

目标：

- 为 reference 与 solar 能力建立最小可复核样例。
- 让第二阶段不只停留在实现代码层。

当前产出：

- `standards/reference/coordinates.json`
- `standards/reference/frames.json`
- `standards/solar/longitudes.json`
- `standards/solar/terms.json`

完成条件：

- 参考系预设、坐标转换与节气结果都能被 fixture 驱动验证。
