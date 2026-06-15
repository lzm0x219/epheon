# Epheon 工程化基础 RFC

## 一、目的

本文定义 Epheon 第一阶段的工程落地方案。

它不改变 `0001-architecture.md` 中的核心架构原则，只回答一个问题：

```txt
项目如何被初始化、构建、测试、校验和发布？
```

工程化选择应该服务于以下目标：

```txt
快速启动
清晰分层
可测试
可发布
可替换
可长期维护
```

## 二、阶段范围

本文只覆盖第一阶段。

第一阶段目标是建立可运行的最小工程骨架，并实现：

```txt
@epheon/primitives
@epheon/temporal
```

第一阶段不实现：

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

这些能力应在后续 RFC 或阶段计划中展开。

## 三、仓库形态

Epheon 采用 monorepo。

当前根目录已经包含：

```txt
epheon/
├─ docs/
│  └─ rfcs/
├─ AGENTS.md
├─ package.json
├─ README.md
├─ LICENSE
├─ pnpm-lock.yaml
├─ pnpm-workspace.yaml
├─ tsconfig.json
├─ vitest.config.ts
├─ .editorconfig
├─ .gitignore
├─ .github/
│  └─ renovate.json
├─ .changeset/
├─ .moon/
├─ .oxlintrc.json
├─ .oxfmtrc.json
└─ lefthook.yml
```

第一阶段目标目录：

```txt
epheon/
├─ docs/
│  └─ rfcs/
├─ packages/
│  ├─ primitives/
│  └─ temporal/
├─ standards/
├─ conformance/
├─ benchmarks/
└─ apps/
```

当前已经创建第一阶段 package 骨架：

```txt
packages/primitives/
packages/temporal/
standards/primitives/
standards/temporal/
```

它们已经包含 package、TypeScript、tsdown、Moonrepo 配置，以及第一批最小 `src/index.ts` 实现和单元测试。

`standards/` 已经包含 primitives 与 temporal 的 JSON fixture。`conformance/` 与 `benchmarks/` 已创建为空目录，保留给后续验证与性能基线工作；`apps/` 仍未创建，保留为后续阶段目录。

第一阶段可以暂不创建所有最终目录，但根目录结构和 workspace 配置应为后续包预留空间。

## 四、包管理器

使用 `pnpm`，当前版本由根 `package.json` 固定：

```txt
pnpm 11.6.0
```

原因：

```txt
原生支持 workspace
依赖解析严格
安装速度快
适合多包仓库
lockfile 可读性较好
```

根目录应包含：

```txt
pnpm-workspace.yaml
pnpm-lock.yaml
```

当前 workspace 范围：

```yaml
packages:
  - packages/*
```

`apps/*` 暂未纳入 workspace。等 CLI 或 playground 进入实际开发时，再把 `apps/*` 加入 `pnpm-workspace.yaml`。

当前依赖版本使用 pnpm catalog 集中管理，位置在：

```txt
pnpm-workspace.yaml
```

根 `package.json` 中的开发依赖使用：

```txt
"catalog:"
```

这样可以在 monorepo 中统一锁定工具链版本。

当前 `pnpm-workspace.yaml` 还声明：

```yaml
allowBuilds:
  lefthook: true
```

这是为了允许 Lefthook 运行安装期构建脚本。

## 五、语言与模块格式

使用 TypeScript。

当前根 `tsconfig.json` 采用：

```txt
target: ES2023
lib: DOM, ES2023
module: ESNext
moduleResolution: Bundler
strict: true
noEmit: true
isolatedModules: true
isolatedDeclarations: true
exactOptionalPropertyTypes: true
noUncheckedIndexedAccess: true
```

包输出优先采用 ESM。

第一阶段默认策略：

```txt
源码：TypeScript
源码目录：src/
测试目录：tests/
产物目录：dist/
主分发格式：ESM
类型声明：必须生成 .d.ts
```

每个 package 的开发期 `exports` 应遵循 tsdown `devExports` 行为，指向源码入口：

