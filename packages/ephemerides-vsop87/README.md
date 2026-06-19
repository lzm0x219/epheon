# @epheon/ephemerides-vsop87

Epheon 的第二阶段太阳位置实现包。当前只提供最小太阳 provider，用于给节气求解链路
提供可验证的太阳地心黄经输入。

## 设计原则

- **先打通最小链路**：当前只支持 `Body.Sun`。
- **遵循统一协议**：通过 `EphemerisProvider.position()` 返回 `Position`。
- **显式能力边界**：只支持 `MeanOfDateEcliptic`、`TrueOfDateEcliptic` 与
  `Precision.Standard`。

## 导出清单

```ts
import {
  createVSOP87SunProvider,
  solarEclipticLongitude,
  solarEclipticPosition,
  type SolarPositionInput
} from "@epheon/ephemerides-vsop87";
```

## 使用方式

```ts
import { createLeapSecondProvider } from "@epheon/dataset-leap-seconds";
import { Body, ReferenceFrame } from "@epheon/reference";
import { Instant } from "@epheon/temporal";
import { createVSOP87SunProvider, solarEclipticLongitude } from "@epheon/ephemerides-vsop87";

const leapSeconds = createLeapSecondProvider();
const instant = Instant.fromUTC("2024-06-20T20:51:01Z", { leapSeconds });
const provider = createVSOP87SunProvider();

const position = provider.position(Body.Sun, instant);
const apparentLongitude = solarEclipticLongitude(instant, {
  frame: ReferenceFrame.TrueOfDateEcliptic
});
```

## 当前实现说明

- 当前实现先使用低阶太阳黄经近似模型，覆盖 `standards/solar/longitudes.json`
  的 bootstrap 验证需求。
- 默认返回 `MeanOfDateEcliptic`；显式请求 `TrueOfDateEcliptic` 时会加入视黄经修正。
- 暂不支持月亮、行星、ICRS、`Precision.FastLow` 或 `Precision.High`。

## 当前验证口径

- 当前可对外说明的口径不是“完整 VSOP87 精度”，而是“当前节气链路在 fixture 覆盖年份内对照 JPL Horizons，conformance 容忍度为 ±15 分钟”。
- 这个口径来自 `@epheon/phenomena` 对节气事件的校验，不等于对任意时刻太阳位置都给出同等级别保证。
- 更完整的来源、年份覆盖和不能宣称的范围，统一参见 `standards/README.md#当前可对外说明的精度口径`。

## 许可

MIT
