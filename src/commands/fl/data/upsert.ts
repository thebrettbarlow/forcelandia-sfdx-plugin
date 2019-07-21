import { flags, SfdxCommand } from '@salesforce/command';
import { SfdxUpsertParams } from '../../../shared/typeDefs';
import { sfdxUpsert } from '../../../shared/upsertUtil';
import { doneInSeconds } from '../../../shared/spinnerUtil';

const now = require('performance-now');

export default class DataUpsert extends SfdxCommand {
  public static description = 'upsert data from a csv file';
  public static examples = [
    'sfdx pm:data:upsert --sobjecttype Account --externalid Id --file accounts_to_upsert.csv',
  ];
  protected static flagsConfig = {
    sobjecttype: flags.string({
      char: 's',
      description: 'sobject type to use with the upsert',
      required: true,
    }),
    externalid: flags.string({
      char: 'i',
      description: 'external id to use with the upsert',
      default: 'Id',
    }),
    file: flags.filepath({
      char: 'f',
      description: 'csv that contains the data to upsert',
      required: true,
    }),
  };
  protected static requiresUsername = true;

  public async run(): Promise<any> { // tslint:disable-line:no-any
    let start = now();
    this.ux.startSpinner('Processing');

    const username = this.org.getUsername();

    await sfdxUpsert(
      <SfdxUpsertParams>{
        username,
        sobjectType: this.flags.sobjecttype,
        externalId: this.flags.externalid,
        csvFile: this.flags.file,
      },
      this.ux,
    );

    let end = now();
    this.ux.stopSpinner(doneInSeconds(start, end));
  }
}
