# @epheon/phenomena

Epheon 的天象求解层。提供二十四节气与朔望事件的求解能力，基于连续天体黄经搜索离散天象事件。

## 设计原则

- **输入输出使用 Instant**：公共 API 不暴露裸 Julian 数值。
- **显式依赖 provider**：太阳/月亮位置、闰秒与 Delta-T 都由调用方注入。
- **事件驱动模型**：不返回连续曲线，只返回离散天象事件。
- **无网络/文件系统依赖**：所有计算通过注入的 provider 完成。

## 安装

```bash
pnpm add @epheon/phenomena
```

## 导出清单

```ts
import {
  // 二十四节气
  SolarTermName,
  type SolarTermName,
  solarTermsOfYear,
  type SolarTermEvent,
  // 朔望
  LunarPhaseKind,
  type LunarPhaseKind,
  findLunarPhaseBetween,
  type LunarPhaseEvent,
  // 共享
  type PhenomenaContext
} from "@epheon/phenomena";
```

## API 参考

### PhenomenaContext（求解上下文）

节气与朔望求解都需要的最小上下文：

```ts
type PhenomenaContext = {
  readonly ephemeris: EphemerisProvider; // 太阳/月亮位置 provider
  readonly leapSeconds: LeapSecondProvider; // 闰秒 provider
  readonly deltaT: DeltaTProvider; // Delta-T provider
};
```

### 二十四节气

#### SolarTermName（节气名称）

```ts
SolarTermName.XiaoHan; // "小寒"
SolarTermName.DaHan; // "大寒"
SolarTermName.LiChun; // "立春"
SolarTermName.YuShui; // "雨水"
SolarTermName.JingZhe; // "惊蛰"
SolarTermName.ChunFen; // "春分"
SolarTermName.QingMing; // "清明"
SolarTermName.GuYu; // "谷雨"
SolarTermName.LiXia; // "立夏"
SolarTermName.XiaoMan; // "小满"
SolarTermName.MangZhong; // "芒种"
SolarTermName.XiaZhi; // "夏至"
SolarTermName.XiaoShu; // "小暑"
SolarTermName.DaShu; // "大暑"
SolarTermName.LiQiu; // "立秋"
SolarTermName.ChuShu; // "处暑"
SolarTermName.BaiLu; // "白露"
SolarTermName.QiuFen; // "秋分"
SolarTermName.HanLu; // "寒露"
SolarTermName.ShuangJiang; // "霜降"
SolarTermName.LiDong; // "立冬"
SolarTermName.XiaoXue; // "小雪"
SolarTermName.DaXue; // "大雪"
SolarTermName.DongZhi; // "冬至"
```

#### solarTermsOfYear(year, context)

返回指定 UTC 公历年份内的 24 个节气事件，按时刻升序排列。

```ts
const terms = solarTermsOfYear(2025, context);

for (const term of terms) {
  console.log(term.name); // "立春"
  console.log(term.targetLongitude); // Angle { 315° }
  console.log(term.instant); // Instant
}
```

**算法**：按 1 日步进找到目标黄经的包围区间，再用二分法细化到秒级。显式请求太阳地心视黄经 `Body.Sun + TrueOfDateEcliptic`。

### 朔望

#### LunarPhaseKind（朔望类型）

```ts
LunarPhaseKind.NewMoon; // "NEW_MOON"  — 朔（日月黄经差 0°）
LunarPhaseKind.FullMoon; // "FULL_MOON" — 望（日月黄经差 180°）
```

#### findLunarPhaseBetween(kind, start, end, context)

在给定时间窗内寻找一个朔或望事件。

```ts
const start = Instant.fromUTC("2025-01-01T00:00:00Z", {
  leapSeconds: createLeapSecondProvider(),
  deltaT: createDeltaTProvider()
});
const end = Instant.fromUTC("2025-02-01T00:00:00Z", {
  leapSeconds: createLeapSecondProvider(),
  deltaT: createDeltaTProvider()
});

const newMoon = findLunarPhaseBetween(LunarPhaseKind.NewMoon, start, end, context);
console.log(newMoon.instant); // Instant — 朔时刻
console.log(newMoon.targetLongitudeDifference); // Angle { 0° }
```

**算法**：按 6 小时步进找到日月黄经差包围区间，再用二分法细化到秒级。

## 使用示例

### 完整 setup

```ts
import { createDeltaTProvider } from "@epheon/dataset-delta-t";
import { createLeapSecondProvider } from "@epheon/dataset-leap-seconds";
import { createVSOP87SunProvider } from "@epheon/ephemerides-vsop87";
import { createELP2000MoonProvider } from "@epheon/ephemerides-elp2000";
import { Body, type Position } from "@epheon/reference";
import { Instant } from "@epheon/temporal";
import { type EphemerisOptions } from "@epheon/ephemerides";
import { solarTermsOfYear, findLunarPhaseBetween, LunarPhaseKind } from "@epheon/phenomena";

const sunProvider = createVSOP87SunProvider();
const moonProvider = createELP2000MoonProvider();

const context = {
  ephemeris: {
    position(body: Body, instant: Instant, options?: EphemerisOptions): Position {
      return body === Body.Sun
        ? sunProvider.position(body, instant, options)
        : moonProvider.position(body, instant, options);
    }
  },
  leapSeconds: createLeapSecondProvider(),
  deltaT: createDeltaTProvider()
};

// 节气查询
const terms2025 = solarTermsOfYear(2025, context);

// 朔望查询
const newMoons2025: Instant[] = [];
let cursorMs = Date.UTC(2025, 0, 1);
const yearEnd = Date.UTC(2026, 0, 1);

while (cursorMs < yearEnd) {
  const start = Instant.fromUTC(new Date(cursorMs).toISOString(), context);
  const end = Instant.fromUTC(new Date(cursorMs + 35 * 24 * 60 * 60 * 1000).toISOString(), context);
  const phase = findLunarPhaseBetween(LunarPhaseKind.NewMoon, start, end, context);
  // ... 收集结果
}
```

## 当前实现说明

- **节气**：按 1 日步进 + 二分法细化到秒级。
- **朔望**：按 6 小时步进 + 二分法细化到秒级。
- 当前使用 VSOP87（太阳）与 ELP2000（月亮）的低阶近似模型，精度已验证通过 JPL Horizons 校准。
- 上弦下弦、日出日落、食等事件留到后续阶段。

## 许可

MIT
