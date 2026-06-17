# Epheon 天象事件求解 RFC

## 一、目的

本文定义 `@epheon/phenomena` 的第二阶段最小模型。

它回答：

```txt
Epheon 如何从连续天体运动中求出离散事件？
二十四节气的目标黄经如何定义？
朔望事件的角度条件是什么？
求解时使用什么时间输入、什么时间输出？
默认求解算法是什么，哪些优化暂缓？
哪些能力属于 phenomena，哪些不属于？
```

本文目标不是一次性覆盖日月食、出没、站心观测或所有天象事件，而是先锁定：

```txt
Solar Terms
New Moon
Full Moon
最小事件搜索边界
最小求根策略
```

这样第二阶段可以先完成节气求解，再为第三阶段的朔望求解留出稳定接口。

## 二、设计边界

`@epheon/phenomena` 负责：

```txt
SolarTermName
SolarTermEvent
LunarPhaseKind
LunarPhaseEvent
基于连续角度函数的事件搜索
二分法求根与可选 Newton refinement 策略
事件定义与返回值模型
```

`@epheon/phenomena` 不负责：

```txt
太阳或月亮位置算法
VSOP87 / ELP2000 / JPL 实现
Delta-T 数据快照
闰秒数据快照
时区数据库
农历日期、闰月、干支
八字、紫微斗数等术数解释
```

其中：

```txt
Instant / DeltaTProvider / LeapSecondProvider 属于 @epheon/temporal。
Body / Position / ReferenceFrame 属于 @epheon/reference。
EphemerisProvider 属于 @epheon/ephemerides。
太阳与月亮位置实现属于 @epheon/ephemerides-*。
历法规则属于 @epheon/calendars 和 @epheon/calendar-chinese。
```

## 三、核心原则

天象事件求解必须遵守：

```txt
先定义事件条件，再选算法。
公共 API 使用 Instant 输入输出，不暴露裸 Julian 数值。
事件搜索不依赖系统时区、当前时间、文件系统或网络。
节气和朔望只依赖注入的 ephemeris 与时间尺度 provider。
默认算法优先选择稳健的二分法，不先暴露通用求根 DSL。
测试 tolerance 明确写在测试中，不把精度承诺偷塞进运行时常量。
phenomena 只知道天象，不知道历法。
```

这些约束是为了让节气和朔望求解保持可替换、可验证、可组合，而不把历法规则或具体星历算法耦合进求解层。

## 四、事件语义

第二阶段最小事件都属于：

```txt
存在一个连续角度函数 f(t)
目标是找到某个时刻 t，使得 f(t) = 0
```

对应关系：

```txt
节气：太阳黄经 - 目标黄经 = 0
朔：月亮黄经 - 太阳黄经 = 0
望：月亮黄经 - 太阳黄经 = 180°
```

这里的“连续”是指数值求解语义上的连续。实现可以在离散采样后找到包围区间，再用求根法细化。

`@epheon/phenomena` 不在第二阶段定义通用 `EventCondition` 抽象。

原因：

```txt
当前只需要节气与朔望。
过早设计通用事件 DSL 会把简单问题变复杂。
等出没、食、合、冲真的进入实现后再评估是否需要统一抽象。
```

## 五、二十四节气定义

二十四节气按太阳地心黄经定义。

第二阶段固定使用：

```txt
太阳地心视黄经
ReferenceFrame.TrueOfDateEcliptic
Origin.Geocentric
```

原因：

```txt
D1 当前 bootstrap fixture 使用 JPL Horizons 的 ObsEcLon（地心视黄经）。
standards/solar/terms.json 和 standards/solar/longitudes.json 已按这一语义生成。
phenomena 不应依赖 ephemeris provider 的默认 frame，而应显式请求目标 frame。
```

二十四节气目标黄经如下：

```txt
春分  =   0°
清明  =  15°
谷雨  =  30°
立夏  =  45°
小满  =  60°
芒种  =  75°
夏至  =  90°
小暑  = 105°
大暑  = 120°
立秋  = 135°
处暑  = 150°
白露  = 165°
秋分  = 180°
寒露  = 195°
霜降  = 210°
立冬  = 225°
小雪  = 240°
大雪  = 255°
冬至  = 270°
小寒  = 285°
大寒  = 300°
立春  = 315°
雨水  = 330°
惊蛰  = 345°
```

排序语义：

```txt
ofYear(year) 返回该 UTC Gregorian year 内发生的 24 个事件。
返回顺序按 Instant 从早到晚排序。
year 表示事件 instant 的 UTC 年，不引入时区换年语义。
```

第二阶段不接受：

```txt
按中国时区或任意地区时区定义节气归属年
按历法月令解释节气用途
按地方历法规则重排节气边界
```