```json
{
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./package.json": "./package.json"
  },
  "publishConfig": {
    "exports": {
      ".": {
        "import": "./dist/index.mjs",
        "require": "./dist/index.cjs"
      },
      "./package.json": "./package.json"
    },
    "access": "public"
  }
}
```

当前 package 骨架的构建配置输出 ESM 与 CJS。

源码仍以 TypeScript 与 ESM 语义为准，CJS 只作为发布产物兼容层。

发布态 `publishConfig.exports` 不手写自定义类型条件，保持 tsdown `devExports` 的生成形态：开发期源码入口与发布期 `dist/` 运行时入口分离。package 入口质量检查由 Moon build 中的 tsdown/publint 流程承担，不额外提供根级 `publint` script。

如果后续发现双格式输出增加维护成本，可以通过独立 RFC 收缩为 ESM-only。

## 六、构建工具

使用 `tsdown` 构建包。

当前状态：

```txt
pnpm catalog 已声明 tsdown 0.22.2。
根 package.json 尚未把 tsdown 加入 devDependencies。
根 package.json 已提供 build 脚本。
packages/primitives 与 packages/temporal 已声明 tsdown devDependency。
packages/primitives 与 packages/temporal 已包含 tsdown.config.ts。
当前 package 已包含 src/index.ts、领域类型实现、internal 辅助模块和单元测试，因此构建任务可以完整运行。
```

原因：

```txt
适合 TypeScript library
配置较轻
构建速度快
支持类型声明生成
适合 monorepo package 输出
```

子包不声明 `scripts` 字段。构建任务由 Moonrepo 的 `moon.yml` 接管，测试、类型检查、lint 和格式化统一通过仓库根目录脚本聚合执行。

根脚本当前约定为：

```json
{
  "scripts": {
    "build": "pnpm moon run :build",
    "coverage": "vitest run --coverage",
    "format": "oxfmt .",
    "format:check": "oxfmt --check .",
    "lint": "oxlint",
    "typecheck": "tsgo --noEmit",
    "test": "vitest"
  }
}
```

当前根 `test` 脚本已通过 Vitest workspace projects 运行所有包测试。

本地非交互环境和 CI 中推荐显式使用：

```bash
CI=true pnpm test
CI=true pnpm typecheck
CI=true pnpm build
```

原因是 pnpm 在非 TTY 场景下可能因模块目录清理确认而失败。当前阶段不额外引入
npm、Yarn、Bun lockfile，也不通过新增脚本包装 `CI=true`，保持根命令与本地交互
使用方式一致。

## 七、测试框架

使用 `vitest`。

当前版本：

```txt
vitest 4.1.8
@vitest/coverage-v8 4.1.8
```

当前根 `vitest.config.ts`：

```txt
test.projects: packages/*
coverage.provider: v8
coverage.include: src/**/*.{ts,tsx}
```

这意味着测试配置已经面向 workspace package，当前第一批 package 已包含测试文件。

原因：

```txt
适合 TypeScript
启动快
断言体验接近 Jest
适合纯函数和数值计算测试
可以扩展 coverage
```

第一阶段测试重点：

```txt
Angle 归一化
角度单位转换
Julian Day 转换
UTC 解析
UTC 与 TT 的接口边界
ΔT provider 的替换模型
错误输入处理
```

数值计算测试必须显式声明误差容忍度。

例如：

```txt
expectAlmostEqual(actual, expected, tolerance)
```

不要在天文计算中使用隐含的精度判断。

共享标准样例统一放在：

```txt
standards/
```

包级单元测试可以读取 `standards/` 下对应领域的 JSON fixture。角度、时长、Julian Day、TT/JDE、UT1 offset 和 Delta-T 等稳定样例不应散落硬编码在多个测试文件中；只有非常局部的边界输入才允许直接写在测试用例里。

## 八、代码规范

第一阶段采用：

```txt
TypeScript strict mode
Oxlint
Oxfmt
Lefthook
```

当前配置：

```txt
.oxlintrc.json
.oxfmtrc.json
lefthook.yml
```

Oxlint 启用：

```txt
typescript
unicorn
oxc
type-aware
type-check
```

