export interface SourceInfo {
  filePath: string;
  source: string;
  isEntry?: boolean;
}

export interface DOMSelectorConfig {
  title?: string;
  hotkey?: { mac?: string; win?: string };
  clickSelector?: string | false;
  targetFilePatterns?: string[];
  onSubmit?: string;
}

export interface SubmitPayload {
  source: string;
  filePath: string;
  input: string;
  timestamp: number;
}
