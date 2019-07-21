import { UX } from '@salesforce/command/lib/ux';
import { BulkJobStats, SfdxBulkStatusResult, SfdxUpsertParams } from './typeDefs';
import { cleanDirectory, writeArrayToPath } from './fsUtil';
import { yyyyMMdd } from './dateUtil';
import { doExec } from './execUtil';

const delay = require('delay');

const BULK_API_NULL_VALUE = '#N/A';
const getJobIdFromResult = (result: any): string => {
  let jobId;

  const errorMessage = 'Could not determine Job Id;';
  if (Array.isArray(result)) {

    if (result.length <= 0) {
      throw new Error(errorMessage);
    }

    jobId = result[0].jobId;

  } else {

    jobId = result.jobId;

  }

  if (!jobId) {
    throw new Error(errorMessage);
  }

  return jobId;
};
const sfdxUpsert = async (params: SfdxUpsertParams, ux?: UX): Promise<BulkJobStats> => {
  const result: any = await doExec(
    `sfdx force:data:bulk:upsert --json --targetusername ${params.username
    } --sobjecttype ${params.sobjectType
    } --externalid ${params.externalId
    } --csvfile ${params.csvFile}`,
  );

  const jobId = getJobIdFromResult(result);

  const jobStatus: BulkJobStats = {
    batchesCompleted: 0,
    recordsProcessed: 0,
    recordsFailed: 0,
  };

  let jobCompleted = false;
  while (jobCompleted === false) {

    await delay(500);

    const jobStatusResponse: SfdxBulkStatusResult = await doExec(
      `sfdx force:data:bulk:status --json --targetusername ${params.username
      } --jobid ${jobId}`,
    );

    const completionPercentage =
      Math.round((jobStatusResponse.numberBatchesCompleted /
        jobStatusResponse.numberBatchesTotal) * 100);

    if (completionPercentage === 100) {

      jobStatus.batchesCompleted = jobStatusResponse.numberBatchesCompleted;
      jobStatus.recordsProcessed = jobStatusResponse.numberRecordsProcessed;
      jobStatus.recordsFailed = jobStatusResponse.numberRecordsFailed;

      jobCompleted = true;

    } else {

      if (ux) {

        ux.setSpinnerStatus(`(${completionPercentage}%)`);

      }

    }

  }

  if (ux) {

    ux.log('');
    ux.table(
      [jobStatus],
      Object.keys(jobStatus),
    );
    ux.log('');

  }

  return jobStatus;
};
const upsertWithBackup = async (
  directory: string,
  fileName: string,
  recordsToBackup: any[],
  recordsToUpsert: any[],
  upsertParams: SfdxUpsertParams,
  ux?: UX): Promise<void> => {

  if (!recordsToBackup || recordsToBackup.length <= 0) {
    throw new Error(`No data was found in recordsToBackup`);
  }
  if (!recordsToUpsert || recordsToUpsert.length <= 0) {
    throw new Error(`No data was found in recordsToUpsert`);
  }

  const pathPrefix = `${cleanDirectory(directory)}${fileName}_${yyyyMMdd(new Date())}`;

  const recordsToBackupPath = `${pathPrefix}__backup.csv`;
  await writeArrayToPath(
    recordsToBackup,
    recordsToBackupPath,
    Object.keys(recordsToBackup[0]),
  );

  ux.log(`Backed up ${recordsToBackup.length.toLocaleString()} records to ${recordsToBackupPath}`);

  upsertParams.csvFile = `${pathPrefix}.csv`;

  await writeArrayToPath(
    recordsToUpsert,
    upsertParams.csvFile,
    Object.keys(recordsToUpsert[0]),
  );

  await sfdxUpsert(upsertParams, ux);
};

export { BULK_API_NULL_VALUE, sfdxUpsert, upsertWithBackup }
