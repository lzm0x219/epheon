# Epheon 坐标与参考系模型 RFC

## 一、目的

本文定义 `@epheon/reference` 的第二阶段模型。

它回答：

```txt
Epheon 如何表示天体位置？
坐标系统、参考系和原点如何分离？
星历 provider 应返回什么坐标结果？
哪些能力属于 reference，哪些不属于？
哪些坐标能力暂缓到后续阶段？
```

第二阶段目标不是实现完整坐标天文学，而是建立一个足够稳定、可扩展、可验证的
坐标与参考系内核。

## 二、设计边界

`@epheon/reference` 负责：

```txt
Body
Origin
Distance
ReferenceFrame
SphericalCoordinates
Position
CoordinateSystem
坐标转换的纯数学边界
```

`@epheon/reference` 不负责：

```txt
Instant
Julian Day
Delta-T
闰秒
星历 provider 接口
星历精度等级
VSOP87
ELP2000
JPL 星历
二十四节气求解
朔望求解
中国历法规则
```

其中：

```txt
Angle / Vector3 / Tolerance 属于 @epheon/primitives。
Instant / JulianEphemerisDay 属于 @epheon/temporal。
EphemerisProvider / Precision 属于 @epheon/ephemerides。
```

## 三、核心原则

坐标模型必须遵守：

```txt
坐标值对象必须不可变。
角度必须使用 Angle。
距离必须使用 Distance。
坐标系统、参考系和原点必须分开表达。
浮点近似比较必须显式声明 tolerance。
不隐式读取系统时区、当前时间、文件系统或网络。
不包含具体星历算法。
不跨包引用其他 package 的 src/internal/*。
```

这些约束是为了让星历实现可以替换，让节气、朔望和历法层只依赖稳定位置模型。

## 四、坐标语义拆分

天体位置不能只用一个经纬度表示。

同一个数值可能同时涉及：

```txt
坐标系统：黄道 / 赤道 / 地平
参考系：ICRS / J2000 / 平黄道 / 真黄道
原点：日心 / 地心 / 站心
历元：固定历元 / 日期瞬时历元
```

因此 `@epheon/reference` 不提供单一的 `Coordinate` 类型，而是拆成：

```txt
SphericalCoordinates 表示经度、纬度和可选距离。
ReferenceFrame 表示参考系和坐标系统。
Origin 表示坐标原点。
Position 组合以上三者，作为星历 provider 的返回值。
```

这样可以避免把“黄经是多少”和“这个黄经属于哪个参考系”混在一起。

## 五、CoordinateSystem

`CoordinateSystem` 描述坐标分量的类型语义。

第一阶段支持：

```txt
Ecliptic
Equatorial
Horizontal
```

建议使用 const 对象模式，而不是 `enum`：

```ts
const CoordinateSystem = {
  Ecliptic: "ECLIPTIC",
  Equatorial: "EQUATORIAL",
  Horizontal: "HORIZONTAL"
} as const;
```

原因：

```txt
与 isolatedModules 兼容。
与现有 TypeScript 风格一致。
字符串值便于测试 fixture 和序列化。
```

`CoordinateSystem` 不表示原点。日心黄道坐标和地心黄道坐标都可以使用
`CoordinateSystem.Ecliptic`，原点由 `Origin` 决定。

## 六、Origin

`Origin` 表示坐标原点。

第一阶段支持：

```txt
Heliocentric
Geocentric
```

语义：

```txt
Heliocentric 表示以太阳为原点，常见于 VSOP87 原始输出。
Geocentric 表示以地球为原点，节气和朔望求解主要使用。
```

暂缓：

```txt
Barycentric
Topocentric
```

原因是第二阶段最小链路只需要太阳黄经和后续月亮黄经。站心和质心坐标等出现真实
需求时再加入。

## 七、Body

`Body` 表示星历 provider 可以请求的天体。

建议使用 const 对象模式：

```ts
const Body = {
  Sun: "SUN",
  Moon: "MOON",
  Mercury: "MERCURY",
  Venus: "VENUS",
  Earth: "EARTH",
  Mars: "MARS",
  Jupiter: "JUPITER",
  Saturn: "SATURN",
  Uranus: "URANUS",
  Neptune: "NEPTUNE"
} as const;
```

第二阶段最小 provider 只要求支持：

```txt
Body.Sun
```

朔望求解进入实现后，再要求：

```txt
Body.Moon
```

其他天体保留在 `Body` 中，是为了让完整 VSOP87、JPL 等实现复用同一套公共类型。
具体 provider 不支持某个天体时，由 RFC 0006 定义的错误模型处理。

## 八、Distance

`Distance` 表示天文距离。

它属于 `@epheon/reference`，不属于 `@epheon/primitives`。

原因：

```txt
AU 是天文单位。
基础类型包不应包含天文语义。
星历输出天然以 AU 为主要距离单位。
```

第一阶段只支持：

```txt
AU
```

建议 API：

