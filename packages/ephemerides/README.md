# @epheon/ephemerides

Epheon 的星历 provider 抽象层。该包只定义统一协议、精度标签和结构化错误，不包含
VSOP87、ELP2000、JPL 或任何具体算法实现。

## 设计原则

- **接口与实现分离**：调用方只依赖 `EphemerisProvider`。
- **最小公共面**：只导出 provider 协议、options、precision 与错误模型。
- **无运行时副作用**：不读取文件系统、网络或全局配置。

## 导出清单

```ts
import {
  EphemerisError,
  Precision,
  resolveEphemerisOptions,
  type EphemerisOptions,
  type EphemerisProvider
} from "@epheon/ephemerides";
```

## 使用方式

```ts
import {
  Body,
  Distance,
  Origin,
  Position,
  ReferenceFrame,
  SphericalCoordinates
} from "@epheon/reference";
import type { Instant } from "@epheon/temporal";
import {
  EphemerisError,
  Precision,
  resolveEphemerisOptions,
  type EphemerisProvider
} from "@epheon/ephemerides";

const sunOnlyProvider: EphemerisProvider = {
  position(body: Body, instant: Instant, options) {
    const resolved = resolveEphemerisOptions(options);

    if (body !== Body.Sun) {
      throw new EphemerisError("UnsupportedBody", `Unsupported body: ${body}.`);
    }

    if (!resolved.frame.equals(ReferenceFrame.MeanOfDateEcliptic)) {
      throw new EphemerisError("InvalidFrame", `Unsupported frame: ${resolved.frame.name}.`);
    }

    if (resolved.precision !== Precision.Standard) {
      throw new EphemerisError(
        "UnsupportedPrecision",
        `Unsupported precision: ${resolved.precision}.`
      );
    }

    return Position.from({
      coordinates: SphericalCoordinates.from({
        longitudeDegrees: 90,
        latitudeDegrees: 0,
        distance: Distance.fromAU(1)
      }),
      frame: resolved.frame,
      origin: Origin.Geocentric
    });
  }
};
```

## 许可

MIT
