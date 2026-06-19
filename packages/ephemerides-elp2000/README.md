# @epheon/ephemerides-elp2000

Epheon 的月亮星历 provider 包。当前提供最小月亮黄经输入，供朔望求解和中国历法计算使用。

## 设计原则

- **先打通最小链路**：当前只支持 `Body.Moon`。
- **遵循统一协议**：通过 `EphemerisProvider.position()` 返回 `Position`。
- **显式能力边界**：只支持 `MeanOfDateEcliptic`、`TrueOfDateEcliptic` 与 `Precision.Standard`。
- **不读外部数据源**：当前实现不读取文件系统、网络或运行时配置。

## 安装

```bash
pnpm add @epheon/ephemerides-elp2000
```

## 导出清单

```ts
import {
  createELP2000MoonProvider,
  lunarEclipticLongitude,
  lunarEclipticPosition,
  type MoonPositionInput
} from "@epheon/ephemerides-elp2000";
```

## 使用方式

```ts
import { createLeapSecondProvider } from "@epheon/dataset-leap-seconds";
import { Body, ReferenceFrame } from "@epheon/reference";
import { Instant } from "@epheon/temporal";
import { createELP2000MoonProvider, lunarEclipticLongitude } from "@epheon/ephemerides-elp2000";

const leapSeconds = createLeapSecondProvider();
const instant = Instant.fromUTC("2025-03-14T06:55:00Z", { leapSeconds });
const provider = createELP2000MoonProvider();

const position = provider.position(Body.Moon, instant);
const apparentLongitude = lunarEclipticLongitude(instant, {
  frame: ReferenceFrame.TrueOfDateEcliptic
});
```

## 当前实现说明

- 当前实现使用低阶月亮黄经周期项近似模型，目标是稳定支撑朔望与中国历法主链路。
- 默认返回 `MeanOfDateEcliptic`；显式请求 `TrueOfDateEcliptic` 时会加入当前实现支持的真黄经修正。
- 公开 helper `lunarEclipticLongitude(...)` 和 `lunarEclipticPosition(...)` 可直接用于只读计算，不必先包一层 provider。

## 当前验证口径

- 当前可对外说明的口径不是“完整 ELP2000 精度”，而是“当前月亮位置实现足以稳定支撑朔望与中国历法主链路”。
- 现有 conformance 口径落在事件层：朔望样例覆盖 2020-2025，事件时刻容忍度为 ±6 小时。
- 这个口径来自朔望与中国历法链路的回归验证，不等于对任意时刻月亮位置给出独立外部校准精度保证。
- 更完整的来源、年份覆盖和不能宣称的范围，统一参见 `standards/README.md#当前可对外说明的精度口径`。

## 当前范围

```txt
Body.Moon
ReferenceFrame.MeanOfDateEcliptic
ReferenceFrame.TrueOfDateEcliptic
Precision.Standard
```

## 当前不包含

```txt
完整 ELP2000 系数展开
其他天体
高精度 / 多精度档位
文件系统、网络或全局配置读取
```

## 许可

MIT
