# Repository Guidelines

## 项目结构与模块组织

Epheon 目前处于工程骨架阶段。现有文档位于 `docs/rfcs/`，文件示例包括 `0001-architecture.md` 和 `0002-engineering-foundation.md`。新增 RFC 继续放在该目录，并使用补零数字前缀。

当前根目录已经包含 `package.json`、`pnpm-workspace.yaml`、`pnpm-lock.yaml`、`tsconfig.json`、`vitest.config.ts`、`.editorconfig`、`.gitignore`、`.oxlintrc.json`、`.oxfmtrc.json`、`lefthook.yml`、`.moon/` 和 `.changeset/`。`.github/renovate.json` 已存在；`.github/workflows/` 尚未创建。`packages/*` 工作区已在 pnpm 与 Moonrepo 中声明。

当前第一阶段包骨架如下：

- `packages/primitives/`：基础值类型，当前包含 `Angle`、`Duration`、`Result`、`Tolerance` 与单元测试。
- `packages/temporal/`：时间尺度、Julian Day、UTC、TT 与 delta-T provider 边界，当前包含 `Instant`、`JulianDay`、provider 函数与单元测试。
- `standards/`：参考数据与预期结果 fixture。
- `conformance/`：跨实现正确性校验。
- `benchmarks/`：性能测试。

保持天文历法逻辑与术数解释、流派判断等主观功能分离。

## 构建、测试与开发命令

在仓库根目录使用 `pnpm`。当前 `package.json` 已接入 `build`、`typecheck`、`test`、`lint`、`format` 与 `format:check` 脚本。

- `pnpm install --frozen-lockfile`：按 lockfile 安装依赖。
- `pnpm test`：使用根 Vitest 配置聚合运行所有包测试；本地非交互环境建议使用 `CI=true pnpm test`。
- `pnpm typecheck`：使用根 TypeScript 配置执行类型检查；本地非交互环境建议使用 `CI=true pnpm typecheck`。
- `pnpm exec oxlint`：使用 Oxlint 检查代码。
- `pnpm exec oxfmt --check .`：使用 Oxfmt 检查格式。
- `pnpm exec lefthook run pre-commit`：手动运行 pre-commit 检查。
- `CI=true pnpm build`：运行所有 workspace package 的构建任务；非交互环境下建议设置 `CI=true`，避免 pnpm 触发交互式模块清理确认。
- `pnpm exec moon run :build`：通过 Moonrepo 运行所有包的 `build` 任务；当前任务调用 `tsdown`。
- `pnpm exec changeset`：为影响发布的变更创建 changeset。

除非 RFC 变更包管理器决策，不要添加 npm、Yarn 或 Bun lockfile。

## 编码风格与命名约定

实现包使用 TypeScript、ESM 与 strict mode。当前根 `tsconfig.json` 目标为 ES2023，使用 `moduleResolution: "Bundler"`、`isolatedModules`、`isolatedDeclarations`、`exactOptionalPropertyTypes` 和 `noUncheckedIndexedAccess`。

公共 API 应使用稳定、清晰的命名，并避免暴露内部数据结构。核心值类型优先设计为不可变；存在歧义时，在名称中显式体现单位。

源码必须包含明确、清晰的中文注释。公共 API 使用中文 TSDoc 说明语义、单位、错误行为和不变量；函数和方法必须包含 `@param` 与 `@returns`，可能抛错时必须包含 `@throws`。内部算法在关键公式、边界处理和非显然转换处写中文注释，并说明关键入参与返回值。避免无信息量注释，例如“给变量赋值”。

每个包的 `src/index.ts` 是公共 API 边界。默认只导出稳定领域对象、provider 类型和明确承诺的 helper。解析器、Gregorian 辅助计算、常量、数值校验等实现细节放入 `src/internal/`，不得从主入口导出，也不得被其他 package 跨包引用。

