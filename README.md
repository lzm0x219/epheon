<p align="center">
  <img src="docs/assets/readme-banner.svg" alt="Epheon banner" width="100%" />
</p>

<h1 align="center">Epheon</h1>

<p align="center">
  面向中国历法体系的、标准驱动的天文历法引擎。
</p>

<p align="center">
  只处理客观的天文与历法计算，不处理术数解释、流派判断或占断规则。
</p>

<p align="center">
  <a href="https://github.com/lzm0x219/epheon/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/lzm0x219/epheon/actions/workflows/ci.yml/badge.svg" /></a>
  <img alt="Node.js 24.16+" src="https://badges.ws/badge/Node.js-24.16%2B-339933?logo=nodedotjs&amp;logoColor=white" />
  <img alt="pnpm 11.7.0" src="https://badges.ws/badge/pnpm-11.7.0-F69220?logo=pnpm&amp;logoColor=white" />
  <a href="LICENSE"><img alt="License: MIT" src="https://badges.ws/github/license/lzm0x219/epheon" /></a>
</p>

<p align="center">
  <a href="#why-epheon">Why Epheon</a> ·
  <a href="#current-packages">Packages</a> ·
  <a href="#getting-started">Getting Started</a> ·
  <a href="#repository-layout">Repository Layout</a> ·
  <a href="#documentation">Documentation</a>
</p>

## Why Epheon

Epheon 为中国历法相关软件提供一层可靠、可验证、可复现的天文历法基础设施。它优先解决最容易出错、也最值得长期稳定的部分：时间模型、儒略日、时间尺度、精度与容差，以及可替换的数据 provider。

很多相关系统的问题，不在于“功能不够多”，而在于边界不够清楚。当天文计算、历法规则和术数解释混在一起，结果就会变得难以验证、难以复用，也难以长期维护。

Epheon 的选择很简单：把客观计算与主观解释分开。先把底层做准，再让上层系统在清晰边界之上自由构建。

| Epheon 负责                            | Epheon 不负责              |
| -------------------------------------- | -------------------------- |
| 时间与历法相关的基础值类型与时间模型   | 八字、紫微斗数等解释性功能 |
| 儒略日、时间尺度、精度与容差等基础能力 | 神煞、格局、吉凶等主观判断 |
| 后续的天象事件、中国历法规则与标准数据 | 某一流派的占断规则编排     |

## Current Packages

仓库已完成第一阶段工程基线，当前以两个核心包为主，并为第二阶段数据能力预留了独立包边界。

| Package                                                  | 说明                                              |
| -------------------------------------------------------- | ------------------------------------------------- |
| [`@epheon/primitives`](packages/primitives/)             | 基础值类型、误差表达与通用数学原语                |
| [`@epheon/temporal`](packages/temporal/)                 | 时间模型、Julian Day、UTC/TT 边界与 provider 骨架 |
| [`dataset-delta-t`](packages/dataset-delta-t/)           | Delta-T 数据集包骨架                              |
| [`dataset-leap-seconds`](packages/dataset-leap-seconds/) | 闰秒数据集包骨架                                  |

第二阶段将继续围绕参考系、星历 provider、闰秒与 Delta-T 数据模型，以及后续历法能力展开。

## Getting Started

### Requirements

- Node.js `>= 24.16.0`
- pnpm `11.7.0`

### Install

```bash
pnpm install --frozen-lockfile
```

### Verify

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm format:check
pnpm build
```

在非交互环境中，建议显式设置 `CI=true`，避免 pnpm 触发模块清理确认：

```bash
CI=true pnpm test
CI=true pnpm typecheck
CI=true pnpm build
```

提交前可手动运行：

```bash
pnpm exec lefthook run pre-commit
```

## Repository Layout

| 路径                             | 用途                      |
| -------------------------------- | ------------------------- |
| [`docs/rfcs/`](docs/rfcs/)       | 架构、边界与公共 API 决策 |
| [`docs/plans/`](docs/plans/)     | 阶段任务拆分与实现计划    |
| [`docs/reviews/`](docs/reviews/) | 设计与实现对照审查记录    |
| [`packages/`](packages/)         | 工作区包                  |
| [`standards/`](standards/)       | 标准 fixture 与参考数据   |
| [`conformance/`](conformance/)   | 跨实现正确性校验          |
| [`benchmarks/`](benchmarks/)     | 性能测试                  |

## Design Constraints

- 核心包只处理客观天文与历法问题，不承载解释性逻辑
- 精度、单位与容差必须显式表达，不依赖隐含约定
- 核心逻辑保持纯净，不隐式读取文件系统、网络、系统时区或全局可变状态
- 公共 API 以各包 `src/index.ts` 为边界，内部实现细节不对外暴露

## Documentation

- 架构与设计决策：[`docs/rfcs/`](docs/rfcs/)
- 阶段计划：[`docs/plans/`](docs/plans/)
- 第一阶段审查记录：[`docs/reviews/0001-rfc-vs-code-audit.md`](docs/reviews/0001-rfc-vs-code-audit.md)
- 包级说明：[`packages/primitives/README.md`](packages/primitives/README.md)、[`packages/temporal/README.md`](packages/temporal/README.md)

## License

MIT
