# Epheon Benchmarks（性能基准测试）

## 定位

`benchmarks/` 用于记录 Epheon 各模块的性能基线。

benchmarks 只测量性能变化趋势，不作为正确性依据（正确性由 `standards/` + `conformance/` 保证）。

## 运行

```txt
pnpm bench
```

当前 runner 基于 `vitest bench`，执行：

- `benchmarks/primitives-temporal.bench.ts`（基础类型与时间模型）
- `benchmarks/calendar-chinese.bench.ts`（天象与历法）

## 当前基准范围

### 基础类型与时间模型

| 文件                           | 基准项    | 说明                            |
| ------------------------------ | --------- | ------------------------------- |
| `primitives-temporal.bench.ts` | Angle     | 构造/归一化/算术                |
|                                | Duration  | 构造与换算/算术                 |
|                                | Tolerance | almostEqual/对象构造            |
|                                | Instant   | fromUTC 构造/JD 转换/多时间尺度 |

### 天象与历法

| 文件                        | 基准项       | 说明                    |
| --------------------------- | ------------ | ----------------------- |
| `calendar-chinese.bench.ts` | 年度节气求解 | `solarTermsOfYear`      |
|                             | 年度朔望扫描 | 年内所有朔时刻扫描      |
|                             | 年度农历月表 | `lunarMonthTableOfYear` |

## 约定

- 性能测试数据不作为正确性依据（正确性由 `standards/` + `conformance/` 保证）
- 基准测试不进入默认 CI 阻塞链路（不会因为性能退化导致 CI 失败）
- 性能基线只用于指导优化决策，不用于发布质量门禁
- 当前使用 `vitest bench`，不引入额外 benchmark 工具链

## 数据来源与误差说明

benchmarks 本身只测量性能，不验证计算结果的正确性。基准中用到的计算组件的数据来源与 tolerance 约定，统一参见 [`standards/README.md`](../standards/README.md#数据来源)。

- 节气与朔望计算使用 VSOP87（太阳）与 ELP2000（月亮）历表
- Delta-T 使用内置 dataset（参见 `@epheon/dataset-delta-t`）
- 闰秒使用内置 IERS 阶跃表（参见 `@epheon/dataset-leap-seconds`）
- 基准结果受运行环境（CPU、Node 版本）影响，应保留运行环境信息以便复现
