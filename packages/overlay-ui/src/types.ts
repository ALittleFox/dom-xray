export interface SourceInfo {
  filePath: string;
  source: string;
  isEntry?: boolean;
}

export interface AgentConfig {
  type: string;
  options?: Record<string, any>;
}

export interface DomXrayConfig {
  title?: string;
  /** 自定义快捷键组合，如 "command+option" / "ctrl+shift" / "option" / "alt"
   *  默认值：mac="option", win="alt"
   *  唤起弹窗仍需配合鼠标点击 */
  hotkey?: { mac?: string; win?: string };
  clickSelector?: string | false;
  targetFilePatterns?: string[];
  onSubmit?: string;
  /** 跳转到编辑器，默认 "cursor"，可选: vscode | cursor | zed | trae */
  editor?: string;
  /** 是否启用快捷键唤起弹窗。默认 true */
  enabled?: boolean;
  /** Agent 配置。提供时，提交会触发 AI Agent 而不是返回数据 */
  agentConfig?: AgentConfig;
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
