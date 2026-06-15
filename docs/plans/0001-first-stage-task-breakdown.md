# 第一阶段任务拆分

## 一、背景

本文根据当前 RFC、源码、测试与工程配置整理 Epheon 第一阶段后续任务。

更细的可执行 backlog 见：

```txt
docs/plans/0002-first-stage-detailed-backlog.md
```

当前代码已经具备：

```txt
@epheon/primitives
@epheon/temporal
standards/primitives/
standards/temporal/
pnpm + Moonrepo + tsdown + Vitest + Oxlint + Oxfmt + Changesets
```

当前验证结果：

```txt
CI=true pnpm test       通过，8 个测试文件、47 个测试
CI=true pnpm typecheck  通过
CI=true pnpm build      通过
```

第一阶段的重点不是立刻进入节气、朔望或中国历法，而是先把 primitives、
temporal、标准样例、验证体系和 CI 收口成稳定基线。

## 二、任务原则

后续任务按以下原则拆分：

```txt
先工程闭环，再扩展 API。
先标准样例，再实现或重构测试。
先 RFC 明确边界，再进入星历、天象和历法实现。
每个阶段完成后都必须保持 test、typecheck、build 可通过。
```

不在当前阶段展开：

```txt
VSOP87
ELP2000
JPL 星历
二十四节气
朔望
中国历法
CLI
Playground
```

## 三、阶段 0：收口第一阶段工程骨架

### 任务 0.1：统一非交互命令体验（已完成）

说明：当前 `pnpm test` 与 `pnpm typecheck` 在非 TTY 环境下可能触发 pnpm 清理
确认并失败，需要明确本地和 CI 的推荐运行方式。

验收标准：

- 文档说明本地非交互环境应使用 `CI=true pnpm test`、`CI=true pnpm typecheck`
  和 `CI=true pnpm build`。
- 若后续决定通过 pnpm 配置避免确认提示，必须同步更新 RFC 0002 与 README。
- 不引入 npm、Yarn 或 Bun lockfile。

验证：

```bash
CI=true pnpm test
CI=true pnpm typecheck
CI=true pnpm build
```

依赖：无。

当前状态：

- 根 README 已说明本地非交互环境和 CI 推荐使用 `CI=true pnpm test`、
  `CI=true pnpm typecheck` 与 `CI=true pnpm build`。
- RFC 0002 已同步记录非交互命令建议。
- 未引入 npm、Yarn 或 Bun lockfile。

### 任务 0.2：新增 GitHub CI（已完成）

说明：`.github/` 当前只有 Renovate 配置，还没有 workflow。第一阶段需要最小 CI
证明源码、测试、构建和格式检查都能在干净环境中运行。

验收标准：

- 新增 `.github/workflows/ci.yml`。
- CI 执行 `pnpm install --frozen-lockfile`。
- CI 至少执行 `pnpm lint`、`pnpm format:check`、`pnpm typecheck`、
  `pnpm test` 与 `pnpm build`。
- CI 设置 `CI=true`，避免 pnpm 在非交互环境触发确认提示。

验证：

```bash
CI=true pnpm lint
CI=true pnpm format:check
CI=true pnpm typecheck
CI=true pnpm test
CI=true pnpm build
```

依赖：任务 0.1。

当前状态：

- 已新增 `.github/workflows/ci.yml`。
- workflow 在 pull request 与 `main` 分支 push 时运行。
- workflow 设置 `CI=true`，使用 Node.js 24 与 Corepack 管理 pnpm。
- workflow 按 lockfile 安装依赖，并执行 lint、format check、typecheck、test 与 build。

### 任务 0.3：文档与公共 API 对齐审计（已完成）

说明：README、RFC 与源码中的导出清单、错误码、当前限制需要保持一致，避免后续
实现基于过期描述展开。

验收标准：

- 根 README、`packages/primitives/README.md`、`packages/temporal/README.md`
  与公共入口导出一致。
