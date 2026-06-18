# Epheon 完整性审计报告：公共 API · 测试覆盖 · RFC 合规 · 架构对齐

> 审计日期：2026-06-18
> 审计范围：packages/\*（全部 10 个包）、standards/、conformance/、benchmarks/
> 对照基准：docs/rfcs/0001-0008、docs/plans/0001-0006、docs/tasks/0001-0006

---

## 一、总体评估

| 维度                     | 状态     | 说明                                             |
| ------------------------ | -------- | ------------------------------------------------ |
| 第一阶段（时间模型）     | ✅ 完成  | primitives + temporal 全量合规                   |
| 第二阶段（参考系与太阳） | ✅ 完成  | reference + ephemerides + vsop87 全量合规        |
| 第三阶段（月球与朔望）   | ✅ 完成  | elp2000 + phenomena 全量合规，dataset 包到位     |
| 第四阶段（中国历法）     | ✅ 完成  | calendar-chinese 导出 7 个公共入口，干支能力已补 |
| 第五阶段（验证体系）     | ✅ 完成  | fixture/conformance/benchmark 最小闭环存在       |
| 第六阶段（兼容与工具）   | ⏸ 暂缓   | 按计划未进入，无偏离                             |
| **总体合规率**           | **95%+** | 主要缺口为文档完整性与 fixture 覆盖面            |

**关键发现摘要：**

1. **Vector3 提前实现**：RFC 0004 标记 Vector3 为"第一阶段暂不包含"，但实际已从 primitives 公共入口导出。这是正面偏离——能力提前到位。
2. **Polynomial/RootFinder 已实现但保持 internal**：这两个模块在 primitives 的 `src/internal/` 中已实现并有测试，但未从公共入口导出，符合现阶段边界约定。
3. **reference README 严重不足**（仅 3 行），与 RFC 0005 的详细设计脱节。
4. **phenomena README 过时**：仍声称"只提供第二阶段最小节气求解"，但实际已包含朔望求解。
5. **standards/lunar/phases.json 仅 2 条样例**，覆盖极为单薄。
6. **conformance 仅覆盖 calendar-chinese**，未对 solar/lunar/temporal/reference 做独立一致性校验。
7. **benchmarks 范围偏窄**：仅 calendar-chinese 一条链路，缺少 primitives/temporal 基准。

---

## 二、逐包审计

### 2.1 `@epheon/primitives`

**公共入口导出（`src/index.ts`）：**

```ts
(Angle,
  Duration,
  PrimitiveError,
  PrimitiveErrorCode,
  Result,
  Ok,
  Err,
  ok,
  err,
  isOk,
  isErr,
  Tolerance,
  almostEqual,
  Vector3);
```

| 检查项                                          | 状态               | 详情                                                                                    |
| ----------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------- |
| RFC 0004 Angle（五单位构造/输出/四种归一化）    | ✅                 | 全部实现                                                                                |
| RFC 0004 Duration（秒/毫秒/日/儒略年/儒略世纪） | ✅                 | 全部实现                                                                                |
| RFC 0004 Result（Ok/Err + 守卫函数）            | ✅                 | 全部实现                                                                                |
| RFC 0004 Tolerance + almostEqual                | ✅                 | 全部实现                                                                                |
| RFC 0004 PrimitiveError（三种错误码）           | ✅                 | DivisionByZero / InvalidNumber / InvalidTolerance                                       |
| RFC 0004 fromXxx/parseXxx 双层 API              | ✅                 | Angle 和 Duration 全部覆盖                                                              |
| NaN/Infinity 拒绝                               | ✅                 | assertFiniteNumber                                                                      |
| **Interval**                                    | ⏸ 暂缓（RFC 正确） | RFC 标记暂缓，未实现，合规                                                              |
| **Maybe**                                       | ⏸ 暂缓（RFC 正确） | RFC 标记暂缓，未实现，合规                                                              |
| **Vector3**                                     | ⚠️ 提前实现        | RFC 0004 标记为"第一阶段暂不包含"，但已从公共入口导出。属正面偏离，且 README 已更新说明 |
| Polynomial (internal)                           | ℹ️ 内部实现        | `src/internal/polynomial.ts` 有 Horner 法求值 + 测试，未导出，合规                      |
| RootFinder (internal)                           | ℹ️ 内部实现        | `src/internal/root-finder.ts` 有二分法 + 测试，未导出，合规                             |
| 不依赖 temporal                                 | ✅                 | 无反向依赖                                                                              |
| 零运行时第三方依赖                              | ✅                 | dependencies 为空                                                                       |

