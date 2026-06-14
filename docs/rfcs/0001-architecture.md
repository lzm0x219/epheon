# Epheon 架构设计文档

## 一、项目定位

Epheon 不是一个普通的农历库，也不是八字、紫微斗数、奇门遁甲等术数库。

Epheon 的定位是：

> 一个标准驱动、可验证、可扩展、可组合的天文历法引擎。

它的核心目标是为东亚历法体系提供稳定、可靠、现代化的底层基础设施。

Epheon 只负责回答这类问题：

```txt
某个时间如何表示？
某个时间对应哪个儒略日？
太阳在某一时刻的黄经是多少？
月亮在某一时刻的位置是多少？
某一年的二十四节气分别发生在什么时候？
某一年有哪些朔日？
某一天对应的农历日期是什么？
某一天的干支纪年、纪月、纪日、纪时是什么？
```

Epheon 不负责回答这类问题：

```txt
这个八字好不好？
这个紫微命盘如何解释？
某个神煞代表什么？
某个流派应该怎么断？
```

因此，Epheon 的边界非常明确：

```txt
Epheon 只做天文与历法，不做术数解释。
```

---

# 二、核心理念

## 1. 先有标准，再有实现

Epheon 不应该一开始就写大量算法代码，而应该先定义清楚：

```txt
时间如何表示？
坐标如何表示？
星历如何提供？
天象如何求解？
历法如何转换？
中国历法规则如何建模？
```

也就是说：

```txt
Specification First
```

先定义标准，再写实现。

这样做的好处是：

```txt
实现可以替换
数据可以替换
算法可以升级
上层生态可以稳定依赖
```

---

## 2. 客观层与主观层分离

Epheon 只处理客观可验证的内容。

例如：

```txt
JD
UTC
TT
ΔT
太阳黄经
月亮黄经
节气
朔望
农历日期
干支纪日
```

这些都属于客观层。

而：

```txt
八字十神
紫微安星
奇门起局
神煞解释
流派断语
```

属于主观层、术数层、应用层。

Epheon 不处理这些内容。

一句话：

```txt
历法可以作为术数的基础，但术数不应该污染历法内核。
```

---

## 3. 算法与数据分离

天文历法库有一个很大的特点：

```txt
算法代码本身不一定大，但天文数据可能很大。
```

例如：

```txt
VSOP87 系数
ELP2000 月球理论系数
JPL DE440 / DE441 星历文件
闰秒表
ΔT 历史数据
```

这些数据不应该直接塞进核心算法包里。

因此 Epheon 采用：

```txt
算法包 + 数据包
```

的方式。

例如：

```txt
@epheon/ephemerides-vsop87
@epheon/dataset-vsop87
```

前者负责算法，后者负责数据。

这样可以做到：

```txt
按需安装
按需加载
减小包体积
方便数据更新
方便高精度替换
```

---

## 4. 接口与实现分离

Epheon 的核心不是某一个具体算法，而是一套统一协议。

例如星历计算不应该直接绑定 VSOP87 或 JPL，而应该先定义接口：

```ts
interface EphemerisProvider {
  position(body: Body, instant: Instant, frame: ReferenceFrame): Position;
}
```

然后再提供不同实现：

```txt
VSOP87 实现
ELP2000 实现
JPL DE440 实现
JPL DE441 实现
```

这样用户可以根据需求选择：

```txt
轻量计算
高精度计算
长时间跨度计算
标准校验计算
```

---

## 5. 可验证优先

历法引擎最重要的不是功能数量，而是正确性。

Epheon 必须建立完整的验证体系：

```txt
标准答案集
一致性测试
精度测试
性能测试
边界测试
```

否则即使 API 再优雅，也无法让用户信任。

---

## 6. 值对象与纯函数结合

Epheon 的 API 设计采用：

```txt
值对象 OOP + 纯函数 FP
```

也就是说：

```txt
领域值使用不可变值对象。
核心算法使用纯函数。
外部数据通过 provider 注入。
可恢复错误通过 Result 表达。
测试必须显式声明 tolerance。
```

适合建模为不可变值对象的类型包括：

```txt
Angle
Duration
Instant
JulianDay
JulianEphemerisDay
CalendarDate
Position
```

这些类型有明确语义、单位、不变量和转换方法，适合使用轻量 class 封装。

例如：

```ts
const angle = Angle.fromDegrees(370);

angle.normalizeDegrees();
angle.toRadians();
```

适合建模为纯函数的内容包括：

```txt
时间尺度转换
坐标转换
太阳黄经计算
月亮黄经计算
求根
天象事件搜索
历法规则判定
```

