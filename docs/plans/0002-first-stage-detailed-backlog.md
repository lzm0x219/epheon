# 第一阶段详细执行清单

## 一、定位

本文是 `0001-first-stage-task-breakdown.md` 的细化版。`0001` 负责阶段路线图，
本文负责把后续工作拆成可直接认领的实现任务。

当前阶段判断：

```txt
阶段 0 工程骨架已收口。
primitives 的 fixture、边界测试和 Interval/Maybe 暂缓决策已收口。
temporal 的标准样例和非法输入样例已扩展，UTC 与 provider 边界仍需补剩余测试。
conformance 与 benchmarks 目前只有占位目录，需要先补文档边界，再决定是否加入可执行任务。
```

每个任务应满足：

```txt
小范围变更
明确验收标准
明确验证命令
不跨越未决 RFC 边界
不引入核心运行时依赖
```

## 二、当前基线

已验证命令：

```bash
CI=true pnpm test
CI=true pnpm typecheck
CI=true pnpm build
```

当前公共包：

```txt
@epheon/primitives
@epheon/temporal
```

当前标准样例目录：

```txt
standards/primitives/angles.json
standards/primitives/durations.json
standards/temporal/julian-days.json
standards/temporal/time-scales.json
standards/temporal/utc-invalid-inputs.json
```

当前已明确暂缓：

```txt
Interval
Maybe
JulianDay.fromGregorian(...)
真实 leap second 数据
真实 Delta-T 数据
TDB
星历、节气、朔望、中国历法
```

## 三、任务状态总览

| 任务 | 状态   | 说明                                                                      |
| ---- | ------ | ------------------------------------------------------------------------- |
| D0.1 | 已完成 | 非交互命令与 CI 约定已记录。                                              |
| D0.2 | 已完成 | GitHub CI workflow 已存在。                                               |
| D0.3 | 已完成 | README、RFC 与错误码已对齐到当前 API。                                    |
| D1.1 | 已完成 | primitives fixture 已扩充角度与时长边界样例。                             |
| D1.2 | 已完成 | primitives 测试已覆盖 fixture、归一化、算术边界和错误码。                 |
| D1.3 | 已完成 | Interval 与 Maybe 第一阶段暂缓，当前不从公共入口导出。                    |
| D2.1 | 已完成 | temporal standards 已扩展日期、offset、小数秒、时间尺度与非法输入样例。   |
| D2.2 | 进行中 | 非法输入 fixture 已接入 parseUTC/fromUTC，fromFields 与 offset 边界待补。 |
| D2.3 | 已暂缓 | JulianDay 直接 Gregorian 构造 API 第一阶段不进入公共入口。                |
| D2.4 | 进行中 | provider 抛错和 NaN 已覆盖，Infinity 与 PrimitiveError 路径待补。         |
| D3.x | 待执行 | conformance、benchmarks、standards README 仍需骨架说明。                  |

## 四、阶段 1：`@epheon/primitives` 细化任务

### D1.1.1：扩充 Angle 换算标准样例

说明：`angles.json` 已扩充零值、负值、多圈、角分和角秒精度边界。

验收标准：

- `standards/primitives/angles.json` 增加 `0`、`360`、`-360`、`720`、`0.5`
  度或同等边界。
- 每个样例包含 `degrees`、`radians`、`turns`、`arcminutes` 和 `arcseconds`。
- 不把天文默认 tolerance 写入 primitives 标准数据。

验证：

```bash
CI=true pnpm test
CI=true pnpm format:check
```

可能触达文件：

```txt
standards/primitives/angles.json
packages/primitives/tests/angle.test.ts
```

依赖：无。

任务大小：S。

### D1.1.2：扩充 Angle 归一化标准样例

说明：Angle 归一化样例已覆盖周期边界与半开区间端点。

验收标准：

