# Epheon 第一阶段任务计划

## 一、定位

本文是 Epheon 第一阶段唯一任务计划。后续只维护这一份文档，避免路线图和 backlog
状态漂移。

第一阶段目标：

```txt
|@epheon/primitives  —— 已完成
|@epheon/temporal    —— 已完成
|standards/          —— 已完成（含 README 与 fixture）
|conformance/        —— 已完成（README 已补）
|benchmarks/         —— 已完成（README 已补）
|工程验证链路         —— 已完成
```

当前不进入：

```txt
VSOP87
ELP2000
JPL 星历
二十四节气
朔望
中国历法
CLI
Playground
```

---

## 二、执行原则

```txt
先工程闭环，再扩展 API。
先标准样例，再实现或重构测试。
先 RFC 明确边界，再进入星历、天象和历法实现。
每个阶段完成后都必须保持 lint、format:check、typecheck、test、build 可通过。
```

小任务要求：

```txt
小范围变更
明确验收标准
明确验证命令
不跨越未决 RFC 边界
不引入核心运行时依赖
```

**新增并行原则**（基于架构审查后的优化）：

```txt
纯数学路径（Vector3、Polynomial、RootFinder）无需 RFC 即可推进。
文档路径（README）、纯数学路径、RFC 路径三条线可同时进行。
Delta-T/闰秒数据模型和标准答案 bootstrap 不能留到 RFC 之后才讨论。
```

---

## 三、当前基线

当前公共包：

```txt
@epheon/primitives: Angle, Duration, Result, Tolerance, PrimitiveError
@epheon/temporal:   Instant, JulianDay, JulianEphemerisDay, UtcDateTime,
                    DeltaTProvider, LeapSecondProvider, TemporalError
```

当前标准样例：

```txt
standards/primitives/angles.json
standards/primitives/durations.json
standards/temporal/julian-days.json
standards/temporal/time-scales.json
standards/temporal/utc-invalid-inputs.json
```

继续暂缓：

```txt
Interval
Maybe
JulianDay.fromGregorian(...)
TDB
星历、节气、朔望、中国历法
```

**已不再是暂缓状态（本计划在下文中纳入规划）：**

```txt
真实 leap second 数据  →  D4.4（Delta-T 与闰秒数据模型 RFC）
真实 Delta-T 数据      →  D4.4
```

已验证命令：

```bash
CI=true pnpm test
CI=true pnpm typecheck
CI=true pnpm build
```

Checkpoint T 已在架构审查中通过（`lint`、`format:check`、`typecheck`、`test`、`build`
全部通过），不再作为独立任务列出。

---

## 四、任务状态

### 第一阶段已完成

| 任务                            | 说明                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------ |
| D0 — 工程骨架收口               | 工程骨架、非交互命令、GitHub CI、README/RFC/API 对齐已收口。                         |
| D1 — primitives 收口            | 角度/时长 fixture、边界测试、normalize 方法、算术运算均已覆盖。Interval/Maybe 暂缓。 |
| D2.1 — temporal fixture 收口    | julian-days、time-scales、utc-invalid-inputs 已扩充。                                |
| D2.2 — UTC 边界收口             | parseUTC/fromUTC、fromFields、offset 边界均已补。                                    |
| D2.3 — JulianDay Gregorian 构造 | 继续暂缓，`src/internal/gregorian` 不导出。                                          |
| D2.4 — provider 错误收敛        | 非有限数值、provider 抛错统一收敛为 TemporalError。                                  |
| A1 — standards/README.md        | 已补，字段约定修正为实际 fixture schema（原泛型模版与 5 个 fixture 文件结构不符）。  |
| A2 — conformance/README.md      | 已写入，说明 conformance 边界。                                                      |
| A3 — benchmarks/README.md       | 已写入，说明第一阶段不引入 benchmark 工具链。                                        |
| A4 — Vector3                    | 已实现：fromXYZ 构造、add/subtract/dot/cross、magnitude、normalize、equals。         |
| A5 — Polynomial                 | 已实现：Horner 法 evaluatePolynomial，src/internal/，不导出。                        |

### 第一阶段待执行

