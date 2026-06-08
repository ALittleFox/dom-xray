# @dom-xray/overlay-ui

> [中文版本](README.zh-CN.md)

DOM XRay in-browser overlay UI. Built with native Web Components + Shadow DOM for complete style isolation, without polluting the host page.

This package is usually installed automatically as an internal dependency of downstream adapters (`@dom-xray/vite`, `@dom-xray/webpack`, etc.). **You generally do not need to install it directly.** Adapters automatically inject the bundled `dist/client.js` into the `<head>` of the dev page.

## Output

| File | Description |
| --- | --- |
| `dist/client.js` | Full client bundle (injected into the page by adapters) |

## Technical Details

- **Shadow DOM**: All components use `attachShadow({ mode: "open" })`. CSS variables and styles are fully isolated.
- **Custom Elements**: `dom-xray-overlay`, `dom-xray-header`, `dom-xray-body`, `dom-xray-source-panel`, `dom-xray-input-panel`, `dom-xray-footer`, `dom-xray-agent-panel`
- **Zero Dependencies**: No dependency on React, Vue, or other frameworks. Pure native Web APIs.

## Local Development

```bash
pnpm --filter @dom-xray/overlay-ui build
# or
pnpm --filter @dom-xray/overlay-ui dev   # watch mode
```

## Configuration

The client reads configuration from global variables:

```html
<script>
  window.__DOM_XRAY_CONFIG__ = {
    title: "DOM XRay",
    hotkey: { mac: "option", win: "alt" },
    editor: "vscode",
    agentConfig: { type: "cursor", options: {} }
  };
  window.__DOM_XRAY_API__ = "/__dom-xray";
</script>
<script src="/@dom-xray/client.js"></script>
```

See full configuration in the root [README.md](https://github.com/ALittleFox/dom-xray#readme).
