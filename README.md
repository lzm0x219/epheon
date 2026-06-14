# Epheon

Epheon 是一个面向东亚历法体系的、标准驱动的天文历法引擎。

它不是命理库，不是术数框架，也不是只靠查表的农历包。它的边界更窄，也更严格：

```txt
天文与历法属于 Epheon。
解释与占断不属于 Epheon。
```

Epheon 用来回答这类问题：

```txt
一个时间点应该如何表示？
一个民用时间对应哪个儒略日？
某个时刻的太阳视黄经是多少？
某一年的二十四节气分别发生在什么时候？
朔日分别发生在什么时候？
某个公历日期对应哪个中国历日期？
某个时间对应的干支纪年、纪月、纪日、纪时是什么？
```

Epheon 不回答这类问题：

```txt
这个八字好不好？
这个紫微斗数命盘应该怎么解释？
某个神煞在某个流派里是什么意思？
应该采用哪个占断规则？
```

## 当前状态

Epheon 目前处于架构设计与工程基础阶段。

当前仓库状态：

```txt
docs/rfcs/0001-architecture.md
docs/rfcs/0002-engineering-foundation.md
docs/rfcs/0003-temporal-model.md
docs/rfcs/0004-primitives-api.md
packages/primitives/
packages/temporal/
```

当前已经具备第一批最小源码、测试和构建配置。`@epheon/primitives` 已包含角度、时长、Result 与 tolerance 基础能力；`@epheon/temporal` 已包含 Julian Day、Instant 与 provider 骨架。

## 架构

长期架构分为三部分：

```txt
Specification
Engine
Distribution
```

计划中的包分层：

```txt
@epheon/spec

@epheon/primitives
@epheon/temporal
@epheon/reference

@epheon/ephemerides
@epheon/ephemerides-vsop87
@epheon/ephemerides-elp2000
@epheon/ephemerides-jpl

@epheon/phenomena

@epheon/calendars
@epheon/calendar-gregorian
@epheon/calendar-julian
@epheon/calendar-chinese

@epheon/dataset-*

@epheon/standards
@epheon/conformance
@epheon/benchmarks

@epheon/compat
@epheon/runtime
@epheon/cli
```

依赖方向必须保持单向：

```txt
primitives -> temporal -> reference -> ephemerides -> phenomena -> calendars
```

低层包不得依赖高层历法包、CLI、playground 或任何解释性逻辑。

## 第一阶段

第一阶段只聚焦：

```txt
@epheon/primitives
@epheon/temporal
```

最小目标：

```txt
Angle
Duration
Instant
Julian Day
UTC input
TT representation
Delta-T provider interface
explicit precision and tolerance rules
```

当前已完成其中的最小工程版本，用于验证 API 风格和构建链路。后续还需要继续扩展错误模型、标准样例、Delta-T 数据模型和更完整的时间尺度转换。

第一阶段有意排除：

```txt
VSOP87
ELP2000
JPL ephemerides
solar terms
new moons
Chinese calendar rules
CLI
playground
```

## 工程

Epheon 当前使用：

```txt
pnpm workspace
TypeScript
tsdown
Vitest
Oxlint
Oxfmt
Lefthook
Moonrepo
Changesets
```

常用命令：

```bash
pnpm install --frozen-lockfile
pnpm test
pnpm exec oxlint
pnpm exec oxfmt --check .
pnpm exec lefthook run pre-commit
pnpm exec moon run :build
pnpm exec changeset
```

当前根命令已可用于验证第一阶段包的构建、测试、类型检查、lint 与格式化状态。

## 设计原则

Epheon 遵循这些原则：

```txt
标准优先
只处理客观天文与历法
算法与数据分离
接口与实现分离
正确性比功能数量更重要
精度必须显式表达
值对象表达领域概念
纯函数实现核心算法
provider 注入外部数据
```

核心包应避免：

```txt
隐式读取系统时区
隐式读取文件系统
隐式发起网络请求
全局可变状态
在内核中依赖外部日期库
内嵌大型天文数据集
```

外部日期库应该进入未来的兼容层 package，而不是进入核心时间模型。

## RFCs

项目当前由这些 RFC 指导：

```txt
0001-architecture.md
0002-engineering-foundation.md
0003-temporal-model.md
0004-primitives-api.md
```

如果新的架构决策会影响公共 API、包边界、精度策略、验证数据或长期兼容性，应先写入 RFC，再进入实现。

## 许可证

MIT