- RFC 0003 明确是否接受 `MissingLeapSecondProvider` 作为第一阶段正式错误码。
- README 中的当前状态、常用命令和阶段边界与代码一致。

验证：

```bash
CI=true pnpm test
CI=true pnpm typecheck
```

依赖：无。

当前状态：

- 根 README 已同步当前工程状态、公共 API 边界、常用命令和阶段限制。
- `packages/primitives/README.md` 已明确当前未导出 `Interval` 与 `Maybe`，后续由任务
  1.3 决策。
- `packages/temporal/README.md` 的错误码示例已包含 `MissingLeapSecondProvider`。
- RFC 0003 已明确 `MissingLeapSecondProvider` 是第一阶段正式错误码，并说明
  `toJulianDay()` 不依赖 leap second provider。

## 四、阶段 1：巩固 `@epheon/primitives`

### 任务 1.1：扩充 primitives 标准样例

说明：`standards/primitives/` 已存在角度和时长 fixture，后续应扩充成公共测试口径。

验收标准：

- `standards/primitives/angles.json` 覆盖角度单位换算、非负归一化、有符号归一化、
  负数和超过一圈的边界。
- `standards/primitives/durations.json` 覆盖秒、毫秒、固定日、儒略年和儒略世纪。
- 每个标准样例都包含明确 tolerance 或可由测试 helper 显式指定 tolerance。

验证：

```bash
CI=true pnpm test
```

依赖：无。

当前状态：

- `standards/primitives/angles.json` 已扩充零值、负值、多圈、半度和归一化端点样例。
- `standards/primitives/durations.json` 已扩充零值、毫秒、小数秒、负固定日和小数日样例。

### 任务 1.2：用 fixture 驱动 primitives 测试

说明：Angle 和 Duration 的稳定数值样例应优先来自 `standards/`，避免同类数值散落
在多个测试文件里。

验收标准：

- Angle 与 Duration 的主要换算测试读取 `standards/primitives/`。
- 测试默认从包入口 `../src` 导入。
- 只把局部错误边界和窄场景留作内联测试。

验证：

```bash
CI=true pnpm test
```

依赖：任务 1.1。

当前状态：

- Angle 与 Duration 换算测试继续从 `standards/primitives/` 读取。
- 已补测 `normalizeRadians()`、`normalizeTurns()`、公共算术边界和稳定错误码。
- Result 类型守卫与 Tolerance absolute/relative 错误边界已补测。

### 任务 1.3：决策 Interval 与 Maybe 是否进入第一阶段

说明：RFC 0004 将 Interval 与 Maybe 标记为可选能力。需要先决策，再决定是否实现。

验收标准：

- 若进入第一阶段，先在 RFC 0004 中补充更明确的 API、错误模型和测试要求。
- 若暂缓，在根 README 或 primitives README 中列入当前限制。
- 不因 Interval 或 Maybe 引入运行时第三方依赖。

验证：

```bash
CI=true pnpm typecheck
```

依赖：任务 0.3。

当前状态：

- 第一阶段暂缓 `Interval` 与 `Maybe`，公共入口不导出。
- 当前优先使用 `Result<T, E>` 表达可恢复错误。
- 若未来推进，需要先更新 RFC 0004 的 API、错误模型和测试要求。

## 五、阶段 2：巩固 `@epheon/temporal`

### 任务 2.1：扩充 temporal 标准样例

说明：`standards/temporal/` 当前已有 Julian Day 与时间尺度样例，需要扩展成后续
conformance 的基础。

验收标准：

- Julian Day 样例覆盖更多 Gregorian 日期、带正负 offset 的等价时刻和小数秒。
- 时间尺度样例覆盖 TT、JDE、UT1 offset 与 Delta-T。
- 非法输入样例记录在标准数据或测试说明中，至少覆盖缺少 offset、非法日期、
  非法秒值和非法 offset。