这些都属于历法层或应用层。

## 六、朔望定义

第二阶段先锁定朔望的角度条件。

固定使用：

```txt
月亮地心视黄经
太阳地心视黄经
ReferenceFrame.TrueOfDateEcliptic
Origin.Geocentric
```

事件条件：

```txt
朔：normalizeSigned(moonLongitude - sunLongitude -   0°) = 0
望：normalizeSigned(moonLongitude - sunLongitude - 180°) = 0
```

其中 `normalizeSigned` 表示把角度差归一化到 `[-180°, 180°)`，避免 359.999° 与 0.001° 被误判为跨越巨大差值。

本 RFC 不在第二阶段要求实现：

```txt
上弦（90°）
下弦（270°）
食相关事件
月球纬度条件
站心修正
```

这些能力有真实实现需求时再扩展。

月亮事件进入实现前，最小 provider 需求是：

```txt
ephemeris provider 必须支持 Body.Moon
并能在 TrueOfDateEcliptic / Geocentric 语义下返回月亮位置
```

## 七、输入、时间尺度与 Delta-T

第二阶段 `@epheon/phenomena` 的公共输入输出统一使用：

```txt
输入：Instant / year / 搜索时间窗
输出：Instant
```

原因：

```txt
Instant 已经是项目稳定的时间点值对象。
节气和朔望的上层调用方最终需要的是“发生在什么时候”。
公共 API 不应让调用方直接持有裸 JDE 或 UT1 数值。
```

时间尺度策略：

```txt
公共边界只暴露 Instant。
ephemeris 实现可以自行从 Instant 派生 TT / JDE / UT1。
phenomena 内部若需要更均匀的求解尺度，可以使用 provider 与 temporal 能力在实现中转换，但不把该细节推到公共 API。
```

Delta-T 的进入方式：

```txt
phenomena 上层 context 必须显式持有 DeltaTProvider。
需要从 UTC 搜索窗转换到 UT1 / TT 推理时，由实现使用该 provider。
如果具体事件实现只通过 ephemerisProvider.position(instant) 评估事件函数，也可以暂时不直接调用 DeltaTProvider，但 context 仍保持显式。
```

Leap second 的进入方式：

```txt
需要从 year 或原始 UTC 字面量生成 Instant 时，调用方必须提供 LeapSecondProvider。
原因是当前 ephemeris 实现可能通过 Instant 派生 TT / JDE，这一步需要 leap second 数据。
```

因此第二阶段最小求解 context 应包含：

```ts
type PhenomenaContext = {
  readonly ephemeris: EphemerisProvider;
  readonly leapSeconds: LeapSecondProvider;
  readonly deltaT: DeltaTProvider;
};
```

这一定义属于 `@epheon/phenomena`，不回推到 `@epheon/temporal` 或 `@epheon/ephemerides`。

## 八、默认求解算法

第二阶段默认算法固定为：

```txt
先粗采样找到变号区间
再用二分法收敛
```

原因：

```txt
二分法实现简单。
二分法只要求区间内存在单根且函数符号可判定。
对 bootstrap 阶段的节气与朔望，比 Newton 法更稳。
```

默认流程：

```txt
1. 根据 year 或调用方提供的搜索窗生成一组离散 Instant 样本。
2. 对相邻样本计算事件函数值。
3. 找到包含目标根的区间。
4. 在该区间上用二分法收敛。
5. 当区间宽度达到测试要求的时间 tolerance 后，返回 Instant。
```

第二阶段不要求把“粗采样步长”做成公共可配置项。

原因：

```txt
节气与朔望当前都属于项目内部已知场景。
步长应先由实现根据 fixture 与稳定性决定。
如果未来出现性能压力，再在实现包 README 或独立 RFC 中引入配置。
```

## 九、Newton 法策略

Newton 法是允许的优化，不是默认路径。

第二阶段策略：

```txt
必须先有已知包围区间。
Newton 只能作为二分法之上的 refinement。
若导数过小、步进离开包围区间或出现 NaN，必须回退到二分法。
```

原因：

```txt
当前最小链路优先要稳，不优先追求最快。
节气与朔望函数都具有周期性；没有包围区间时，Newton 容易跳到错误根。
```

因此 `@epheon/phenomena` 第二阶段不导出：

```txt
通用 NewtonSolver
通用 RootFinder 接口
多算法可插拔框架
```

这些都等多个事件实现稳定后再考虑。

## 十、最小结果模型

第二阶段最小结果建议如下：