| 任务            | 大小 | 说明                                |
| --------------- | ---- | ----------------------------------- |
| A6 — RootFinder | S    | primitives 新增二分法/Newton 法求根 |

### 第二阶段待执行

| 任务                                        | 大小 | 说明                                           |
| ------------------------------------------- | ---- | ---------------------------------------------- |
| B1 — RFC 0005 坐标模型                      | M    | 需决策 Vector3 归属、Distance 形式             |
| B2 — RFC 0006 Ephemeris Provider            | M    | 需决策精度分层、Body 枚举位置                  |
| B3 — RFC 0007 天象事件求解                  | M    | 需决策节气/朔望的算法策略                      |
| B4 — RFC 0008 Delta-T 与闰秒数据            | M    | **新增**，明确数据模型和 package 结构          |
| C1 — @epheon/reference                      | M    | 新建包，含 ReferenceFrame、Body、Position      |
| C2 — @epheon/ephemerides                    | M    | 新建抽象接口包                                 |
| C3 — dataset-delta-t / dataset-leap-seconds | M    | 新建数据包，依赖 B4                            |
| C4 — 太阳黄经实现（IAU 2006）               | M    | 快速跑通求解链路                               |
| C5 — 节气求解                               | M    | 二分法 24 气                                   |
| C6 — 朔望求解                               | L    | 需月亮算法先到位                               |
| C7 — 中国历法规则包                         | XL   | 依赖 C5、C6                                    |
| D1 — 外部参考数据 bootstrap                 | M    | **新增**，拉取 JPL Horizons 等数据生成 fixture |

---

## 五、并行路径 A：第一阶段收口（可立即执行）

这几项彼此无依赖，可以并行推进。

| 任务                       | 状态 | 说明                                                   |
| -------------------------- | ---- | ------------------------------------------------------ |
| A1 — standards/README.md   | ✅   | 字段约定修正为实际 fixture schema，原泛型模版已移除。  |
| A2 — conformance/README.md | ✅   | 已写入，说明 conformance 边界。                        |
| A3 — benchmarks/README.md  | ✅   | 已写入，说明第一阶段不引入 benchmark 工具链。          |
| A4 — Vector3               | ✅   | fromXYZ 构造、四则运算、叉积/点积、normalize、equals。 |
| A5 — Polynomial            | ✅   | Horner 法 evaluatePolynomial，src/internal/，不导出。  |

---

### A6：primitives 新增 RootFinder

说明：节气求解本质是黄经函数上的根查找。第一阶段只实现二分法（bracketing），
Newton 法留到性能优化阶段。同样放在 `src/internal/`。

API 草案：

```ts
// packages/primitives/src/internal/root-finder.ts
export function bisect(
  f: (x: number) => number,
  target: number,
  left: number,
  right: number,
  options?: {
    tolerance?: number; // 收敛容差，默认 1e-10
    maxIterations?: number; // 最大迭代次数，默认 100
  }
): number;
```

验收标准：

- 给定单调函数 f 和目标值 target，在 [left, right] 区间查找 x 使 `f(x) ≈ target`。
- `f(left) - target` 与 `f(right) - target` 必须异号（bracket 条件），否则抛出
  `PrimitiveError(DivisionByZero)`。
- 收敛条件为区间宽度 < tolerance。
- 超过 maxIterations 仍未收敛时抛出 Error。
- 测试覆盖：线性函数、VSOP87 多项式风格的三角函数、空区间、无效 bracket。
- 不导出到公共入口。

可能触达文件：

```txt
packages/primitives/src/internal/root-finder.ts
packages/primitives/tests/internal/root-finder.test.ts
```

任务大小：S。

---

## 六、并行路径 B：第二阶段 RFC 起草（需决策后定稿）

路径 B 的三个 RFC 设计边界有交叠，以下是明确的类型归属表，避免 D4.1/D4.2
重复定义：

```txt
类型 / 概念             归属 RFC
─────────────────────────────────────
Vector3                 0004（更新，或独立设计说明）
Matrix3                 0004（更新，或独立设计说明）
ReferenceFrame          0005
Body type               0005 或 0006，建议 0005 定义枚举，0006 引用
Coordinate              0005
Position                0005
Distance                0005
Precision 等级          0006
EphemerisProvider 接口  0006
算法/数据分离规则       0006
二十四节气求解策略      0007
朔望求解策略            0007
Delta-T 数据模型        0008（新增）
闰秒数据模型            0008（新增）
```