- 增加 `0`、`360`、`-360`、`540`、`-180`、`180` 等样例。
- 样例明确 `normalizeDegrees()` 的区间为 `[0, 360)`。
- 样例明确 `normalizeSignedDegrees()` 的区间为 `[-180, 180)`。

验证：

```bash
CI=true pnpm test
```

可能触达文件：

```txt
standards/primitives/angles.json
packages/primitives/tests/angle.test.ts
```

依赖：D1.1.1。

任务大小：S。

### D1.1.3：补测 Angle 的 radians 与 turns 归一化

说明：公共 API 的 `normalizeRadians()` 和 `normalizeTurns()` 已有显式测试。

验收标准：

- 测试覆盖 `normalizeRadians()`，并验证输出在 `[0, 2π)`。
- 测试覆盖 `normalizeTurns()`，并验证输出在 `[0, 1)`。
- 测试使用显式 tolerance。

验证：

```bash
CI=true pnpm test
```

可能触达文件：

```txt
packages/primitives/tests/angle.test.ts
packages/primitives/tests/helpers.ts
```

依赖：D1.1.2。

任务大小：XS。

### D1.2.1：扩充 Duration 标准样例

说明：`durations.json` 已扩充零值、负值、毫秒和小数日。

验收标准：

- 增加 `0` 秒、`1.5` 秒、`-86400` 秒、`0.5` 日等样例。
- 每个样例包含 `seconds`、`milliseconds`、`days`、`julianYears`、
  `julianCenturies`。
- 测试继续通过 `standards/primitives/durations.json` 驱动。

验证：

```bash
CI=true pnpm test
CI=true pnpm format:check
```

可能触达文件：

```txt
standards/primitives/durations.json
packages/primitives/tests/duration.test.ts
```

依赖：无。

任务大小：S。

### D1.2.2：补测 Angle 与 Duration 算术边界

说明：公共算术方法的主要边界行为已补测。

验收标准：

- Angle 覆盖 `subtract`、`multiply`、`divide`、`negate`、`abs`、`equals`。
- Duration 覆盖 `subtract`、`multiply`、`divide`、`negate`、`abs`、`equals`。
- `multiply(NaN)`、`divide(0)` 等错误路径断言 `PrimitiveError.code`。

验证：

```bash
CI=true pnpm test
```

可能触达文件：

```txt
packages/primitives/tests/angle.test.ts
packages/primitives/tests/duration.test.ts
```

依赖：D1.1.1、D1.2.1。

任务大小：M。

### D1.2.3：补测 Result 与 Tolerance 错误边界

说明：`Result` 和 `Tolerance` 是下游错误模型与数值比较的基础，应明确边界行为。

验收标准：

- `isOk` 与 `isErr` 的类型守卫行为有测试覆盖。
- `almostEqual` 覆盖 absolute、relative、absolute+relative 组合。
- `almostEqual` 对负 tolerance、`NaN`、`Infinity` 抛出 `PrimitiveError`。

验证：

```bash
CI=true pnpm test
```

可能触达文件：

```txt
packages/primitives/tests/result.test.ts
packages/primitives/tests/tolerance.test.ts
```

依赖：无。

任务大小：S。

### D1.3.1：关闭或推进 Interval 决策

说明：RFC 0004 将 Interval 标为第一阶段可选；当前已明确暂缓，公共入口不导出。

验收标准：

- 若暂缓，在 `docs/plans/0001-first-stage-task-breakdown.md` 标记任务 1.3 当前状态。
- 若推进，先更新 RFC 0004，明确 `Interval` 构造、错误码、边界语义和测试样例。
- 不在未更新 RFC 的情况下直接实现 `Interval`。

验证：

```bash
CI=true pnpm format:check
```

可能触达文件：

```txt
docs/rfcs/0004-primitives-api.md
docs/plans/0001-first-stage-task-breakdown.md
packages/primitives/README.md
```

依赖：D0.3。

任务大小：S。

### D1.3.2：关闭或推进 Maybe 决策

说明：RFC 0004 提到 Maybe 可暂缓；当前已明确第一阶段优先使用 `Result`。

