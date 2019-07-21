import { Connection } from '@salesforce/core';
import util = require('util');
import child_process = require('child_process');

const exec = util.promisify(child_process.exec);

/**
 * Returns the sobjectType that is being selected in the query
 *
 * @param query (string) - Query to get the sobjectType from
 *
 * @return (string) - SObjectType that is being selected
 */
const getSObjectType = (query: string): string => {
  const fromKeyword = ' from ';

  // Find the position where the from keyword ends
  const queryFromIndex =
    query.toLowerCase().indexOf(fromKeyword) + fromKeyword.length;

  // Find the first space after that position
  const afterQueryFromIndex = query.indexOf(' ', queryFromIndex);

  // Return the value in between
  return query.substring(
    queryFromIndex,
    afterQueryFromIndex,
  );
};

// TODO: refactor these two functions down to a shared function
const queryAllRecords = async (conn: Connection, query: string): Promise<any[]> => {
  const result = await conn.query(query);

  let records: any[] = result.records;
  let done = result.done;
  let nextRecordsUrl = result.nextRecordsUrl;

  while (done !== true) {

    const nextResult = await conn.queryMore(nextRecordsUrl);

    records = records.concat(nextResult.records);
    nextRecordsUrl = nextResult.nextRecordsUrl;
    done = nextResult.done;

  }

  return records;
};
const queryAllRecords_WithQueryAll = async (conn: Connection, query: string): Promise<any[]> => {
  const result = await conn.queryAll(query);

  const records: any[] = result.records;

  let done = result.done;
  let nextRecordsUrl = result.nextRecordsUrl;

  while (done === false) {

    const nextResult = await conn.queryMore(nextRecordsUrl);

    records.push(nextResult.records);
    done = nextResult.done;
    nextRecordsUrl = nextResult.nextRecordsUrl;

  }

  return records;
};

const sfdxQuery = async (query: string, username: string, path?: string): Promise<any> => {
  const baseCommand = `sfdx force:data:soql:query --query "${query}" --targetusername ${username}`;

  if (path) {
    await exec(
      `${baseCommand} --resultformat csv > ${path} `,
    );

    console.log(`Results written to ${path}`);
    return;
  }

  const process = await exec(baseCommand);
  console.log(process.stdout);
};


export { getSObjectType, queryAllRecords, queryAllRecords_WithQueryAll, sfdxQuery }
