# @epheon/dataset-delta-t

Epheon 的 Delta-T 数据包。提供一组分段多项式模型和 `createDeltaTProvider()`
工厂函数，供 `@epheon/temporal` 显式注入使用。

## 设计原则

- **显式注入**：不让 `@epheon/temporal` 隐式加载数据包。
- **静态模型**：运行时不联网，不读取文件系统。
- **最小公开面**：只导出元信息和 provider 工厂，不暴露内部模型分段。
- **先覆盖可用范围**：当前以 1600-2150 年的分段多项式估算为主。

## 安装

```bash
pnpm add @epheon/dataset-delta-t
```

## 导出清单

```ts
import { createDeltaTProvider, deltaTDatasetInfo, type DatasetInfo } from "@epheon/dataset-delta-t";
```

## 使用方式

```ts
import { Instant } from "@epheon/temporal";
import { createDeltaTProvider } from "@epheon/dataset-delta-t";

const instant = Instant.fromUTC("2000-01-01T12:00:00Z", {
  deltaT: createDeltaTProvider()
});

instant.toUT1(); // 需要同时配合 leapSeconds provider
```

## 数据来源

- Espenak / Meeus 常用 Delta-T 分段多项式
- 适合作为第二阶段节气、朔望和历法计算的初始估算模型

## 覆盖范围

- `coverageStart`: `1600-01-01T00:00:00Z`
- `coverageEnd`: `2150-01-01T00:00:00Z`

超出该范围时，provider 会抛出 `TemporalError("InvalidTimeScaleInput")`。

## 更新时间与刷新节奏

- `generatedAt`: `2026-06-15T00:00:00Z`
- `updateCadence`: 模型系数或来源发生变化时手动刷新

## 误差与限制

- 当前包使用分段多项式估算，不是月度 IERS 观测表。
- 在现代日期上，误差目标按秒级看待；测试当前使用 `2s` 容忍度。
- 如果后续需要更严格的现代段精度，可以在不改公共 API 的前提下，把内部实现换成
  IERS 表段加模型段的组合。

## 许可

MIT
