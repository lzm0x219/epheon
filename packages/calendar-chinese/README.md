# @epheon/calendar-chinese

Epheon 的中国历法规则包。当前提供基于天象输入的农历月表、农历日期和干支查询。

## 设计原则

- **规则层不直接算星历**：太阳、月亮、闰秒和 Delta-T 都通过 `PhenomenaContext` 注入。
- **先收口 modern 最小规则集**：当前只承诺一个明确规则切片，不提前展开历史规则。
- **只做历法，不做术数解释**：返回客观可复核的历法结果，不混入上层解释。
- **公共 API 保持只读查询**：当前不提供反向换算或统一历法抽象。

## 安装

```bash
pnpm add @epheon/calendar-chinese
```

## 导出清单

```ts
import {
  buildLunarMonthSequence,
  lunarMonthTableBetween,
  lunarMonthTableOfYear,
  lunarDateOf,
  ganzhiOf,
  HEAVENLY_STEMS,
  EARTHLY_BRANCHES,
  type ChineseLunarMonth,
  type ChineseLunarMonthTableEntry,
  type ChineseLunarDate,
  type GanzhiPillar,
  type ChineseGanzhi
} from "@epheon/calendar-chinese";
```

## 使用方式

```ts
import { createDeltaTProvider } from "@epheon/dataset-delta-t";
import { createLeapSecondProvider } from "@epheon/dataset-leap-seconds";
import { createELP2000MoonProvider } from "@epheon/ephemerides-elp2000";
import { createVSOP87SunProvider } from "@epheon/ephemerides-vsop87";
import { type EphemerisOptions } from "@epheon/ephemerides";
import { Body, type Position } from "@epheon/reference";
import { Instant } from "@epheon/temporal";
import { ganzhiOf, lunarDateOf, lunarMonthTableBetween } from "@epheon/calendar-chinese";

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

const instant = Instant.fromUTC("2024-02-10T12:00:00+08:00", {
  leapSeconds: context.leapSeconds,
  deltaT: context.deltaT
});

const lunarDate = lunarDateOf(instant, context);
const ganzhi = ganzhiOf(instant, context);
const monthTable = lunarMonthTableBetween(
  Instant.fromUTC("2024-01-01T00:00:00+08:00", {
    leapSeconds: context.leapSeconds,
    deltaT: context.deltaT
  }),
  Instant.fromUTC("2024-04-01T00:00:00+08:00", {
    leapSeconds: context.leapSeconds,
    deltaT: context.deltaT
  }),
  context
);
```

## 当前范围

```txt
农历日期
农历月表
月份编号
农历月序
闰月判定
干支纪年 / 纪月 / 纪日 / 纪时
```

## 当前干支规则

```txt
modern（最小稳定规则集）
- 纪年按立春切换
- 纪月按十二节切换，立春起寅月
- 纪日按输入 offset 对应的本地民用日切换
- 纪时按本地时区的 23:00 子时起算
```

## 当前不包含

```txt
历史规则集
农历日期到 Instant 的反向换算
@epheon/calendars 统一历法抽象
术数解释
```

## 许可

MIT
