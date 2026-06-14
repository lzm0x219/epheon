# @epheon/temporal

Epheon 的时间模型包。提供时间点（Instant）、Julian Day、时间尺度转换等基础能力，是天文计算和历法转换的时基。

## 设计原则

- **内核不依赖 JavaScript `Date`**：所有时间计算基于纯函数和 provider 注入。
- **不隐式读取系统环境**：不读取系统时区、当前时间、文件系统或网络。
- **JD 与 JDE 明确区分**：Julian Day（UTC 尺度）与 Julian Ephemeris Day（TT 尺度）是不同的类型。
- **Provider 注入外部数据**：闰秒表、ΔT 数据通过 provider 函数注入，不写死在内核中。
- **双层 API**：`fromXxx()` 抛出 `TemporalError`，`parseXxx()` 返回 `Result<..., TemporalError>`。
- **只依赖 `@epheon/primitives`**：使用其 `Duration`、`Result`、`Tolerance` 等基础类型。

## 安装

```bash
pnpm add @epheon/temporal
```

## 导出清单

```ts
import {
  Instant,
  type InstantOptions,
  type TimePoint,
  JulianDay,
  JulianEphemerisDay,
  TemporalError,
  type TemporalErrorCode,
  type DeltaTProvider,
  type LeapSecondProvider,
  UtcDateTime,
  type UtcDateTimeFields,
  fixedDeltaT,
  fixedLeapSeconds
} from "@epheon/temporal";
```

## Instant（时间点）

`Instant` 表示一个不可变的物理时间点。第一阶段以显式 UTC offset 的字符串作为输入边界，内部缓存 UTC Julian Day，通过注入的 leap second provider 派生 TT 与 Julian Ephemeris Day。

### 输入约束

只接受带**显式 UTC offset** 的 ISO-like 字符串：

```
✅ 2000-01-01T12:00:00Z
✅ 2000-01-01T20:00:00+08:00
✅ 2000-01-01T04:00:00-08:00
✅ 2000-01-01T12:00:00.000Z
❌ 2000-01-01T12:00:00       // 无 offset，拒绝
❌ 2000-01-01                 // 无时、分、秒，拒绝
```

原因：隐式本地时区会导致历法结果不可复现。

### 构造

```ts
// 抛异常式（失败时抛出 TemporalError）
const instant = Instant.fromUTC("2000-01-01T12:00:00Z");

// Result 式（失败时返回 Err<TemporalError>）
const result = Instant.parseUTC("2000-01-01T12:00:00Z");
if (result.ok) {
  console.log(result.value.toJulianDay().toNumber()); // 2451545
}
```

### 注入 leap second provider

```ts
import { fixedLeapSeconds } from "@epheon/temporal";

const instant = Instant.fromUTC("2000-01-01T12:00:00Z", {
  leapSeconds: fixedLeapSeconds(32) // 固定 TAI-UTC = 32s
});
```

未提供 `leapSeconds` 时默认按 0 处理（适用于不需要高精度 TT 的场景）。

### 注入 Delta-T provider

```ts
import { Duration } from "@epheon/primitives";
import { fixedDeltaT, fixedLeapSeconds, Instant } from "@epheon/temporal";

const instant = Instant.fromUTC("2000-01-01T12:00:00Z", {
  leapSeconds: fixedLeapSeconds(32),
  deltaT: fixedDeltaT(Duration.fromSeconds(64))
});

instant.toUT1().offsetFromUtc.toSeconds(); // 32 + 32.184 - 64
```

`Delta-T = TT - UT1`，因此 `UT1-UTC = TT-UTC - Delta-T`。未提供 `deltaT` 时调用 `toUT1()` 会抛出 `TemporalError`，错误码为 `MissingDeltaTProvider`。

### 方法

| 方法                     | 返回                 | 说明                                            |
| ------------------------ | -------------------- | ----------------------------------------------- |
| `toJulianDay()`          | `JulianDay`          | UTC 尺度的 Julian Day                           |
| `toJulianEphemerisDay()` | `JulianEphemerisDay` | TT 尺度的 Julian Ephemeris Day                  |
| `toTT()`                 | `TimePoint`          | TT 时间尺度表达，含 `offsetFromUtc`（TT−UTC）   |
| `toUT1()`                | `TimePoint`          | UT1 时间尺度表达，含 `offsetFromUtc`（UT1−UTC） |
| `toUTCDateTime()`        | `UtcDateTime`        | 解析后的 UTC 输入边界值对象                     |
| `toUTCFields()`          | `UtcDateTimeFields`  | 解析后的 UTC 字段副本                           |