例如：

```ts
const tt = utcToTT(utc, leapSeconds);
const longitude = solarLongitude(instant, ephemeris);
```

Provider 用于注入可替换的数据或算法来源：

```txt
DeltaTProvider
LeapSecondProvider
EphemerisProvider
CalendarRuleSet
```

Provider 可以是函数类型，也可以是轻量接口。只有当 provider 需要暴露元数据、覆盖范围、精度说明或多个相关方法时，才优先使用接口。

Epheon 应避免：

```txt
深层 class 继承
抽象基类驱动的复杂 OOP
带有隐藏状态的 service 对象
隐式全局配置
隐式默认精度
```

一句话：

```txt
领域概念用值对象表达，计算过程用纯函数实现，外部知识用 provider 注入。
```

---

# 三、整体架构

Epheon 的顶级架构可以分为三大部分：

```txt
Specification
Engine
Distribution
```

也就是：

```txt
标准定义
引擎实现
数据与工具分发
```

项目目录建议如下：

```txt
epheon/
├─ specs/              # 标准与协议文档
├─ packages/           # 核心 npm 包
├─ datasets/           # 原始数据与构建脚本
├─ standards/          # 标准答案集
├─ conformance/        # 一致性测试
├─ benchmarks/         # 性能与精度基准测试
├─ docs/               # 用户文档与设计文档
└─ apps/
   ├─ cli              # 命令行工具
   └─ playground       # 在线演示与调试工具
```

---

# 四、包结构设计

最终建议的 npm 包结构如下：

```txt
@epheon/spec

@epheon/primitives
@epheon/temporal
@epheon/reference

@epheon/ephemerides
@epheon/ephemerides-vsop87
@epheon/ephemerides-elp2000
@epheon/ephemerides-jpl

@epheon/phenomena

@epheon/calendars
@epheon/calendar-gregorian
@epheon/calendar-julian
@epheon/calendar-chinese

@epheon/dataset-leap-seconds
@epheon/dataset-delta-t
@epheon/dataset-vsop87
@epheon/dataset-elp2000
@epheon/dataset-jpl-de440
@epheon/dataset-jpl-de441

@epheon/standards
@epheon/conformance
@epheon/benchmarks

@epheon/compat
@epheon/runtime
@epheon/cli
```

---

# 五、分层说明

## 1. `@epheon/spec`

### 定位

标准定义层。

这是整个 Epheon 的最高抽象层。

它不负责具体计算，而是定义：

```txt
什么是时间？
什么是天体位置？
什么是参考系？
什么是星历提供者？
什么是天象事件？
什么是历法系统？
```

### 职责

包括：

```txt
时间协议
坐标协议
星历协议
天象协议
历法协议
数据协议
精度协议
错误模型
```

### 为什么需要它？

如果没有 spec，项目很容易变成：

```txt
一堆能跑的函数
```

但有了 spec，Epheon 才能成为：

```txt
标准驱动的历法引擎
```

它允许未来出现多个实现：

```txt
官方实现
轻量实现
WASM 实现
高精度实现
第三方实现
```

只要这些实现符合 spec，就能被上层应用替换使用。

---

## 2. `@epheon/primitives`

### 定位

数学原语与基础类型层。

它是整个项目最底层的包。

### 包含内容

```txt
Angle
Vector2
Vector3
Matrix3
Matrix4
Interval
Polynomial
Root
Unit
Duration
Precision
Result
Maybe
Error
```

### 示例

角度处理：

```ts
const angle = Angle.fromDegrees(370).normalize();

angle.toDegrees(); // 10
```

向量处理：

```ts
const v = Vector3.of(x, y, z);
```

### 设计原则

这个包必须保持极度纯净。

它不应该知道：

```txt
JD
UTC
太阳
月亮
农历
节气
```

它只负责基础数学能力。

---

## 3. `@epheon/temporal`

### 定位

时间系统内核。

### 职责

处理所有天文学所需的时间概念：

```txt
Instant
Julian Day
Julian Ephemeris Day
Julian Century
UTC
TAI
TT
TDB
UT1
ΔT
Leap Seconds
```

### 为什么不能直接用 JavaScript Date？

JavaScript Date 适合日常开发，但不适合天文历法内核。

原因包括：

```txt
历史日期支持不理想
时区模型不适合天文计算
无法表达 TT、TDB、UT1
无法自然处理 ΔT
无法表达儒略日
```

因此，Epheon 内核不应该依赖 JS Date。

JS Date 只能出现在适配层：

```txt
@epheon/compat
```

### 示例 API