验收标准：

- 若暂缓，文档说明第一阶段优先使用 `Result<T, E>` 表达可恢复错误。
- 若推进，RFC 0004 明确 `Maybe<T>` 是否只是 `T | null`，以及是否从入口导出。
- 不引入复杂 Option monad。

验证：

```bash
CI=true pnpm format:check
```

可能触达文件：

```txt
docs/rfcs/0004-primitives-api.md
packages/primitives/README.md
```

依赖：D1.3.1。

任务大小：XS。

### Checkpoint P：primitives 收口

完成 D1.1 至 D1.3 后运行：

```bash
CI=true pnpm lint
CI=true pnpm format:check
CI=true pnpm typecheck
CI=true pnpm test
CI=true pnpm build
```

通过后，`@epheon/primitives` 第一阶段可视为可冻结基线，除非后续 RFC 明确改变。

## 五、阶段 2：`@epheon/temporal` 细化任务

### D2.1.1：扩充 Julian Day 标准样例

说明：`julian-days.json` 已扩充 Gregorian 日期、offset 和小数秒输入。

验收标准：

- 增加至少一个正 offset 与一个负 offset 的等价 UTC 时刻。
- 增加至少一个小数秒输入。
- 增加至少一个 Gregorian 闰年日期样例。
- 每个新增样例记录来源或计算依据，至少在提交说明或 standards README 中说明。

验证：

```bash
CI=true pnpm test
CI=true pnpm format:check
```

可能触达文件：

```txt
standards/temporal/julian-days.json
packages/temporal/tests/instant.test.ts
```

依赖：无。

任务大小：S。

### D2.1.2：扩充时间尺度标准样例

说明：`time-scales.json` 已补充不同 TAI-UTC 与 Delta-T 值的样例，避免实现只对单一
数字组合正确。

验收标准：

- 至少增加一个 `taiMinusUtcSeconds` 不同于 `32` 的样例。
- 至少增加一个 `deltaTSeconds` 为小数的样例。
- 每个样例包含 `julianDay`、`ttMinusUtcSeconds`、`ut1MinusUtcSeconds` 和
  `julianEphemerisDay`。
- 测试继续使用显式 `DAY_TOLERANCE` 与 `SECOND_TOLERANCE`。

验证：

```bash
CI=true pnpm test
```

可能触达文件：

```txt
standards/temporal/time-scales.json
packages/temporal/tests/instant.test.ts
packages/temporal/tests/time-scale.test.ts
```

依赖：D2.1.1。

任务大小：S。

### D2.1.3：为非法 UTC 输入建立样例清单

说明：非法输入已建立标准化清单，并由 `Instant` 测试读取。

验收标准：

- 明确非法样例覆盖缺少 offset、缺少秒、非法日期、非法 offset、闰秒字段。
- 每个样例包含期望错误码 `InvalidUTCDateTime`。
- 不把异常消息作为稳定断言。

验证：

```bash
CI=true pnpm test
CI=true pnpm format:check
```

可能触达文件：

```txt
standards/temporal/utc-invalid-inputs.json
packages/temporal/tests/instant.test.ts
```

依赖：D2.1.1。

任务大小：S。

### D2.2.1：补齐 parseUTC 与 fromUTC 的错误路径

说明：`parseUTC` 返回 `Result`，`fromUTC` 抛出 `TemporalError`。两条路径都应对同一批
非法输入行为一致。

验收标准：

- 同一批非法输入分别覆盖 `Instant.parseUTC()` 与 `Instant.fromUTC()`。
- `parseUTC()` 断言 `result.ok === false` 与 `error.code`。
- `fromUTC()` 断言抛出 `TemporalError`，不依赖错误消息文本。

验证：

```bash
CI=true pnpm test
```

可能触达文件：

```txt
packages/temporal/tests/instant.test.ts
standards/temporal/utc-invalid-inputs.json
```

依赖：D2.1.3。

