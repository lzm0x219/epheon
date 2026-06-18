# 第一阶段任务清单：时间模型

对应计划：`docs/plans/0001-stage-1-time-model.md`

## 任务总览

| ID    | 状态   | 任务                                             | 主要输出                                                                                             |
| ----- | ------ | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| S1-T1 | 已完成 | 建立工程骨架与工作区工具链                       | 根 `package.json`、`pnpm-workspace.yaml`、`tsconfig.json`、Moonrepo、Vitest、Oxlint、Oxfmt、Lefthook |
| S1-T2 | 已完成 | 实现 `@epheon/primitives` 公共值对象             | `packages/primitives/`                                                                               |
| S1-T3 | 已完成 | 实现 `@epheon/temporal` 时间模型与 provider 边界 | `packages/temporal/`                                                                                 |
| S1-T4 | 已完成 | 建立第一阶段 fixture 与测试闭环                  | `standards/primitives/`、`standards/temporal/`、对应 tests                                           |

## S1-T1：建立工程骨架与工作区工具链

状态：`已完成`

目标：

- 建立 pnpm workspace 与 `packages/*` 目录约定。
- 接入 TypeScript strict mode、Vitest、Moonrepo、Oxlint、Oxfmt、Lefthook、Changesets。
- 让根命令能统一执行 build、typecheck、test、lint、format。

当前产出：

- 根级工作区与构建配置已经存在并被当前包复用。
- Moon build、tsdown 双格式输出与开发期 `exports` 规则已经接通。

完成条件：

- 根脚本能够驱动所有 package 的构建与测试。
- 第一阶段 package 不依赖额外运行时第三方库。

## S1-T2：实现 `@epheon/primitives` 公共值对象

状态：`已完成`

目标：

- 提供 `Angle`、`Duration`、`Vector3`、`Result`、`Tolerance` 与结构化错误。
- 保持不可变值对象与显式容差比较。

当前产出：

- `packages/primitives/src/index.ts`
- `packages/primitives/tests/*.test.ts`

完成条件：

- `fromXxx` / `parseXxx` 双层构造 API 到位。
- 非法数字、除零和无效 tolerance 都走结构化错误。

## S1-T3：实现 `@epheon/temporal` 时间模型与 provider 边界

状态：`已完成`

目标：

- 提供 `Instant`、`JulianDay`、`JulianEphemerisDay`、`UtcDateTime`。
- 提供 leap second / Delta-T provider 边界。
- 支持 UTC、TT、UT1 与 JDE 相关转换。

当前产出：

- `packages/temporal/src/index.ts`
- `packages/temporal/tests/*.test.ts`

完成条件：

- UTC 输入、JD / JDE 转换、provider 缺失与非法输入边界都有测试覆盖。
- 内部 Gregorian 校验与时间尺度纯函数不从公共入口泄漏。

## S1-T4：建立第一阶段 fixture 与测试闭环

状态：`已完成`

目标：

- 把第一阶段标准样例放进 `standards/`。
- 让 primitives 与 temporal 都通过仓库级测试聚合运行。

当前产出：

- `standards/primitives/angles.json`
- `standards/primitives/durations.json`
- `standards/primitives/vectors.json`
- `standards/temporal/julian-days.json`
- `standards/temporal/time-scales.json`
- `standards/temporal/utc-invalid-inputs.json`

完成条件：

- 第一阶段核心数值测试显式声明 tolerance。
- 包测试默认从公共入口验证 API。
