# Epheon 时间模型 RFC

## 一、目的

本文定义 `@epheon/temporal` 的第一阶段模型。

它回答：

```txt
Epheon 如何表示一个时间点？
如何处理 Julian Day？
如何区分 UTC、TAI、TT、UT1？
Delta-T 如何进入计算？
哪些能力属于 temporal，哪些不属于？
```

第一阶段目标不是实现完整天文学时间系统，而是建立一个足够稳定、可扩展、可验证的时间内核。

---

## 二、设计边界

`@epheon/temporal` 负责：

```txt
Instant
Julian Day
Julian Ephemeris Day
UTC 输入与输出边界
TAI / TT / UT1 的模型边界
Delta-T provider 接口
时间尺度转换
时间精度声明
```

`@epheon/temporal` 不负责：

```txt
时区数据库
本地化日期格式
农历日期
节气求解
朔望求解
JavaScript Date 适配
Temporal API 适配
Luxon / Day.js / date-fns 适配
```

外部日期库适配属于未来的 `@epheon/compat`。

---

## 三、核心原则

时间模型必须遵守：

```txt
内核不依赖 JavaScript Date。
内核不隐式读取系统时区。
内核不隐式读取当前时间。
内核不隐式加载闰秒或 Delta-T 数据。
所有精度和误差都必须显式表达。
所有时间尺度转换都必须说明数据来源。
```

这些约束是为了让历法结果可复现。

---

## 四、Instant

`Instant` 表示一个物理时间点。

它不是：

```txt
日历日期
本地时间
时区时间
JavaScript Date 包装
```

第一阶段建议内部表达为：

```txt
Julian Day in TT-compatible numeric form
```

但公共 API 不应承诺内部存储方式。

示例 API：

```ts
const instant = Instant.fromUTC("2026-02-04T08:00:00+08:00", {
  deltaT: deltaTProvider,
  leapSeconds: leapSecondProvider
});

const jd = instant.toJulianDay();
const jde = instant.toJulianEphemerisDay();
```

`Instant` 必须是不可变值对象。

`Instant` 的方法只负责从自身派生新的时间表达，不应隐藏读取 provider、系统时区、当前时间或全局配置。

时间尺度转换的核心逻辑应优先实现为纯函数，再由 `Instant` 方法作为易用封装调用。

---

## 五、Julian Day

Julian Day 是 `@epheon/temporal` 的基础能力之一。

第一阶段至少支持：

```txt
JD number
JDN integer
JD from Gregorian civil date
Gregorian civil date from JD
```

命名建议：

```ts
JulianDay;
JulianDayNumber;
JulianEphemerisDay;
```

其中：

```txt
JD 表示以日为单位的连续时间值。
JDN 表示 Julian Day Number，通常是整数日编号。
JDE 表示以 TT 为时间尺度的 Julian Ephemeris Day。
```

不要把 JD 与 JDE 混用。

---

## 六、UTC

UTC 是民用输入输出边界，不是天文公式的默认计算尺度。

第一阶段 UTC 输入应支持：

```txt
YYYY-MM-DDTHH:mm:ssZ
YYYY-MM-DDTHH:mm:ss.sssZ
YYYY-MM-DDTHH:mm:ss+08:00
YYYY-MM-DDTHH:mm:ss-05:00
```

不支持隐式本地时区。

也就是说，以下输入应被拒绝：

```txt
2026-02-04T08:00:00
```

因为它没有明确 offset。

---

## 七、TAI 与闰秒

TAI 是连续原子时。

UTC 与 TAI 的转换依赖闰秒数据。

`@epheon/temporal` 不应内置完整闰秒表，而应通过 provider 注入：

```ts
interface LeapSecondProvider {
  taiMinusUtc(instant: UtcInstantLike): number;
}
```

第一阶段可以提供一个固定 provider 用于测试：

```ts
const fixedLeapSeconds = LeapSecondProvider.fixed(37);
```

真实闰秒数据应进入未来的：

```txt
@epheon/dataset-leap-seconds
```

---

## 八、TT

TT 是许多天文公式的输入尺度。

关系：

```txt
TT = TAI + 32.184 seconds
```

第一阶段应支持：

```txt
UTC -> TAI -> TT
TT -> Julian Ephemeris Day
```

公共 API 应明确暴露时间尺度：

```ts
instant.toTT();
instant.toJulianEphemerisDay();
```

不要让用户通过普通 `toJulianDay()` 隐式得到 JDE。

---

## 九、UT1 与 Delta-T