**测试覆盖：**

- `angle.test.ts`（112 行）：覆盖单位转换、归一化、算术、不可变性、边界错误 ✅
- `duration.test.ts`（79 行）：覆盖单位转换、算术、tolerance、NaN/Infinity/除零错误 ✅
- `result.test.ts` ✅
- `tolerance.test.ts` ✅
- `vector3.test.ts` ✅
- `internal/polynomial.test.ts` ✅
- `internal/root-finder.test.ts` ✅

**文档：** README.md（215 行）详尽，含导出清单、API 表格、示例代码、当前限制说明 ✅

**质量问题：**

- 无严重问题。`internal/number.ts` 的 `assertFiniteNumber` 与 temporal 的重复是已知架构选择（上次审计已标记），符合设计意图。

---

### 2.2 `@epheon/temporal`

**公共入口导出（`src/index.ts`）：**

```ts
(TemporalError,
  TemporalErrorCode,
  Instant,
  InstantOptions,
  TimePoint,
  JulianDay,
  JulianEphemerisDay,
  DeltaTProvider,
  LeapSecondProvider,
  fixedDeltaT,
  fixedLeapSeconds,
  UtcDateTime,
  UtcDateTimeFields);
```

| 检查项                                                             | 状态 | 详情                    |
| ------------------------------------------------------------------ | ---- | ----------------------- |
| RFC 0003 Instant（fromUTC/parseUTC）                               | ✅   | 全部实现                |
| RFC 0003 toJulianDay/toJulianEphemerisDay/toTT/toUT1/toUTCDateTime | ✅   | 全部实现                |
| RFC 0003 不可变值对象                                              | ✅   | private #fields         |
| RFC 0003 JulianDay / JulianEphemerisDay 类型区分                   | ✅   | 不同类型，不可混用      |
| RFC 0003 DeltaTProvider / LeapSecondProvider 边界                  | ✅   | 函数类型，支持注入      |
| RFC 0003 fixedDeltaT / fixedLeapSeconds                            | ✅   | 固定值工厂函数          |
| RFC 0003 不读系统时区/当前时间                                     | ✅   | 无 Date.now/Intl        |
| RFC 0003 拒绝无 offset 输入                                        | ✅   | 正则要求 Z 或 ±HH:mm    |
| RFC 0003 5 种 TemporalError 错误码                                 | ✅   | 全部实现                |
| RFC 0003 内部实现不泄漏                                            | ✅   | index.ts 仅导出公共类型 |
| Provider 缺失/失败错误包装                                         | ✅   | 测试覆盖                |

**测试覆盖：**

- `instant.test.ts`（266 行）：极为全面——JD 转换、offset 处理、非法输入、leap second/Delta-T provider 注入、错误包装、不可变性 ✅
- `time-scale.test.ts` ✅
- `julian-day.test.ts` ✅
- `utc-date-time.test.ts` ✅

**文档：** README.md（267 行）详尽，含导出清单、API 表格、时间尺度转换链图示 ✅

**已知问题（上次审计遗留）：**

- `time-scale.ts` L46 TSDoc 错误提及 `PrimitiveError`，实际对外表现为 `TemporalError(InvalidTimeScaleInput)`。严重度：低。

---

### 2.3 `@epheon/reference`

**公共入口导出（`src/index.ts`）：**

```ts
(Body,
  CoordinateSystem,
  SphericalCoordinates,
  SphericalCoordinatesInput,
  Distance,
  Origin,
  Position,
  PositionInput,
  ReferenceFrame);
```

| 检查项                                                                | 状态 | 详情                                               |
| --------------------------------------------------------------------- | ---- | -------------------------------------------------- |
| RFC 0005 Body（10 个天体标识）                                        | ✅   | Sun/Moon/Mercury~Neptune/Earth                     |
| RFC 0005 Origin（Heliocentric/Geocentric）                            | ✅   |                                                    |
| RFC 0005 ReferenceFrame（ICRS/MeanOfDateEcliptic/TrueOfDateEcliptic） | ✅   | 含 epoch JDE                                       |
| RFC 0005 SphericalCoordinates（经度/纬度/可选距离）                   | ✅   | 含 from/equals/almostEquals                        |
| RFC 0005 Position（坐标+参考系+原点组合）                             | ✅   | 含 from/equals/almostEquals                        |
| RFC 0005 Distance（AU 值对象）                                        | ✅   | fromAU/parseAU/multiply/divide/equals/almostEquals |
| RFC 0005 CoordinateSystem（Ecliptic/Equatorial/Horizontal）           | ✅   |                                                    |
| 笛卡尔转换保留在 internal                                             | ✅   | `internal/cartesian.ts` 不导出到公共入口           |
| 不可变性                                                              | ✅   | readonly #fields                                   |