任务大小：S。

### D2.2.2：补齐 UtcDateTime.fromFields 边界

说明：当前字段测试覆盖非法日期、非有限数、非整数和负 clock 字段。还应覆盖月份、
日期、offset 上限和小数秒。

验收标准：

- 覆盖 `month` 小于 1、大于 12。
- 覆盖 `day` 为 0、超出当月天数。
- 覆盖 `offsetMinutes` 超出 `±23:59`。
- 明确 `second` 允许小数但必须满足 `[0, 60)`。

验证：

```bash
CI=true pnpm test
```

可能触达文件：

```txt
packages/temporal/tests/utc-date-time.test.ts
```

依赖：无。

任务大小：S。

### D2.2.3：补齐 UTC offset 解析边界

说明：`parseUTCDateTime` 支持 `Z` 与 `±HH:mm`。需要测试极端合法值与非法格式。

验收标准：

- 覆盖 `+00:00`、`-00:00`、`+14:00`、`-12:00` 或同等合法 offset。
- 覆盖 `+24:00`、`+00:60`、缺少冒号、缺少 offset 等非法格式。
- 验证 offset 等价时刻得到相同 Julian Day。

验证：

```bash
CI=true pnpm test
```

可能触达文件：

```txt
standards/temporal/julian-days.json
packages/temporal/tests/instant.test.ts
```

依赖：D2.1.1、D2.1.3。

任务大小：M。

### D2.3.1：关闭 JulianDay.fromGregorian 决策

说明：RFC 0003 当前将 Gregorian 与 JD 的公共互转 API 留到后续收敛；计划中已按暂缓
关闭。

验收标准：

- 若暂缓，`docs/plans/0001-first-stage-task-breakdown.md` 标记任务 2.3 当前状态。
- 若推进，先更新 RFC 0003，明确输入字段类型、offset 语义、返回类型和错误码。
- 不直接导出 `src/internal/gregorian`。

验证：

```bash
CI=true pnpm format:check
```

可能触达文件：

```txt
docs/rfcs/0003-temporal-model.md
docs/plans/0001-first-stage-task-breakdown.md
packages/temporal/README.md
```

依赖：D0.3。

任务大小：S。

### D2.4.1：补齐 leap second provider 非法值测试

说明：当前测试覆盖 provider 返回 `NaN` 与抛错。还应覆盖正负 Infinity，并确认固定
provider 不在创建时隐藏校验。

验收标准：

- 覆盖 `Number.POSITIVE_INFINITY` 与 `Number.NEGATIVE_INFINITY`。
- 错误统一为 `TemporalError`，错误码 `InvalidTimeScaleInput`。
- 不把 provider 内部错误类型泄漏为公共 API 行为。

验证：

```bash
CI=true pnpm test
```

可能触达文件：

```txt
packages/temporal/tests/instant.test.ts
packages/temporal/src/instant.ts
```

依赖：无。

任务大小：XS。

### D2.4.2：补齐 Delta-T provider 非法值测试

说明：Delta-T provider 返回 `Duration`。需要确认 provider 抛出 primitives 错误或其它
错误时，temporal 公共 API 收敛为 `TemporalError`。

验收标准：

- 覆盖 Delta-T provider 抛出 `PrimitiveError` 的路径。
- 覆盖 Delta-T provider 抛出普通 `Error` 的路径。
- 调用 `toUT1()` 时统一得到 `TemporalError`，错误码 `InvalidTimeScaleInput`。

验证：

```bash
CI=true pnpm test
```

可能触达文件：

```txt
packages/temporal/tests/instant.test.ts
```

依赖：D2.4.1。

任务大小：XS。

### D2.4.3：补齐 time-scale 内部纯函数测试

说明：`src/internal/time-scale.ts` 是时间尺度转换核心，应对非法输入和符号边界有窄测试。

验收标准：

