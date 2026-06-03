export interface SourceInfo {
  filePath: string;
  source: string;
  isEntry?: boolean;
}

export interface DOMSelectorConfig {
  title?: string;
  /** 自定义快捷键组合，如 "command+option" / "ctrl+shift" / "command" / "ctrl"
   *  默认值：mac="command", win="ctrl"
   *  唤起弹窗仍需配合鼠标点击 */
  hotkey?: { mac?: string; win?: string };
  clickSelector?: string | false;
  targetFilePatterns?: string[];
  onSubmit?: string;
  /** 跳转到编辑器，默认 "vscode"，可选: vscode | cursor | zed | trae */
  editor?: string;
}

export interface SubmitPayload {
  source: string;
  filePath: string;
  input: string;
  timestamp: number;
}

export interface InspectTarget {
  tagName: string;
  id: string;
  className: string;
  textContent: string;
  /** React component chain from fiber tree (innermost → outermost) */
  reactChain?: string[];
  /** Injected data-source attribute: "filePath:startLine" */
  dataSource?: string;
}