验证：

```bash
CI=true pnpm test
```

依赖：无。

当前状态：

- `standards/temporal/julian-days.json` 已扩充闰年日期、小数秒、正负 offset 等价时刻样例。
- `standards/temporal/time-scales.json` 已扩充不同 TAI-UTC 与小数 Delta-T 样例。
- 已新增 `standards/temporal/utc-invalid-inputs.json`，记录缺少 offset、缺少秒、非法日期、非法 offset 与闰秒字段样例。

### 任务 2.2：补齐 UTC 输入边界测试

说明：UTC 是 temporal 的公共输入边界，需要对显式 offset 和拒绝隐式本地时间保持
高覆盖。

验收标准：

- 覆盖 `Z`、`+08:00`、`-05:00`、小数秒和极端合法 offset。
- 覆盖隐式本地时间、非法 offset、非法 Gregorian 日期、非整数离散字段和闰秒字段。
- `UtcDateTime.toFields()` 的返回值仍保持调用方视角不可变。

验证：

```bash
CI=true pnpm test
```

依赖：任务 2.1。

当前状态：

- `Instant.parseUTC()` 与 `Instant.fromUTC()` 已读取 `standards/temporal/utc-invalid-inputs.json`
  校验同一批非法输入。
- 已覆盖 `UtcDateTime.toFields()` 和 `Instant.toUTCFields()` 的调用方不可变视角。
- `UtcDateTime.fromFields()` 已覆盖非法 Gregorian 日期、非有限数、非整数离散字段、
  负 clock 字段和第一阶段闰秒拒绝。
- 仍需补齐月份、日期、offset 上限和极端合法 offset 等边界。

### 任务 2.3：明确 JulianDay 直接构造 API

说明：RFC 0003 提到 Gregorian civil date 与 Julian Day 互转，但当前公共 API 主要通过
`Instant.fromUTC()` 间接获得 JD。需要决定是否在第一阶段增加公共构造方法。

验收标准：

- 若新增 `JulianDay.fromGregorian(...)` 或同类 API，先更新 RFC 0003 并明确字段模型、
  时间尺度和错误码。
- 若暂缓，在 temporal README 当前限制中保留说明。
- 不从主入口导出 `src/internal/gregorian`。

验证：

```bash
CI=true pnpm typecheck
CI=true pnpm test
```

依赖：任务 0.3。

当前状态：

- 第一阶段继续暂缓 `JulianDay.fromGregorian(...)` 或同类公共 API。
- `packages/temporal/README.md` 已把该能力列入当前限制。
- RFC 0003 仍将直接 Gregorian/JD 公共互转留到后续 API 收敛时再决策。
- `src/internal/gregorian` 未从主入口导出。

### 任务 2.4：加固 provider 错误边界

说明：闰秒和 Delta-T provider 是外部注入边界，必须稳定收敛错误，避免泄漏内部或
第三方异常。

验收标准：

- leap second provider 抛错、返回 `NaN`、`Infinity` 时收敛为 `TemporalError`。
- Delta-T provider 抛错、返回非法 `Duration` 来源时收敛为 `TemporalError`。
- 错误码与 README、RFC 0003 保持一致。

验证：

```bash
CI=true pnpm test
```

依赖：任务 0.3。

当前状态：

- leap second provider 返回 `NaN` 或抛错时已收敛为 `TemporalError`。
- Delta-T provider 抛出普通 `Error` 时已收敛为 `TemporalError`。
- 仍需补齐 leap second provider 正负 `Infinity` 和 Delta-T provider 抛出
  `PrimitiveError` 的测试。

## 六、阶段 3：建立验证体系骨架

### 任务 3.1：创建 `conformance/` 最小骨架

说明：conformance 用于证明公共 API 符合 standards，而不是替代包内单元测试。

验收标准：

