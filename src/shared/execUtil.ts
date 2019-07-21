import { StdOut } from './typeDefs';
import util = require('util');
import child_process = require('child_process');

const exec = util.promisify(child_process.exec);

const doExec = async (command: string, execOptions?: child_process.ExecOptions): Promise<any> => {
  const response = await exec(command, execOptions);

  if (response.stderr) {
    throw new Error(response.stderr);
  }

  if (typeof response.stdout !== 'string') {
    return response.stdout;
  }

  let stdout: StdOut;
  try {

    stdout = JSON.parse(response.stdout);

  } catch (e) {

    return response.stdout;

  }

  if (!stdout || stdout.status !== 0 || !stdout.result) {
    throw new Error(`exited with code: ${stdout.status} and result: ${stdout.result}`);
  }

  return stdout.result;
};

export { doExec }
