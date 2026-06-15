# Epheon Benchmarks（性能基准测试）

## 定位

`benchmarks/` 用于记录 Epheon 各模块的性能基线。

## 首批基准测试范围（规划中）

- Angle 构造、单位转换、归一化
- Duration 构造、单位转换、算术
- UTC 字符串解析
- Instant 构造与派生
- Julian Day / JDE 转换

## 约定

- 性能测试数据不作为正确性依据（正确性由 `standards/` + `conformance/` 保证）
- 基准测试不进入默认 CI 阻塞链路（不会因为性能退化导致 CI 失败）
- 性能基线只用于指导优化决策，不用于发布质量门禁

## 当前状态

第一阶段暂不引入 benchmark 工具链。后续需要选择工具（vitest bench、tinybench、mitata 等）时，通过 pnpm catalog 统一决策。

当前 `benchmarks/` 保留为目录占位，为后续性能基线预留空间。