包构建使用 `tsdown.config.ts`，入口约定为 `src/index.ts`，当前配置输出 ESM 与 CJS，并生成类型声明。package 的开发期 `exports` 指向源码，发布期 `publishConfig.exports` 遵循 tsdown `devExports` 生成行为，只映射 import/require 运行时入口到 `dist/`，不得手写成另一套自定义发布出口。package 入口质量检查由 Moon build 中的 tsdown/publint 流程承担。

代码检查与格式化使用 Oxlint 和 Oxfmt，不使用 ESLint/Prettier。Oxfmt 会排序 `package.json` 和 import，默认 `tabWidth` 为 2、`printWidth` 为 100。EditorConfig 要求 2 空格、LF、UTF-8、去除行尾空白并保留文件末尾换行。Markdown 保持简洁，并沿用 RFC 命名模式：`0003-topic-name.md`。

Lefthook 当前 pre-commit hook 并行执行三个 job：`lint` 对已暂存的 JS/TS/JSON/JSONC 文件运行 `pnpm exec oxlint {staged_files}`；`format` 对全部已暂存文件运行 `pnpm exec oxfmt --no-error-on-unmatched-pattern {staged_files}`；`type check` 运行 `pnpm exec oxlint --type-aware {staged_files}`。这些 job 都启用 `stage_fixed: true`，自动修复后会重新暂存结果。

## 测试指南

包测试使用 Vitest 4，根配置启用 `projects: ["packages/*"]` 和 V8 coverage provider。测试统一通过仓库根目录的 `pnpm test` 聚合运行，子包不声明独立 `test` script。数值测试必须显式声明误差容忍度，例如 `expectAlmostEqual(actual, expected, tolerance)`。优先覆盖边界输入、非法输入、已知 Julian Day 样例、时间尺度转换与 provider 替换行为。

单元测试统一放入包级 `tests/` 目录，不和 `src/` 源码混放。测试默认从包入口 `../src` 导入，以验证公共 API；只有针对内部算法的窄测试才允许显式导入 `src/internal/*`。共享 fixture 放入 `standards/`，不要把大型数据集嵌入核心包。

## 依赖与工具链

依赖版本通过 `pnpm-workspace.yaml` 的 catalog 统一管理。根 `devDependencies` 目前包含 Changesets、Moonrepo CLI、TypeScript、Vite、Vitest、Oxlint、Oxfmt、Lefthook、Publint 等工程工具。

Renovate 已通过 `.github/renovate.json` 配置，使用推荐规则、`dependencies` 标签、指派给 `lzm0x219`，并关闭自动合并。

Moonrepo 已通过 `.moon/workspace.yml` 启用，项目范围为 `packages/*`，默认分支为 `main`，provider 为 GitHub。`.moon/tasks/all.yml` 定义共享 file groups，并声明跨项目隐式依赖 `^:build`。每个包的 `moon.yml` 当前只定义 `build` 任务。

Changesets 已通过 `.changeset/config.json` 初始化，使用 `main` 作为 base branch、`public` 发布访问级别、`linked: [["@epheon/primitives", "@epheon/temporal"]]`、自定义 `changelog-generator.ts`，并关闭 changeset 自动提交。changelog 生成器的 repo 配置为 `lzm0x219/epheon`，用于生成 PR 链接。

## 提交与 Pull Request 规范

仓库当前还没有提交历史，因此使用清晰的 Conventional Commit 风格消息，例如 `docs: add engineering RFC` 或 `feat(temporal): add Julian Day type`。

PR 应包含简短摘要、关键架构选择的理由、测试结果或测试暂不可用说明，并链接相关 RFC 或 issue。只有未来涉及 playground 或文档站等可视化工具时才需要截图。

## 安全与配置提示

核心包不应隐式读取文件系统、发起网络请求、读取系统时区，或修改全局可变状态。大型天文数据应放入独立 dataset package 或 standards fixture，不应进入核心算法包。
