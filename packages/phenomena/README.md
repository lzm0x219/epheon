# @epheon/phenomena

Epheon 的天象求解层。当前只提供第二阶段最小节气求解能力，从连续太阳黄经中搜索
24 个离散节气事件。

## 设计原则

- **先打通最小链路**：当前只实现 `solarTermsOfYear()`。
- **输入输出使用 Instant**：公共 API 不暴露裸 Julian 数值。
- **显式依赖 provider**：太阳位置、闰秒与 Delta-T 都由调用方注入。

## 导出清单

```ts
import {
  SolarTermName,
  solarTermsOfYear,
  type PhenomenaContext,
  type SolarTermEvent
} from "@epheon/phenomena";
```

## 使用方式

```ts
import { createDeltaTProvider } from "@epheon/dataset-delta-t";
import { createLeapSecondProvider } from "@epheon/dataset-leap-seconds";
import { createVSOP87SunProvider } from "@epheon/ephemerides-vsop87";
import { solarTermsOfYear } from "@epheon/phenomena";

const terms = solarTermsOfYear(2025, {
  ephemeris: createVSOP87SunProvider(),
  leapSeconds: createLeapSecondProvider(),
  deltaT: createDeltaTProvider()
});
```

## 当前实现说明

- 当前算法先按 1 日步进寻找目标黄经的包围区间，再用二分法细化到秒级。
- 当前节气求解显式请求太阳地心视黄经：`Body.Sun + TrueOfDateEcliptic`。
- 朔望、上弦下弦、日出日落、食等事件留到后续阶段。

## 许可

MIT