**测试覆盖：**

- `reference.test.ts` ✅

**文档：** README.md 仅 3 行内容！严重不足。

**质量问题：**

- ❌ **README 严重缺失**：需补充导出清单、API 示例、参考系预设说明、与 RFC 0005 的对照。当前 README 不足 70 字符。
- ⚠️ `Body` 同时声明为 const 对象和 type，这是 TypeScript 常见模式（const 用于值，同名 type 用于类型），技术上正确但可能让新开发者困惑。建议在 README 说明此模式。

---

### 2.4 `@epheon/ephemerides`

**公共入口导出（`src/index.ts`）：**

```ts
(EphemerisError,
  EphemerisErrorCode,
  toEphemerisError,
  EphemerisOptions,
  EphemerisProvider,
  resolveEphemerisOptions,
  Precision(值),
  Precision / EphemerisPrecision(类型));
```

| 检查项                                        | 状态 | 详情                                         |
| --------------------------------------------- | ---- | -------------------------------------------- |
| RFC 0006 EphemerisProvider 接口               | ✅   | position(body, instant, options?) → Position |
| RFC 0006 EphemerisOptions（frame, precision） | ✅   | 含默认值解析函数                             |
| RFC 0006 Precision（FastLow/Standard/High）   | ✅   |                                              |
| RFC 0006 EphemerisError（5 种错误码）         | ✅   | 含 toEphemerisError 收敛函数                 |
| 无具体算法                                    | ✅   | 纯抽象层                                     |
| 无文件系统/网络依赖                           | ✅   |                                              |

**测试覆盖：**

- `ephemerides.test.ts` ✅

**文档：** README.md（77 行）合格，含导出清单、使用示例 ✅

**质量问题：** 无。

---

### 2.5 `@epheon/ephemerides-vsop87`

**公共入口导出（`src/index.ts`）：**

```ts
(createVSOP87SunProvider, solarEclipticLongitude, solarEclipticPosition, SolarPositionInput);
```

| 检查项                                         | 状态 | 详情                                                  |
| ---------------------------------------------- | ---- | ----------------------------------------------------- |
| RFC 0006 太阳 provider 实现                    | ✅   | 遵循 EphemerisProvider 协议                           |
| 仅支持 Body.Sun                                | ✅   | 其他天体抛 UnsupportedBody                            |
| 支持 MeanOfDateEcliptic/TrueOfDateEcliptic     | ✅   |                                                       |
| 仅支持 Precision.Standard                      | ✅   | 其他精度抛 UnsupportedPrecision                       |
| 太阳低阶模型（Meeus 近似）                     | ✅   | 注释中标注为 bootstrap 模型，未来替换为完整 VSOP87 项 |
| 独立 helper（solarEclipticLongitude/Position） | ✅   | 不依赖 provider 包装即可使用                          |

**测试覆盖：**

- `solar-provider.test.ts` ✅

**文档：** 需确认 README 存在。`ephemerides-vsop87/README.md` 存在 ✅

**质量问题：**

- ℹ️ 太阳模型使用了简化低阶项（Meeus 近似），而非完整 VSOP87 系数展开。代码中有 `ponytail` 注释明确标注此为 bootstrap 方案。当前对节气求解精度足够（JPL Horizons 校准通过），但 package 名 `ephemerides-vsop87` 与实际实现有差距。建议在 README 中明确说明当前使用简化模型。

---

### 2.6 `@epheon/ephemerides-elp2000`

**公共入口导出（`src/index.ts`）：**

```ts
(createELP2000MoonProvider, lunarEclipticLongitude, lunarEclipticPosition, MoonPositionInput);
```

