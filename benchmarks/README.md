# Epheon Benchmarks（性能基准测试）

## 定位

`benchmarks/` 用于记录 Epheon 各模块的性能基线。

benchmarks 只测量性能变化趋势，不作为正确性依据（正确性由 `standards/` + `conformance/` 保证）。

## 运行

```txt
pnpm bench
```

当前 runner 基于 `vitest bench`，执行 `benchmarks/calendar-chinese.bench.ts`。

## 当前基准范围

| 基准项       | 说明                    |
| ------------ | ----------------------- |
| 年度节气求解 | `solarTermsOfYear`      |
| 年度朔望扫描 | 年内所有朔时刻扫描      |
| 年度农历月表 | `lunarMonthTableOfYear` |

每个基准项覆盖 2023 / 2024 / 2025 三个年份，用于观察典型计算负载。

## 约定

- 性能测试数据不作为正确性依据（正确性由 `standards/` + `conformance/` 保证）
- 基准测试不进入默认 CI 阻塞链路（不会因为性能退化导致 CI 失败）
- 性能基线只用于指导优化决策，不用于发布质量门禁
- 当前使用 `vitest bench`，不引入额外 benchmark 工具链

## 数据来源与误差说明

- 节气与朔望计算使用 VSOP87（太阳）与 ELP2000（月亮）历表
- Delta-T 使用内置 dataset
- 基准结果受运行环境（CPU、Node 版本）影响，应保留运行环境信息以便复现
