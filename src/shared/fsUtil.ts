import fs = require('fs-extra');
import stream = require('stream');
import json2csv from 'json2csv';
import parse = require('csv-parse');
import util = require('util');
import { flags } from '@salesforce/command';
import { yyyyMMdd } from './dateUtil';

const pipeline = util.promisify(stream.pipeline);

const getPath = (directory: string, fileName: string, fileType: string): string => {
  return `${cleanDirectory(directory)}${fileName}_${yyyyMMdd(new Date())}.${fileType}`;
};

const parseCsvToObject = async (csv: string, keyField: string, parseFunction?: (row: object) => void) => {
  const obj: object = {};

  await fs.createReadStream(csv)
    .pipe(parse({columns: true}))
    .on('data', (row: object) => {
      if (parseFunction) {
        parseFunction(row);
      }

      obj[row[keyField]] = row;
    });

  return obj;
};

const parseCsvToArray = async (csv: string, parseFunction?: (row: object) => void): Promise<any[]> => {
  const arr: any[] = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(csv)
      .pipe(parse({columns: true}))
      .on('data', (row: any) => {
        if (parseFunction) {
          parseFunction(row);
        }

        arr.push(row);
      })
      .on('end', () => resolve(arr));
  });
};

const writeArrayToPath = async (arr: object[], path: string, fields: string[]) => {
  const input = new stream.Readable({
    objectMode: true, read() {
    },
  });
  arr.forEach(obj => input.push(obj));
  input.push(null);

  await pipeline(
    input,
    new json2csv.Transform({fields}, {objectMode: true}),
    fs.createWriteStream(path, {encoding: 'utf8'}),
  );
};

const cleanDirectory = (directory: string): string => {
  if (directory === '.') {
    return '';
  }

  if (directory.endsWith('/')) {
    return directory;
  }

  return directory += '/';
};

const directoryFlag = flags.directory({
  char: 'd',
  description: 'directory where you would like the output to go',
  default: '.',
});

const fileNameFlag = (defaultFileName: string, description: string = 'name of the output file') => flags.string(
  {
    char: 'n',
    description,
    default: defaultFileName,
  })
;

export { getPath, parseCsvToObject, parseCsvToArray, writeArrayToPath, cleanDirectory, directoryFlag, fileNameFlag }
