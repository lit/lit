---
'@lit-labs/virtualizer': patch
---

- Fixed erratic scrollbar behavior when item heights change due to container resize (#4693). Off-screen metrics cache entries are now cleared when the cross-axis dimension changes, preventing stale sizes from poisoning the average used for position estimation.
- Fixed scrollbar instability during large scroll jumps (#5006). The layout update cycle now freezes during large scroll jumps and resumes with a clean state reset when scrolling settles, preventing the feedback loop between changing size estimates and scroll position.
