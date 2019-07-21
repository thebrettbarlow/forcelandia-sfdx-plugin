import { SfdxCommand } from '@salesforce/command';
import { sfdxQuery } from '../../../shared/queryUtil';

export default class RecordTypeGet extends SfdxCommand {
  public static description = 'gets record type names and ids';
  public static examples = [
    'sfdx pm:recordtype:get',
  ];
  protected static flagsConfig = {};
  protected static requiresUsername = true;

  public async run(): Promise<any> { // tslint:disable-line:no-any
    const username = this.org.getUsername();

    // NamespacePrefix DESC so that namespaced record types are at the end
    const query = '' +
      'SELECT SObjectType, DeveloperName, Id ' +
      'FROM RecordType ' +
      'ORDER BY NamespacePrefix DESC, SObjectType, DeveloperName';

    await sfdxQuery(query, username);
  }
}
