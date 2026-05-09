---
'@lit-labs/virtualizer': patch
---

- Fixed `scrollIntoView` landing at the wrong position when the virtualizer is inside a scrolling ancestor with other content above it. At large scroll distances the cumulative position error was severe enough to leave the list blank after the scroll.
- Fixed an off-by-one in forward position estimation.