### B1：起草 RFC 0005 — 坐标与参考系模型

说明：进入太阳黄经前，必须先定义坐标、参考系和单位边界。

**需要决策的点：**

1. Vector3、Matrix3 归 primitives 还是 reference？
2. Distance 是 number（以 AU 为单位）还是值对象？
3. ReferenceFrame 是 string literal union 还是带 epoch 的对象？

验收标准：

- 新增 `docs/rfcs/0005-coordinate-reference-model.md`。
- 列出 Position、ReferenceFrame、Body、Coordinate、Distance 的候选定义。
- 标出哪些属于 primitives，哪些属于 reference 或 ephemerides。
- 明确误差表达复用 `Tolerance`。
- 不在此任务中创建新 package。

验证：

```bash
CI=true pnpm format:check
```

依赖：无。

任务大小：M。

---

### B2：起草 RFC 0006 — Ephemeris Provider 接口

说明：星历 provider 是 VSOP87、ELP2000、JPL 等所有实现面对的公共边界。

**需要决策的点：**

1. **精度分层：** `FastLow`（~1"，IAU 2006 多项式） vs `Standard` vs `High`。
2. **position() 是否同时返回速度？** 暂时只返回位置，速度留给后续扩展。
3. **第一阶段只算太阳黄经，** 其余天体通过统一错误码表示未实现。

验收标准：

- 新增 `docs/rfcs/0006-ephemeris-provider.md`。
- 明确 provider 输入使用 `Instant` 或 `JulianEphemerisDay`。
- 明确 Body 枚举引用 RFC 0005 的定义。
- 明确输出坐标类型（Position from RFC 0005）。
- 明确算法包与 dataset package 的分离方式。

依赖：B1。

任务大小：M。

---

### B3：起草 RFC 0007 — 天象事件求解

说明：节气和朔望是事件求解问题，应先定义搜索策略、输入尺度和 tolerance。

**需要决策的点：**

1. 冬至（270°）是否需要独立精度要求？
2. 朔望求解是否等月亮算法先实现（分期交付）？
3. 是否支持批量求解（给定年份返回所有气/朔）？

验收标准：

- 新增 `docs/rfcs/0007-phenomena-events.md`。
- 明确二十四节气以太阳黄经为基础。
- 明确朔望以太阳月亮黄经差为基础。
- 明确 Delta-T 如何影响 UT1 日期边界和验收样例。
- 明确是否先只做节气（分期交付第一步）。

依赖：B2。

任务大小：M。

---

### B4：起草 RFC 0008 — Delta-T 与闰秒数据模型

说明：**新增任务。** 节气时刻的 UTC 表达高度依赖 Delta-T，VSOP87 精度再高，
Delta-T 不准则 UT1 和节气时刻准确度没有意义。

当前 `fixedDeltaT` 和 `fixedLeapSeconds` 只够写单元测试，不能用于民用历法。

验收标准：

- 新增 `docs/rfcs/0008-delta-t-leap-second-data.md`。
- 明确 Delta-T 历史数据的来源（Stephenson & Morrison 2016 多项式 / IERS 表）。
- 明确 Delta-T 外推策略（近几年的实时数据 vs 远期多项式近似）。
- 明确闰秒历史数据的来源（IERS Bulletin C）。
- 明确 package 结构（建议 `@epheon/dataset-delta-t` + `@epheon/dataset-leap-seconds`）。
- 明确 data provider 的输出格式（仍然是 `DeltaTProvider`/`LeapSecondProvider` 函数签名）。
- 明确数据更新节奏（随 NPM 发布，不热更新）。
- 不在此任务中创建新 package。

依赖：无。可与 B1、B2 并行。

任务大小：M。

---

## 七、并行路径 C：第二阶段实现（需 RFC 定稿后启动）

### C1：新建 `@epheon/reference` 包

文件结构：