- `taiMinusUtcToTTMinusUtc()` 覆盖 `NaN`、`Infinity`。
- `ttMinusUtcToUT1MinusUtc()` 覆盖 Delta-T 大于 TT-UTC 时的负 UT1-UTC。
- `utcJulianDayToJulianEphemerisDay()` 继续验证 JDE 计算 tolerance。

验证：

```bash
CI=true pnpm test
```

可能触达文件：

```txt
packages/temporal/tests/time-scale.test.ts
```

依赖：D2.1.2。

任务大小：S。

### Checkpoint T：temporal 收口

完成 D2.1 至 D2.4 后运行：

```bash
CI=true pnpm lint
CI=true pnpm format:check
CI=true pnpm typecheck
CI=true pnpm test
CI=true pnpm build
```

通过后，`@epheon/temporal` 第一阶段可以作为后续 provider、dataset 和 ephemeris RFC 的
时间基线。

## 六、阶段 3：验证体系细化任务

### D3.1.1：补 `standards/README.md`

说明：标准样例需要有维护规范，否则后续 conformance 很难判断数据来源与误差口径。

验收标准：

- 说明 `standards/primitives/` 与 `standards/temporal/` 的职责。
- 说明数值样例应记录来源、字段含义和 tolerance。
- 说明大型数据集进入未来 dataset package，不进入核心包。

验证：

```bash
CI=true pnpm format:check
```

可能触达文件：

```txt
standards/README.md
```

依赖：D1.1.1、D2.1.1。

任务大小：S。

### D3.1.2：补 `conformance/README.md`

说明：`conformance/` 当前只有占位文件。先写清楚它与包内单测的边界。

验收标准：

- 说明 conformance 只验证公共 API 与 standards 的一致性。
- 说明它不直接导入 `src/internal/*`。
- 说明未来如何扩展到第三方实现或多语言实现。

验证：

```bash
CI=true pnpm format:check
```

可能触达文件：

```txt
conformance/README.md
conformance/.gitkeep
```

依赖：D3.1.1。

任务大小：XS。

### D3.1.3：决策 conformance 是否纳入 workspace

说明：如果 conformance 只保留说明文档，不需要 workspace package；如果要可执行，则需要
单独设计脚本和依赖边界。

验收标准：

- 若暂不执行，只在 README 中列出未来任务，不修改 workspace。
- 若纳入执行，先明确 package 名称、脚本、输入 standards 和 CI 命令。
- 不让 conformance 反向成为核心包运行时依赖。

验证：

```bash
CI=true pnpm typecheck
```

可能触达文件：

```txt
conformance/README.md
pnpm-workspace.yaml
package.json
vitest.config.ts
```

依赖：D3.1.2。

任务大小：M。

### D3.2.1：补 `benchmarks/README.md`

说明：benchmark 先记录性能基线，不作为第一阶段优化入口。

验收标准：

- 说明首批 benchmark 范围：Angle、Duration、UTC 解析、JD 转换。
- 说明 benchmark 结果不作为正确性依据。
- 说明 benchmark 不进入默认 CI 阻塞链路，除非后续 RFC 决策。

验证：

```bash
CI=true pnpm format:check
```

可能触达文件：

```txt
benchmarks/README.md
benchmarks/.gitkeep
```

依赖：无。

任务大小：XS。

### D3.2.2：决策 benchmark 工具链

说明：当前依赖中没有专门 benchmark 工具。应先决定是否使用 Vitest bench、tinybench 或
保留纯文档。

验收标准：

- 若保留纯文档，写清楚暂缓原因。
- 若引入工具，必须走 pnpm catalog，不直接在子包写散版本。
- 不让 benchmark 工具进入核心包运行时依赖。

验证：

```bash
CI=true pnpm typecheck
CI=true pnpm format:check
```

可能触达文件：

```txt
pnpm-workspace.yaml
package.json
benchmarks/README.md
```

依赖：D3.2.1。

任务大小：M。

### D3.3.1：更新阶段计划状态

