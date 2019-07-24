import { flags, SfdxCommand } from '@salesforce/command';
import { directoryFlag, getPath } from '../../../shared/fsUtil';
import { sfdxQuery } from '../../../shared/queryUtil';

export default class get extends SfdxCommand {
  public static description = 'gets users based on certain parameters';
  public static examples = [
    'sfdx fl:user:get',
    'sfdx fl:user:get --active',
    'sfdx fl:user:get --active --name "john smith"',
    'sfdx fl:user:get --active --profile admin',
    'sfdx fl:user:get --active --userrole sales',
    'sfdx fl:user:get --active --skinny',
    'sfdx fl:user:get --active --outputcsv',
  ];
  protected static flagsConfig = {
    active: flags.boolean({
      char: 'a',
      description: 'only return active users',
    }),
    name: flags.string({
      char: 'n',
      description: 'return users whose name contains this value',
    }),
    profile: flags.string({
      char: 'p',
      description: 'return users whose profile name contains this value',
    }),
    userrole: flags.string({
      char: 'r',
      description: 'return users whose user role developer name contains this value',
    }),
    skinny: flags.boolean({
      char: 's',
      description: 'only returns the Username and Id of each result',
    }),
    outputcsv: flags.boolean({
      char: 'o',
      description: 'output the result as a csv',
    }),
    directory: directoryFlag,
  };
  protected static requiresUsername = true;

  public async run(): Promise<any> { // tslint:disable-line:no-any
    const username = this.org.getUsername();

    const fields = {
      default: [
        'FirstName',
        'LastName',
        'Name',
        'Email',
        'Username',
        'Id',
        'IsActive',
        'format(LastLoginDate)',
      ],
      skinny: [
        'Name',
        'Username',
        'Id',
      ],
    };

    let query = `SELECT ${
      this.flags.skinny === true ? 
        fields.skinny.toString() : fields.default.toString()} FROM User `;

    let hasFilter: boolean = false;
    const filterKeyword = (): string => {
      if (hasFilter) {
        return 'AND';
      }

      hasFilter = true;
      return 'WHERE';
    };

    query += (this.flags.active || this.flags.active) ?
      filterKeyword() + ` IsActive = ${this.flags.active} ` : '';

    query += (this.flags.name) ?
      filterKeyword() + ` Name LIKE '%${this.flags.name}%' ` : '';

    query += (this.flags.profile) ?
      filterKeyword() + ` Profile.Name LIKE '%${this.flags.profile}%' ` : '';

    query += (this.flags.userrole) ?
      filterKeyword() + ` UserRoleId != NULL AND UserRole.DeveloperName LIKE '%${this.flags.userrole}%' ` : '';

    query += 'ORDER BY IsActive DESC, Name ASC';

    const path = this.flags.outputcsv === true ?
      getPath(this.flags.directory, 'Users', 'csv') : null;

    await sfdxQuery(query, username, path);
  }
}
