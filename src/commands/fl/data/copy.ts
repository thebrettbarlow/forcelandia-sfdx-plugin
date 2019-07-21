import { flags, SfdxCommand } from '@salesforce/command';
import { Account, SfdxUpsertParams } from '../../../shared/typeDefs';
import { directoryFlag, getPath, writeArrayToPath } from '../../../shared/fsUtil';
import { doneInSeconds } from '../../../shared/spinnerUtil';
import { sfdxUpsert } from '../../../shared/upsertUtil';
import { queryAllRecords } from '../../../shared/queryUtil';

const now = require("performance-now");

export default class AccountCopy extends SfdxCommand {
  public static description = 'copies data from production to another sfdx connection';
  public static examples = [
    'sfdx pm:data:copy --sobjecttype Account --limit 100 --destination stage',
  ];
  protected static flagsConfig = {
    all: flags.boolean({
      char: 'a',
      description: 'if true, the script gets all sobjects in the `sobjectTypes` array',
      default: false,
    }),
    sobjecttype: flags.string({
      char: 's',
      description: 'name of the sobject to get. Required if --all is false',
    }),
    limit: flags.number({
      char: 'l',
      description: 'limit the number of records to export',
    }),
    destination: flags.filepath({
      char: 't',
      description: 'sfdx connection to copy places to',
      required: true,
    }),
    directory: directoryFlag,
  };
  protected static requiresUsername = true;

  public async run(): Promise<any> { // tslint:disable-line:no-any
    const conn = this.org.getConnection();
    // const username = this.org.getUsername();

    if (this.flags.all === false && !this.flags.sobjecttype) {
      throw new Error('--sobjecttype MUST be defined when --all is false');
    }

    if (this.flags.all === true && this.flags.sobjecttype) {
      throw new Error('--sobjecttype MUST NOT be defined when --all is true');
    }

    // TODO: remove this if when other objects are supported
    if (this.flags.sobjecttype.toLowerCase() !== 'account') {
      throw new Error('The only supported SObjectType is Account');
    }
    // const sobjectTypes: string[] = [];
    // if (this.flags.all === true) {
    //
    //   sobjectTypes.push(
    //     'Account'
    //   );
    //
    // } else {
    //
    //   sobjectTypes.push(this.flags.sobjecttype);
    //
    // }

    let start = now();
    this.ux.startSpinner(`Copying ${this.flags.limit.toLocaleString()} Accounts to ${this.flags.destination}`);

    const fields = ['Name'];
    const accounts: Account[] = await queryAllRecords(
      conn,
      `
      SELECT ${fields.toString()}
      FROM Account
      LIMIT ${this.flags.limit}`,
    );

    if (!accounts || accounts.length <= 0) {

      this.ux.log('No Accounts were found');
      return;

    }

    if (accounts.length % 10000 === 0) {

      this.ux.warn(`DataBulkUpsertCommand doesn't seem to like batches that divide equally by 10k`);
      this.ux.warn(`There will be ${accounts.length.toLocaleString()} records in this batch`);
      this.ux.warn('If this fails, try it again with 1 more or less record');

    }

    const path = getPath(this.flags.directory, 'accounts_to_copy', 'csv');
    await writeArrayToPath(
      accounts,
      path,
      Object.keys(accounts[0]),
    );

    await sfdxUpsert(
      <SfdxUpsertParams>{
        username: this.flags.destination,
        sobjectType: 'Account',
        externalId: 'Id',
        csvFile: path,
      },
      this.ux,
    );

    let end = now();
    this.ux.stopSpinner(doneInSeconds(start, end));
  }
}
