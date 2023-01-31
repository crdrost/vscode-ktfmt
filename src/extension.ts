/*
 * Copyright 2020 Ilkka Poutanen, CR Drost
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import * as vscode from 'vscode';
import * as cp from 'child_process';
import { env } from 'process';
import * as path from 'path';

const documentFilter: vscode.DocumentFilter = {
  language: 'kotlin',
  scheme: 'file',
};

const outputChannel = vscode.window.createOutputChannel('ktfmt');
interface JavaRuntime {
  name: string;
  path: string;
  default?: boolean;
}

class KtfmtProvider implements vscode.DocumentRangeFormattingEditProvider {
  provideDocumentRangeFormattingEdits(
    document: vscode.TextDocument
    // range: vscode.Range,
    // options: vscode.FormattingOptions,
    // token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.TextEdit[]> {
    const config = vscode.workspace.getConfiguration('ktfmt');
    const runtimes = vscode.workspace
      .getConfiguration('java.configuration')
      .get<JavaRuntime[]>('runtimes');

    if (!runtimes || typeof runtimes !== 'object' || !runtimes.length) {
      vscode.window.showErrorMessage(
        'ktfmt could not start.\nCould not find any java runtimes in java.configuration.runtimes'
      );
      return Promise.resolve(null);
    }
    const pathToJar = config.get<string>('path-to-jar');
    const choosenCodeStyle = config.get<string>('code-style');
    const javaRuntimeName = config.get<string>('java-runtime');
    let runtime: undefined | JavaRuntime;
    if (!javaRuntimeName) {
      runtime = runtimes.find((x) => x.default);
      if (!runtime) {
        vscode.window.showErrorMessage(
          'ktfmt could not start.\nNo java runtime specified in ktfmt.java-runtime and none of the java.configuration.runtimes are marked as {default: true}'
        );
        return Promise.resolve(null);
      }
    } else {
      runtime = runtimes.find((x) => x.name === javaRuntimeName);
      if (!runtime) {
        vscode.window.showErrorMessage(
          'ktfmt could not start.\nNo java runtime with {name: ' +
            JSON.stringify(javaRuntimeName) +
            '} found in java.configuration.runtimes.'
        );
        return Promise.resolve(null);
      }
    }
    if (pathToJar === undefined) {
      vscode.window.showErrorMessage(
        'ktfmt could not start.\nktfmt.path-to-jar not defined'
      );
      return Promise.resolve(null);
    }
    let codeStyle = '--kotlinlang-style';
    if (choosenCodeStyle) {
      codeStyle = `--${choosenCodeStyle}`;
    }

    const javaHome = runtime.path;

    outputChannel.appendLine(`Formatting ${document.fileName}`);
    const subEnv = { ...env };
    subEnv.JAVA_HOME = javaHome;
    return new Promise((resolve, reject) => {
      let stdout = '';
      let child: cp.ChildProcessWithoutNullStreams;
      try {
        child = cp.spawn(
          path.resolve(javaHome, 'bin', 'java'),
          ['-jar', pathToJar, codeStyle, '-'],
          {
            env: subEnv,
          }
        );
        child.stdout.setEncoding('utf8');
        child.stderr.setEncoding('utf8');
      } catch (err) {
        outputChannel.appendLine('Could not format: ' + err);
        return reject(err);
      }
      child.stdout.on('data', (chunk) => {
        stdout += chunk;
      });
      child.stderr.on('data', (chunk) => {
        outputChannel.appendLine(chunk.replace(/^/gm, 'ktfmt.err> '));
      });
      child.on('error', (err) => {
        vscode.window.showErrorMessage(`Could not run ktfmt
        : ${err}`);
        return reject(err);
      });
      child.on('close', (retcode) => {
        if (retcode !== 0) {
          return reject(
            'Failed to format file; ktfmt exited with code ' + retcode
          );
        }
        return resolve([
          new vscode.TextEdit(
            new vscode.Range(0, 0, document.lineCount + 1, 0),
            stdout
          ),
        ]);
      });
      child.stdin.write(document.getText(), (err) => {
        if (err) {
          outputChannel.appendLine(err.message);
        }
        child.stdin.end();
      });
    });
  }
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.languages.registerDocumentRangeFormattingEditProvider(
      documentFilter,
      new KtfmtProvider()
    )
  );
}

// this method is called when your extension is deactivated
export function deactivate(): void {
  return undefined;
}
