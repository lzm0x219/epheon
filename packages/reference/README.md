# @epheon/reference

Epheon 的坐标与参考系值对象包。提供天体标识、球面坐标、距离、位置与参考系等不可变值对象，供星历查询和天象求解使用。

## 设计原则

- **纯值对象层**：不包含算法或星历计算，只承载类型与值。
- **不可变性**：所有值对象构造后不可修改。
- **零运行时依赖**：不读文件系统、不发网络请求、不查系统时区。
- **最小依赖链**：只依赖 `@epheon/primitives`（Angle、Tolerance）。

## 安装

```bash
pnpm add @epheon/reference
```

## 导出清单

```ts
import {
  // 天体标识
  Body,
  type Body,
  // 坐标系统
  CoordinateSystem,
  type CoordinateSystem,
  // 球面坐标
  SphericalCoordinates,
  type SphericalCoordinatesInput,
  // 距离（AU）
  Distance,
  // 坐标原点
  Origin,
  type Origin,
  // 完整位置
  Position,
  type PositionInput,
  // 参考系
  ReferenceFrame
} from "@epheon/reference";
```

## API 参考

### Body（天体标识）

```ts
Body.Sun; // "SUN"
Body.Moon; // "MOON"
Body.Mercury; // "MERCURY"
Body.Venus; // "VENUS"
Body.Earth; // "EARTH"
Body.Mars; // "MARS"
Body.Jupiter; // "JUPITER"
Body.Saturn; // "SATURN"
Body.Uranus; // "URANUS"
Body.Neptune; // "NEPTUNE"
```

`Body` 同时声明为 const 对象（运行时值）和同名 type（字面量联合），典型用法：

```ts
// 作为值使用
ephemeris.position(Body.Sun, instant, options);

// 作为类型使用
function handle(body: Body): void { ... }
```

### CoordinateSystem（坐标系统）

| 预设         | 含义   |
| ------------ | ------ |
| `Ecliptic`   | 黄道系 |
| `Equatorial` | 赤道系 |
| `Horizontal` | 地平系 |

### Origin（坐标原点）

| 预设           | 含义 |
| -------------- | ---- |
| `Heliocentric` | 日心 |
| `Geocentric`   | 地心 |

### SphericalCoordinates（球面坐标）

```ts
// 从 Angle 对象创建
SphericalCoordinates.from({
  longitude: Angle.fromDegrees(120),
  latitude: Angle.fromDegrees(30)
});

// 从度数值创建
SphericalCoordinates.from({
  longitudeDegrees: 120,
  latitudeDegrees: 30,
  distance: Distance.fromAU(1.5) // 可选
});
```

| 方法 / 属性          | 说明                                |
| -------------------- | ----------------------------------- |
| `from(input)`        | 从 `SphericalCoordinatesInput` 创建 |
| `.longitude`         | 经度（Angle）                       |
| `.latitude`          | 纬度（Angle）                       |
| `.distance`          | 可选距离（Distance \| undefined）   |
| `.equals(other)`     | 严格相等比较                        |
| `.almostEquals(o,t)` | 使用显式 tolerance 比较             |

### Distance（AU 距离）

```ts
const dist = Distance.fromAU(1.5);
dist.toAU(); // 1.5
dist.multiply(2); // Distance { 3.0 AU }
dist.divide(2); // Distance { 0.75 AU }
dist.equals(other); // 严格相等
dist.almostEquals(other, tolerance); // tolerance 比较
```

`fromAU` 和 `parseAU` 构成双层 API：前者抛出异常，后者返回 `Result<Distance, PrimitiveError>`。

### Position（完整位置）

```ts
const pos = Position.from({
  coordinates: SphericalCoordinates.from({ longitudeDegrees: 100, latitudeDegrees: 0 }),
  frame: ReferenceFrame.TrueOfDateEcliptic,
  origin: Origin.Geocentric
});

pos.coordinates; // SphericalCoordinates
pos.frame; // ReferenceFrame
pos.origin; // Origin
pos.equals(other);
pos.almostEquals(other, tolerance);
```

### ReferenceFrame（参考系）

三个预设帧：

| 预设                  | 坐标系统   | 历元    | 说明             |
| --------------------- | ---------- | ------- | ---------------- |
| `ReferenceFrame.ICRS` | Equatorial | J2000.0 | ICRS 固定历元帧  |
| `MeanOfDateEcliptic`  | Ecliptic   | 瞬时    | 当日平春分点黄道 |
| `TrueOfDateEcliptic`  | Ecliptic   | 瞬时    | 当日真春分点黄道 |

```ts
frame.name; // 稳定名称，如 "ICRS"
frame.coordinateSystem; // CoordinateSystem
frame.epoch; // JulianEphemerisDay | undefined（瞬时帧无历元）
frame.equals(other); // 严格相等比较
```

## 使用示例

### 星历查询

```ts
import { Body, ReferenceFrame } from "@epheon/reference";

const position = ephemeris.position(Body.Sun, instant, {
  frame: ReferenceFrame.TrueOfDateEcliptic
});

console.log(position.coordinates.longitude.toDegrees());
```

### 位置比较

```ts
import { Tolerance } from "@epheon/primitives";

const tolerance = Tolerance.fromArcseconds(1);
if (pos1.almostEquals(pos2, tolerance)) {
  // 在 1 角秒精度内位置相同
}
```

## 内部模块

`src/internal/cartesian.ts` 提供球面 ↔ 笛卡尔坐标转换工具，当前不导出到公共入口。当出现多个包需要复用时再考虑提升为公共 API。

## 当前暂缓

- 站心坐标（Topocentric）—— 暂无需求
- 质心坐标（Barycentric）—— 暂无需求
- `fromKilometers` 距离构造 —— 属于后续展示/兼容层需求
- 速度分量（Velocity）—— 后续高精度模型再考虑

## 许可

MIT
