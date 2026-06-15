# 第一阶段任务计划

## 一、定位

本文是 Epheon 第一阶段唯一任务计划，合并原阶段路线图与详细执行清单。后续只维护
这一份文档，避免路线图和 backlog 状态漂移。

第一阶段目标是把以下内容收口成稳定基线：

```txt
@epheon/primitives
@epheon/temporal
standards/
conformance/
benchmarks/
工程验证链路
```

当前不进入：

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

## 二、执行原则

```txt
先工程闭环，再扩展 API。
先标准样例，再实现或重构测试。
先 RFC 明确边界，再进入星历、天象和历法实现。
每个阶段完成后都必须保持 lint、format:check、typecheck、test、build 可通过。
```

小任务要求：

```txt
小范围变更
明确验收标准
明确验证命令
不跨越未决 RFC 边界
不引入核心运行时依赖
```

## 三、当前基线

当前公共包：

```txt
@epheon/primitives
@epheon/temporal
```

当前标准样例：

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

已验证命令：

```bash
CI=true pnpm test
CI=true pnpm typecheck
CI=true pnpm build
```

## 四、任务状态

| 任务 | 状态   | 说明                                                                    |
| ---- | ------ | ----------------------------------------------------------------------- |
| D0   | 已完成 | 工程骨架、非交互命令、GitHub CI、README/RFC/API 对齐已收口。            |
| D1   | 已完成 | primitives fixture、边界测试和 Interval/Maybe 暂缓决策已收口。          |
| D2.1 | 已完成 | temporal standards 已扩展日期、offset、小数秒、时间尺度与非法输入样例。 |
| D2.2 | 已完成 | parseUTC/fromUTC、fromFields 与 UTC offset 解析边界已补。               |
| D2.3 | 已暂缓 | JulianDay 直接 Gregorian 构造 API 第一阶段不进入公共入口。              |
| D2.4 | 已完成 | provider 错误收敛与 time-scale 窄测试已补。                             |
| D3   | 待执行 | standards、conformance、benchmarks README 骨架待补。                    |
| D4   | 待执行 | 第二阶段 RFC 预备任务，需等 Checkpoint T 与 D3 文档骨架完成。           |

## 五、已完成任务

### D0：工程骨架收口

当前状态：

- 根 README 已说明本地非交互环境和 CI 推荐使用 `CI=true pnpm test`、
  `CI=true pnpm typecheck` 与 `CI=true pnpm build`。
- `.github/workflows/ci.yml` 已存在，并执行 install、lint、format check、
  typecheck、test 与 build。
- README、RFC 0003、package README 与公共入口导出、错误码、当前限制已对齐。

### D1：`@epheon/primitives` 收口

当前状态：

- `standards/primitives/angles.json` 已覆盖零值、负值、多圈、半度和归一化端点样例。
- `standards/primitives/durations.json` 已覆盖零值、毫秒、小数秒、负固定日和小数日样例。
- Angle 与 Duration 换算测试从 `standards/primitives/` 读取。
- 已补测 `normalizeRadians()`、`normalizeTurns()`、公共算术边界和稳定错误码。
- Result 类型守卫与 Tolerance absolute/relative 错误边界已补测。
- 第一阶段暂缓 `Interval` 与 `Maybe`，公共入口不导出；未来推进前必须先更新 RFC 0004。

Checkpoint P 已通过后，`@epheon/primitives` 第一阶段可视为冻结基线，除非后续 RFC 明确改变。

### D2.1：temporal 标准样例收口

当前状态：

- `standards/temporal/julian-days.json` 已扩充闰年日期、小数秒、正负 offset 等价时刻样例。
- `standards/temporal/time-scales.json` 已扩充不同 TAI-UTC 与小数 Delta-T 样例。
- `standards/temporal/utc-invalid-inputs.json` 已记录缺少 offset、缺少秒、非法日期、
  非法 offset 与闰秒字段样例。

### D2.2：UTC 输入边界收口

当前状态：

- `Instant.parseUTC()` 与 `Instant.fromUTC()` 已从标准样例读取合法和非法 UTC 输入。
- `UtcDateTime.fromFields()` 已覆盖字段不可变、非法 Gregorian 日期、非有限数值、非整数民用字段、
  负时分秒、闰秒暂缓和 offset 边界。
- UTC offset 已覆盖 `Z`、`+00:00`、`-00:00`、`+14:00`、`-12:00` 与等价 Julian Day。
- 非法 offset 已覆盖 `+24:00`、`+00:60`、缺少冒号和缺少 offset。

### D2.3：JulianDay 直接 Gregorian 构造暂缓

当前状态：

- 第一阶段继续暂缓 `JulianDay.fromGregorian(...)` 或同类公共 API。
- `packages/temporal/README.md` 已把该能力列入当前限制。
- RFC 0003 仍将直接 Gregorian/JD 公共互转留到后续 API 收敛时再决策。
- `src/internal/gregorian` 未从主入口导出。

重新开启条件：

