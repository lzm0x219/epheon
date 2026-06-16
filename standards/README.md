# Epheon Standards（标准答案集）

## 定位

`standards/` 存放 Epheon 各个领域模块的参考数值与预期结果，简称 fixture。

fixture 用于：

- 包级单元测试验证正确性
- `conformance/` 一致性校验
- 不同实现（TypeScript、Python、Rust）之间的交叉验证

fixture 不用于：

- 大型天文数据集（进入未来的 `@epheon/dataset-*` 包）
- 运行时数据（内核不应读取 `standards/`）

## 目录结构

```
standards/
├── README.md             # 本文件
├── primitives/           # @epheon/primitives 的参考数值
│   ├── angles.json       # 角度转换与归一化样例
│   ├── durations.json    # 时长转换样例
│   └── vectors.json      # 三维向量运算样例
├── reference/            # 坐标与参考系参考数值
│   ├── coordinates.json  # 球面坐标与内部笛卡尔转换样例
│   └── frames.json       # ReferenceFrame 预设帧样例
├── solar/                # 太阳黄经与二十四节气参考数值
│   ├── longitudes.json   # 太阳视黄经样例
│   └── terms.json        # 二十四节气时刻样例
└── temporal/             # @epheon/temporal 的参考数值
    ├── julian-days.json        # Julian Day 转换样例
    ├── time-scales.json        # 时间尺度转换样例
    └── utc-invalid-inputs.json # 非法 UTC 输入样例
```

## 字段约定

每个 fixture 文件使用该领域最自然的 schema，而非统一的泛型模版。

为避免随着目录增多后出现大量 `foo[].bar.baz` 形式的长路径，下面统一按三层展示：

- `根结构`：文件顶层字段，先快速说明这个文件装了什么
- `条目字段`：数组元素或顶层对象的直接字段
- `内嵌对象字段`：只有存在对象嵌套时才展开

### 快速索引

| 文件                               | 根结构                             | 说明                  |
| ---------------------------------- | ---------------------------------- | --------------------- |
| `primitives/angles.json`           | `conversions[]`、`normalization[]` | 角度单位转换与归一化  |
| `primitives/durations.json`        | `conversions[]`                    | 时长单位转换          |
| `primitives/vectors.json`          | `vectors[]`、`operations[]`        | 向量数值与运算结果    |
| `reference/coordinates.json`       | `coordinates[]`                    | 球面坐标与笛卡尔转换  |
| `reference/frames.json`            | `frames[]`                         | 预设参考系定义        |
| `solar/longitudes.json`            | `solarLongitudes[]`                | 太阳视黄经参考样例    |
| `solar/terms.json`                 | `solarTerms[]`                     | 二十四节气时刻样例    |
| `temporal/julian-days.json`        | `utcInstants[]`                    | UTC 与 JD 映射        |
| `temporal/time-scales.json`        | `timeScaleConversions[]`           | UTC 与各时间尺度转换  |
| `temporal/utc-invalid-inputs.json` | `utcDateTimes[]`                   | 非法 UTC 输入与错误码 |

### `primitives/angles.json`

根结构：`{ conversions: AngleConversion[]; normalization: AngleNormalization[] }`

`conversions[]`

| 字段         | 类型   | 说明 |
| ------------ | ------ | ---- |
| `degrees`    | number | 度数 |
| `radians`    | number | 弧度 |
| `turns`      | number | 圈数 |
| `arcminutes` | number | 角分 |
| `arcseconds` | number | 角秒 |

`normalization[]`

| 字段                | 类型   | 说明                     |
| ------------------- | ------ | ------------------------ |
| `degrees`           | number | 原始角度                 |
| `normalizedDegrees` | number | `[0°, 360°)` 归一化结果  |
| `signedDegrees`     | number | `[-180°, 180°)` 归约结果 |

### `primitives/durations.json`

根结构：`{ conversions: DurationConversion[] }`

`conversions[]`

| 字段              | 类型   | 说明                 |
| ----------------- | ------ | -------------------- |
| `seconds`         | number | 秒（basis unit）     |
| `milliseconds`    | number | 毫秒                 |
| `days`            | number | 日                   |
| `julianYears`     | number | 儒略年（365.25 日）  |
| `julianCenturies` | number | 儒略世纪（36525 日） |

### `primitives/vectors.json`

根结构：`{ vectors: VectorSample[]; operations: VectorOperation[] }`

`vectors[]`

| 字段        | 类型   | 说明                                 |
| ----------- | ------ | ------------------------------------ |
| `x`         | number | X 分量                               |
| `y`         | number | Y 分量                               |
| `z`         | number | Z 分量                               |
| `magnitude` | number | 欧几里得范数 `sqrt(x^2 + y^2 + z^2)` |

`operations[]`

| 字段       | 类型   | 说明                 |
| ---------- | ------ | -------------------- |
| `a`        | object | 运算的第一个向量     |
| `b`        | object | 运算的第二个向量     |
| `add`      | object | `a + b` 结果向量     |
| `subtract` | object | `a - b` 结果向量     |
| `dot`      | number | `a · b` 点积         |
| `cross`    | object | `a × b` 叉积结果向量 |

`operations[].a`、`operations[].b`、`operations[].add`、`operations[].subtract`、`operations[].cross`

