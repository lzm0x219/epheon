# Epheon Delta-T 与闰秒数据模型 RFC

## 一、目的

本文定义 Epheon 第二阶段的 Delta-T 与闰秒数据模型。

它回答：

```txt
真实闰秒数据从哪里来？
真实 Delta-T 数据从哪里来？
数据包如何声明覆盖范围、更新节奏和版本标识？
provider 工厂函数暴露什么公共 API？
dataset package 如何保持为显式可选依赖，而不是 temporal 内核的隐式运行时依赖？
```

第二阶段目标不是立刻实现抓取脚本或联网更新，而是先锁定：

```txt
@epheon/dataset-leap-seconds 的公共边界
@epheon/dataset-delta-t 的公共边界
数据快照的最小元信息
默认 provider 的覆盖与失败语义
```

## 二、设计边界

本文负责：

```txt
闰秒数据来源
Delta-T 数据来源
数据快照的版本标识
覆盖范围声明
更新节奏约定
provider 工厂函数
dataset package 与核心包的依赖边界
```

本文不负责：

```txt
修改 RFC 0003 已确定的 DeltaTProvider / LeapSecondProvider 类型
修改 Instant / UtcDateTime 的公共 API
运行时联网抓取 IERS 数据
leap smear
时区数据库
历史地区历法改革规则
```

其中：

```txt
DeltaTProvider / LeapSecondProvider 仍属于 @epheon/temporal。
dataset package 只负责提供真实数据驱动的 provider 工厂函数。
```

## 三、核心原则

数据模型必须遵守：

```txt
数据与时间内核分离。
数据快照与 provider 逻辑分离。
dataset package 是显式可选依赖，不是核心包隐式依赖。
provider 工厂函数返回纯函数型 provider，不升级为重接口。
版本、覆盖范围和来源元信息单独导出，不挂在 provider 实例上。
运行时不读取网络、文件系统或全局配置。
超出覆盖范围必须失败，不静默猜测未来闰秒或无限外推 Delta-T。
```

原因：

```txt
RFC 0003 已经把 provider 定义为轻量函数边界。
第二阶段真正缺的是数据，不是新的抽象层。
把元信息与 provider 分开，能保留 temporal 包现有 API，不把 richer provider 形状反向压回核心包。
```

## 四、公共 API 边界

第二阶段 dataset package 的最小公共 API：

```ts
import type { DeltaTProvider, LeapSecondProvider } from "@epheon/temporal";

export type DatasetInfo = {
  readonly id: string;
  readonly source: readonly string[];
  readonly generatedAt: string;
  readonly coverageStart: string;
  readonly coverageEnd: string;
  readonly updateCadence: string;
};

export declare function createLeapSecondProvider(): LeapSecondProvider;
export declare const leapSecondDatasetInfo: DatasetInfo;

export declare function createDeltaTProvider(): DeltaTProvider;
export declare const deltaTDatasetInfo: DatasetInfo;
```

约束：

```txt
createLeapSecondProvider() 返回 LeapSecondProvider。
createDeltaTProvider() 返回 DeltaTProvider。
默认工厂函数不要求调用方传 options。
若未来确实出现多个内建数据快照，优先新增具名工厂函数，而不是提前设计宽泛 options bag。
```

示例：

```ts
import { Instant } from "@epheon/temporal";
import { createDeltaTProvider } from "@epheon/dataset-delta-t";
import { createLeapSecondProvider } from "@epheon/dataset-leap-seconds";

const instant = Instant.fromUTC("2026-02-04T08:00:00+08:00", {
  leapSeconds: createLeapSecondProvider(),
  deltaT: createDeltaTProvider()
});
```

## 五、闰秒数据模型

### 1. 数据来源

`@epheon/dataset-leap-seconds` 的权威来源是 IERS 的闰秒公告体系。

默认快照应基于：

```txt
IERS Bulletin C
IERS 官方 time scales / leap second 发布页或等价官方镜像
```

规范要求：

```txt
Bulletin C 是是否插入闰秒的判定来源。
包内可以保存归一化后的静态表，但不得在运行时重新联网确认。
同一 release 必须在 README 或 datasetInfo.source 中写明所依据的 Bulletin C 标识。
```

### 2. 归一化结构

建议的归一化快照结构：