- 先更新 RFC 0003，明确输入字段类型、offset 语义、返回类型和错误码。
- 仍不得直接导出 `src/internal/gregorian`。

### D2.4：时间尺度 provider 与内部纯函数收口

当前状态：

- Leap second provider 返回 `NaN`、正负 `Infinity` 或抛错时，已统一收敛为
  `TemporalError`，错误码为 `InvalidTimeScaleInput`。
- Delta-T provider 抛出 `PrimitiveError` 或普通 `Error` 时，`toUT1()` 已统一收敛为
  `TemporalError`，错误码为 `InvalidTimeScaleInput`。
- `taiMinusUtcToTTMinusUtc()` 已覆盖非有限 TAI-UTC 秒数。
- `ttMinusUtcToUT1MinusUtc()` 已覆盖 Delta-T 大于 TT-UTC 时的负 `UT1-UTC`。
- `utcJulianDayToJulianEphemerisDay()` 继续基于 standards 验证 JDE 计算 tolerance。

## 六、剩余可执行任务

### Checkpoint T：temporal 收口

下一步运行：

```bash
CI=true pnpm lint
CI=true pnpm format:check
CI=true pnpm typecheck
CI=true pnpm test
CI=true pnpm build
```

通过后，`@epheon/temporal` 第一阶段可以作为后续 provider、dataset 和 ephemeris RFC 的
时间基线。

### D3.1：补 `standards/README.md`

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

依赖：D1、D2.1。

任务大小：S。

### D3.2：补 `conformance/README.md`

说明：`conformance/` 当前只有占位文件。先写清楚它与包内单测的边界。

验收标准：

- 说明 conformance 只验证公共 API 与 standards 的一致性。
- 说明它不直接导入 `src/internal/*`。
- 说明未来如何扩展到第三方实现或多语言实现。
- 第一阶段不纳入 workspace，等出现可执行 conformance runner 再决策。

验证：

```bash
CI=true pnpm format:check
```

可能触达文件：

```txt
conformance/README.md
```

依赖：D3.1。

任务大小：XS。

### D3.3：补 `benchmarks/README.md`

说明：benchmark 先记录性能基线，不作为第一阶段优化入口。

验收标准：

- 说明首批 benchmark 范围：Angle、Duration、UTC 解析、JD 转换。
- 说明 benchmark 结果不作为正确性依据。
- 说明 benchmark 不进入默认 CI 阻塞链路。
- 第一阶段不引入 benchmark 工具链，等性能基线要可执行时再走 catalog 决策。

验证：

```bash
CI=true pnpm format:check
```

可能触达文件：

```txt
benchmarks/README.md
```

依赖：无。

任务大小：XS。

## 七、第二阶段 RFC 预备任务

阶段 4 的 RFC 任务只应在 primitives、temporal 和验证体系文档骨架都收口后开始。

### D4.1：起草 RFC 0005 坐标与参考系模型

说明：进入太阳黄经前，必须先定义坐标、参考系和单位边界。术语表直接写入 RFC 草稿，
不单独维护中间文档。

验收标准：

- 新增 `docs/rfcs/0005-coordinate-reference-model.md`。
- 列出 `Position`、`ReferenceFrame`、`Body`、`Coordinate`、`Distance`、
  `Precision` 的候选定义。
- 标出哪些属于 primitives，哪些属于未来 reference 或 ephemerides。
- 明确第一阶段是否只定义接口，不实现天体位置算法。
- 明确误差表达是否复用 `Tolerance`。
- 不在此任务中创建新 package。

验证：

```bash
CI=true pnpm format:check
```

依赖：Checkpoint T、D3。

任务大小：M。

### D4.2：起草 RFC 0006 Ephemeris Provider 接口

说明：星历 provider 是未来 VSOP87、ELP2000、JPL 等实现的公共边界。

验收标准：

- 新增 `docs/rfcs/0006-ephemeris-provider.md`。
- 明确 provider 输入使用 `Instant`、`JulianEphemerisDay` 或其它时间表达。
- 明确输出坐标类型、覆盖范围、精度元数据和错误模型。
- 明确算法包与 dataset package 的分离方式。

验证：

```bash
CI=true pnpm format:check
```

依赖：D4.1。

任务大小：M。

### D4.3：起草 RFC 0007 天象事件求解

说明：节气和朔望是事件求解问题，应先定义搜索策略、输入尺度和 tolerance。

验收标准：

- 新增 `docs/rfcs/0007-phenomena-events.md`。
- 明确二十四节气以太阳黄经为基础。
- 明确朔望以太阳月亮黄经差或等价天象条件为基础。
- 明确 Delta-T 如何影响 UT1、日期边界和验收样例。

验证：

```bash
CI=true pnpm format:check
```

依赖：D4.2。

任务大小：M。

## 八、推荐执行顺序

短期最小路径：

```txt
1. Checkpoint T
```

随后补验证体系文档：

```txt
1. D3.1
2. D3.2 与 D3.3 可并行
```

之后再进入第二阶段 RFC：

```txt
1. D4.1
2. D4.2
3. D4.3
```

## 九、后续实现顺序

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
