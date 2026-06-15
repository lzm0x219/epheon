# Epheon 第二阶段任务计划

第二阶段把第一阶段的时间内核向上扩展到坐标模型、星历 provider、参考数据、天象事件求解和中国历法。本文只定义执行顺序和任务边界；公共 API、包边界、数据来源和精度策略仍以 RFC 为准。

## 一、阶段范围

第二阶段进入：

```txt
@epheon/reference
@epheon/ephemerides
@epheon/ephemerides-vsop87
@epheon/dataset-delta-t
@epheon/dataset-leap-seconds
@epheon/phenomena
standards/solar/
standards/lunar/
```

第二阶段暂不进入：

```txt
完整 VSOP87 行星实现
ELP2000 完整月球理论
JPL 星历
CLI
Playground
时区数据库
历史历法改革规则
术数解释
```

## 二、进入条件

第一阶段已经完成并通过：

```bash
CI=true pnpm lint
CI=true pnpm format:check
CI=true pnpm typecheck
CI=true pnpm test
CI=true pnpm build
```

第二阶段已具备的设计输入：

| RFC  | 文件                                           | 用途                                                 |
| ---- | ---------------------------------------------- | ---------------------------------------------------- |
| 0005 | `docs/rfcs/0005-coordinate-reference-model.md` | 定义 reference 包的坐标、参考系、距离和天体枚举      |
| 0006 | `docs/rfcs/0006-ephemeris-provider.md`         | 定义 ephemerides 包的 provider、precision 和错误模型 |

仍需先写 RFC 的主题：

| RFC  | 主题                   | 阻塞任务 |
| ---- | ---------------------- | -------- |
| 0007 | 天象事件求解           | C5、C6   |
| 0008 | Delta-T 与闰秒数据模型 | C3       |

## 三、执行原则

第二阶段继续遵守以下原则：

```txt
先 RFC，再公共 API。
先 standards，再实现。
先最小可验证链路，再扩展算法覆盖面。
新增 package 沿用 primitives 和 temporal 的目录结构。
公共入口只导出稳定类型，internal 不跨包引用。
const 对象替代 enum，与 isolatedModules 兼容。
```

## 四、任务总览

| 任务 | 大小 | 前置条件                  | 输出                                                        |
| ---- | ---- | ------------------------- | ----------------------------------------------------------- |
| B3   | M    | C4、D1                    | RFC 0007 天象事件求解                                       |
| B4   | M    | 无                        | RFC 0008 Delta-T 与闰秒数据模型                             |
| C1   | M    | RFC 0005                  | `@epheon/reference`                                         |
| C2   | M    | RFC 0006、C1              | `@epheon/ephemerides`                                       |
| C3   | M    | B4                        | `@epheon/dataset-delta-t` 与 `@epheon/dataset-leap-seconds` |
| C4   | M    | C1、C2、D1                | 太阳黄经最小 provider                                       |
| C5   | M    | B3、C3、C4                | 二十四节气求解                                              |
| C6   | L    | B3、C3、月亮黄经 provider | 朔望求解                                                    |
| C7   | XL   | C5、C6                    | 中国历法规则包                                              |
| D1   | M    | 无                        | 外部参考数据 bootstrap                                      |

## 五、任务详情

### B3：RFC 0007 天象事件求解

文件：`docs/rfcs/0007-phenomena-events.md`

说明：C4 和 D1 产出太阳黄经能力与验证数据后，再起草天象事件 RFC。这样可以用实测 fixture 反推可承诺的 tolerance，避免先写一个不落地的精度目标。

验收标准：

- 明确二十四节气的黄经定义：0°、15°、30°，直到 345°
- 明确求解算法：默认二分法，Newton 法留作优化
- 明确输入时间尺度、Delta-T 进入方式和输出 `Instant`
- 明确朔望事件的角度条件和月亮黄经 provider 需求
- 通过 `CI=true pnpm format:check`
- 不创建新 package

### B4：RFC 0008 Delta-T 与闰秒数据模型

文件：`docs/rfcs/0008-delta-t-leap-second-data.md`

验收标准：

- 明确 Delta-T 与 leap second 的数据来源
- 明确数据更新节奏、覆盖范围和版本标识
- 明确 provider 工厂函数返回 `DeltaTProvider` 与 `LeapSecondProvider`
- 明确 dataset package 不成为核心运行时隐式依赖
- 通过 `CI=true pnpm format:check`
- 不创建新 package

### C1：新建 `@epheon/reference`

文件范围：`packages/reference/`

