# Epheon 星历 Provider 接口 RFC

## 一、目的

本文定义 `@epheon/ephemerides` 的第二阶段模型。

它回答：

```txt
Epheon 如何统一获取天体位置？
不同星历算法如何替换？
调用方如何声明期望精度？
Provider 不支持某个天体、参考系或精度时如何报错？
哪些能力属于 ephemerides，哪些不属于？
```

第二阶段目标不是实现具体星历算法，而是建立一个足够稳定、可替换、可测试的星历
抽象层。

## 二、设计边界

`@epheon/ephemerides` 负责：

```txt
EphemerisProvider
EphemerisOptions
Precision
EphemerisError
```

`@epheon/ephemerides` 不负责：

```txt
坐标值对象
坐标转换
具体 VSOP87 算法
具体 ELP2000 算法
JPL 星历文件读取
星历数据打包
二十四节气求解
朔望求解
Delta-T 数据模型
闰秒数据模型
```

其中：

```txt
Body / Position / ReferenceFrame 属于 @epheon/reference。
Instant / JulianEphemerisDay 属于 @epheon/temporal。
具体星历算法属于 @epheon/ephemerides-* 实现包。
星历数据属于 @epheon/dataset-* 数据包。
天象事件求解属于 @epheon/phenomena。
```

RFC 0005 的表 4.1 已列出 `Precision` 与 `EphemerisProvider` 的归属。

## 三、核心原则

星历 provider 模型必须遵守：

```txt
接口与实现分离。
算法与数据分离。
Provider 通过同一 position() 协议返回 Position。
Provider 不静默降级精度。
Provider 不把 unsupported body 伪装成空结果。
Provider 不返回裸 number 位置。
Provider 不要求调用方知道具体算法来源。
ephemerides 包不包含具体星历算法。
ephemerides 包不读取文件系统、网络或全局配置。
```

这些约束是为了让 VSOP87、ELP2000、JPL 或用户自定义 provider 可以互换。

## 四、EphemerisProvider

`EphemerisProvider` 是星历抽象层的核心接口。

本阶段只需要一个方法：

```ts
interface EphemerisProvider {
  position(body: Body, instant: Instant, options?: EphemerisOptions): Position;
}
```

参数语义：

```txt
body 表示目标天体。
instant 表示观测时刻。
options 表示目标参考系和期望精度。
```

返回值必须是 `Position`。

原因：

```txt
Position 已包含球面坐标、参考系和原点。
调用方不需要猜测返回的是日心还是地心。
调用方不需要猜测返回的是平黄道还是真黄道。
节气和朔望求解可以依赖同一位置模型。
```

`EphemerisProvider` 使用 `interface`，不使用抽象类。

原因：

```txt
与 DeltaTProvider / LeapSecondProvider 的轻量 provider 风格一致。
第三方实现更简单。
不强制继承层级。
```

## 五、EphemerisOptions

`EphemerisOptions` 表达调用方对结果的要求。

本阶段包含：

```ts
type EphemerisOptions = {
  readonly frame?: ReferenceFrame;
  readonly precision?: Precision;
};
```

默认值：

```txt
frame 默认为 ReferenceFrame.MeanOfDateEcliptic。
precision 默认为 Precision.Standard。
```

默认帧选择 `MeanOfDateEcliptic`。

原因：

```txt
节气求解需要太阳在瞬时平黄道上的黄经。
这是第二阶段最小链路的主要使用场景。
需要 ICRS 或真黄道时，调用方可以显式传入 frame。
```

Provider 支持请求的 `frame` 时，应返回该参考系下的 `Position`。

Provider 不支持请求的 `frame` 时，必须抛出 `EphemerisError`，错误码为
`InvalidFrame`。不要静默返回其他参考系。

## 六、Precision

`Precision` 表示调用方期望的星历计算精度等级。

它属于 `@epheon/ephemerides`，不属于 `@epheon/reference`。

原因：

