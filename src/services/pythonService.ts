import { Command } from '@tauri-apps/plugin-shell';
import { appLocalDataDir, join } from '@tauri-apps/api/path';
import { writeTextFile, remove, mkdir } from '@tauri-apps/plugin-fs';

export interface PythonCommandResult {
  status: 'success' | 'error';
  message?: string;
  traceback?: string;
  [key: string]: any;
}

/**
 * Sends a command to the Python sidecar using a temporary file to bypass CLI length limits.
 */
export async function invokePython(cmdData: any): Promise<PythonCommandResult> {
  let tempFilePath: string | null = null;
  try {
    const json = JSON.stringify(cmdData);
    console.log('Invoking python command:', cmdData.command);
    
    // Generate a unique temporary file path in the app's local data directory
    const dataDir = await appLocalDataDir();
    // Ensure the data directory exists (just in case this is the first run)
    try {
      await mkdir(dataDir, { recursive: true });
    } catch (e) { /* ignore if already exists */ }

    const fileName = `cmd_${Date.now()}_${Math.floor(Math.random() * 1000)}.json`;
    tempFilePath = await join(dataDir, fileName);
    
    // Write the JSON payload directly to disk (bypasses URL and Base64 encoding limits)
    await writeTextFile(tempFilePath, json);
    
    // Command.create corresponds to the 'python' identifier in capabilities/default.json
    // In dev mode, Tauri's CWD is src-tauri, so the path is ../python/main.py
    const command = Command.create('python', ['../python/main.py', '--file', tempFilePath]);
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
  } finally {
    // Always clean up the temporary file
    if (tempFilePath) {
      try {
        await remove(tempFilePath);
      } catch (cleanupError) {
        console.error('Failed to clean up temp file:', cleanupError);
      }
    }
  }
}
