---
'@lit-labs/virtualizer': patch
---

- Fixed off-by-one errors in Flow layout margin handling that caused incorrect item positioning when adjacent items have different CSS margins (#5285). Three related bugs used the wrong index when looking up collapsed margins: backward position estimation, forward position estimation, and the forward layout loop. These bugs were invisible with uniform margins (the common case) but caused compounding position errors with non-uniform margins.
