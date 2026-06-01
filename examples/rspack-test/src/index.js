console.log("[rspack-test] app started");

const app = document.createElement("div");
app.innerHTML = `
  <p>这是一个 Rspack 测试项目，用于调试 <code>@dom-selector/rspack</code> 插件。</p>
  <p>尝试按下快捷键或点击按钮来唤起 DOM Selector 弹窗。</p>
`;
document.body.appendChild(app);