```ts
const instant = Instant.fromUTC("2026-02-04T08:00:00+08:00");

instant.toJulianDay();
instant.toTT();
instant.toUTC();
instant.deltaT();
```

### 关键概念

#### UTC

民用时间。

#### TAI

国际原子时，连续均匀。

#### TT

地球时，很多天文公式以 TT 为输入。

#### UT1

与地球自转相关的时间。

#### ΔT

```txt
ΔT = TT - UT1
```

这是中国历法极其重要的量。

如果 ΔT 处理不好，节气、朔望、农历日期都可能出现误差。

---

## 4. `@epheon/reference`

### 定位

参考系与坐标系统。

### 为什么需要这一层？

天文计算里，“位置”不是一个简单的经纬度。

同一个天体的位置可能有很多表达方式：

```txt
日心坐标
地心坐标
站心坐标

黄道坐标
赤道坐标
地平坐标

J2000
Date
Mean of Date
True of Date

真位置
平位置
视位置
```

如果不单独抽象这一层，项目后期会非常混乱。

### 包含内容

```txt
ReferenceFrame
Origin
Epoch
CoordinateSystem

ICRF
J2000
MeanOfDate
TrueOfDate

Ecliptic
Equatorial
Horizontal

Precession
Nutation
Obliquity
Aberration
Parallax
```

### 职责

它负责回答：

```txt
这个坐标属于哪个参考系？
这个位置是地心还是日心？
这个黄经是真黄经还是平黄经？
这个坐标是否已经经过章动修正？
这个位置是否是视位置？
```

---

## 5. `@epheon/ephemerides`

### 定位

星历抽象层。

### 职责

定义统一的星历接口。

例如：

```ts
interface EphemerisProvider {
  position(body: Body, instant: Instant, options?: PositionOptions): Position;

  state?(body: Body, instant: Instant, options?: StateOptions): StateVector;
}
```

其中：

```txt
position
```

返回位置。

```txt
state
```

返回位置与速度。

### 为什么用复数 ephemerides？

因为 ephemeris 的复数是 ephemerides。

项目里会同时存在多种星历实现：

```txt
VSOP87
ELP2000
JPL DE440
JPL DE441
```

所以使用复数更专业。

---

## 6. `@epheon/ephemerides-vsop87`

### 定位

VSOP87 太阳与行星星历实现。

### 作用

VSOP87 用于计算太阳系行星位置。

在中国历法中，主要用于计算：

```txt
太阳位置
太阳黄经
二十四节气
```

因为从地球视角看太阳，本质上可以通过地球日心位置反推太阳地心位置。

### 适合场景

```txt
轻量计算
节气计算
普通历法应用
浏览器端运行
```

---

## 7. `@epheon/ephemerides-elp2000`

### 定位

ELP2000 月球理论实现。

### 作用

用于计算月亮位置。

在中国历法中，月亮位置用于：

```txt
朔
望
月相
农历月份
```

农历月份的核心不是查表，而是定朔。

定朔本质上是：

```txt
太阳黄经 = 月亮黄经
```

也就是：

```txt
月亮与太阳黄经差为 0
```

---

## 8. `@epheon/ephemerides-jpl`

### 定位

JPL 数值星历实现。

### 作用

JPL 星历可以作为高精度计算与标准验证来源。

支持：

```txt
DE430
DE431
DE440
DE441
```

### 适合场景

```txt
高精度计算
长时间跨度计算
标准答案生成
算法校验
```

### 注意

JPL 数据文件通常较大，因此不应该直接打包进核心代码。

应该通过独立数据包加载。

---

## 9. `@epheon/phenomena`

### 定位

天象求解层。

### 职责

从连续的天体运动中寻找特定事件。

例如：

```txt
太阳黄经达到 315° → 立春
太阳黄经达到 330° → 雨水
月亮黄经 - 太阳黄经 = 0° → 朔
月亮黄经 - 太阳黄经 = 180° → 望
```

### 包含内容

```txt
Solar Terms
New Moon
Full Moon
First Quarter
Last Quarter
Conjunction
Opposition
Sunrise
Sunset
Moonrise
Moonset
Eclipse
Root Finder
Event Search
Refinement
```

### 示例

```ts
const terms = solarTerms.ofYear(2026, {
  ephemeris,
  timezone: "Asia/Shanghai"
});
```

### 重要原则

`phenomena` 只知道天象，不知道历法。

它可以计算：

```txt
朔发生在什么时候
节气发生在什么时候
```

但它不负责判断：

```txt
哪个月是闰月
今天是农历几月几日
```

这些属于历法层。