```ts
type LeapSecondEntry = {
  readonly effectiveAt: string;
  readonly taiMinusUtcSeconds: number;
  readonly source: string;
};
```

字段语义：

```txt
effectiveAt: 新的 TAI-UTC 生效的 UTC 时刻，格式固定为 ISO 8601 且使用 Z。
taiMinusUtcSeconds: 该时刻起生效的 TAI-UTC 秒数，必须是整数。
source: 对应公告标识，例如某期 Bulletin C 编号或官方发布日期。
```

查找规则：

```txt
provider 选择最后一条 effectiveAt <= input 的记录。
若 input 早于第一条记录，provider 必须抛错。
provider 不得假设相邻记录只会 +1 秒；数据模型必须允许未来出现负闰秒。
```

### 3. 覆盖范围

默认数据快照的最小覆盖起点应为：

```txt
1972-01-01T00:00:00Z
```

因为现代 UTC 闰秒制度从该时点起进入现行模式。

覆盖终点规则：

```txt
coverageEnd 必须是该快照显式承诺的最后 UTC 时刻。
超出 coverageEnd 的查询必须抛错，而不是盲目沿用最后一个 TAI-UTC 值。
```

这样做的原因是：

```txt
未来闰秒只会在官方公告后才确定。
对超出公告范围的日期静默返回当前值，会把“暂时未知”伪装成“确定无闰秒”。
```

### 4. 更新节奏

闰秒数据按官方公告节奏检查。

默认约定：

```txt
至少每次 IERS 发布新的 Bulletin C 时评估一次是否需要发包。
若公告没有改变已知表和 coverageEnd，可以不为“无变化”单独发布新版本。
```

也就是说：

```txt
源数据检查节奏是半年度级别。
npm 发包节奏取决于归一化快照是否发生实际变化。
```

## 六、Delta-T 数据模型

### 1. 数据来源

`@epheon/dataset-delta-t` 的默认数据模型分成两类来源：

```txt
现代观测/预测段：来自 IERS 的 UT1-UTC 产品，归一化为 Delta-T。
历史或远未来段：来自包版本明确选定的公开表或多项式模型。
```

现代段的换算关系固定为：

```txt
Delta-T = (TAI-UTC) + 32.184s - (UT1-UTC)
```

约束：

```txt
现代段的 Delta-T 值应在数据生成阶段就被归一化完成。
运行时 provider 不应再依赖 @epheon/dataset-leap-seconds 做二次拼装。
同一版本必须在 README 或 datasetInfo.source 中列出现代段来源与历史/未来模型来源。
```

这样可以避免：

```txt
dataset package 之间形成不必要的运行时链式依赖。
同一时刻先查 leap second 再查 UT1-UTC 的重复工作。
```

### 2. 归一化结构

Delta-T 快照允许使用分段模型。

逻辑结构建议为：

```ts
type DeltaTSegment =
  | {
      readonly kind: "table";
      readonly coverageStart: string;
      readonly coverageEnd: string;
      readonly interpolation: "linear";
      readonly source: string;
      readonly samples: readonly {
        readonly instant: string;
        readonly deltaTSeconds: number;
      }[];
    }
  | {
      readonly kind: "model";
      readonly coverageStart: string;
      readonly coverageEnd: string;
      readonly source: string;
      readonly model: string;
    };
```

约束：

```txt
table 段用于现代观测值或短期预测值。
model 段用于历史或远未来区间。
provider 在同一时刻只能命中一个 segment；不允许重叠歧义。
跨 segment 不做隐式混合。
```

默认行为：

```txt
命中 table 段时，使用相邻样本线性插值。
命中 model 段时，按该模型的文档公式直接求值。
落在所有 segment 之外时，provider 必须抛错。
```

### 3. 覆盖范围

Delta-T 需要明确比闰秒更大的时间跨度，因为节气、朔望和中国历法并不只关心现代日期。

因此：

```txt
coverageStart 与 coverageEnd 必须由具体快照明确声明。
每个 segment 都必须声明自己的 coverageStart 与 coverageEnd。
默认 provider 只能承诺快照内的范围，不能无限外推。
```

本文不在 RFC 层写死某个最终年份区间。

原因：

```txt
不同版本可能替换历史表或多项式模型。
真正重要的是“范围必须显式声明”，而不是今天先拍一个看似永久的年份常量。
```