Oxfmt 当前约束：

```txt
tabWidth: 2
printWidth: 100
trailingComma: none
sortPackageJson: true
sortImports: enabled
sortTailwindcss: true
```

EditorConfig 当前约束：

```txt
indent_style: space
indent_size: 2
end_of_line: lf
charset: utf-8
trim_trailing_whitespace: true
insert_final_newline: true
```

Lefthook 当前配置了 pre-commit，并行执行：

```txt
lint
format
type check
```

这些 hook 当前通过 `pnpm exec oxlint` 与 `pnpm exec oxfmt` 执行，并启用 `stage_fixed: true` 自动重新暂存修复后的文件。

要求：

```txt
禁止隐式 any
导出 API 必须有稳定命名
核心类型尽量不可变
公共 API 必须有中文 TSDoc 注释
内部算法必须有中文关键注释
测试用例必须覆盖边界输入
公共 API 不直接暴露内部数据结构
```

注释要求：

```txt
说明语义，而不是复述代码。
说明单位、不变量、错误行为和精度边界。
函数和方法必须说明入参。
函数和方法必须说明返回值。
可能抛错的函数和方法必须说明抛错条件。
复杂公式、历法规则、时间尺度转换必须写中文注释。
避免无信息量注释。
```

格式化与 lint 不应该承担架构约束。

架构约束应由：

```txt
包依赖规则
测试
conformance
文档
code review
```

共同保证。

## 九、依赖策略

核心包应尽量少依赖。

当前根 `devDependencies` 包含：

```txt
@changesets/cli
@changesets/types
@moonrepo/cli
@typescript/native-preview
@vitest/coverage-v8
lefthook
oxfmt
oxlint
oxlint-tsgolint
publint
typescript
vite
vitest
```

这些依赖都是工程工具，不应进入核心运行时依赖。

当前 catalog 中的关键版本：

```txt
@moonrepo/cli: 2.3.3
@vitest/coverage-v8: 4.1.8
@types/node: 25.9.3
@typescript/native-preview: 7.0.0-dev.20260614.1
@changesets/cli: 3.0.0-next.5
@changesets/types: 6.1.0
vite: 8.0.16
vitest: 4.1.8
lefthook: 2.1.9
oxfmt: 0.54.0
oxlint: 1.69.0
oxlint-tsgolint: 0.23.0
tsdown: 0.22.2
typescript: 6.0.3
publint: 0.3.21
```

当前 `.github/renovate.json` 已启用 Renovate 推荐配置：

```txt
label: dependencies
assignee: lzm0x219
autoApprove: true
automerge: false
automergeStrategy: squash
ignoreTests: false
```

Renovate 用于依赖更新，不承担 CI 校验职责。

第一阶段原则：

```txt
@epheon/primitives 不依赖任何运行时第三方包。
@epheon/temporal 可以依赖 @epheon/primitives。
@epheon/temporal 不依赖 JavaScript 日期库。
外部日期库只能进入 @epheon/compat。
测试工具只作为 devDependency。
构建工具只作为 devDependency。
```

禁止出现反向依赖：

```txt
@epheon/primitives -> @epheon/temporal
@epheon/temporal -> @epheon/calendar-*
core package -> cli
core package -> playground
```

## 十、发布策略

使用 Changesets 管理版本与发布。

当前状态：

```txt
Changesets 依赖已在 package.json 中声明。
.changeset/ 已初始化。
.changeset/config.json 已将 @epheon/primitives 与 @epheon/temporal 设为 linked package。
.changeset/changelog-generator.ts 已配置仓库为 lzm0x219/epheon，用于生成 PR 链接。
packages/primitives 与 packages/temporal 已具备可发布 package 的基础元数据。
当前 package 已包含最小源码，构建产物由 tsdown 生成到 dist/，并由 .gitignore 忽略。
```

原因：

```txt
适合 monorepo
可以独立版本
可以生成 changelog
适合 npm package 发布
```

第一阶段可以先不发布到 npm，但 package 结构应按可发布标准设计。

每个 package 都应包含：

```txt
name
version
description
license
type
exports
files
```