---

## 10. `@epheon/calendars`

### 定位

历法抽象层。

### 职责

定义统一的历法接口。

```ts
interface CalendarSystem {
  fromInstant(instant: Instant): CalendarDate;
  toInstant(date: CalendarDate): Instant;
}
```

### 作用

所有具体历法都应该实现这个接口：

```txt
Gregorian Calendar
Julian Calendar
Chinese Calendar
Islamic Calendar
Hindu Calendar
```

---

## 11. `@epheon/calendar-gregorian`

### 定位

格里高利历实现。

也就是现代公历。

### 职责

```txt
公历日期
闰年
年月日转换
与 JD / Instant 互转
```

---

## 12. `@epheon/calendar-julian`

### 定位

儒略历实现。

### 为什么需要？

历史日期、古代天文事件、历法研究经常会用到儒略历。

例如：

```txt
1582 年格里高利历改革前后的日期换算
历史文献中的日期校对
古代天象记录复原
```

---

## 13. `@epheon/calendar-chinese`

### 定位

中国历法实现。

这是 Epheon 面向东亚时间体系最重要的历法应用层。

### 包含能力

```txt
农历日期
农历月份
闰月
二十四节气
干支纪年
干支纪月
干支纪日
干支纪时
```

### 不包含能力

```txt
八字十神
紫微斗数
神煞
奇门遁甲
命理解读
```

### 核心流程

中国历法的核心流程是：

```txt
计算太阳黄经
    ↓
求二十四节气
    ↓
计算太阳与月亮黄经差
    ↓
求朔
    ↓
构建农历月序
    ↓
根据中气判断闰月
    ↓
得到农历日期
```

### 规则集设计

中国历法在历史上存在规则变化，因此不应写死为唯一规则。

应该引入：

```ts
ChineseCalendarRuleSet;
```

例如：

```ts
const calendar = ChineseCalendar.create({
  ruleSet: "modern",
  timezone: "Asia/Shanghai",
  ephemeris
});
```

未来可以支持：

```txt
modern
historical
custom
```

---

# 六、数据包设计

## 为什么数据要独立？

因为天文数据有三个特点：

```txt
体积大
来源不同
更新方式不同
许可协议不同
```

所以必须独立成包。

---

## 1. `@epheon/dataset-leap-seconds`

闰秒数据。

用于：

```txt
UTC ↔ TAI
```

---

## 2. `@epheon/dataset-delta-t`

ΔT 数据与模型。

用于：

```txt
TT ↔ UT1
```

对古代历法尤其重要。

---

## 3. `@epheon/dataset-vsop87`

VSOP87 系数数据。

---

## 4. `@epheon/dataset-elp2000`

ELP2000 月球理论系数数据。

---

## 5. `@epheon/dataset-jpl-de440`

JPL DE440 数据。

---

## 6. `@epheon/dataset-jpl-de441`

JPL DE441 数据。

适合超长时间跨度计算。

---

# 七、验证体系

## 1. `@epheon/standards`

标准答案集。

它不是测试代码，而是标准数据。

来源可以包括：

```txt
JPL
NASA
IMCCE
香港天文台
紫金山天文台
权威历书
历史边界样例
```

包含：

```txt
节气标准样例
朔望标准样例
农历日期样例
ΔT 样例
闰秒样例
历法改革样例
```

---

## 2. `@epheon/conformance`

一致性测试工具。

用于验证某个实现是否符合 Epheon 标准。

例如：

```bash
epheon-conformance run
```

它可以检查：

```txt
星历 provider 是否符合接口
时间转换是否正确
节气求解是否在误差范围内
朔望求解是否在误差范围内
中国历法结果是否符合标准样例
```

---

## 3. `@epheon/benchmarks`

性能与精度基准。

用于比较：

```txt
VSOP87 vs JPL
ELP2000 vs JPL
不同求根算法性能
不同数据加载方式性能
浏览器端性能
Node 端性能
WASM 性能
```

---

# 八、兼容与运行时

## 1. `@epheon/compat`

兼容层。

负责与外部时间库、日期库交互。

支持：

```txt
JavaScript Date
Temporal API
Intl
Luxon
Day.js
date-fns
```

重要原则：

```txt
兼容层可以依赖外部日期库
内核层不依赖外部日期库
```

---

## 2. `@epheon/runtime`

运行时能力。

负责：

```txt
Node
Browser
Bun
Deno
WASM
Web Worker
缓存
流式加载
远程数据加载
本地数据加载
```

尤其是 JPL 数据这种大文件，不应该简单 import，而应该支持运行时加载。

---