| 检查项                                         | 状态 | 详情                        |
| ---------------------------------------------- | ---- | --------------------------- |
| RFC 0006 月亮 provider 实现                    | ✅   | 遵循 EphemerisProvider 协议 |
| 仅支持 Body.Moon                               | ✅   |                             |
| 支持 MeanOfDateEcliptic/TrueOfDateEcliptic     | ✅   |                             |
| 仅支持 Precision.Standard                      | ✅   |                             |
| 独立 helper（lunarEclipticLongitude/Position） | ✅   |                             |
| 低阶周期项模型                                 | ✅   | 含简化章动修正              |

**测试覆盖：**

- `moon-provider.test.ts` ✅

**文档：** `ephemerides-elp2000/README.md` 存在 ✅

**质量问题：**

- ℹ️ 与 VSOP87 类似，月亮模型使用了低阶周期项（约 20 项），而非完整 ELP2000 展开。代码中有 `ponytail` 注释标注。建议 README 说明当前精度范围。

---

### 2.7 `@epheon/phenomena`

**公共入口导出（`src/index.ts`）：**

```ts
// solar-terms.ts:
(SolarTermName, SolarTermName(type), PhenomenaContext, SolarTermEvent, solarTermsOfYear);
// lunar-phases.ts:
(LunarPhaseKind, LunarPhaseKind(type), LunarPhaseEvent, findLunarPhaseBetween);
```

| 检查项                                                      | 状态 | 详情                             |
| ----------------------------------------------------------- | ---- | -------------------------------- |
| RFC 0007 二十四节气（SolarTermName 24 个）                  | ✅   | 全部实现                         |
| RFC 0007 solarTermsOfYear                                   | ✅   | 日步进 + 二分法细化到秒级        |
| RFC 0007 PhenomenaContext                                   | ✅   | ephemeris + leapSeconds + deltaT |
| RFC 0007 SolarTermEvent（name + targetLongitude + instant） | ✅   |                                  |
| RFC 0007 朔望求解（LunarPhaseKind NewMoon/FullMoon）        | ✅   |                                  |
| RFC 0007 findLunarPhaseBetween                              | ✅   | 6 小时步进 + 二分法              |
| 使用 Instant 输入输出                                       | ✅   | 不暴露裸 Julian 数值             |
| 不依赖系统时区/文件系统/网络                                | ✅   |                                  |

**测试覆盖：**

- `solar-terms.test.ts` ✅
- `lunar-phases.test.ts` ✅

**文档：** README.md（46 行）**过时** ❌

**质量问题：**

- ❌ **README 过时**：仍声称"当前只提供第二阶段最小节气求解能力"，但实际已实现朔望求解（`findLunarPhaseBetween`、`LunarPhaseKind`、`LunarPhaseEvent`）。导出清单也缺少月相相关导出。
- ⚠️ `toUtcMilliseconds` 和 `createInstantFromUtcMilliseconds` 在 `solar-terms.ts` 和 `lunar-phases.ts` 中**重复定义**（完全相同的实现）。可考虑提取为 internal 共享模块。

---

### 2.8 `@epheon/calendar-chinese`

**公共入口导出（`src/index.ts`）：**

```ts
// 类型
(ChineseLunarMonth,
  ChineseLunarMonthTableEntry,
  ChineseLunarDate,
  HeavenlyStem,
  EarthlyBranch,
  GanzhiPillar,
  ChineseGanzhi);
// 函数
(buildLunarMonthSequence, lunarMonthTableBetween, lunarMonthTableOfYear, lunarDateOf, ganzhiOf);
```

| 检查项                                                     | 状态           | 详情                            |
| ---------------------------------------------------------- | -------------- | ------------------------------- |
| S4-T1 农历月段构建（buildLunarMonthSequence）              | ✅             | 含闰月判定逻辑                  |
| S4-T2 农历月表 API（lunarMonthTableOfYear/Between）        | ✅             | 返回带年月编号+闰月标记的条目   |
| S4-T3 农历日期查询（lunarDateOf）                          | ✅             | 返回 year/month/day/isLeapMonth |
| S4-T4 月份编号与年界映射                                   | ✅             | 以冬至为十一月锚点              |
| S4-T5 干支能力（ganzhiOf）                                 | ✅             | 纪年/纪月/纪日/纪时四柱         |
| S4-T6 @epheon/calendars 抽象                               | ⏸ 暂缓（合规） | 按计划延迟                      |
| modern 规则集（立春换年/十二节换月/立春起寅月/23:00 子时） | ✅             | 文档明确说明                    |

**测试覆盖：**