```txt
packages/reference/
├── package.json         # 依赖 @epheon/primitives, @epheon/temporal
├── tsdown.config.ts
├── moon.yml
├── src/
│   ├── index.ts
│   ├── reference-frame.ts
│   ├── body.ts
│   ├── coordinate.ts
│   ├── position.ts
│   └── internal/
└── tests/
```

验收标准：

- 代码风格和目录结构遵循 `packages/primitives/` 的现有模板（`moon.yml`、`tsdown.config.ts`、`package.json`）。
- 依赖 `@epheon/primitives` 与 `@epheon/temporal`，按需只从入口 `index.ts` 导入。
- 包构建通过。
- 类型定义通过 typecheck。
- 值对象不可变，提供 `fromXxx` / `parseXxx` 双层 API，公共方法使用中文 TSDoc。
- 测试使用 `expectAlmostEqual` helper（从现有 `packages/*/tests/helpers.ts` 模式照搬）。
- 测试优先读取 `standards/` fixture，不硬编码标准数值。
- 更新 `pnpm-workspace.yaml`（如需要，将 `packages/reference` 加入 workspace）。
- 根 `vitest.config.ts` 自动发现测试（workspace projects 模式）。

依赖：B1 定稿。

任务大小：M。

---

### C2：新建 `@epheon/ephemerides` 抽象接口包

文件结构：

```txt
packages/ephemerides/
├── package.json         # 依赖 @epheon/reference, @epheon/temporal
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

- 代码风格和目录结构遵循 `packages/primitives/` 的现有模板。
- `EphemerisProvider` 接口定义完整，包含 `position()` 方法签名和返回类型。
- `Precision` 等级枚举 / union 定义完整。
- 依赖 `@epheon/reference` 与 `@epheon/temporal`，只从入口 `index.ts` 导入。
- 包构建通过，类型检查通过。
- 不包含任何具体算法实现。

依赖：B2 定稿。

任务大小：M。

---

### C3：新建 dataset-delta-t / dataset-leap-seconds 数据包

```txt
packages/dataset-delta-t/
├── package.json
├── data/
│   └── delta-t.json       # 历史 ΔT 表
├── src/
│   └── index.ts            # 暴露 provider 工厂函数
└── tests/

packages/dataset-leap-seconds/
├── package.json
├── data/
│   └── leap-seconds.json   # 闰秒历史表
├── src/
│   └── index.ts            # 暴露 provider 工厂函数
└── tests/
```

验收标准：

- 数据来源在 package README 中说明。
- Provider 工厂函数返回 `DeltaTProvider` / `LeapSecondProvider` 类型。
- 覆盖至少 1972 年至今的数据。
- 包构建通过。

依赖：B4 定稿。

任务大小：M。

---

### C4：实现 IAU 2006 太阳黄经

说明：快速跑通从 `Instant → JDE → 多项式求值 → Angle` 的全链路。使用 IAU 2006
太阳视黄经多项式（约 20 项），精度 ~1"，足够验证节气求解算法是否正确。

```txt
packages/ephemerides-vsop87/
├── package.json         # 依赖 @epheon/ephemerides, @epheon/temporal
├── tsdown.config.ts
├── moon.yml
├── src/
│   ├── index.ts
│   ├── solar-longitude.ts
│   └── internal/
│       └── iau2006-coefficients.ts
└── tests/
```

验收标准：

- 输入 `JulianEphemerisDay`，输出 `Angle`。
- 测试覆盖若干已知 JD 下的 expected 黄经（使用 Skyfield / JPL Horizons 验证）。
- 标准差 < 1"（IAU 2006 多项式的能力上限）。
- 实现 `EphemerisProvider` 接口（至少实现 `position(Body.SUN, ...)`）。

依赖：C2（接口）、A5（Polynomial）。

任务大小：M。

---

### C5：实现二分法节气求解

说明：输入年份 + EphemerisProvider，输出 24 节气的 `Instant[]`。

```txt
packages/phenomena/
├── package.json         # 依赖 @epheon/ephemerides, @epheon/temporal
├── tsdown.config.ts,
├── moon.yml
├── src/
│   ├── index.ts
│   └── solar-terms.ts
└── tests/
```

验收标准：

- 返回 2024 年 24 个节气的 `Instant[]`。
- 从 `standards/` 读取节气 fixture 验证。
- 每个节气时刻附带 `{ deltaT: Duration, source: string, tolerance: Duration }`。
- 精度 < 1 分钟（在已知 ΔT 下）。

依赖：C4、B3、A6（RootFinder）。

任务大小：M。

---

### C6：实现朔望求解

验收标准：

- 返回指定年份的朔望月相时刻 `Instant[]`。
- 精度与计算复杂度在 RFC 0007 中进一步约束。

依赖：C4（需要月亮黄经算法）、B3。

任务大小：L。

---

### C7：实现中国历法规则包

验收标准：

- 返回指定公历日期对应的农历日期（年、月、日、是否闰月）。
- 返回干支纪年、纪月、纪日、纪时。

依赖：C5、C6。

任务大小：XL。

---

## 八、标准答案 bootstrap（跨路径问题，优先级高）

### D1：外部参考数据生成方案

说明：节气、朔望、农历日期这些标准答案不能凭空产生。必须有一个可信的外部参考源
来验证实现。这是 Epheon 正确性的**根本前提**——没有 reference data 就无法知道
算法算得对不对。

推荐验证策略：

```txt
太阳黄经验证:
  Skyfield（Python）—— 使用 VSOP87 的高精度 Python 封装，
  输入 JDE 输出黄经，用于验证 C4 的 IAU 2006 多项式。
  脚本: scripts/fetch-standards/solar-longitudes.py

