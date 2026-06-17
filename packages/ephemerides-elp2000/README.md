# @epheon/ephemerides-elp2000

`@epheon/ephemerides-elp2000` 提供 Epheon 当前阶段的最小月亮星历 provider。

当前范围：

```txt
Body.Moon
ReferenceFrame.MeanOfDateEcliptic
ReferenceFrame.TrueOfDateEcliptic
Precision.Standard
```

当前不包含：

```txt
完整 ELP2000 系数展开
其他天体
高精度 / 多精度档位
文件系统、网络或全局配置读取
```

该包当前目标是为朔望求解提供稳定的月亮黄经输入；完整 ELP2000 能力留待后续阶段扩展。
