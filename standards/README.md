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
└── temporal/             # @epheon/temporal 的参考数值
    ├── julian-days.json        # Julian Day 转换样例
    ├── time-scales.json        # 时间尺度转换样例
    └── utc-invalid-inputs.json # 非法 UTC 输入样例
```

## 字段约定

每个 fixture 文件使用该领域最自然的 schema，而非统一的泛型模版。当前各文件结构如下：

### `primitives/angles.json`

| 字段                                | 类型     | 说明                     |
| ----------------------------------- | -------- | ------------------------ |
| `conversions[]`                     | 对象数组 | 同一角度的多单位等价表示 |
| `conversions[].degrees`             | number   | 度数                     |
| `conversions[].radians`             | number   | 弧度                     |
| `conversions[].turns`               | number   | 圈数                     |
| `conversions[].arcminutes`          | number   | 角分                     |
| `conversions[].arcseconds`          | number   | 角秒                     |
| `normalization[]`                   | 对象数组 | 角度归一化前后的对比     |
| `normalization[].degrees`           | number   | 原始角度                 |
| `normalization[].normalizedDegrees` | number   | [0°, 360°) 归一化        |
| `normalization[].signedDegrees`     | number   | [-180°, 180°) 归约       |

### `primitives/durations.json`

| 字段                            | 类型     | 说明                     |
| ------------------------------- | -------- | ------------------------ |
| `conversions[]`                 | 对象数组 | 同一时长的多单位等价表示 |
| `conversions[].seconds`         | number   | 秒（basis unit）         |
| `conversions[].milliseconds`    | number   | 毫秒                     |
| `conversions[].days`            | number   | 日                       |
| `conversions[].julianYears`     | number   | 儒略年（365.25 日）      |
| `conversions[].julianCenturies` | number   | 儒略世纪（36525 日）     |

### `primitives/vectors.json`

| 字段                    | 类型     | 说明                         |
| ----------------------- | -------- | ---------------------------- |
| `vectors[]`             | 对象数组 | 向量样例，含分量与模长       |
| `vectors[].x`           | number   | X 分量                       |
| `vectors[].y`           | number   | Y 分量                       |
| `vectors[].z`           | number   | Z 分量                       |
| `vectors[].magnitude`   | number   | 欧几里得范数 √(x² + y² + z²) |
| `operations[]`          | 对象数组 | 向量运算对偶样例             |
| `operations[].a`        | object   | 运算的第一个向量 `{x, y, z}` |
| `operations[].b`        | object   | 运算的第二个向量 `{x, y, z}` |
| `operations[].add`      | object   | a + b 结果向量               |
| `operations[].subtract` | object   | a − b 结果向量               |
| `operations[].dot`      | number   | a · b 点积                   |
| `operations[].cross`    | object   | a × b 叉积结果向量           |

### `temporal/julian-days.json`

| 字段            | 类型     | 说明                         |
| --------------- | -------- | ---------------------------- |
| `utcInstants[]` | 对象数组 | UTC 时刻到 Julian Day 的映射 |
| `input`         | string   | UTC 字符串，带时区偏移       |
| `julianDay`     | number   | 对应的 Julian Day 数值       |
| `basis` (可选)  | string   | 数据来源或计算公式           |

### `temporal/time-scales.json`

| 字段                     | 类型     | 说明                           |
| ------------------------ | -------- | ------------------------------ |
| `timeScaleConversions[]` | 对象数组 | UTC 时刻向各时间尺度的转换结果 |
| `input`                  | string   | UTC 字符串，带时区偏移         |
| `julianDay`              | number   | 对应的 JD                      |
| `taiMinusUtcSeconds`     | number   | TAI − UTC （闰秒累计偏移）     |
| `deltaTSeconds`          | number   | ΔT = TT − UT1                  |
| `ttMinusUtcSeconds`      | number   | TT − UTC                       |
| `ut1MinusUtcSeconds`     | number   | UT1 − UTC                      |
| `julianEphemerisDay`     | number   | 对应的 JDE                     |
| `basis` (可选)           | string   | 计算说明或公式参考             |

### `temporal/utc-invalid-inputs.json`

| 字段             | 类型     | 说明                                  |
| ---------------- | -------- | ------------------------------------- |
| `utcDateTimes[]` | 对象数组 | 非法 UTC 输入与预期错误码             |
| `input`          | string   | 非法 UTC 字符串                       |
| `code`           | string   | 预期错误码（如 `InvalidUTCDateTime`） |
| `basis`          | string   | 该输入被判定为非法原因                |

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