节气时刻验证:
  Skyfield + 二分法求解，生成 2000-2050 年 24 气时刻。
  与 NOAA Solar Calculator 交叉验证若干标志年份。
  脚本: scripts/fetch-standards/solar-terms.py

朔望时刻验证:
  Skyfield 的 phase 功能或 JPL Horizons API。
  脚本: scripts/fetch-standards/lunar-phases.py
```

输出格式：每个脚本生成一个独立 JSON fixture 文件放在 `standards/` 下，
符合 `standards/README.md` 定义的 schema：

```json
{
  "description": "用例说明",
  "input": { ... },
  "expected": value,
  "tolerance": { "absolute": number, "relative?": number },
  "source": "数据来源说明"
}
```

验收标准：

- 确定主参考源（**建议 Skyfield + JPL Horizons 双重验证**）。
- 编写可复现的一次性脚本放入 `scripts/fetch-standards/` 目录。
- 输出为 `standards/` 下的 JSON fixture。
- 脚本不纳入核心包，不走 pnpm workspace，不参加 CI。
- 脚本运行环境在 README 中说明（Python 3 + `skyfield` + `astropy` 等）。
- 不在此任务中向 `packages/` 写入代码。
- 2024 年和 2025 年的节气时刻是首批必须 fixture。

验证：脚本可复现执行，生成的 fixture 格式符合 `standards/README.md` 规范。

依赖：无。可与 A 路径并行。

任务大小：M。

---

## 九、推荐执行顺序

### 立即启动（无需等待任何人）

```txt
[A4]  primitives Vector3       —— 已有 exact 实现模板
[A5]  primitives Polynomial    —— 内部算法，无需 RFC
[A6]  primitives RootFinder    —— 内部算法，无需 RFC
[D1]  参考数据 bootstrap 脚本  —— 使用 Skyfield 生成 fixture
[B4]  Delta-T 与闰秒数据模型 RFC  —— 可与 A 路并行起草
```

### 决策后立即启动

```txt
[B1]  坐标模型 RFC         → 确认 Vector3 归属、Distance 形式
  └─ [C1]  @epheon/reference
[B2]  Ephemeris Provider RFC → 确认精度分层
  └─ [C2]  @epheon/ephemerides
[B4]  Delta-T/闰秒 RFC      → 确认数据来源
  └─ [C3]  dataset-delta-t + dataset-leap-seconds
```

### 链式启动

```txt
[B3]  天象事件 RFC
  └─ [C4]  IAU 2006 太阳黄经
    └─ [C5]  节气求解
      └─ [C6]  朔望求解
        └─ [C7]  中国历法规则包
```

### 一句话总结

```txt
三路并行，不等 RFC 锁死：

