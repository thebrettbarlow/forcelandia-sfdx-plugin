import { flags, SfdxCommand } from '@salesforce/command';
import { getSObjectType, queryAllRecords } from '../../../shared/queryUtil';
import { directoryFlag } from '../../../shared/fsUtil';
import { BULK_API_NULL_VALUE, upsertWithBackup } from '../../../shared/upsertUtil';
import { SfdxUpsertParams } from '../../../shared/typeDefs';
import { doneInSeconds } from '../../../shared/spinnerUtil';

const now = require("performance-now");

export default class DataSetValue extends SfdxCommand {
  public static description = 'sets a value into a field for all records returned by the query';
  public static examples = [
    'sfdx pm:data:setvalue --query "select id, type from account where type != null limit 5" --field Type --value "Cool Company" --targetusername stage',
  ];
  protected static flagsConfig = {
    query: flags.string({
      char: 'q',
      description: 'query to get records to update',
      required: true,
    }),
    field: flags.string({
      char: 'f',
      description: 'name of the field to set',
      required: true,
    }),
    value: flags.string({
      char: 'v',
      description: 'value that should be set',
      required: true,
    }),
    filename: flags.string({
      char: 'n',
      description: 'name of the backup and output files',
      default: 'set_value',
    }),
    directory: directoryFlag,
  };
  protected static requiresUsername = true;

  public async run(): Promise<any> { // tslint:disable-line:no-any
    const conn = this.org.getConnection();
    const username = this.org.getUsername();

    let start = now();
    this.ux.startSpinner('Processing');

    const records: any[] = await queryAllRecords(
      conn,
      this.flags.query,
    );

    if (!records || records.length <= 0) {

      this.ux.log('No records found');
      return;

    }

    this.ux.log(`Records Found: ${records.length.toLocaleString()}`);

    const recordsToUpdate: any[] = records.map(record => {
      if (!record.Id) {
        throw new Error('Id not found on record');
      }

      return {
        Id: record.Id,
        [this.flags.field]: this.flags.value.toLowerCase() === 'null' ?
          BULK_API_NULL_VALUE : this.flags.value,
      };
    });

    await upsertWithBackup(
      this.flags.directory,
      this.flags.filename,
      records,
      recordsToUpdate,
      <SfdxUpsertParams>{
        username,
        sobjectType: getSObjectType(this.flags.query),
        externalId: 'Id',
      },
      this.ux,
    );

    let end = now();
    this.ux.stopSpinner(doneInSeconds(start, end));
  }
}
