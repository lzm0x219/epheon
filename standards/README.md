# Epheon Standards（标准答案集）

## 定位

`standards/` 存放 Epheon 各个领域模块的参考数值与预期结果，简称 fixture。

fixture 用于：

- 包级单元测试验证正确性
- `conformance/` 一致性校验
- 不同实现（TypeScript、Python、Rust）之间的交叉验证

fixture 不用于：

- 大型天文数据集（进入未来的 `@epheon/dataset-*` 包）
- 运行时数据（内核不应读取 `standards/`）

## 当前目录

```
standards/
├── README.md             # 本文件
├── primitives/           # @epheon/primitives 的参考数值
│   ├── angles.json       # 角度转换与归一化样例
│   └── durations.json    # 时长转换样例
└── temporal/             # @epheon/temporal 的参考数值
    ├── julian-days.json        # Julian Day 转换样例
    ├── time-scales.json        # 时间尺度转换样例
    └── utc-invalid-inputs.json # 非法 UTC 输入样例
```

## 维护规范

### 字段含义

每个 fixture 文件记录：

- `description`: 用例说明
- `input`: 输入参数
- `expected`: 预期结果数值
- `tolerance`: 误差容忍度（`{ "absolute": number, "relative?" : number }`）
- `source` (可选): 数据来源或计算公式

### 样例要求

- 覆盖正常值和边界值
- 包含非法输入（用于验证错误处理）
- 每个用例的 tolerance 必须显式声明
- 大型数据集（> 100 KB）不应进入 `standards/`，应放入独立的 dataset package

### 添加新 fixture

新增领域包时，同步创建对应的 `standards/<domain>/` 目录和 fixture 文件。

## 使用方式

包级测试通过相对路径 `../../standards/<domain>/<fixture>.json` 读取 fixture。

例如 `packages/primitives/tests/angle.test.ts` 读取 `standards/primitives/angles.json`。