## 3. `@epheon/cli`

命令行工具。

示例：

```bash
epheon jd 2026-02-04T08:00:00+08:00

epheon solar-terms 2026 --tz Asia/Shanghai

epheon lunar 2026-02-17 --tz Asia/Shanghai

epheon new-moons 2026
```

CLI 不是核心能力，而是调试、验证、展示工具。

---

# 九、工程化约束

工程化选择会影响项目能否长期维护，但它们不应该压过核心架构。

因此，本文只定义稳定约束：

```txt
Epheon 采用 TypeScript monorepo。
Epheon 以 npm package 作为主要分发单元。
核心包必须保持清晰的依赖边界。
核心历法与天文内核不直接依赖外部日期库。
算法包与数据包独立发布。
验证体系是项目的一等工程目标。
```

具体工程选择包括：

```txt
包管理器
构建工具
测试框架
代码规范
CI 策略
发布策略
运行时支持矩阵
```

这些内容由独立 RFC 管理。

第一份工程化 RFC 是：

```txt
docs/rfcs/0002-engineering-foundation.md
```

工程化 RFC 可以随着项目阶段演进而修订，但不得破坏本文定义的架构原则：

```txt
标准优先
算法与数据分离
接口与实现分离
值对象与纯函数结合
单向依赖
可验证优先
```

---

# 十、依赖关系

## 总体依赖方向

Epheon 必须保持单向依赖。

```txt
@epheon/spec
    ↓
@epheon/primitives
    ↓
@epheon/temporal
    ↓
@epheon/reference
    ↓
@epheon/ephemerides
    ↓
@epheon/phenomena
    ↓
@epheon/calendars
    ↓
@epheon/calendar-chinese
```

## 数据包关系

数据包不主动依赖算法包。

```txt
dataset-* 被算法包读取
```

而不是：

```txt
dataset-* 调用算法
```

## 验证包关系

验证包不参与运行时。

```txt
standards
conformance
benchmarks
```

只用于：

```txt
开发
测试
CI
生态验证
```

---

# 十一、设计边界

## Epheon 应该提供

```txt
时间模型
JD / JDE
UTC / TAI / TT / TDB / UT1
ΔT
闰秒
参考系
坐标转换
太阳位置
月亮位置
行星位置
二十四节气
朔望
公历
儒略历
农历
闰月
干支纪年
干支纪月
干支纪日
干支纪时
```

## Epheon 不应该提供

```txt
八字
十神
大运
流年分析
紫微斗数
奇门遁甲
六壬
六爻
神煞
命理解读
风水择日
```

---

# 十二、推荐开发顺序

## 第一阶段：时间模型

优先实现：

```txt
@epheon/primitives
@epheon/temporal
```

目标：

```txt
稳定表达 Instant
支持 JD
支持 UTC / TT
支持 ΔT
```

---

## 第二阶段：参考系与太阳

实现：

```txt
@epheon/reference
@epheon/ephemerides
@epheon/ephemerides-vsop87
```

目标：

```txt
计算太阳黄经
求二十四节气
```

---

## 第三阶段：月球与朔望

实现：

```txt
@epheon/ephemerides-elp2000
@epheon/phenomena
```

目标：

```txt
求朔
求望
求月相
```

---

## 第四阶段：中国历法

实现：

```txt
@epheon/calendars
@epheon/calendar-chinese
```

目标：

```txt
农历日期
闰月
干支
```

---

## 第五阶段：验证体系

实现：

```txt
@epheon/standards
@epheon/conformance
@epheon/benchmarks
```

目标：

```txt
证明计算结果可信
```

---

## 第六阶段：兼容与工具

实现：

```txt
@epheon/compat
@epheon/runtime
@epheon/cli
```

目标：

```txt
提升易用性
支持不同运行环境
```

---

# 十三、项目最终目标

Epheon 最终希望成为：

```txt
东亚时间体系的天文历法内核
```

它应该像：

```txt
Astropy
Skyfield
Swiss Ephemeris
```

那样，成为一个被长期依赖的基础设施。

不是一个临时 npm 包。

不是一个查表农历库。

不是一个术数工具包。

而是一个：

```txt
标准驱动
数据可替换
算法可验证
模型可扩展
生态可依赖
```

的现代天文历法引擎。

---

# 十四、核心宣言

```txt
Time is the foundation.
Astronomy defines time.
Calendars interpret time.
```

中文可以表达为：

```txt
时间是基础。
天文定义时间。
历法解释时间。
```

Epheon 的使命，就是在这三者之间建立一套清晰、可靠、现代化的工程体系。