Delta-T 定义为：

```txt
Delta-T = TT - UT1
```

中国历法中，Delta-T 对节气、朔望和日期边界具有关键影响。

`@epheon/temporal` 不应把 Delta-T 写死为某个公式。

应定义 provider：

```ts
interface DeltaTProvider {
  deltaT(instant: Instant): Duration;
}
```

Provider 可以来自：

```txt
固定测试值
历史表
多项式模型
外部数据包
用户自定义模型
```

第一阶段只需要接口、固定 provider、简单测试样例。

---

## 十、时间尺度转换

第一阶段支持的转换方向：

```txt
UTC -> TAI
TAI -> TT
UTC -> TT
TT -> JDE
UTC -> JD
```

暂缓：

```txt
TDB
完整 UT1 反算
高精度地球自转参数
时区数据库
历史历法改革前后的区域民用日期
```

这些能力在后续阶段通过独立 RFC 设计。

---

## 十一、日期解析

第一阶段只接受显式 offset 的 ISO-like 字符串。

解析规则：

```txt
必须包含年月日
必须包含时分秒
必须包含 Z 或 ±HH:mm offset
秒可以包含小数
不接受自然语言日期
不接受系统 locale
不接受隐式本地时区
```

错误输入应返回明确错误，而不是自动猜测。

---

## 十二、精度策略

时间值内部可以使用 JavaScript `number`。

第一阶段接受这一选择，因为：

```txt
实现简单
生态兼容
足够覆盖早期 JD 与历法测试
```

但公共 API 必须避免承诺无限精度。

测试中必须使用显式容忍度：

```ts
expectAlmostEqual(actual, expected, tolerance);
```

典型容忍度应按场景命名：

```txt
DAY_TOLERANCE
SECOND_TOLERANCE
MILLISECOND_TOLERANCE
```

不要在测试中直接散落魔法数字。

---

## 十三、错误模型

时间模型错误应可区分。

建议错误类型：

```txt
InvalidDateTimeString
MissingUtcOffset
UnsupportedTimeScale
MissingLeapSecondProvider
MissingDeltaTProvider
OutOfRangeDate
InvalidJulianDay
```

错误模型的具体承载方式由 `0004-primitives-api.md` 中的 `Result` 或异常策略统一决定。

---

## 十四、最小 API 草案

第一阶段 API 草案：

```ts
export class Instant {
  static fromUTC(input: string, options?: InstantOptions): Instant;
  static parseUTC(input: string, options?: InstantOptions): Result<Instant, TemporalError>;
  toJulianDay(): JulianDay;
  toJulianEphemerisDay(): JulianEphemerisDay;
  toTT(): TimePoint;
}

export class JulianDay {
  static fromNumber(value: number): JulianDay;
  toNumber(): number;
}

export class JulianEphemerisDay {
  static fromNumber(value: number): JulianEphemerisDay;
  toNumber(): number;
}

export type DeltaTProvider = (instant: Instant) => Duration;

export type LeapSecondProvider = (input: UtcInstantLike) => number;
```

这是设计草案，不是最终实现签名。

公共入口只应暴露稳定 API，例如：

```txt
Instant
JulianDay
JulianEphemerisDay
TemporalError
Provider 类型与固定 provider helper
```

以下内容属于内部实现，放入 `src/internal/`，不从主入口导出：

```txt
UTC 字符串解析器
Gregorian 日期校验
Gregorian -> JD 辅助函数
时间常量
内部数值校验
```

Provider 第一阶段优先使用函数类型。若后续需要暴露数据来源、覆盖时间范围、精度说明或版本信息，可以升级为轻量接口：

```ts
interface DeltaTProvider {
  deltaT(instant: Instant): Duration;
  coverage?: TimeInterval;
  source?: string;
}
```

实现前可以根据 `@epheon/primitives` 的错误模型、不可变值对象约定和 provider 元数据需求微调。

---

## 十五、验收标准

第一阶段完成时，`@epheon/temporal` 应证明：

```txt
可以解析显式 offset UTC 输入。
可以拒绝隐式本地时间输入。
可以计算已知 Gregorian date 的 JD。
可以区分 JD 与 JDE。
可以通过 provider 注入闰秒与 Delta-T。
可以通过 parseUTC 返回 Result，通过 fromUTC 抛出结构化 TemporalError。
可以在测试中声明误差容忍度。
不会读取系统时区、当前时间、文件系统或网络。
```

这些能力完成后，才能进入太阳位置、节气和朔望阶段。
