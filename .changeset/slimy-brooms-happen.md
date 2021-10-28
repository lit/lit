---
'@lit/localize-tools': minor
---

**BREAKING** Placeholders containing HTML markup and dynamic expressions are now
represented in XLIFF as `<x>` tags instead of `<ph>` tags.

To preserve the previous behavior of using `<ph>` tags, update your JSON config
file and set `interchange.placeholderStyle` to `"ph"`:

```json
{
  "interchange": {
    "format": "xliff",
    "placeholderStyle": "ph"
  }
}
```