说明：D1、D2、D3 的任务完成后，需要回写 `0001`，让路线图保持当前状态。

验收标准：

- 已完成任务标记为已完成，并写明当前状态。
- 暂缓任务写明暂缓原因和重新开启条件。
- 推荐下一步指向尚未完成的最小任务。

验证：

```bash
CI=true pnpm format:check
```

可能触达文件：

```txt
docs/plans/0001-first-stage-task-breakdown.md
docs/plans/0002-first-stage-detailed-backlog.md
```

依赖：D1、D2、D3 已完成或明确暂缓。

任务大小：S。

## 七、阶段 4：第二阶段 RFC 预备任务

### D4.1.1：整理坐标模型 RFC 术语表

说明：写 RFC 0005 前，先整理术语，避免 reference、ephemerides、phenomena 的边界混乱。

验收标准：

- 列出 `Position`、`ReferenceFrame`、`Body`、`Coordinate`、`Distance`、
  `Precision` 的候选定义。
- 标出哪些属于 primitives，哪些属于未来 reference 或 ephemerides。
- 不在此任务中创建新 package。

验证：

```bash
CI=true pnpm format:check
```

可能触达文件：

```txt
docs/plans/0002-first-stage-detailed-backlog.md
docs/rfcs/0005-coordinate-reference-model.md
```

依赖：Checkpoint P、Checkpoint T。

任务大小：S。

### D4.1.2：起草 RFC 0005 坐标与参考系模型

说明：进入太阳黄经前，必须先定义坐标、参考系和单位边界。

验收标准：

- 新增 RFC 0005。
- 明确第一阶段是否只定义接口，不实现天体位置算法。
- 明确误差表达是否复用 `Tolerance`。

验证：

```bash
CI=true pnpm format:check
```

可能触达文件：

```txt
docs/rfcs/0005-coordinate-reference-model.md
```

依赖：D4.1.1。

任务大小：M。

### D4.2.1：起草 Ephemeris Provider RFC

说明：星历 provider 是未来 VSOP87、ELP2000、JPL 等实现的公共边界。

验收标准：

- 明确 provider 输入使用 `Instant`、`JulianEphemerisDay` 或其它时间表达。
- 明确输出坐标类型、覆盖范围、精度元数据和错误模型。
- 明确算法包与 dataset package 的分离方式。

验证：

```bash
CI=true pnpm format:check
```

可能触达文件：

```txt
docs/rfcs/0006-ephemeris-provider.md
```

依赖：D4.1.2。

任务大小：M。

### D4.3.1：起草 Phenomena RFC

说明：节气和朔望是事件求解问题，应先定义搜索策略、输入尺度和 tolerance。

验收标准：

- 明确二十四节气以太阳黄经为基础。
- 明确朔望以太阳月亮黄经差或等价天象条件为基础。
- 明确 Delta-T 如何影响 UT1、日期边界和验收样例。

验证：

```bash
CI=true pnpm format:check
```

可能触达文件：

```txt
docs/rfcs/0007-phenomena-events.md
```

依赖：D4.2.1。

任务大小：M。

## 八、推荐执行顺序

短期最小路径：

```txt
1. D2.2.2
2. D2.2.3
3. D2.4.1
4. D2.4.2
5. D2.4.3
6. Checkpoint T
```

随后补验证体系：

```txt
1. D3.1.1
2. D3.1.2
3. D3.1.3
4. D3.2.1
5. D3.2.2
6. D3.3.1
```

阶段 4 的 RFC 任务只应在 primitives、temporal 和验证体系都收口后开始。

## 九、并行建议

可以并行：

```txt
D2.2.2 与 D2.4.1
D3.1.2 与 D3.2.1
```

需要串行：

```txt
D2.4.1 -> D2.4.2
D4.1.2 -> D4.2.1 -> D4.3.1
```

需要人工决策：

```txt
D3.1.3 conformance 是否成为可执行 workspace
D3.2.2 benchmark 是否引入新工具链
```
