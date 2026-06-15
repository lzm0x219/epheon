# Epheon 第一阶段任务计划

第一阶段已完成。本文记录完成范围、验证结果和保留下来的架构决策，后续执行入口转到 `docs/plans/0002-second-stage-task-breakdown.md`。

## 一、完成范围

第一阶段完成了工程骨架、基础值类型、时间内核、标准样例和验证体系文档：

```txt
@epheon/primitives
@epheon/temporal
standards/
conformance/
benchmarks/
GitHub CI
```

公共 API 边界：

| 包                   | 公共 API                                                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `@epheon/primitives` | `Angle`、`Duration`、`Vector3`、`Result`、`Tolerance`、`PrimitiveError`                                                        |
| `@epheon/temporal`   | `Instant`、`JulianDay`、`JulianEphemerisDay`、`UtcDateTime`、`TimePoint`、provider 类型、固定 provider helper、`TemporalError` |

内部实现边界：

- `@epheon/primitives/src/internal/` 保留 `evaluatePolynomial`、`bisect`、`normalizeModulo` 等内部数学工具
- `@epheon/temporal/src/internal/` 保留 Gregorian 校验、UTC 解析、时间尺度转换和常量
- 两个包都不从公共入口导出 `src/internal/*`

## 二、标准样例

第一阶段标准样例放在 `standards/`，供包级测试和未来 conformance 使用：

```txt
standards/primitives/angles.json
standards/primitives/durations.json
standards/primitives/vectors.json
standards/temporal/julian-days.json
standards/temporal/time-scales.json
standards/temporal/utc-invalid-inputs.json
```

维护规范见 `standards/README.md`。大型天文数据仍进入未来的 dataset package，不进入 `standards/`。

## 三、验证结果

第一阶段收口时验证通过：

```bash
CI=true pnpm lint
CI=true pnpm format:check
CI=true pnpm typecheck
CI=true pnpm test
CI=true pnpm build
```

最近一次测试结果：

```txt
11 个测试文件
80 个测试用例
```

## 四、完成任务

### D0：工程骨架

- 根脚本覆盖 `build`、`test`、`typecheck`、`lint`、`format`、`format:check`
- pnpm workspace 范围为 `packages/*`
- TypeScript 使用 strict mode、ESM 和 `moduleResolution: "Bundler"`
- tsdown、Vitest、Moonrepo、Oxlint、Oxfmt、Lefthook、Changesets 已接入
- GitHub CI 执行安装、lint、format check、typecheck、test 和 build

### D1：`@epheon/primitives`

- `Angle` 覆盖五种单位、四种归一化、算术、严格比较和近似比较
- `Duration` 覆盖固定时间单位、算术、严格比较和近似比较
- `Vector3` 覆盖构造、加减、点积、叉积、模长、归一化和严格比较
- `Result`、`Tolerance`、`PrimitiveError` 形成第一阶段错误与数值比较基础
- `Interval` 和 `Maybe` 暂缓，未来推进前必须先更新 RFC 0004

### D2：`@epheon/temporal`

- `Instant.parseUTC()` 与 `Instant.fromUTC()` 覆盖显式 offset UTC 输入
- `UtcDateTime.fromFields()` 覆盖 Gregorian 校验、非整数拒绝和字段不可变视角
- UTC offset 支持 `Z`、`+00:00`、`-00:00`、`+14:00`、`-12:00`
- 非法 offset、缺少 offset、缺少秒、非法日期和闰秒字段均收敛为 `TemporalError`
- Leap second provider 与 Delta-T provider 的错误收敛到结构化错误码
- `JulianDay.fromGregorian(...)` 暂缓，Gregorian 辅助函数继续保留在 internal

### D3：验证体系文档

- `standards/README.md` 说明 fixture 维护规范、字段含义和数据来源要求
- `conformance/README.md` 说明 conformance 与包级单测的边界
- `benchmarks/README.md` 说明性能基线范围和暂不进入默认 CI 的原因

### D4：第二阶段桥接 RFC

- RFC 0005 定义坐标、参考系、天体枚举、距离单位和类型归属
- RFC 0006 定义星历 provider 接口、精度等级和错误模型

## 五、关键决策

第一阶段保留以下决策：

1. `Interval` 和 `Maybe` 暂缓。当前阶段使用 `Result<T, E>` 表达可恢复错误。
2. `JulianDay.fromGregorian(...)` 暂缓。UTC 输入仍是 Julian Day 公共构造的主要入口。
3. 真实 leap second 和 Delta-T 数据留到第二阶段 dataset package。
4. `Vector3` 属于 `@epheon/primitives`，因为它是纯数学类型，不携带参考系语义。
5. Polynomial 和 root finder 暂时只作为 primitives 内部工具，不进入公共入口。

## 六、下一步

第二阶段从 `docs/plans/0002-second-stage-task-breakdown.md` 开始。任何涉及公共 API、包边界、标准数据或精度策略的变更，先更新对应 RFC，再进入实现。
