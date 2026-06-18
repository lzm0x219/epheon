# Epheon 基础类型 API RFC

## 一、目的

本文定义 `@epheon/primitives` 的第一阶段 API 边界。

`@epheon/primitives` 是 Epheon 的最底层包。它只提供数学、单位、误差和结果表达能力，不包含任何天文或历法语义。

## 二、设计边界

`@epheon/primitives` 可以包含：

```txt
Angle
Duration
Interval
Precision
Tolerance
Result
Maybe
Epsilon comparison helpers
```

第一阶段暂不包含：

```txt
Vector2
Vector3         ← 已于 2026-06 提前实现并从公共入口导出，primitive README 已同步更新。
Matrix3
Matrix4
Polynomial
Root finder
Coordinate frame
Julian Day
Instant
Calendar date
Solar term
New moon
```

这些能力属于后续阶段或更高层 package。

## 三、核心原则

基础类型必须遵守：

```txt
不依赖运行时第三方包。
不依赖 @epheon/temporal。
不包含天文术语。
不包含历法术语。
值对象默认不可变。
单位必须显式。
浮点比较必须显式声明 tolerance。
公共 API 必须有中文 TSDoc 注释。
公共函数和方法必须包含 @param 与 @returns。
可能抛错的公共函数和方法必须包含 @throws。
```

`@epheon/primitives` 是下游所有包的共同语言。它应该小、稳定、可预测。

## 四、Angle

`Angle` 表示角度。

第一阶段支持单位：

```txt
degree
radian
turn
arcminute
arcsecond
```

建议 API：

```ts
const angle = Angle.fromDegrees(370);

angle.toDegrees(); // 370
angle.normalizeDegrees().toDegrees(); // 10
angle.toRadians();
```

构造方法：

```ts
Angle.fromDegrees(value: number): Angle
Angle.fromRadians(value: number): Angle
Angle.fromTurns(value: number): Angle
Angle.fromArcminutes(value: number): Angle
Angle.fromArcseconds(value: number): Angle
```

输出方法：

```ts
toDegrees(): number
toRadians(): number
toTurns(): number
toArcminutes(): number
toArcseconds(): number
```

归一化方法：

```ts
normalizeTurns(): Angle
normalizeDegrees(): Angle
normalizeRadians(): Angle
normalizeSignedDegrees(): Angle
```

建议语义：

```txt
normalizeDegrees: [0, 360)
normalizeRadians: [0, 2π)
normalizeSignedDegrees: [-180, 180)
```

不要在构造时自动归一化。

原因是原始角度可能有语义，例如累计转角或差值。

## 五、Duration

`Duration` 表示时间长度。

它不是日历日期差。

第一阶段支持：

```txt
seconds
milliseconds
days
Julian years
Julian centuries
```

建议 API：

```ts
Duration.fromSeconds(value: number): Duration
Duration.fromMilliseconds(value: number): Duration
Duration.fromDays(value: number): Duration

duration.toSeconds(): number
duration.toMilliseconds(): number
duration.toDays(): number
duration.toJulianYears(): number
duration.toJulianCenturies(): number
```

约定：

```txt
1 day = 86400 seconds
1 Julian year = 365.25 days
1 Julian century = 36525 days
```

`Duration` 不处理：

```txt
月份
年份
时区
夏令时
闰秒插入日的民用日期表现
```

这些不是固定长度单位。

## 六、Interval

`Interval` 表示一维数值区间。

第一阶段暂缓实现。若未来实现，应保持通用：

```ts
Interval.closed(min, max);
Interval.open(min, max);
Interval.closedOpen(min, max);
Interval.openClosed(min, max);
```

基础能力：

```txt
contains
intersects
clamp
length
```

`Interval` 不应知道时间、角度或历法。

## 七、Precision 与 Tolerance

数值计算必须显式表达误差容忍度。

建议提供：

```ts
type Tolerance = {
  readonly absolute: number;
  readonly relative?: number;
};
```

辅助函数：

```ts
almostEqual(a: number, b: number, tolerance: Tolerance): boolean
```

常用 tolerance 应由调用方或测试工具定义，不应在 primitives 中塞入天文默认值。

例如，`@epheon/temporal` 可以定义：

```txt
SECOND_TOLERANCE
MILLISECOND_TOLERANCE
DAY_TOLERANCE
```

但 `@epheon/primitives` 不应该知道这些命名。

## 八、Result

Epheon 需要明确错误表达方式。

第一阶段建议提供轻量 `Result`：

```ts
type Result<T, E> = Ok<T> | Err<E>;

type Ok<T> = {
  readonly ok: true;
  readonly value: T;
};

type Err<E> = {
  readonly ok: false;
  readonly error: E;
};
```

辅助函数：

