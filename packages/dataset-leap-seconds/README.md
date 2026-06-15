# @epheon/dataset-leap-seconds

Epheon 的闰秒数据包。提供一份静态 TAI-UTC 阶跃表和 `createLeapSecondProvider()`
工厂函数，供 `@epheon/temporal` 显式注入使用。

## 设计原则

- **显式注入**：不让 `@epheon/temporal` 隐式加载数据包。
- **静态快照**：运行时不联网，不读取文件系统。
- **最小公开面**：只导出元信息和 provider 工厂，不暴露内部表结构。
- **以历史表为主**：当前内置 1972 年以来的闰秒阶跃记录。

## 安装

```bash
pnpm add @epheon/dataset-leap-seconds
```

## 导出清单

```ts
import {
  createLeapSecondProvider,
  leapSecondDatasetInfo,
  type DatasetInfo
} from "@epheon/dataset-leap-seconds";
```

## 使用方式

```ts
import { Instant } from "@epheon/temporal";
import { createLeapSecondProvider } from "@epheon/dataset-leap-seconds";

const instant = Instant.fromUTC("2017-01-01T00:00:00Z", {
  leapSeconds: createLeapSecondProvider()
});

instant.toTT().offsetFromUtc.toSeconds(); // 69.184
```

## 数据来源

- IERS Bulletin C 历史闰秒公告
- 归一化后的 TAI-UTC 阶跃表

## 覆盖范围

- `coverageStart`: `1972-01-01T00:00:00Z`
- `coverageEnd`: `2100-01-01T00:00:00Z`

当前快照内置的最后一次阶跃是 `2017-01-01T00:00:00Z -> 37s`。因此 2017 之后到
`coverageEnd` 之前会沿用最后一个已知 TAI-UTC 值。这个范围是为了先让第二阶段链路
可注入运行；如果后续需要严格按最新 Bulletin C 截断未来区间，应刷新快照并收紧
`coverageEnd`。

## 更新时间与刷新节奏

- `generatedAt`: `2026-06-15T00:00:00Z`
- `updateCadence`: 每次 IERS 发布新的 Bulletin C 后检查并按需刷新

## 误差与限制

- 闰秒是阶跃表，不存在数值插值误差。
- 当前包不处理 leap smear。
- 当前包不扩展 `23:59:60` 的文本解析边界；这仍由 `@epheon/temporal` 后续 RFC 决定。

## 许可

MIT