| 字段 | 类型   | 说明   |
| ---- | ------ | ------ |
| `x`  | number | X 分量 |
| `y`  | number | Y 分量 |
| `z`  | number | Z 分量 |

### `reference/coordinates.json`

根结构：`{ coordinates: CoordinateSample[] }`

`coordinates[]`

| 字段               | 类型   | 说明                 |
| ------------------ | ------ | -------------------- |
| `longitudeDegrees` | number | 球面经度（度）       |
| `latitudeDegrees`  | number | 球面纬度（度）       |
| `distanceAu`       | number | 对应距离（AU）       |
| `cartesian`        | object | 对应的内部笛卡尔向量 |

`coordinates[].cartesian`

| 字段 | 类型   | 说明         |
| ---- | ------ | ------------ |
| `x`  | number | X 分量（AU） |
| `y`  | number | Y 分量（AU） |
| `z`  | number | Z 分量（AU） |

### `reference/frames.json`

根结构：`{ frames: ReferenceFrameSample[] }`

`frames[]`

| 字段               | 类型             | 说明                                |
| ------------------ | ---------------- | ----------------------------------- |
| `name`             | string           | 预设帧稳定名称                      |
| `coordinateSystem` | string           | 对应坐标系统                        |
| `epochJde`         | `number \| null` | 固定历元的 JDE；瞬时历元帧为 `null` |

### `temporal/julian-days.json`

根结构：`{ utcInstants: JulianDayFixture[] }`

`utcInstants[]`

| 字段        | 类型         | 说明                   |
| ----------- | ------------ | ---------------------- |
| `input`     | string       | UTC 字符串，带时区偏移 |
| `julianDay` | number       | 对应的 Julian Day 数值 |
| `basis`     | string，可选 | 数据来源或计算公式     |

### `temporal/time-scales.json`

根结构：`{ timeScaleConversions: TimeScaleConversion[] }`

`timeScaleConversions[]`

| 字段                 | 类型         | 说明                      |
| -------------------- | ------------ | ------------------------- |
| `input`              | string       | UTC 字符串，带时区偏移    |
| `julianDay`          | number       | 对应的 JD                 |
| `taiMinusUtcSeconds` | number       | `TAI - UTC`，闰秒累计偏移 |
| `deltaTSeconds`      | number       | `ΔT = TT - UT1`           |
| `ttMinusUtcSeconds`  | number       | `TT - UTC`                |
| `ut1MinusUtcSeconds` | number       | `UT1 - UTC`               |
| `julianEphemerisDay` | number       | 对应的 JDE                |
| `basis`              | string，可选 | 计算说明或公式参考        |

### `temporal/utc-invalid-inputs.json`

根结构：`{ utcDateTimes: InvalidUtcInput[] }`

`utcDateTimes[]`

| 字段    | 类型   | 说明                                |
| ------- | ------ | ----------------------------------- |
| `input` | string | 非法 UTC 字符串                     |
| `code`  | string | 预期错误码，如 `InvalidUTCDateTime` |
| `basis` | string | 该输入被判定为非法原因              |

### `solar/longitudes.json`

根结构：`{ solarLongitudes: SolarLongitudeSample[] }`

`solarLongitudes[]`

| 字段               | 类型   | 说明                         |
| ------------------ | ------ | ---------------------------- |
| `year`             | number | 样例所在公历年份             |
| `term`             | string | 对应节气名                   |
| `input`            | string | UTC 字符串，带 `Z`           |
| `longitudeDegrees` | number | 对应时刻太阳地心视黄经（度） |
| `basis`            | string | 外部参考来源与生成方法说明   |

### `solar/terms.json`

根结构：`{ solarTerms: SolarTermSample[] }`

`solarTerms[]`

| 字段                     | 类型   | 说明                             |
| ------------------------ | ------ | -------------------------------- |
| `year`                   | number | 节气所在公历年份                 |
| `name`                   | string | 节气名                           |
| `targetLongitudeDegrees` | number | 对应节气的目标黄经（度）         |
| `instant`                | string | 节气交接时刻，UTC 字符串，带 `Z` |
| `basis`                  | string | 外部参考来源与生成方法说明       |

## 维护规范

### 新增 fixture

新增领域包时，同步创建对应的 `standards/<domain>/` 目录和 fixture 文件。依照该领域最自然的 schema 组织数据，并在本 README 中补全字段说明。

### 样例要求

- 覆盖正常值和边界值
- 包含非法输入（用于验证错误处理）
- 数值转换类 fixture 依赖显式公式或已知参考源（Meeus、IERS、JPL 等），在 `basis` 字段注明
- 大型数据集（> 100 KB）不应进入 `standards/`，应放入独立的 dataset package

### 数据来源

- 转换类数值：通过已知公式（Meeus 算法、IAU 决议）计算得出，在测试中赋 tolerance
- 非法输入：根据公共 API 校验规则构造
- 外部校准来源：未来引入 JPL Horizons 等参考数据时，需在 `basis` 中记录查询参数和日期

## 使用方式

包级测试通过相对路径 `../../standards/<domain>/<fixture>.json` 读取 fixture。

例如 `packages/primitives/tests/angle.test.ts` 读取 `standards/primitives/angles.json`。