```ts
Distance.fromAU(value: number): Distance
Distance.parseAU(value: number): Result<Distance, PrimitiveError>

distance.toAU(): number
distance.multiply(factor: number): Distance
distance.divide(divisor: number): Distance
distance.equals(other: Distance): boolean
distance.almostEquals(other: Distance, tolerance: Tolerance): boolean
```

构造时必须拒绝：

```txt
NaN
Infinity
-Infinity
```

`divide(0)` 必须抛出 `PrimitiveError`，错误码为 `DivisionByZero`。

`fromKilometers` 第一阶段暂缓。千米换算属于后续地面观测、展示或兼容层需求。

## 九、ReferenceFrame

`ReferenceFrame` 表示坐标所在的参考系。

它不是一个普通 string。原因是参考系至少需要携带：

```txt
稳定名称
坐标系统
可选固定历元
```

第一阶段预设：

```txt
ICRS
MeanOfDateEcliptic
TrueOfDateEcliptic
```

语义：

```txt
ICRS 表示固定历元参考系，使用 J2000.0，赤道坐标。
MeanOfDateEcliptic 表示瞬时平黄道坐标，是节气计算的默认输出帧。
TrueOfDateEcliptic 表示瞬时真黄道坐标，包含章动修正，留给更高精度链路。
```

相等语义：

```txt
equals 比较 name、coordinateSystem 和 epoch。
name 是稳定帧标识，不是本地化展示文案。
MeanOfDateEcliptic 和 TrueOfDateEcliptic 都是瞬时黄道帧，但不相等。
```

`ReferenceFrame.epoch` 使用 `JulianEphemerisDay`。这是 `@epheon/reference` 依赖
`@epheon/temporal` 的唯一必要原因。

## 十、SphericalCoordinates

`SphericalCoordinates` 表示球面坐标。

它包含：

```txt
longitude
latitude
distance?
```

其中：

```txt
longitude 使用 Angle。黄道坐标中表示黄经 λ。
latitude 使用 Angle。黄道坐标中表示黄纬 β。
distance 可选，使用 Distance。
```

`distance` 是可选字段。

原因：

```txt
节气求解只需要太阳黄经。
朔望求解主要需要太阳和月亮黄经。
完整星历 provider 可以返回距离，但上层不应被迫使用。
```

构造时不自动归一化经度。

原因是原始角度可能表达累计角或差值。是否归一化应由星历 provider 或调用方显式
决定。

## 十一、Position

`Position` 是完整位置表达，也是 RFC 0006 中 `EphemerisProvider.position()` 的
返回值。

它组合：

```txt
SphericalCoordinates
ReferenceFrame
Origin
```

比较语义：

```txt
equals 严格比较坐标、参考系和原点。
almostEquals 使用 tolerance 比较坐标，严格比较参考系和原点。
```

`Position` 不包含：

```txt
速度
观测者位置
provider 来源
精度等级
光行时修正说明
```

这些内容属于星历 provider 或后续高精度模型，不进入第二阶段最小坐标模型。

## 十二、笛卡尔坐标与转换

`Vector3` 已属于 `@epheon/primitives`。

`@epheon/reference` 可以在内部使用 `Vector3` 做坐标转换，例如：

```txt
cartesianToSpherical
sphericalToCartesian
```

但第一阶段不从公共入口导出 `CartesianCoordinates`。

原因：

```txt
节气和朔望公共链路需要的是球面坐标。
VSOP87 等实现中的笛卡尔转换是算法适配细节。
过早公开 CartesianCoordinates 会扩大 API 面。
```

若后续多个算法包都需要同一套转换逻辑，可以先放在 `@epheon/reference/src/internal/`。
其他 package 不得跨包引用该 internal 路径。

`Matrix3` 也暂缓。等岁差、章动、黄赤交角和坐标旋转进入实现时再定义。

## 十三、误差与错误模型

近似比较统一复用 `@epheon/primitives` 的 `Tolerance`。

```ts
import type { Tolerance } from "@epheon/primitives";
```

建议提供：

```txt
Distance.almostEquals(other, tolerance)
SphericalCoordinates.almostEquals(other, tolerance)
Position.almostEquals(other, tolerance)
```

不要提供隐式默认 tolerance。

`Distance` 的非法数值构造复用 `PrimitiveError`。`ReferenceFrame`、`Origin`、
`Body` 等领域错误若未来需要结构化表达，再在 `@epheon/reference` 中定义
`ReferenceError`。第二阶段最小模型先不引入新错误类型。

`Precision` 不属于误差比较。它由 RFC 0006 定义，用来表达星历 provider 的精度
能力，不能替代测试中的 `Tolerance`。

## 十四、最小 API 草案

第二阶段 API 草案：

