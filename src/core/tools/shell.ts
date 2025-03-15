/**
 * Shell Tool
 * 
 * Provides a secure interface for executing shell commands
 * within the sandbox environment.
 */

import { BaseTool } from './index';

export interface ShellCommandResult {
    command: string;
    exitCode: number;
    stdout: string;
    stderr: string;
    duration: number;
}

export interface ShellToolOptions {
    workingDirectory?: string;
    timeout?: number;
    maxBuffer?: number;
    allowedCommands?: string[];
    disallowedCommands?: string[];
}

export class ShellTool implements BaseTool {
    public name: string = 'shell';
    public description: string = 'Executes shell commands in a secure sandbox environment';

    private options: ShellToolOptions = {
        workingDirectory: '/tmp/manus-sandbox',
        timeout: 30000,
        maxBuffer: 1024 * 1024 * 10, // 10MB
        allowedCommands: [
            'ls', 'cat', 'head', 'tail', 'grep', 'find', 'wc',
            'mkdir', 'touch', 'cp', 'mv', 'rm', 'echo',
            'curl', 'wget', 'ping', 'traceroute', 'dig', 'nslookup',
            'python', 'python3', 'node', 'npm', 'pip', 'git',
        ],
        disallowedCommands: [
            'sudo', 'su', 'chmod', 'chown', 'chgrp',
            'dd', 'mkfs', 'apt', 'apt-get', 'yum', 'dnf',
            'systemctl', 'service', 'firewall-cmd', 'iptables',
            'ssh', 'scp', 'sftp', 'telnet', 'ftp',
        ],
    };

    constructor(options: ShellToolOptions = {}) {
        this.options = { ...this.options, ...options };
    }

    /**
     * Initialize the shell environment
     */
    public async initialize(): Promise<void> {
        // In a real implementation, this would set up the sandbox environment
        // For now, we'll just simulate the initialization

        // Create working directory
        // This would be a Docker container mount or similar in production
        // await this.execute('mkdir -p ' + this.options.workingDirectory);

        // This is where we'd initialize the sandbox environment
        console.log('Initializing shell sandbox environment');
    }

    /**
     * Execute a shell command
     */
    public async execute(command: string): Promise<ShellCommandResult> {
        if (!this.isCommandAllowed(command)) {
            throw new Error(`Command not allowed: ${command}`);
        }

        // In a real implementation, this would execute the command in a sandbox
        // For now, we'll just simulate the execution

        const startTime = Date.now();

        // Simulate command execution
        const simulatedResult = this.simulateCommandExecution(command);

        const endTime = Date.now();
        const duration = endTime - startTime;

        return {
            command,
            exitCode: simulatedResult.exitCode,
            stdout: simulatedResult.stdout,
            stderr: simulatedResult.stderr,
            duration,
        };
    }

    /**
     * Run a script file
     */
    public async runScript(script: string, interpreter: string = 'bash'): Promise<ShellCommandResult> {
        // In a real implementation, this would write the script to a file and execute it
        // For now, we'll just simulate the execution

        if (!this.isCommandAllowed(interpreter)) {
            throw new Error(`Interpreter not allowed: ${interpreter}`);
        }

        // Simulate script execution
        const startTime = Date.now();

        const simulatedResult = {
            exitCode: 0,
            stdout: `Simulated execution of ${interpreter} script:\n\n${script}\n\nExecution completed successfully.\n`,
            stderr: '',
        };

        const endTime = Date.now();
        const duration = endTime - startTime;

        return {
            command: `${interpreter} script.${interpreter}`,
            exitCode: simulatedResult.exitCode,
            stdout: simulatedResult.stdout,
            stderr: simulatedResult.stderr,
            duration,
        };
    }

    /**
     * Check if a command is allowed to be executed
     */
    private isCommandAllowed(command: string): boolean {
        // Extract the base command (e.g., 'ls' from 'ls -la')
        const baseCommand = command.trim().split(/\s+/)[0];

        // Check if the command is explicitly disallowed
        if (this.options.disallowedCommands?.some(cmd => baseCommand === cmd)) {
            return false;
        }

        // If there's an allowed list, the command must be on it
        if (this.options.allowedCommands && this.options.allowedCommands.length > 0) {
            return this.options.allowedCommands.some(cmd => baseCommand === cmd);
        }

        // If there's no allowed list, then it's allowed by default
        return true;
    }

    /**
     * Simulate shell command execution (for development purposes)
     */
    private simulateCommandExecution(command: string): { exitCode: number; stdout: string; stderr: string } {
        // Extract the base command
        const baseCommand = command.trim().split(/\s+/)[0];

        // Simulate common commands
        switch (baseCommand) {
            case 'ls':
                return {
                    exitCode: 0,
                    stdout: 'file1.txt\nfile2.txt\ndirectory1\n',
                    stderr: '',
                };

            case 'cat':
                return {
                    exitCode: 0,
                    stdout: 'This is the content of the simulated file.\n',
                    stderr: '',
                };

            case 'echo':
                const echoContent = command.substring(5); // Remove 'echo '
                return {
                    exitCode: 0,
                    stdout: echoContent + '\n',
                    stderr: '',
                };

            case 'mkdir':
                return {
                    exitCode: 0,
                    stdout: '',
                    stderr: '',
                };

            case 'python':
            case 'python3':
                if (command.includes('print')) {
                    return {
                        exitCode: 0,
                        stdout: 'Hello from Python!\n',
                        stderr: '',
                    };
                } else {
                    return {
                        exitCode: 0,
                        stdout: '',
                        stderr: '',
                    };
                }

            case 'curl':
            case 'wget':
                return {
                    exitCode: 0,
                    stdout: 'Simulating download... Done.\n',
                    stderr: '',
                };

            case 'grep':
                return {
                    exitCode: 0,
                    stdout: 'Matching line 1\nMatching line 2\n',
                    stderr: '',
                };

            default:
                return {
                    exitCode: 0,
                    stdout: `Simulated execution of: ${command}\n`,
                    stderr: '',
                };
        }
    }

    /**
     * Clean up resources
     */
    public async cleanup(): Promise<void> {
        // In a real implementation, this would clean up the sandbox environment
        console.log('Cleaning up shell sandbox environment');
    }
}