```txt
坐标模型只表达位置结果。
Precision 是 provider 能力和计算策略。
同一 Position 类型可以来自不同精度的 provider。
```

建议使用 const 对象模式：

```ts
const Precision = {
  FastLow: "FAST_LOW",
  Standard: "STANDARD",
  High: "HIGH"
} as const;
```

语义：

```txt
FastLow 表示快速低精度，适合粗略查找或初值估计。
Standard 表示标准精度，是第二阶段默认目标。
High 表示高精度，通常需要 JPL 等更重的数据源。
```

`Precision` 不绑定固定误差数值。

原因：

```txt
不同实现包的算法和数据来源不同。
同一等级的实际误差上限应由实现包 README 和测试 fixture 说明。
未来实现包可能升级算法而不改变等级标签。
```

调用方请求 provider 不支持的 `precision` 时，必须抛出 `EphemerisError`，错误码为
`UnsupportedPrecision`。

`Precision` 不是 `Tolerance`。

```txt
Precision 表达 provider 能力要求。
Tolerance 表达测试或比较时的误差容忍度。
```

两者不互通。

## 七、EphemerisError

`EphemerisError` 表示星历 provider 边界上的结构化错误。

本阶段错误码建议：

```txt
UnsupportedBody
InvalidFrame
UnsupportedPrecision
PositionUnavailable
InvalidInput
```

语义：

```txt
UnsupportedBody 表示 provider 不支持请求的天体。
InvalidFrame 表示 provider 不支持请求的参考系。
UnsupportedPrecision 表示 provider 不支持请求的精度等级。
PositionUnavailable 表示指定时刻或数据范围内无法给出位置。
InvalidInput 表示输入非法或 provider 返回非法中间值。
```

建议结构：

```ts
class EphemerisError extends Error {
  readonly code: EphemerisErrorCode;
}
```

`position()` 失败时应抛出 `EphemerisError`，不返回 `null`、`undefined` 或空
`Result`。

原因是 provider 失败通常是调用方配置、数据覆盖范围或实现能力问题。直接抛出结构化
错误更容易暴露错误边界。

## 八、最小 Provider 能力

第二阶段最小 provider 只要求支持：

```txt
Body.Sun
```

原因：

```txt
第二阶段最小目标是太阳黄经。
太阳黄经是二十四节气求解的输入。
月亮黄经进入朔望求解阶段后再要求。
```

调用不支持的天体时必须抛出：

```txt
EphemerisError("UnsupportedBody")
```

示例：

```ts
provider.position(Body.Sun, instant);
provider.position(Body.Moon, instant); // 抛出 UnsupportedBody，直到 provider 支持月亮
```

不要让最小 provider 为不支持的天体返回零坐标、太阳坐标或占位坐标。

## 九、Provider 生命周期

`EphemerisProvider` 本身不定义 `dispose`、`close` 或初始化生命周期。

本阶段目标是：

```txt
无状态
可替换
可组合
易于测试
```

如果具体实现需要加载 WASM、读取数据文件或管理缓存，应由实现包自行设计，不进入
`@epheon/ephemerides` 的核心接口。

缓存策略也不属于本阶段接口。

原因：

```txt
内存缓存、文件缓存和远程数据缓存的成本不同。
太阳黄经最小 provider 不需要统一缓存协议。
过早定义缓存接口会把实现细节推入抽象层。
```

## 十、Provider 组合

组合 provider 是设计方向，不是本阶段必须实现。

未来可以考虑：

```ts
function combineProviders(
  primary: EphemerisProvider,
  fallback: EphemerisProvider
): EphemerisProvider;
```

组合规则建议：

```txt
优先调用 primary。
primary 抛出 UnsupportedBody 时，转发给 fallback。
其他错误直接向上传播。
```

这个能力适合将太阳 provider 和月亮 provider 组合成统一入口。

本阶段 C2 任务可以先不实现它。等 Sun / Moon provider 同时存在后再加入更稳。

## 十一、调用流程