```ts
const instant = Instant.fromUTC("2000-01-01T12:00:00Z");

instant.toJulianDay().toNumber(); // 2451545
instant.toJulianEphemerisDay().toNumber(); // 2451545 + 闰秒偏移

const utcDateTime = instant.toUTCDateTime();
utcDateTime.year; // 2000
utcDateTime.offsetMinutes; // 0

const tp = instant.toTT();
tp.scale; // "TT"
tp.offsetFromUtc.toSeconds(); // TT−UTC 秒数
```

## UtcDateTime（UTC 输入边界）

`UtcDateTime` 是公开的不可变值对象，表示带显式 UTC offset 的输入边界。它不是时区对象，也不会读取系统本地时区。

```ts
const utcDateTime = UtcDateTime.fromFields({
  year: 2000,
  month: 1,
  day: 1,
  hour: 20,
  minute: 0,
  second: 0,
  offsetMinutes: 480
});

utcDateTime.toFields(); // 返回字段副本
```

内部解析器、Gregorian 校验和 JD 辅助函数仍保留在 `src/internal/`，不会从主入口导出。

## JulianDay（儒略日）

表示以 UTC 为尺度的连续日数。不可变值对象。

```ts
const jd = JulianDay.fromNumber(2451545);
jd.toNumber(); // 2451545

const result = JulianDay.parseNumber(2451545);

// 拒绝非有限数，错误码为 InvalidJulianDay
JulianDay.fromNumber(Number.NaN); // 抛出 TemporalError
```

## JulianEphemerisDay（历书儒略日）

表示以 TT 为尺度的连续日数。类型与 `JulianDay` 不同，**不可混用**。

```ts
const jde = JulianEphemerisDay.fromNumber(2451545.0003725);
jde.toNumber(); // 2451545.0003725...

const result = JulianEphemerisDay.parseNumber(2451545.0003725);
```

## Provider（可注入数据源）

### LeapSecondProvider

提供指定 UTC 时刻的 TAI−UTC 秒数。

```ts
type LeapSecondProvider = (input: UtcDateTime) => number;
```

**内置固定值工厂**：

```ts
import { fixedLeapSeconds } from "@epheon/temporal";

// 任意时刻都返回 37 秒
const provider = fixedLeapSeconds(37);
```

### DeltaTProvider

提供 TT−UT1 的时长（即 ΔT）。

```ts
import { Duration } from "@epheon/primitives";
type DeltaTProvider = (instant: Instant) => Duration;
```

**内置固定值工厂**：

```ts
import { fixedDeltaT } from "@epheon/temporal";

// 任意时刻都返回 67.5 秒的 ΔT
const provider = fixedDeltaT(Duration.fromSeconds(67.5));
```

## 时间尺度转换链

```
UTC 输入 ──→ Gregorian 校验 ──→ 本地 JD ──→ 减 offset ──→ UTC JD
                                                              │
                                                  ┌───────────┘
                                                  ▼
                                          + leapSeconds ──→ TAI
                                                              │
                                                  ┌───────────┘
                                                  ▼
                                          + 32.184s ──→ TT ──→ JDE
```

## TemporalError（结构化错误）

```ts
class TemporalError extends Error {
  readonly code:
    | "InvalidJulianDay"
    | "InvalidTimeScaleInput"
    | "InvalidUTCDateTime"
    | "MissingDeltaTProvider";
  readonly name: "TemporalError";
}
```

当前错误码：

| 错误码                  | 触发场景                                                                       |
| ----------------------- | ------------------------------------------------------------------------------ |
| `InvalidJulianDay`      | Julian Day 或 Julian Ephemeris Day 输入不是有限数                              |
| `InvalidTimeScaleInput` | 时间尺度 provider 返回或抛出无法用于计算的值                                   |
| `InvalidUTCDateTime`    | UTC 输入缺少 offset、日期格式非法、Gregorian 日期不存在（如 2 月 29 日非闰年） |
| `MissingDeltaTProvider` | 调用 `toUT1()` 但构造 `Instant` 时未注入 Delta-T provider                      |

抛异常式 API 会直接抛出 `TemporalError`；解析式 API 会将其放入 `Result` 的 `Err` 分支。

## 当前限制

第一阶段有意排除以下能力，将在后续版本中实现：

- TDB 等其他时间尺度
- 真实闰秒表（目前只支持固定值 provider）
- 真实 ΔT 历史数据表
- 时区数据库（如 IANA tzdata）
- 历史历法改革前后的区域民用日期
- `JulianDay` 直接从 Gregorian `(year, month, day)` 构造

如需这些能力，可以等待后续 RFC 或通过自定义 provider 扩展。

## 许可

MIT
