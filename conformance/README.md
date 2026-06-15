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

## 当前状态

第一阶段不把 conformance 纳入 pnpm workspace。等到出现可执行的 conformance runner（基于 Node.js 或其他运行时）后再决策其工具链和 CI 集成方式。

当前 `conformance/` 保留为目录占位，为后续多语言校验预留空间。

## 未来扩展方向

1. 基于 TypeScript 版本的官方 conformance runner
2. 基于 REST/gRPC 协议的远程实现验证
3. 基于 WASM 的浏览器端一致性校验
4. 基于 JSON fixture 的纯数据驱动验证（不依赖任何运行时）
