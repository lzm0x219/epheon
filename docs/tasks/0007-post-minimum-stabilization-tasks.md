# 后最小链路任务清单：稳定化

对应计划：`docs/plans/0007-post-minimum-roadmap.md`

## 任务总览

| ID    | 状态   | 任务                             | 主要输出                                                    |
| ----- | ------ | -------------------------------- | ----------------------------------------------------------- |
| R7-T1 | 已完成 | 补包级 README 缺口与过时描述     | `packages/*/README.md`                                      |
| R7-T2 | 已完成 | 扩充天象与中国历法 fixture 覆盖  | `standards/`、对应 tests / conformance                      |
| R7-T3 | 已完成 | 收口精度、误差来源与适用边界文档 | `standards/README.md`、相关 package README、必要时补 review |
| R7-T4 | 待开始 | 复核并收口中国历法公共 API 承诺  | `packages/calendar-chinese/`、相关 docs                     |
| R7-T5 | 待开始 | 形成稳定化收口审查结论           | `docs/reviews/`                                             |

## R7-T1：补包级 README 缺口与过时描述

状态：`已完成`

目标：

- 把当前审计里已经暴露出来的 README 缺口先补齐。
- 让对外说明和当前代码能力一致，不保留明显过时描述。

依赖：

- 无

当前关注点：

- `packages/reference/README.md` 内容严重不足。
- `packages/phenomena/README.md` 仍停留在“只含节气求解”的旧描述。
- 其他 package README 需要复核是否和当前公共导出一致。

当前产出：

- `packages/reference/README.md`
- `packages/phenomena/README.md`
- `packages/ephemerides-elp2000/README.md`
- `packages/calendar-chinese/README.md`

完成条件：

- 至少补齐审计中点名的 README 缺口。
- README 中的能力说明与当前公共 API 对齐。
- 不在 README 里提前承诺尚未稳定的历史规则或未来 package。

当前结果：

- `reference` 与 `phenomena` README 已与当前公共能力对齐。
- 补齐了 `ephemerides-elp2000` 的导出、用法和能力边界说明。
- 补齐了 `calendar-chinese` 的导出、上下文用法和当前承诺范围说明。

## R7-T2：扩充天象与中国历法 fixture 覆盖

状态：`已完成`

目标：

- 把当前 “最小证明” 级样例扩成“可复核集合”。
- 先补覆盖面，不先追求大而全的数据仓库。

依赖：

- S5-T2
- S5-T3

当前关注点：

- `standards/lunar/phases.json` 目前样例过少。
- 中国历法样例目前只覆盖少量闰月年、年界与月界。
- 样例扩充后需要同步补测试与 conformance。

当前产出：

- `standards/lunar/phases.json`
- `standards/calendar-chinese/lunar.json`
- `packages/phenomena/tests/lunar-phases.test.ts`
- `packages/calendar-chinese/tests/lunar-months.test.ts`
- `conformance/lunar-phases.test.ts`
- `conformance/calendar-chinese.test.ts`
- `standards/README.md`
- `conformance/README.md`

完成条件：

- 节气、朔望、中国历法都比当前有更广的代表性样例覆盖。
- 至少覆盖更多年份、更多边界，而不只是单点证明。
- 对应 tests / conformance 继续保持可运行。

当前结果：

- `standards/lunar/phases.json` 当前覆盖 2020-2025 的朔望样例，测试与 conformance 同步使用 `expectedElongationDegrees`。
- `standards/calendar-chinese/lunar.json` 补到了更多闰月年、年界、月界样例，并新增干支样例。
- 中国历法 conformance 现在同时校验农历月表、农历日期和干支结果。

## R7-T3：收口精度、误差来源与适用边界文档

状态：`已完成`

目标：

- 把“当前能算到什么程度”写成集中、明确、可引用的文档。

依赖：

- R7-T2

当前关注点：

- 现在已有 tolerance 和 basis，但还分散在 fixture、README、测试说明里。
- “已验证” 和 “已形成完整精度报告” 之间要明确区分。

当前产出：

- `standards/README.md`
- `conformance/README.md`
- `packages/phenomena/README.md`
- `packages/ephemerides-vsop87/README.md`
- `packages/ephemerides-elp2000/README.md`
- `packages/calendar-chinese/README.md`

完成条件：

- 可以明确回答每条主能力链路的来源、tolerance、当前边界。
- 文档能区分离散结果精确相等与底层天象数值 tolerance。
- 不把当前结果表述成超出证据范围的“精准度结论”。

当前结果：

- `standards/README.md` 新增“当前可对外说明的精度口径”，按能力链路集中说明证据范围、当前可说明口径和当前不能说明的内容。
- `conformance/README.md` 现在明确区分太阳节气、朔望、中国历法三条链路的证据强度，不再把 bootstrap 回归样例写成外部精度报告。
- 相关 package README 都补上了“当前验证口径”或等价说明，能直接回答当前 tolerance、覆盖范围和边界。

## R7-T4：复核并收口中国历法公共 API 承诺

状态：`待开始`

目标：

- 把 `@epheon/calendar-chinese` 的对外承诺收口到当前真正稳定的范围。

依赖：

- R7-T1
- R7-T3

当前关注点：

- 当前只支持 `modern` 规则切片。
- 需要避免对历史规则、反向换算、统一历法抽象产生误导性承诺。

完成条件：

- README、公共导出、测试口径互相一致。
- 明确哪些能力已稳定，哪些仍未进入承诺范围。
- 不提前启动 `@epheon/calendars` 抽象。

## R7-T5：形成稳定化收口审查结论

状态：`待开始`

目标：

- 在稳定化任务完成后，留下可复用的收口结论。

依赖：

- R7-T1
- R7-T2
- R7-T3
- R7-T4

完成条件：

- 至少新增一份 review，说明当前稳定化完成到了什么程度。
- 明确剩余缺口是否进入“扩展化”或“产品化”。
- 给下一轮任务拆分提供可直接引用的结论。
