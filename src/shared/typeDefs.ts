export interface Account {
  Name?: string;
}

export interface BulkJobStats {
  batchesCompleted: number;
  recordsProcessed: number;
  recordsFailed: number;
}

export interface ExecResponse {
  stdout: string;
  stderr: string;
}

export interface RecordType {
  Id: string;
  DeveloperName: string;
  Name: string;
  SobjectType: string;
}

export interface SfdxBulkStatusResult {
  numberBatchesCompleted: number;
  numberRecordsProcessed: number;
  numberRecordsFailed: number;
  numberBatchesTotal: number;
}

export interface SfdxUpsertParams {
  username: string;
  sobjectType: string;
  externalId: string;
  csvFile?: string;
}

export interface StdOut {
  status: number;
  result: any;
}
