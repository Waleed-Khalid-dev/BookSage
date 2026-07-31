import { Command } from '@tauri-apps/plugin-shell';

export interface PythonCommandResult {
  status: 'success' | 'error';
  message?: string;
  traceback?: string;
  [key: string]: any;
}

/**
 * Sends a command to the Python sidecar using CLI arguments mode.
 */
export async function invokePython(cmdData: any): Promise<PythonCommandResult> {
  try {
    const cmdString = btoa(JSON.stringify(cmdData));
    console.log('Invoking python command:', cmdData.command);
    
    // Command.create corresponds to the 'python' identifier in capabilities/default.json
    // In dev mode, Tauri's CWD is src-tauri, so the path is ../python/main.py
    const command = Command.create('python', ['../python/main.py', '--b64', cmdString]);
    const output = await command.execute();

    if (output.code !== 0) {
      console.error('Python command failed:', output.stderr);
      return { status: 'error', message: output.stderr || 'Command failed with non-zero exit code' };
    }

    // Try parsing the last line of stdout (in case there are other prints)
    const lines = output.stdout.trim().split('\n');
    const resultJson = lines[lines.length - 1];

    if (!resultJson) {
      return { status: 'error', message: 'No output from python script' };
    }

    return JSON.parse(resultJson) as PythonCommandResult;
  } catch (error: any) {
    console.error('Failed to invoke python:', error);
    return { status: 'error', message: error.message || String(error) };
  }
}