### 4. 更新节奏

Delta-T 的更新节奏分两层：

```txt
现代观测/预测段：按月检查并刷新快照。
历史/远未来模型段：只有在切换模型或修正系数时才变化。
```

默认包策略应偏保守：

```txt
不追求按日滚动发包。
优先发布月度级快照，保证可复现与维护成本平衡。
```

## 七、版本标识

`DatasetInfo` 的 `id` 用来标识“这一份数据快照是谁”。

要求：

```txt
id 必须包含足够区分数据来源与快照时间的信息。
id 不等同于 npm package version，但两者应在 README 中能互相追溯。
generatedAt 使用 UTC 时间戳。
coverageStart / coverageEnd 使用 ISO 8601 且固定为 Z。
source 至少列出权威来源名称和所用快照标识。
```

示例格式：

```txt
leap-seconds: iers-bulletin-c-2026-01
delta-t: iers-2026-06-plus-model-v1
```

这里的格式只是示意，真正要求是“稳定、可追溯、可比较”，而不是某个特定字符串模板。

## 八、与核心运行时的依赖边界

第二阶段必须保持以下方向：

```txt
@epheon/temporal 不依赖 @epheon/dataset-leap-seconds。
@epheon/temporal 不依赖 @epheon/dataset-delta-t。
dataset package 只依赖 primitives / temporal 的公开类型与 helper。
应用层显式决定是否安装并注入 dataset package。
```

不要做：

```txt
在 Instant 内部自动加载默认闰秒表。
在 temporal 包顶层偷偷 import 某个 dataset package。
provider 未传入时退回全局单例数据源。
```

这些做法都会破坏 RFC 0003 的核心原则：

```txt
内核不隐式加载闰秒或 Delta-T 数据。
```

## 九、闰秒输入边界策略

RFC 0003 已经把当前 `@epheon/temporal` 的 UTC 输入边界限定为显式 offset 的
ISO-like 字符串，并把字面量闰秒输入边界留到后续收敛。

因此 RFC 0008 的范围是：

```txt
定义闰秒数据快照与 provider。
不强制本阶段修改 UtcDateTime 的公共输入模型。
```

具体约定：

```txt
dataset package 必须知道 UTC 偏移会在闰秒边界发生阶跃变化。
但是否接受字面量 23:59:60 输入，留给未来 temporal RFC 单独决策。
```

这意味着第二阶段先解决：

```txt
“已知某时刻该用哪个 TAI-UTC / Delta-T 值”
```

而不是一次性把：

```txt
“所有闰秒文本解析能力”
```

也塞进这份 RFC。

## 十、测试与标准答案集

`standards/` 仍然只放小而稳定的参考样例，不放真实大数据表。

约定：

```txt
少量时间尺度回归样例继续进入 standards/temporal/。
完整闰秒表和 Delta-T 大样本进入各自 dataset package。
dataset package README 必须记录来源、coverage、更新时间和误差说明。
```

默认 provider 至少应验证：

```txt
覆盖起点和终点行为。
超出 coverage 的报错行为。
闰秒阶跃前后 TAI-UTC 的变化。
Delta-T table segment 的插值行为。
Delta-T model segment 的切换边界。
```

## 十一、暂缓事项

本阶段暂缓：

```txt
统一抓取脚本协议
自动联网更新命令
provider 元信息接口化
leap smear 支持
预加载多个数据快照并在运行时切换
pre-1972 UTC 重建模型
字面量 23:59:60 公共解析 API
```

需要时再由后续 RFC 单独收敛，不在本次任务里预埋抽象。

## 十二、验收标准

RFC 0008 完成时，应证明：

```txt
明确了 Delta-T 与 leap second 的数据来源。
明确了两个 dataset package 的更新节奏。
明确了 coverageStart / coverageEnd 与超界失败语义。
明确了 DatasetInfo 作为版本标识的最小结构。
明确了 createDeltaTProvider() 返回 DeltaTProvider。
明确了 createLeapSecondProvider() 返回 LeapSecondProvider。
明确了 dataset package 不成为核心运行时隐式依赖。
明确了 RFC 0008 不负责扩张 temporal 的闰秒文本输入边界。
```

这些能力确定后，C3 才可以在不改动 temporal 核心模型的前提下交付真实数据包。