```ts
export const SolarTermName = {
  ChunFen: "春分",
  QingMing: "清明",
  // ...
  JingZhe: "惊蛰"
} as const;

export type SolarTermName = (typeof SolarTermName)[keyof typeof SolarTermName];

export type SolarTermEvent = {
  readonly name: SolarTermName;
  readonly targetLongitude: Angle;
  readonly instant: Instant;
};

export const LunarPhaseKind = {
  NewMoon: "NEW_MOON",
  FullMoon: "FULL_MOON"
} as const;

export type LunarPhaseKind = (typeof LunarPhaseKind)[keyof typeof LunarPhaseKind];

export type LunarPhaseEvent = {
  readonly kind: LunarPhaseKind;
  readonly targetLongitudeDifference: Angle;
  readonly instant: Instant;
};
```

约束：

```txt
结果对象只表达“是什么”和“发生在什么时候”。
不在结果对象中挂 provider、算法实例或大段调试状态。
误差说明、采样步长、迭代次数等实现细节可以先留给测试与 README，不急着做成公共字段。
```

## 十一、最小 API 草案

第二阶段最小 API 草案：

```ts
export type PhenomenaContext = {
  readonly ephemeris: EphemerisProvider;
  readonly leapSeconds: LeapSecondProvider;
  readonly deltaT: DeltaTProvider;
};

export declare function solarTermsOfYear(
  year: number,
  context: PhenomenaContext
): readonly SolarTermEvent[];

export declare function findLunarPhaseBetween(
  kind: LunarPhaseKind,
  start: Instant,
  end: Instant,
  context: PhenomenaContext
): LunarPhaseEvent;
```

说明：

```txt
solarTermsOfYear(year, ...) 先服务 C5。
findLunarPhaseBetween(...) 先服务 C6。
先用函数，不引入 class、builder 或 service 容器。
```

第二阶段不导出：

```txt
通用 Event 类型
通用 RootFinder 类型
timezone 选项
calendar 选项
moonrise / sunrise API
eclipse API
```

## 十二、与其他包的关系

`@epheon/phenomena` 可以依赖：

```txt
Instant
DeltaTProvider
LeapSecondProvider
EphemerisProvider
Body
ReferenceFrame
Position
Angle
```

`@epheon/phenomena` 不得反向依赖：

```txt
calendar
calendar-chinese
术数层
具体 dataset 包的内部数据表
其他 package 的 src/internal/*
```

特别约束：

```txt
phenomena 可以依赖 ephemerides 协议，但不直接依赖具体 VSOP87 或 ELP2000 实现细节。
具体实现包由调用方注入。
```

## 十三、验证策略

第二阶段验证遵循：

```txt
先 standards，再实现。
节气测试读取 standards/solar/terms.json。
朔望测试读取未来的 standards/lunar/ 对应 fixture。
每个测试必须显式写 tolerance。
```

当前 tolerance 策略：

```txt
RFC 不写死单一秒数承诺。
D1 当前 terms fixture 来自 JPL 小时采样后线性插值，是 bootstrap 外部参考，不应在 RFC 中伪装成终极真值。
C5/C6 落地时，测试应根据 fixture 生成方法与当前实现误差显式声明 tolerance。
```

这也是为什么第二阶段先完成 D1 和 C4，再写本 RFC。

## 十四、阶段化计划

第二阶段最小路径：

```txt
C4: 太阳黄经最小 provider
B3: RFC 0007 天象事件求解
C5: 二十四节气求解
```

第三阶段继续：

```txt
月亮黄经 provider
C6: 朔望求解
```

也就是说：

```txt
本 RFC 先为 C5 固定事件定义与求解策略。
朔望部分先固定边界，不要求第二阶段立刻实现。
```

## 十五、暂缓事项

第二阶段暂缓：

```txt
上弦 / 下弦
日出日落 / 月出月落
食相关事件
通用事件 DSL
公开的可插拔求根框架
timezone-aware 的 ofYear 语义
基于站心或地平坐标的事件
调试元数据进入公共结果对象
```

这些能力等 `@epheon/phenomena` 出现第二个、第三个稳定事件族后再决定是否进入公共接口。

## 十六、验收标准

第二阶段 RFC 0007 完成时，应证明：

```txt
明确了二十四节气对应的 0°、15°、30° 直到 345° 目标黄经。
明确了节气使用太阳地心视黄经、TrueOfDateEcliptic 与 Geocentric 语义。
明确了朔与望的角度条件。
明确了公共输入输出使用 Instant。
明确了 Delta-T 与 leap second 的进入方式。
明确了默认算法是先找包围区间再用二分法。
明确了 Newton 法只作为可选 refinement。
明确了月亮事件依赖支持 Body.Moon 的 ephemeris provider。
明确了 phenomena 不负责历法判断和时区数据库。
通过 pnpm format:check。
```

这些约束固定后，C5 可以在稳定边界内实现二十四节气求解，C6 可以在月亮 provider 准备好后继续实现朔望。