- 创建 `conformance/` 目录和 README。
- 明确 conformance 与 package unit tests 的边界。
- 至少规划如何读取 `standards/primitives/` 与 `standards/temporal/`。

验证：

```bash
CI=true pnpm typecheck
```

依赖：任务 1.2、任务 2.2。

当前状态：

- `conformance/` 目前只有 `.gitkeep`，尚未补 README。

### 任务 3.2：创建 `benchmarks/` 最小骨架

说明：benchmark 先用于记录基线，不作为性能优化入口。

验收标准：

- 创建 `benchmarks/` 目录和 README。
- 首批基准只覆盖 Angle、Duration、JD 与 UTC 解析。
- 文档明确 benchmark 结果不作为正确性依据。

验证：

```bash
CI=true pnpm typecheck
```

依赖：任务 1.2、任务 2.2。

当前状态：

- `benchmarks/` 目前只有 `.gitkeep`，尚未补 README。

### 任务 3.3：建立标准数据维护规范

说明：标准样例需要记录来源、字段含义和 tolerance，才能支撑未来跨实现校验。

验收标准：

- 在 `standards/README.md` 中说明目录结构、样例来源、字段命名和新增流程。
- 说明数值样例必须配套显式误差容忍度。
- 说明大型数据集不进入核心 package。

验证：

```bash
CI=true pnpm format:check
```

依赖：任务 1.1、任务 2.1。

当前状态：

- `standards/README.md` 尚未创建。

## 七、阶段 4：进入第二阶段前的 RFC

### 任务 4.1：RFC 0005 坐标与参考系模型

说明：进入太阳、月亮或星历前，需要先定义位置表达、坐标单位和参考系边界。

验收标准：

- 新增 `docs/rfcs/0005-coordinate-reference-model.md` 或同等命名 RFC。
- 明确 `Position`、参考系、角度单位、距离单位和误差表达。
- 明确哪些能力属于 primitives、temporal、reference 或 ephemerides。

验证：

```bash
CI=true pnpm format:check
```

依赖：阶段 0 至阶段 3。

### 任务 4.2：RFC 0006 Ephemeris Provider 接口

说明：星历能力应先定义 provider 协议，再选择 VSOP87、ELP2000 或 JPL 等实现。

验收标准：

- 新增 ephemeris provider RFC。
- 明确 provider 输入时间尺度、输出坐标、覆盖范围、精度元数据和错误模型。
- 明确算法包与 dataset package 的分离方式。

验证：

```bash
CI=true pnpm format:check
```

依赖：任务 4.1。

### 任务 4.3：RFC 0007 天象事件求解

说明：节气和朔望依赖事件搜索与误差模型，不能直接写成单个历法函数。

验收标准：

- 新增 phenomena RFC。
- 明确节气、朔望、求根或搜索策略、输入时间尺度和验收 tolerance。
- 明确 Delta-T 对日期边界的影响如何进入计算。

验证：

```bash
CI=true pnpm format:check
```

依赖：任务 4.2。

## 八、阶段 5：后续实现顺序

阶段 4 的 RFC 接受后，再按以下顺序进入实现：

```txt
1. 实现轻量 @epheon/reference 或 spec 类型包。
2. 实现 leap second / Delta-T dataset provider 包。
3. 实现 ephemeris provider 抽象包。
4. 实现太阳黄经最小能力。
5. 实现二十四节气求解。
6. 实现月相与朔望求解。
7. 实现中国历法规则包。
```

这些任务不应绕过 RFC 直接落代码。只要涉及公共 API、包边界、标准数据或误差模型，
都应先更新或新增 RFC。

## 九、推荐下一步

当前阶段 0、阶段 1 和任务 2.1 已收口。下一步优先执行：

```txt
任务 2.2：补齐 UTC 输入边界测试中剩余的 fromFields 与 offset 边界
```

任务 2.2 完成后，再执行任务 2.4，补齐 provider 的剩余错误收敛测试。
