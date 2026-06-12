export interface AgentConfig {
  type: string;
  options?: Record<string, any>;
}

export interface PluginConfig {
  /** UI title. Default: "DOM XRay" */
  title?: string;
  /** Hotkey alias. Default: mac=option, win=alt. Supports combos like "command+option" or "ctrl+shift". Always requires mouse click to open. */
  hotkey?: { mac?: string; win?: string };
  /** Optional DOM selector to trigger the dialog on click. Default: '[data-dom-xray]', false to disable */
  clickSelector?: string | false;
  /** File patterns that should be selectable (glob). Default: all page sources */
  targetFilePatterns?: string[];
  /** Endpoint/mode for handling submitted data. Default: 'return' to return to caller via fetch */
  onSubmit?: "return" | string | ((data: SubmitData) => void | Promise<void>);
  /** Target editor for "open in editor" button. Default: "cursor". Supports: vscode, cursor, zed, trae */
  editor?: string;
  /** Whether to enable hotkey+click to invoke the overlay. Default: true */
  enabled?: boolean;
  /** Agent configuration. When provided, submit triggers an AI Agent instead of returning data */
  agentConfig?: AgentConfig;
}

export interface SubmitData {
  source: string;
  filePath: string;
  input: string;
  timestamp: number;
}

export interface SourceInfo {
  filePath: string;
  source: string;
  isEntry?: boolean;
}

export interface BundlerAdapter {
  name: string;
  injectClient: (options: {
    clientCode: string;
  }) => void | Promise<void>;
  registerEndpoint?: (options: {
    path: string;
    handler: (req: any, res: any) => void | Promise<void>;
  }) => void;
  getModuleSource?: (id: string) => { code?: string; path?: string } | null;
  onDevServerStart?: (server: any) => void | Promise<void>;
}