遵循 RFC 0005。该包只承载坐标和参考系语义，不实现星历算法。

最小目录结构：

```txt
packages/reference/
├── package.json
├── tsconfig.json
├── tsdown.config.ts
├── moon.yml
├── src/
│   ├── index.ts
│   ├── reference-frame.ts
│   ├── body.ts
│   ├── coordinate.ts
│   ├── position.ts
│   ├── distance.ts
│   └── internal/
│       └── cartesian.ts
└── tests/
```

验收标准：

- `ReferenceFrame`、`Body`、`CoordinateSystem`、`Origin`、`SphericalCoordinates`、`Position`、`Distance` 从公共入口导出
- 值对象不可变，公共构造采用 `fromXxx` / `parseXxx` 双层 API
- 内部 Cartesian 转换不从主入口导出
- 测试优先读取 `standards/reference/`
- 公共 API 含中文 TSDoc
- `CI=true pnpm typecheck`、`CI=true pnpm test`、`CI=true pnpm build` 通过

### C2：新建 `@epheon/ephemerides`

文件范围：`packages/ephemerides/`

该包只定义抽象接口，不包含具体星历算法。

最小目录结构：

```txt
packages/ephemerides/
├── package.json
├── tsconfig.json
├── tsdown.config.ts
├── moon.yml
├── src/
│   ├── index.ts
│   ├── ephemeris-provider.ts
│   ├── precision.ts
│   └── errors.ts
└── tests/
```

验收标准：

- `EphemerisProvider`、`EphemerisOptions`、`Precision`、`EphemerisError` 从公共入口导出
- 不包含 VSOP87、ELP2000、JPL 或任何具体算法
- 不读取文件系统、网络或全局配置
- `CI=true pnpm typecheck`、`CI=true pnpm test`、`CI=true pnpm build` 通过

### C3：新建 dataset package

文件范围：

```txt
packages/dataset-delta-t/
packages/dataset-leap-seconds/
```

验收标准：

- `dataset-delta-t` 暴露 `createDeltaTProvider()`
- `dataset-leap-seconds` 暴露 `createLeapSecondProvider()`
- package README 记录数据来源、覆盖范围、更新时间和误差说明
- 数据文件放在 package 内部，不进入核心算法包
- 不让核心包隐式加载 dataset

### C4：太阳黄经最小 provider

文件范围：`packages/ephemerides-vsop87/`

说明：实现太阳黄经最小能力，目标是让节气求解有可验证的太阳位置输入。具体算法名称和精度上限以 RFC 0006 与实现说明为准。

验收标准：

- 输入 `JulianEphemerisDay` 或 `Instant`，输出 `Angle` 或 `Position(Body.Sun)`
- 实现 `EphemerisProvider.position(Body.Sun, instant, options)`
- 不支持的天体返回 `EphemerisError("UnsupportedBody")`
- 测试使用 D1 生成的 `standards/solar/longitudes.json`
- 误差目标写入测试 tolerance，不隐藏默认精度

### C5：节气求解

文件范围：`packages/phenomena/`

验收标准：

- 返回指定年份 24 个节气时刻
- 每个结果包含节气名、目标黄经、`Instant` 和误差说明
- 使用注入的 ephemeris provider 和 Delta-T provider
- 测试从 `standards/solar/terms.json` 验证

### C6：朔望求解

说明：朔望依赖太阳黄经和月亮黄经。月亮 provider 进入实现前，先在 RFC 0007 中固定算法边界和精度目标。

### C7：中国历法规则包

说明：从节气、朔望和 Delta-T 推导农历日期、闰月和干支纪法。不包含术数解释。

### D1：外部参考数据 bootstrap

文件范围：`scripts/fetch-standards/`

验收标准：

- 生成 2024 年和 2025 年的太阳黄经 fixture
- 生成 2024 年和 2025 年的二十四节气 fixture
- 输出写入 `standards/solar/`
- 脚本不纳入 pnpm workspace，不进入默认 CI
- 不在此任务中向 `packages/` 写入代码

## 六、推荐执行顺序

第二阶段最小路径：

```txt
1. B4
2. D1
3. C1
4. C2
5. C3
6. C4
7. B3
8. C5
```

可并行：

```txt
B4 与 D1
C1 与 B4
```

必须串行：

```txt
C1 -> C2 -> C4 -> B3 -> C5
B4 -> C3 -> C5
```

## 七、验证链路

每个实现任务完成后运行：

```bash
CI=true pnpm lint
CI=true pnpm format:check
CI=true pnpm typecheck
CI=true pnpm test
CI=true pnpm build
```