```ts
ok<T>(value: T): Result<T, never>
err<E>(error: E): Result<never, E>
isOk<T, E>(result: Result<T, E>): result is Ok<T>
isErr<T, E>(result: Result<T, E>): result is Err<E>
```

公共 API 可以分为两层：

```txt
parseXxx -> Result
fromXxx -> throw on invalid input
```

这样既保留函数式错误处理，也允许简洁构造。

具体命名可在实现时验证。

## 九、Maybe

`Maybe` 第一阶段暂缓，当前优先使用 `Result<T, E>` 表达可恢复错误。

如果需要，建议定义为：

```ts
type Maybe<T> = T | null;
```

不要引入复杂 Option monad。

Epheon 的错误多半需要携带原因，因此 `Result` 比 `Maybe` 更重要。

## 十、不可变值对象

基础类型应设计为不可变。

要求：

```txt
内部字段 readonly
不提供 mutating 方法
转换方法返回 number
运算方法返回新对象
```

示例：

```ts
const a = Angle.fromDegrees(10);
const b = a.add(Angle.fromDegrees(20));
```

`a` 不应被修改。

`@epheon/primitives` 采用轻量值对象 OOP，而不是继承式 OOP。

推荐：

```txt
class Angle
class Duration
static constructors
readonly internal state
methods return new values
```

避免：

```txt
deep inheritance
abstract base class hierarchy
mutable service object
hidden global defaults
```

基础算法和比较逻辑应保持纯函数。例如：

```ts
almostEqual(a, b, tolerance);
```

不要把算法实现藏在带有隐式状态的对象里。

## 十一、数值有效性

构造基础值对象时应拒绝：

```txt
NaN
Infinity
-Infinity
```

错误类型建议：

```txt
InvalidNumber
InvalidTolerance
InvalidInterval
```

对于高频内部路径，可以提供 unsafe 构造函数，但不应作为默认公共入口：

```ts
Angle.unsafeFromRadians(value: number): Angle
```

是否暴露 unsafe API 需要实现时谨慎决定。

## 十二、运算能力

第一阶段 `Angle` 可提供：

```txt
add
subtract
multiply
divide
negate
abs
equals
almostEquals
```

第一阶段 `Duration` 可提供：

```txt
add
subtract
multiply
divide
negate
abs
equals
almostEquals
```

`almostEquals` 必须要求调用方传入 tolerance。

不要提供隐式默认容忍度。

## 十三、导出结构

第一阶段入口：

```ts
export { Angle } from "./angle";
export { Duration } from "./duration";
export { PrimitiveError } from "./errors";
export type { PrimitiveErrorCode } from "./errors";
export type { Result, Ok, Err } from "./result";
export { ok, err, isOk, isErr } from "./result";
export type { Tolerance } from "./tolerance";
export { almostEqual } from "./tolerance";
```

`Angle` 与 `Duration` 的公共构造应同时提供 `fromXxx` 和 `parseXxx` 风格：

```txt
fromXxx: 输入非法时抛出 PrimitiveError。
parseXxx: 输入非法时返回 Result<..., PrimitiveError>。
```

`PrimitiveErrorCode` 第一阶段至少包含：

```txt
DivisionByZero
InvalidNumber
InvalidTolerance
```

内部文件结构建议：

```txt
src/
├─ angle.ts
├─ duration.ts
├─ errors.ts
├─ internal/
│  └─ number.ts
├─ result.ts
├─ tolerance.ts
└─ index.ts
```

`src/internal/` 只服务包内实现，不从主入口导出，也不被其他 package 跨包引用。

测试统一放在包级目录：

```txt
tests/*.test.ts
```

角度、时长等稳定换算样例统一放入：

```txt
standards/primitives/
```

测试优先读取这些 fixture，避免同一类标准数值在多个测试文件里重复硬编码。

## 十四、与 temporal 的关系

`@epheon/temporal` 可以依赖：

```txt
Duration
Result
Tolerance
almostEqual
```

`@epheon/primitives` 不得依赖：

```txt
Instant
JulianDay
UtcDateTime
DeltaTProvider
LeapSecondProvider
```

如果某个类型看起来既能放入 primitives，也能放入 temporal，默认放入 temporal，直到证明它足够通用。

## 十五、验收标准

第一阶段完成时，`@epheon/primitives` 应证明：

```txt
Angle 单位转换正确。
Angle 归一化边界正确。
Duration 固定单位转换正确。
NaN 与 Infinity 被拒绝。
almostEqual 使用显式 tolerance。
Result 能表达成功和失败。
包没有运行时第三方依赖。
包没有反向依赖 temporal。
```

这些能力完成后，`@epheon/temporal` 可以在稳定基础上实现 JD、UTC、TT 和 Delta-T provider。
