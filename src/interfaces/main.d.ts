export interface DefineFileInfo {
  fileId: string;
  fullPath: string;
  folder: string;
  filename: string;
  format: 'xml' | 'json';
  size: number;
  lastModified: number;
  defineVersion: '2.0' | '2.1';
  arm: boolean;
}
export interface FileInfo {
  fullPath: string;
  folder: string;
  filename: string;
  format: string;
  size: number;
  lastModified: number;
}
export interface NewWindowProps {}