典型调用流程：

```txt
调用方传入 body、instant 和 options。
Provider 检查 body 是否支持。
Provider 检查 frame 是否支持。
Provider 检查 precision 是否支持。
Provider 从 instant 派生计算所需时间值。
Provider 运行具体星历算法。
Provider 转换到目标参考系和原点。
Provider 返回 Position。
```

其中：

```txt
时间尺度转换由 @epheon/temporal 提供。
坐标表达由 @epheon/reference 提供。
具体算法由实现包提供。
```

`@epheon/ephemerides` 只定义协议，不参与具体计算。

## 十二、最小 API 草案

第二阶段 API 草案：

```ts
export interface EphemerisProvider {
  position(body: Body, instant: Instant, options?: EphemerisOptions): Position;
}

export type EphemerisOptions = {
  readonly frame?: ReferenceFrame;
  readonly precision?: Precision;
};

export const Precision;
export type Precision;

export class EphemerisError extends Error {
  readonly code: EphemerisErrorCode;
}

export type EphemerisErrorCode =
  | "UnsupportedBody"
  | "InvalidFrame"
  | "UnsupportedPrecision"
  | "PositionUnavailable"
  | "InvalidInput";
```

这是设计草案，不是最终实现签名。

公共入口只应暴露稳定 API，例如：

```txt
EphemerisProvider
EphemerisOptions
Precision
EphemerisError
EphemerisErrorCode
```

以下内容不从 `@epheon/ephemerides` 主入口导出：

```txt
VSOP87 太阳 provider
ELP2000 月亮 provider
JPL provider
星历数据加载器
缓存实现
内部测试 stub
```

## 十三、与 reference / temporal 的关系

`@epheon/ephemerides` 可以依赖：

```txt
Body
Position
ReferenceFrame
Instant
```

实现包可以通过 `Instant` 派生：

```txt
JulianEphemerisDay
TT
UT1
```

具体使用哪个时间尺度由算法决定。

`@epheon/ephemerides` 不得反向依赖：

```txt
phenomena
calendar
calendar-chinese
dataset 包
具体 ephemerides-* 实现包
```

`Position` 的结构由 RFC 0005 定义。Provider 不应重新定义坐标返回类型。

## 十四、阶段化计划

第二阶段最小路径：

```txt
C1: @epheon/reference
C2: @epheon/ephemerides
C4: @epheon/ephemerides-vsop87 最小太阳 provider
C5: 二十四节气求解
```

`@epheon/ephemerides` 本身只完成 C2：

```txt
定义接口。
定义 options。
定义 precision。
定义错误模型。
不实现具体算法。
```

后续实现包：

```txt
@epheon/ephemerides-vsop87 负责太阳和行星相关算法。
@epheon/ephemerides-elp2000 负责月亮理论。
@epheon/ephemerides-jpl 负责 JPL 高精度星历。
```

## 十五、暂缓事项

第二阶段暂缓：

```txt
state(body, instant, options?)
速度向量
coverage 元信息
source 元信息
version 元信息
dispose / close 生命周期
统一缓存接口
网络数据加载协议
combineProviders 强制实现
```

这些能力等多个 provider 实现后再决定是否进入公共接口。

## 十六、验收标准

第二阶段 `@epheon/ephemerides` 完成时，应证明：

```txt
可以通过 EphemerisProvider.position() 获取 Position。
可以通过 EphemerisOptions 指定 frame 和 precision。
默认 frame 为 ReferenceFrame.MeanOfDateEcliptic。
默认 precision 为 Precision.Standard。
不支持的 body 抛出 UnsupportedBody。
不支持的 frame 抛出 InvalidFrame。
不支持的 precision 抛出 UnsupportedPrecision。
position() 不返回速度。
ephemerides 包不包含具体星历算法。
ephemerides 包不读取文件系统、网络或全局配置。
```

这些能力完成后，具体星历实现包可以在统一协议上提供太阳、月亮和行星位置。