- `lunar-months.test.ts`（180 行）：覆盖月段构建、闰月判定、月表生成、窗口查询、非法输入、农历日期 fixture 对照、干支对照 ✅
- 含 2023 闰二月和 2024 春节 fixture 验证 ✅

**文档：** README.md（31 行）合格但略显简略，缺少导出清单和 API 使用示例 ⚠️

**质量问题：**

- ⚠️ `src/index.ts` 达 845 行，全部放在单一文件中。内部辅助函数（如 `buildResolvedChineseLunarMonths`、`resolveGanzhiYear` 等约 20 个私有函数）与公共 API 混在同一文件中。按 AGENTS.md 约定，内部实现应抽入 `src/internal/`。当前虽未违反"不从主入口导出 internal"规则，但可维护性已受影响。
- ⚠️ `toUtcMilliseconds` / `createInstantFromUtcMilliseconds` 在 calendar-chinese 中**再次重复定义**（第 3 次出现，与前两个包完全相同）。这是跨包代码重复问题。
- ℹ️ 部分函数缺少 `@throws` TSDoc（如内部 `collectWinterSolsticeAnchors`、`buildChineseLunarMonthTable`），但这些是内部函数，影响有限。

---

### 2.9 `@epheon/dataset-delta-t`

**公共入口导出（`src/index.ts`）：**

```ts
(DatasetInfo, deltaTDatasetInfo, createDeltaTProvider);
```

| 检查项                             | 状态 | 详情                                                  |
| ---------------------------------- | ---- | ----------------------------------------------------- |
| RFC 0008 dataset info 元信息       | ✅   | id/source/generatedAt/coverageStart/End/updateCadence |
| RFC 0008 createDeltaTProvider 工厂 | ✅   | 返回 DeltaTProvider                                   |
| 覆盖范围 1600–2150                 | ✅   | Espenak & Meeus 多项式近似                            |
| 超出覆盖抛 TemporalError           | ✅   |                                                       |
| 数据与 provider 逻辑分离           | ✅   | data 在 internal/delta-t-data.ts                      |

**测试覆盖：**

- `delta-t.test.ts` ✅

**文档：** `dataset-delta-t/README.md` 存在 ✅

**质量问题：** 无。

---

### 2.10 `@epheon/dataset-leap-seconds`

**公共入口导出（`src/index.ts`）：**

```ts
(DatasetInfo, leapSecondDatasetInfo, createLeapSecondProvider);
```

| 检查项                                 | 状态 | 详情                     |
| -------------------------------------- | ---- | ------------------------ |
| RFC 0008 dataset info 元信息           | ✅   |                          |
| RFC 0008 createLeapSecondProvider 工厂 | ✅   | 返回 LeapSecondProvider  |
| 覆盖范围 1972–2100（暂定）             | ✅   | IERS Bulletin C 历史数据 |
| 超出覆盖抛 TemporalError               | ✅   |                          |

**测试覆盖：**

- `leap-seconds.test.ts` ✅

**文档：** `dataset-leap-seconds/README.md` 存在 ✅

**质量问题：** 无。

---

## 三、standards/ fixture 覆盖面

| 领域                             | fixture 文件 | 样例数量（估计） | 覆盖评估        |
| -------------------------------- | ------------ | ---------------- | --------------- |
| primitives/angles.json           | ✅           | 充足             | 转换与归一化    |
| primitives/durations.json        | ✅           | 充足             | 五种单位        |
| primitives/vectors.json          | ✅           | 充足             | 向量运算        |
| temporal/julian-days.json        | ✅           | 充足             | UTC→JD          |
| temporal/time-scales.json        | ✅           | 充足             | 多尺度转换      |
| temporal/utc-invalid-inputs.json | ✅           | 充足             | 非法输入+错误码 |
| reference/coordinates.json       | ✅           | 充足             | 球面↔笛卡尔     |
| reference/frames.json            | ✅           | 充足             | 预设帧定义      |
| solar/longitudes.json            | ✅           | 充足             | 太阳视黄经      |
| solar/terms.json                 | ✅           | 充足             | 24 节气         |
| **lunar/phases.json**            | ✅           | **仅 2 条**      | ❌ 严重不足     |
| calendar-chinese/lunar.json      | ✅           | 充足             | 月表+历日       |

**缺口：**

