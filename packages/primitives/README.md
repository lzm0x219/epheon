# @epheon/primitives

Epheon 最底层的基础值类型包。提供角度、时长、误差容忍度、Result 错误模型等通用数学原语，是下游所有包的共同语言。

## 设计原则

- **零运行时依赖**：不依赖任何第三方 npm 包，也不依赖 `@epheon/temporal`。
- **领域无关**：不含任何天文术语、历法术语。角度就是角度，时长就是时长。
- **不可变值对象**：所有类型为不可变 class，运算方法返回新对象。内部字段使用 `readonly` 私有存储。
- **双层 API**：`fromXxx()` 抛出异常，`parseXxx()` 返回 `Result<T, E>`。调用方可根据场景自由选择。
- **NaN/Infinity 拒绝**：所有构造路径拒绝非有限数值，通过结构化 `PrimitiveError` 表达。

## 安装

```bash
pnpm add @epheon/primitives
```

## 导出清单

```ts
import {
  Angle,
  Duration,
  PrimitiveError,
  type PrimitiveErrorCode,
  type Result,
  type Ok,
  type Err,
  ok,
  err,
  isOk,
  isErr,
  type Tolerance,
  almostEqual
} from "@epheon/primitives";
```

## Angle（角度）

表示一个不可变角度值。内部统一以弧度存储，构造时**不自动归一化**，因此可以安全表达累计转角、角度差值等带方向和圈数语义的值。

### 构造

```ts
const deg = Angle.fromDegrees(370); // 抛异常式
const rad = Angle.fromRadians(Math.PI);
const turn = Angle.fromTurns(0.5); // 半圈 = 180°
const min = Angle.fromArcminutes(60); // 60 角分 = 1°
const sec = Angle.fromArcseconds(3600); // 3600 角秒 = 1°

// Result 式（不抛异常）
const result = Angle.parseDegrees(370);
if (result.ok) {
  console.log(result.value.toRadians());
}
```

### 输出与转换

| 方法             | 返回     | 说明                    |
| ---------------- | -------- | ----------------------- |
| `toDegrees()`    | `number` | 角度制                  |
| `toRadians()`    | `number` | 弧度制                  |
| `toTurns()`      | `number` | 整圈数（1 turn = 360°） |
| `toArcminutes()` | `number` | 角分（1° = 60'）        |
| `toArcseconds()` | `number` | 角秒（1° = 3600"）      |

### 归一化

| 方法                       | 区间          | 说明                         |
| -------------------------- | ------------- | ---------------------------- |
| `normalizeDegrees()`       | `[0, 360)`    | 非负角度归一化               |
| `normalizeRadians()`       | `[0, 2π)`     | 非负弧度归一化               |
| `normalizeTurns()`         | `[0, 1)`      | 非负圈数归一化               |
| `normalizeSignedDegrees()` | `[-180, 180)` | 有符号归一化，适合最短方向差 |

### 算术运算

```ts
const a = Angle.fromDegrees(30);
const b = Angle.fromDegrees(45);

a.add(b); // 75°
a.subtract(b); // -15°
a.multiply(2); // 60°
a.divide(2); // 15°
a.negate(); // -30°
a.abs(); // 30°（取绝对值）
```

> 所有运算返回新对象，原对象不受影响。

### 比较

```ts
a.equals(b); // 严格数值相等
a.almostEquals(b, { absolute: 1e-12 }); // 近似相等，必须显式传入 tolerance
```

## Duration（时长）

表示一段固定长度的物理时间间隔。内部以秒存储。**不表达**月份、民用年份、夏令时等非固定长度概念。

### 构造

```ts
const s = Duration.fromSeconds(60);
const ms = Duration.fromMilliseconds(1500);
const d = Duration.fromDays(1); // 1 日 = 86400 秒（固定）
const jy = Duration.fromJulianYears(1); // 1 儒略年 = 365.25 日
const jc = Duration.fromJulianCenturies(1); // 1 儒略世纪 = 36525 日
```

### 输出与转换

| 方法                  | 返回     | 换算       |
| --------------------- | -------- | ---------- |
| `toSeconds()`         | `number` | —          |
| `toMilliseconds()`    | `number` | ×1000      |
| `toDays()`            | `number` | ÷86400     |
| `toJulianYears()`     | `number` | ÷365.25 日 |
| `toJulianCenturies()` | `number` | ÷36525 日  |

### 算术运算与比较

与 `Angle` 相同：`add`、`subtract`、`multiply`、`divide`、`negate`、`abs`、`equals`、`almostEquals`。

## Tolerance（误差容忍度）

```ts
type Tolerance = {
  readonly absolute: number; // 绝对误差上限（必填）
  readonly relative?: number; // 相对误差上限（可选）
};
```

### almostEqual

```ts
import { almostEqual } from "@epheon/primitives";

almostEqual(1, 1.001, { absolute: 0.01 }); // true
almostEqual(1000, 1001, { absolute: 0, relative: 0.002 }); // true（相对误差 0.1% < 0.2%）
almostEqual(1, 1.1, { absolute: 0.01 }); // false
```

比较逻辑：先检查绝对误差，若未通过且有相对误差定义，则按 `|a-b| ≤ max(|a|,|b|) × relative` 检查。

## Result<T, E>（可恢复错误）

```ts
import { ok, err, isOk, isErr } from "@epheon/primitives";

function parse(input: string): Result<number, PrimitiveError> {
  const n = Number(input);
  if (Number.isNaN(n)) return err(new PrimitiveError("InvalidNumber", "bad input"));
  return ok(n);
}

const result = parse("42");
if (isOk(result)) {
  console.log(result.value); // 42
} else {
  console.log(result.error.code); // "InvalidNumber"
}
```

## PrimitiveError（结构化错误）

```ts
class PrimitiveError extends Error {
  readonly code: "DivisionByZero" | "InvalidNumber" | "InvalidTolerance";
  readonly name: "PrimitiveError";
}
```

`fromXxx()` 构造方法抛出 `PrimitiveError`，`parseXxx()` 将其放入 `Result` 的 `Err` 分支。

| 错误码             | 触发场景                               |
| ------------------ | -------------------------------------- |
| `InvalidNumber`    | 传入 NaN、+Infinity、-Infinity         |
| `DivisionByZero`   | `divide(0)`                            |
| `InvalidTolerance` | tolerance.absolute 或 .relative 为负数 |

## 许可

MIT