子包不需要 `scripts` 字段；构建入口在 `moon.yml` 中声明，测试入口使用根 `pnpm test`。

## 十一、CI 策略

第一阶段 CI 最终至少执行：

```txt
pnpm install --frozen-lockfile
CI=true pnpm lint
CI=true pnpm format:check
CI=true pnpm typecheck
CI=true pnpm test
CI=true pnpm build
```

当前状态：

```txt
.github/workflows/ci.yml 已添加。
CI 在 pull request 与 main 分支 push 时运行。
CI 使用 Node.js 24、Corepack 与 pnpm install --frozen-lockfile。
根 package.json 已提供 build/typecheck/test/coverage/lint/format/format:check 脚本。
```

后续再增加：

```txt
coverage
benchmark
conformance
package size check
docs build
release dry run
```

CI 不应该依赖本地未提交数据。

如果测试需要标准数据，数据应进入：

```txt
standards/
```

或独立 dataset package。

当前已经存在：

```txt
standards/primitives/
standards/temporal/
```

其中 `standards/temporal/` 当前包含 Julian Day 与时间尺度转换 fixture。这些 fixture 是测试与未来 conformance 的共同输入，不属于核心包运行时代码。

## 十二、运行时支持

第一阶段优先支持：

```txt
Node.js >= 24.16.0
Browser bundler
```

第一阶段暂不承诺：

```txt
Deno
Bun
WASM
Web Worker
```

但 API 设计不应主动阻碍这些运行时。

核心包中应避免：

```txt
Node 专属 API
全局可变状态
隐式读取文件系统
隐式网络请求
依赖系统时区
```

## 十三、第一阶段最小交付

第一阶段完成时，仓库应具备：

```txt
可安装
可构建
可测试
可类型检查
可作为 npm package 发布
```

最小包：

```txt
@epheon/primitives
@epheon/temporal
```

最小能力：

```txt
Angle
Duration
Result 或错误模型
Instant
Julian Day
UTC 输入
TT 表达
ΔT provider 接口
```

当前进展：

```txt
@epheon/primitives 已实现 Angle、Duration、Result、PrimitiveError、Tolerance 与 almostEqual。
@epheon/temporal 已实现 Instant、JulianDay、JulianEphemerisDay、UtcDateTime、TemporalError、DeltaTProvider、LeapSecondProvider、fixedDeltaT 与 fixedLeapSeconds。
两个包的公共 API 都从 src/index.ts 导出，internal 辅助模块没有从主入口导出。
temporal 通过 workspace:* 依赖 primitives，primitives 不包含运行时第三方依赖。
```

最小验证：

```txt
单位测试
边界测试
已知 JD 样例
误差容忍工具
```

## 十四、暂缓决策

以下问题暂缓：

```txt
是否扩大 Moonrepo 任务编排范围
是否长期保留 CJS 发布产物
是否发布 Deno/Bun 专用入口
是否提供 WASM 实现
是否内置高精度数据下载器
是否提供浏览器 playground
```

当前 `@moonrepo/cli` 已作为开发依赖声明，且仓库已经包含基础配置：

```txt
.moon/workspace.yml
.moon/tasks/all.yml
packages/primitives/moon.yml
packages/temporal/moon.yml
```

第一阶段可以使用 Moonrepo 执行 package build 任务。后续是否把 lint、test、typecheck、release dry run 等都纳入 Moonrepo，由实际复杂度决定。

这些问题应在对应阶段到来时再决策。

过早绑定会增加维护成本。

## 十五、落地状态与计划边界

本文记录第一阶段工程化基础的稳定决策、约束和当前状态，不维护逐项实施清单。

当前项目已经进入第一阶段实现期，工程骨架可以支持继续扩展核心领域能力。

后续任务拆分、验收标准和推荐执行顺序由计划文档维护：

```txt
docs/plans/0001-first-stage-task-breakdown.md
```

如果后续任务改变包管理器、构建工具、测试框架、发布策略、运行时支持矩阵或核心包边界，应先更新本文或新增 RFC，再落到计划与实现中。
