# fetch-standards

这里放不进入 pnpm workspace、也不进入默认 CI 的外部参考数据脚本。

当前提供：

```txt
fetch-solar-standards.mjs
```

用途：

```txt
从官方 JPL Horizons API 抓取 2024 和 2025 年太阳地心视黄经小时采样
线性插值生成 24 节气时刻
输出 standards/solar/longitudes.json
输出 standards/solar/terms.json
```

运行方式：

```bash
node scripts/fetch-standards/fetch-solar-standards.mjs
```

说明：

- 该脚本使用 Node 内置 `fetch`，不引入额外依赖。
- 输出是 bootstrap fixture，不承诺最终长期格式不变。
- 若后续需要更高精度，可把小时采样换成更密采样或局部二分查询。