- ❌ `lunar/phases.json` 仅含 2 条样例（2024-04-08 朔、2025-03-14 望），远不足以驱动可靠的回归测试。建议至少覆盖 5 年 × 每月 1 朔 1 望 ≈ 120 条。
- ⚠️ 缺少 `lunar/positions.json`（月亮地心位置参考值），当前只能通过 phase 间接验证月亮位置精度。
- ⚠️ 缺少 dataset 领域的 fixture（Delta-T 参考值、闰秒参考值），虽然 dataset 包自带测试，但独立 fixture 可增强跨实现验证。

---

## 四、conformance/ 完备性

| 检查项                         | 状态 | 详情                                      |
| ------------------------------ | ---- | ----------------------------------------- |
| 可运行入口（pnpm conformance） | ✅   | 基于 vitest                               |
| 覆盖 calendar-chinese          | ✅   | 对照 lunar.json                           |
| 覆盖 solar                     | ❌   | 无独立 conformance 测试                   |
| 覆盖 lunar                     | ❌   | 无独立 conformance 测试                   |
| 覆盖 temporal                  | ❌   | 无独立 conformance 测试                   |
| 覆盖 reference                 | ❌   | 无独立 conformance 测试                   |
| 跨实现核对链路                 | ❌   | 仅 TypeScript 单实现，无 Python/Rust 对照 |
| 数据来源与误差文档             | ✅   | README 链接到 standards/README.md         |

**评估：** conformance 当前只覆盖了一条最小链路（calendar-chinese）。S5-T3 任务标记为"已完成"，但按 S5 plan 的完成判定（"conformance 至少能跑通一条链路"），技术上确实达标。然而，solar/lunar 的 fixture 已经存在，conformance 未利用它们做独立验证是明显遗漏。

---

## 五、benchmarks/ 完备性

| 检查项                                 | 状态 | 详情                |
| -------------------------------------- | ---- | ------------------- |
| 可运行入口（pnpm bench）               | ✅   | 基于 vitest bench   |
| 年度节气求解                           | ✅   | 2023/2024/2025      |
| 年度朔望扫描                           | ✅   | 2023/2024/2025      |
| 年度农历月表                           | ✅   | 2023/2024/2025      |
| primitives 基准（Angle/Duration 运算） | ❌   | 未覆盖              |
| temporal 基准（Instant 构造/转换）     | ❌   | 未覆盖              |
| 跨年对比（如 1900 vs 2024）            | ❌   | 仅覆盖 3 个近期年份 |

**评估：** S5-T4 任务标记为"已完成"，按 plan 的完成判定（"至少存在一个可重复运行的基准用例"），技术上达标。但覆盖范围偏窄，建议后续阶段补 primitives 和 temporal 基准。

---

## 六、与 RFC / Plans / Tasks 的偏离分析

### 6.1 正面偏离（提前实现）

| 偏离项                  | RFC 预期                        | 实际状态                            |
| ----------------------- | ------------------------------- | ----------------------------------- |
| Vector3                 | RFC 0004 标记"第一阶段暂不包含" | 已实现并从公共入口导出              |
| Polynomial（Horner 法） | RFC 0004 标记暂缓               | 已实现为 internal 模块 + 测试       |
| RootFinder（二分法）    | RFC 0004 标记暂缓               | 已实现为 internal 模块 + 测试       |
| 朔望求解                | 原属第三阶段                    | 实际在第二阶段 phenomena 中同步实现 |
| 干支能力                | S4-T5 在农历日期后补            | 与农历日期同步实现                  |

评价：这些前置实现是良性的，反映了实际开发中"按需推进"的务实策略。但需注意：

- Vector3 的导出已修改 RFC 0004 的阶段边界，建议在 RFC 或 plan 中更新记录。
- Polynomial/RootFinder 保留 internal 是正确的——没有过早承诺公共 API。

### 6.2 已计划但缺失

| 缺失项              | 计划依据          | 当前状态             |
| ------------------- | ----------------- | -------------------- |
| `@epheon/calendars` | RFC 0001 第四阶段 | ⏸ S4-T6 暂缓（合规） |
| `@epheon/compat`    | RFC 0001 第六阶段 | ⏸ 暂缓（合规）       |
| `@epheon/runtime`   | RFC 0001 第六阶段 | ⏸ 暂缓（合规）       |
| `@epheon/cli`       | RFC 0001 第六阶段 | ⏸ 暂缓（合规）       |

无应在本阶段完成但实际缺失的能力。

### 6.3 计划实现但质量不足

