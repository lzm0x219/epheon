# Epheon Conformance（一致性测试）

## 定位

`conformance/` 存放跨实现的一致性校验测试。

conformance 只验证公共 API 与 `standards/` fixture 之间的一致性，不验证内部算法实现细节。

## 适用范围

- 验证 TypeScript 官方实现的公共 API 输出与 `standards/` 预期值一致
- 验证第三方实现（Rust、Python 等语言重实现）的输出是否匹配同一组 standards
- 验证升级算法后行为是否回归

## 不做的事

- conformance 不直接导入 `src/internal/*`
- conformance 不覆盖包级单元测试已覆盖的局部边界场景（那些留在 `packages/*/tests/` 中）
- conformance 不验证性能（去 `benchmarks/`）

## 当前入口

当前最小可运行入口：

```txt
pnpm conformance
```

当前 runner 基于 `vitest`，执行：

- `conformance/calendar-chinese.test.ts`
- `conformance/solar-terms.test.ts`
- `conformance/lunar-phases.test.ts`

当前校验三条链路：

- 中国历法：`@epheon/calendar-chinese` ↔ `standards/calendar-chinese/lunar.json`
- 二十四节气：`@epheon/phenomena` ↔ `standards/solar/terms.json`
- 朔望：`@epheon/phenomena` ↔ `standards/lunar/phases.json`

## 当前规则

中国历法 conformance 使用离散结果的精确相等校验：

- 农历月表：精确比较 `year`、`month`、`isLeapMonth`
- 农历日期：精确比较 `year`、`month`、`day`、`isLeapMonth`

天象 conformance 使用数值 tolerance：

- 太阳节气：±15 分钟（VSOP87 低阶模型 vs JPL Horizons）
- 朔望：±6 小时（6 小时步进扫描算法的最大理论误差）

> 完整的 fixture 数据来源、领域分类与 tolerance 约定参见 [`standards/README.md`](../standards/README.md#数据来源)。

当前数据来源链路：

- 样例文件：`standards/calendar-chinese/lunar.json`
- 样例由 VSOP87（太阳）+ ELP2000（月亮）+ 内置 ΔT + IERS 闰秒表，按 modern 规则集合成
- 每条样例的 `basis` 字段说明该样例对应的规则集切片与边界场景
- 天象输入的数值精度由 JPL Horizons 校准（参见 `standards/solar/terms.json` 的 `basis`）
- 离散字段的精确相等建立在底层天象输入已在 tolerance 内收敛的前提上

当前 `conformance/` 仍不纳入 pnpm workspace；先保持一个独立、可手动执行的最小入口。

## 未来扩展方向

1. 基于 TypeScript 版本的官方 conformance runner
2. 基于 REST/gRPC 协议的远程实现验证
3. 基于 WASM 的浏览器端一致性校验
4. 基于 JSON fixture 的纯数据驱动验证（不依赖任何运行时）