A 路：纯数学扩展（Vector3、Polynomial、RootFinder）—— 现在就能写
B 路：四个 RFC 起草 —— 需要决策，但不阻塞 A
C 路：包实现 —— 等待 B 路定稿
D 路：参考数据 —— 优先级最高，不然算出来也不知道对不对
```

---

## 十、验证链路

所有变更必须保持以下命令通过：

```bash
CI=true pnpm lint
CI=true pnpm format:check
CI=true pnpm typecheck
CI=true pnpm test
CI=true pnpm build
```

---

## 附录：架构审查输入

本附录汇总架构审查阶段（0002）中识别的关键决策记录、技术方案对比和模块边界定义，
作为 0001 任务拆分的设计依据。后续改动应在 0001 中记录，本附录只在架构级输入
发生变化时更新。

### A. 设计风险记录

**风险 1：`@epheon/reference` 的包定位尚未收敛**

RFC 0001 把 `Position`、`Vector3`、`ReferenceFrame` 放在 `@epheon/reference`。
但 Vector3、Matrix3（旋转矩阵）属于纯数学，与天文学语义无关。如果放在 reference 包，
等于切断了 primitives 作为全项目数学表达层的定位。

**当前决策：** Vector3、Matrix3、Polynomial、RootFinder 归入 `@epheon/primitives`
第二阶段扩展（A4-A6）。ReferenceFrame、Coordinate、Position 等带天文学语义的类型
归入 `@epheon/reference`（C1）。

**风险 2：VSOP87 精度目标缺少决策记录**

VSOP87 的精度截断直接影响历法引擎正确性。低精度（~1"）下节气时刻误差约数分钟，
在农历日边界判定中可能不够。但高精度（< 0.01"）意味着 ~6000 项系数和数倍的计算量。

**当前决策：** 两面下注。先以 IAU 2006 多项式（~20 项）快速跑通节气求解链路（C4），
再逐步替换为完整 VSOP87D（C5 的前提条件在 RFC 0007 中进一步明确）。

---

### B. VSOP87 实现策略对比

| 方案                      | 精度     | 包体积 | 实现难度 | 用途                       |
| ------------------------- | -------- | ------ | -------- | -------------------------- |
| IAU 2006 多项式（~20 项） | ~1"      | 极小   | 极低     | **短期**，快速跑通求解链路 |
| VSOP87D 截断（~300 项）   | < 0.1"   | 中     | 中       | **中期**，满足多数历法需求 |
| 完整 VSOP87D（~6000 项）  | < 0.01"  | 大     | 中       | 长期，高精度验证           |
| VSOP2013                  | < 0.001" | 很大   | 高       | 未来备选                   |

节气求解策略：先用二分法（bracketing）实现 24 气搜索，稳定后再切换到 Newton 法
获得更快的收敛速度。二分法在 1" 精度目标下约需 15-20 轮迭代，对全年 24 次计算
足够快。

---

### C. 模块边界图

```
┌──────────────────┐
│  @epheon/        │
│  primitives      │
│  (+ A4-A6 扩展)  │
│  Angle、Vector3  │
│  Duration        │
│  Polynomial      │
│  RootFinder      │
│  Result/Tolerance│
└────────┬─────────┘
         │
         ▼
┌──────────────────┐     ┌──────────────────┐
│  @epheon/        │     │  @epheon/        │
│  temporal        │     │  reference (C1)  │
│  （当前不变）     │     │                  │
│  Instant         │     │  ReferenceFrame  │
│  JulianDay       │     │  Body            │
│  UtcDateTime     │     │  Coordinate      │
│  Provider types  │     │  Position        │
└────────┬─────────┘     └────────┬─────────┘
         │                        │
         ▼                        ▼
┌──────────────────┐     ┌──────────────────┐
│  @epheon/        │     │  @epheon/        │
│  ephemerides(C2) │◄────│  ephemerides-    │
│  （抽象接口包）   │     │  vsop87 (C4)    │
│                   │     │                  │
│  EphemerisProvdr  │     │  IAU 2006 实现  │
│  Precision 等级   │     │  (或完整 VSOP87)│
└──────────────────┘     └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │  @epheon/         │
                         │  phenomena (C5)  │
                         │                   │
                         │  solarTerms()    │
                         └──────────────────┘
```