| 问题项                         | 严重度 | 说明                             |
| ------------------------------ | ------ | -------------------------------- |
| reference README 仅 3 行       | 中     | 不符合 AGENTS.md 对文档的要求    |
| phenomena README 过时          | 中     | 导出清单与实际 API 不一致        |
| lunar fixture 仅 2 条          | 中     | 不足以驱动可靠的回归测试         |
| conformance 仅覆盖单链路       | 低     | 按 plan 判定"已完成"，但覆盖面窄 |
| calendar-chinese 单文件 845 行 | 低     | 建议拆分 internal 模块           |

---

## 七、测试覆盖评估

### 7.1 错误路径覆盖

| 包                   | 边界/错误测试                                | 评估    |
| -------------------- | -------------------------------------------- | ------- |
| primitives           | NaN/Infinity/除零/非法 tolerance             | ✅ 全面 |
| temporal             | 缺少 provider/非法 UTC/闰秒错误/Delta-T 错误 | ✅ 全面 |
| reference            | 坐标比较/笛卡尔零向量                        | ✅      |
| ephemerides          | provider 协议测试                            | ✅      |
| ephemerides-vsop87   | 不支持的天体/frame/precision                 | ✅      |
| ephemerides-elp2000  | 不支持的天体/frame/precision                 | ✅      |
| phenomena            | 非法年份/搜索窗口/包围区间缺失               | ✅      |
| calendar-chinese     | 非法年份/倒序窗口/非递增朔时刻               | ✅      |
| dataset-delta-t      | 超出覆盖范围                                 | ✅      |
| dataset-leap-seconds | 超出覆盖范围                                 | ✅      |

**结论：错误路径覆盖整体良好。**

### 7.2 边界值覆盖

- primitives：角度归一化边界（0/360/±180）、零向量归一化拒绝 ✅
- temporal：闰年 2 月 29 日、offset 跨日 ✅
- calendar-chinese：年界（春节前后）、月界（闰月切换前后） ✅

---

## 八、文档完整性评估

| 包                   | README 行数    | TSDoc 覆盖                      | 评估 |
| -------------------- | -------------- | ------------------------------- | ---- |
| primitives           | 215            | 完整（@param/@returns/@throws） | ✅   |
| temporal             | 267            | 完整                            | ✅   |
| reference            | **3**          | 完整                            | ❌   |
| ephemerides          | 77             | 完整                            | ✅   |
| ephemerides-vsop87   | 存在           | 完整                            | ✅   |
| ephemerides-elp2000  | 存在           | 完整                            | ✅   |
| phenomena            | 46（**过时**） | 完整                            | ❌   |
| calendar-chinese     | 31（简略）     | 部分（内部函数缺 @throws）      | ⚠️   |
| dataset-delta-t      | 存在           | 完整                            | ✅   |
| dataset-leap-seconds | 存在           | 完整                            | ✅   |

---

## 九、建议改进优先级

### P0（应尽快修复）

1. **reference/README.md**：从 3 行扩展到完整文档（导出清单、API 示例、参考系说明）
2. **phenomena/README.md**：更新导出清单，加入朔望相关 API

### P1（应在本阶段补全）

3. **standards/lunar/phases.json**：从 2 条扩展到至少 50 条（覆盖多年朔望）
4. **conformance/** 增加 solar-terms 和 lunar-phases 独立校验入口

### P2（后续阶段）

5. **calendar-chinese/src/index.ts** 拆分 internal 模块
6. **benchmarks/** 增加 primitives/temporal 基准
7. 更新 RFC 0004 记录 Vector3 已提升为公共 API
8. 统一 `toUtcMilliseconds`/`createInstantFromUtcMilliseconds` 重复定义（可考虑提取到 temporal 包作为公共 helper，或至少提取到 shared internal 约定）

---

## 十、结论

Epheon 代码库整体处于良好状态。所有 10 个 packages/\* 包均按照 RFC 和 plans 的阶段规划实现了承诺的能力，测试覆盖扎实（错误路径和边界值均有验证），工程工具链（pnpm/Moonrepo/Vitest/Oxlint/Oxfmt/Lefthook/Changesets）完整运转。

主要改进空间集中在**文档完善**（reference 和 phenomena 的 README）和**验证体系深化**（lunar fixture 扩充、conformance 多链路覆盖），不涉及核心算法或 API 设计的结构性缺陷。第六阶段的 compat/runtime/cli 包按计划暂缓，无抢跑问题。