```ts
export const CoordinateSystem;
export type CoordinateSystem;

export const Origin;
export type Origin;

export const Body;
export type Body;

export class Distance {
  static fromAU(value: number): Distance;
  static parseAU(value: number): Result<Distance, PrimitiveError>;
  toAU(): number;
  multiply(factor: number): Distance;
  divide(divisor: number): Distance;
  equals(other: Distance): boolean;
  almostEquals(other: Distance, tolerance: Tolerance): boolean;
}

export class ReferenceFrame {
  static readonly ICRS: ReferenceFrame;
  static readonly MeanOfDateEcliptic: ReferenceFrame;
  static readonly TrueOfDateEcliptic: ReferenceFrame;
  equals(other: ReferenceFrame): boolean;
}

export class SphericalCoordinates {
  static from(input: SphericalCoordinatesInput): SphericalCoordinates;
  equals(other: SphericalCoordinates): boolean;
  almostEquals(other: SphericalCoordinates, tolerance: Tolerance): boolean;
}

export class Position {
  static from(input: PositionInput): Position;
  equals(other: Position): boolean;
  almostEquals(other: Position, tolerance: Tolerance): boolean;
}
```

这是设计草案，不是最终实现签名。

公共入口只应暴露稳定 API，例如：

```txt
Body
Origin
Distance
Position
ReferenceFrame
CoordinateSystem
SphericalCoordinates
```

以下内容属于内部实现，放入 `src/internal/`，不从主入口导出：

```txt
笛卡尔转换辅助函数
球面转换辅助函数
内部数值校验
未来旋转矩阵辅助函数
```

## 十五、类型归属汇总

表 4.1：第二阶段相关类型归属。

| 类型                   | 归属                  | 说明                    |
| ---------------------- | --------------------- | ----------------------- |
| `Angle`                | `@epheon/primitives`  | 已存在，角度值对象      |
| `Vector3`              | `@epheon/primitives`  | 已存在，纯数学向量      |
| `Tolerance`            | `@epheon/primitives`  | 已存在，误差容忍度      |
| `Instant`              | `@epheon/temporal`    | 已存在，物理时间点      |
| `JulianEphemerisDay`   | `@epheon/temporal`    | 已存在，TT 尺度的 JDE   |
| `CoordinateSystem`     | `@epheon/reference`   | 新增，坐标系统          |
| `Origin`               | `@epheon/reference`   | 新增，坐标原点          |
| `Body`                 | `@epheon/reference`   | 新增，天体标识          |
| `Distance`             | `@epheon/reference`   | 新增，AU 距离值对象     |
| `ReferenceFrame`       | `@epheon/reference`   | 新增，参考系值对象      |
| `SphericalCoordinates` | `@epheon/reference`   | 新增，球面坐标值对象    |
| `Position`             | `@epheon/reference`   | 新增，provider 返回位置 |
| `CartesianCoordinates` | 不导出                | 内部转换概念            |
| `Matrix3`              | 暂缓                  | 等旋转需求出现后再定义  |
| `Precision`            | `@epheon/ephemerides` | 由 RFC 0006 定义        |
| `EphemerisProvider`    | `@epheon/ephemerides` | 由 RFC 0006 定义        |

## 十六、与 standards/ 的关系

`@epheon/reference` 实现后，应新增：

```txt
standards/reference/
```

第一阶段可以包含：

```txt
coordinates.json
frames.json
```

用途：

```txt
coordinates.json 验证球面坐标与内部 Vector3 转换。
frames.json 验证 ReferenceFrame 预设帧和相等语义。
```

测试应优先读取这些 fixture，再针对局部错误边界补少量内联用例。

大型星历数据不进入 `standards/reference/`，而应进入未来的星历或数据包 fixture。

## 十七、包依赖关系

第二阶段依赖方向：

```txt
@epheon/primitives
  ↓
@epheon/temporal
  ↓
@epheon/reference
  ↓
@epheon/ephemerides
```

`@epheon/reference` 可以依赖：

```txt
Angle
Vector3
Tolerance
Result
PrimitiveError
JulianEphemerisDay
```

`@epheon/reference` 不得依赖：

```txt
EphemerisProvider
Precision
VSOP87 实现
phenomena 求解器
calendar 包
dataset 包
```

如果某个能力看起来既能放入 `reference`，也能放入 `ephemerides`，默认放入
`ephemerides`，直到证明它只是坐标表达或坐标转换。

## 十八、暂缓事项

第二阶段暂缓：

```txt
Matrix3
StateVector
Barycentric origin
Topocentric origin
Distance.fromKilometers
Position.toJSON / fromJSON
地平坐标中的观测者位置模型
光行差、视差、光行时和引力延迟修正
完整岁差、章动和黄赤交角模型
```

其中岁差、章动、黄赤交角和坐标旋转仍倾向放在 `@epheon/reference`。但它们需要
等太阳黄经 provider 和验证数据进入后，再收敛可承诺的 API。

## 十九、验收标准

第二阶段 `@epheon/reference` 完成时，应证明：

```txt
可以表达球面坐标。
可以表达日心和地心原点。
可以表达 ICRS、瞬时平黄道和瞬时真黄道参考系。
可以区分坐标系统、参考系和原点。
可以用 Position 作为星历 provider 返回值。
可以用显式 tolerance 做近似比较。
可以拒绝非法 Distance 数值。
不会读取系统时区、当前时间、文件系统或网络。
不会包含具体星历算法。
不会从公共入口导出内部笛卡尔转换。
```

这些能力完成后，`@epheon/ephemerides` 可以在稳定坐标模型上定义 provider 接口。
