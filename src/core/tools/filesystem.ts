/**
 * FileSystem Tool
 * 
 * Provides a secure interface for performing file system operations
 * within the sandbox environment.
 */

import { BaseTool } from './index';

export interface FileInfo {
    name: string;
    path: string;
    size: number;
    isDirectory: boolean;
    isFile: boolean;
    created: Date;
    modified: Date;
    extension?: string;
    mimeType?: string;
}

export interface FileSystemToolOptions {
    rootDirectory?: string;
    maxFileSize?: number;
    allowedExtensions?: string[];
    disallowedExtensions?: string[];
}

export class FileSystemTool implements BaseTool {
    public name: string = 'filesystem';
    public description: string = 'Provides file system operations in a secure sandbox environment';

    private options: FileSystemToolOptions = {
        rootDirectory: '/tmp/manus-sandbox/files',
        maxFileSize: 1024 * 1024 * 50, // 50MB
        allowedExtensions: [
            'txt', 'json', 'csv', 'md', 'xml', 'html', 'css', 'js', 'ts',
            'jpg', 'jpeg', 'png', 'gif', 'svg', 'pdf', 'doc', 'docx',
            'xls', 'xlsx', 'zip', 'tar', 'gz', 'py', 'ipynb', 'r',
        ],
        disallowedExtensions: [
            'exe', 'dll', 'sh', 'bat', 'cmd', 'com', 'jar', 'msi', 'app',
            'dmg', 'sys', 'so', 'dylib', 'bin',
        ],
    };

    // Simulate a virtual file system for development
    private virtualFileSystem: Map<string, { content: Buffer; isDirectory: boolean; created: Date; modified: Date }> = new Map();

    constructor(options: FileSystemToolOptions = {}) {
        this.options = { ...this.options, ...options };
    }

    /**
     * Initialize the file system
     */
    public async initialize(): Promise<void> {
        // In a real implementation, this would set up the sandbox environment
        // For now, we'll initialize a virtual file system for development

        // Create root directory
        this.virtualFileSystem.set(this.options.rootDirectory!, {
            content: Buffer.from(''),
            isDirectory: true,
            created: new Date(),
            modified: new Date(),
        });

        // Create some sample files for development
        await this.writeFile(
            `${this.options.rootDirectory}/sample.txt`,
            Buffer.from('This is a sample text file.')
        );

        await this.writeFile(
            `${this.options.rootDirectory}/data.json`,
            Buffer.from(JSON.stringify({ name: 'Sample Data', values: [1, 2, 3, 4, 5] }, null, 2))
        );

        await this.mkdir(`${this.options.rootDirectory}/documents`);
        await this.writeFile(
            `${this.options.rootDirectory}/documents/readme.md`,
            Buffer.from('# Sample Readme\n\nThis is a sample markdown document.')
        );
    }

    /**
     * Read a file
     */
    public async readFile(path: string): Promise<Buffer> {
        const normalizedPath = this.normalizePath(path);
        this.validatePath(normalizedPath);

        const fileEntry = this.virtualFileSystem.get(normalizedPath);

        if (!fileEntry) {
            throw new Error(`File not found: ${path}`);
        }

        if (fileEntry.isDirectory) {
            throw new Error(`Cannot read directory as file: ${path}`);
        }

        return fileEntry.content;
    }

    /**
     * Write a file
     */
    public async writeFile(path: string, content: Buffer): Promise<void> {
        const normalizedPath = this.normalizePath(path);
        this.validatePath(normalizedPath);

        // Check file extension
        const ext = this.getFileExtension(normalizedPath);
        if (ext && this.options.disallowedExtensions?.includes(ext)) {
            throw new Error(`File extension not allowed: ${ext}`);
        }

        if (ext && this.options.allowedExtensions && !this.options.allowedExtensions.includes(ext)) {
            throw new Error(`File extension not in allowed list: ${ext}`);
        }

        // Check file size
        if (content.length > this.options.maxFileSize!) {
            throw new Error(`File size exceeds maximum allowed: ${content.length} > ${this.options.maxFileSize}`);
        }

        // Ensure parent directory exists
        const parentDir = this.getParentDirectory(normalizedPath);
        if (!this.virtualFileSystem.has(parentDir)) {
            throw new Error(`Parent directory does not exist: ${parentDir}`);
        }

        // Write the file
        this.virtualFileSystem.set(normalizedPath, {
            content,
            isDirectory: false,
            created: new Date(),
            modified: new Date(),
        });
    }

    /**
     * Create a directory
     */
    public async mkdir(path: string): Promise<void> {
        const normalizedPath = this.normalizePath(path);
        this.validatePath(normalizedPath);

        // Check if already exists
        if (this.virtualFileSystem.has(normalizedPath)) {
            throw new Error(`Path already exists: ${path}`);
        }

        // Ensure parent directory exists
        const parentDir = this.getParentDirectory(normalizedPath);
        if (!this.virtualFileSystem.has(parentDir)) {
            throw new Error(`Parent directory does not exist: ${parentDir}`);
        }

        // Create the directory
        this.virtualFileSystem.set(normalizedPath, {
            content: Buffer.from(''),
            isDirectory: true,
            created: new Date(),
            modified: new Date(),
        });
    }

    /**
     * List directory contents
     */
    public async readdir(path: string): Promise<FileInfo[]> {
        const normalizedPath = this.normalizePath(path);
        this.validatePath(normalizedPath);

        const dirEntry = this.virtualFileSystem.get(normalizedPath);

        if (!dirEntry) {
            throw new Error(`Directory not found: ${path}`);
        }

        if (!dirEntry.isDirectory) {
            throw new Error(`Not a directory: ${path}`);
        }

        // Find all entries with this directory as parent
        const entries: FileInfo[] = [];

        for (const [entryPath, entry] of this.virtualFileSystem.entries()) {
            if (entryPath === normalizedPath) {
                continue; // Skip the directory itself
            }

            const parent = this.getParentDirectory(entryPath);

            if (parent === normalizedPath) {
                const name = entryPath.split('/').pop() || '';

                entries.push({
                    name,
                    path: entryPath,
                    size: entry.content.length,
                    isDirectory: entry.isDirectory,
                    isFile: !entry.isDirectory,
                    created: entry.created,
                    modified: entry.modified,
                    extension: this.getFileExtension(entryPath),
                    mimeType: this.getMimeType(entryPath),
                });
            }
        }

        return entries;
    }

    /**
     * Delete a file or directory
     */
    public async delete(path: string, recursive: boolean = false): Promise<void> {
        const normalizedPath = this.normalizePath(path);
        this.validatePath(normalizedPath);

        // Check if path exists
        if (!this.virtualFileSystem.has(normalizedPath)) {
            throw new Error(`Path not found: ${path}`);
        }

        const entry = this.virtualFileSystem.get(normalizedPath)!;

        // If it's a directory, check if it's empty or recursive is true
        if (entry.isDirectory) {
            const contents = await this.readdir(normalizedPath);

            if (contents.length > 0 && !recursive) {
                throw new Error(`Directory not empty: ${path}`);
            }

            if (recursive) {
                // Delete all contents recursively
                for (const subEntry of contents) {
                    await this.delete(subEntry.path, true);
                }
            }
        }

        // Delete the entry
        this.virtualFileSystem.delete(normalizedPath);
    }

    /**
     * Move/rename a file or directory
     */
    public async move(oldPath: string, newPath: string): Promise<void> {
        const normalizedOldPath = this.normalizePath(oldPath);
        const normalizedNewPath = this.normalizePath(newPath);

        this.validatePath(normalizedOldPath);
        this.validatePath(normalizedNewPath);

        // Check if source exists
        if (!this.virtualFileSystem.has(normalizedOldPath)) {
            throw new Error(`Source path not found: ${oldPath}`);
        }

        // Check if destination already exists
        if (this.virtualFileSystem.has(normalizedNewPath)) {
            throw new Error(`Destination path already exists: ${newPath}`);
        }

        // Ensure parent directory of destination exists
        const parentDir = this.getParentDirectory(normalizedNewPath);
        if (!this.virtualFileSystem.has(parentDir)) {
            throw new Error(`Destination parent directory does not exist: ${parentDir}`);
        }

        // Move the entry
        const entry = this.virtualFileSystem.get(normalizedOldPath)!;
        this.virtualFileSystem.set(normalizedNewPath, {
            ...entry,
            modified: new Date(),
        });
        this.virtualFileSystem.delete(normalizedOldPath);

        // If it's a directory, update all paths of its contents
        if (entry.isDirectory) {
            const oldPaths: string[] = [];

            // Collect all paths that need to be updated
            for (const path of this.virtualFileSystem.keys()) {
                if (path !== normalizedOldPath && path.startsWith(normalizedOldPath + '/')) {
                    oldPaths.push(path);
                }
            }

            // Update each path
            for (const path of oldPaths) {
                const relativePath = path.substring(normalizedOldPath.length);
                const newSubPath = normalizedNewPath + relativePath;

                const subEntry = this.virtualFileSystem.get(path)!;
                this.virtualFileSystem.set(newSubPath, subEntry);
                this.virtualFileSystem.delete(path);
            }
        }
    }

    /**
     * Copy a file or directory
     */
    public async copy(sourcePath: string, destinationPath: string, recursive: boolean = false): Promise<void> {
        const normalizedSource = this.normalizePath(sourcePath);
        const normalizedDest = this.normalizePath(destinationPath);

        this.validatePath(normalizedSource);
        this.validatePath(normalizedDest);

        // Check if source exists
        if (!this.virtualFileSystem.has(normalizedSource)) {
            throw new Error(`Source path not found: ${sourcePath}`);
        }

        const sourceEntry = this.virtualFileSystem.get(normalizedSource)!;

        // Check if destination already exists
        if (this.virtualFileSystem.has(normalizedDest)) {
            throw new Error(`Destination path already exists: ${destinationPath}`);
        }

        // Ensure parent directory of destination exists
        const parentDir = this.getParentDirectory(normalizedDest);
        if (!this.virtualFileSystem.has(parentDir)) {
            throw new Error(`Destination parent directory does not exist: ${parentDir}`);
        }

        // Copy the entry
        this.virtualFileSystem.set(normalizedDest, {
            content: Buffer.from(sourceEntry.content),
            isDirectory: sourceEntry.isDirectory,
            created: new Date(),
            modified: new Date(),
        });

        // If it's a directory and recursive is true, copy all contents
        if (sourceEntry.isDirectory && recursive) {
            const contents = await this.readdir(normalizedSource);

            for (const subEntry of contents) {
                const subDestPath = `${normalizedDest}/${subEntry.name}`;
                await this.copy(subEntry.path, subDestPath, recursive);
            }
        }
    }

    /**
     * Get file information
     */
    public async stat(path: string): Promise<FileInfo> {
        const normalizedPath = this.normalizePath(path);
        this.validatePath(normalizedPath);

        const entry = this.virtualFileSystem.get(normalizedPath);

        if (!entry) {
            throw new Error(`Path not found: ${path}`);
        }

        const name = normalizedPath.split('/').pop() || '';

        return {
            name,
            path: normalizedPath,
            size: entry.content.length,
            isDirectory: entry.isDirectory,
            isFile: !entry.isDirectory,
            created: entry.created,
            modified: entry.modified,
            extension: this.getFileExtension(normalizedPath),
            mimeType: this.getMimeType(normalizedPath),
        };
    }

    /**
     * Normalize a path (remove redundant slashes, resolve . and .., etc.)
     */
    private normalizePath(path: string): string {
        // Ensure path starts with the root directory
        if (!path.startsWith(this.options.rootDirectory!)) {
            path = `${this.options.rootDirectory}/${path}`;
        }

        // Split path into components
        const components = path.split('/').filter(c => c.length > 0);
        const result: string[] = [];

        for (const component of components) {
            if (component === '.') {
                // Skip '.' (current directory)
                continue;
            } else if (component === '..') {
                // Go up one level, but not above root
                if (result.length > 0 && result[result.length - 1] !== this.options.rootDirectory) {
                    result.pop();
                }
            } else {
                // Add component to result
                result.push(component);
            }
        }

        // Join components back into a path
        return '/' + result.join('/');
    }

    /**
     * Validate that a path is within the sandbox
     */
    private validatePath(path: string): void {
        if (!path.startsWith(this.options.rootDirectory!)) {
            throw new Error(`Path is outside sandbox: ${path}`);
        }
    }

    /**
     * Get parent directory path
     */
    private getParentDirectory(path: string): string {
        const parts = path.split('/');
        return parts.slice(0, -1).join('/') || '/';
    }

    /**
     * Get file extension
     */
    private getFileExtension(path: string): string | undefined {
        const name = path.split('/').pop() || '';
        const parts = name.split('.');

        if (parts.length > 1 && parts[parts.length - 1].length > 0) {
            return parts[parts.length - 1].toLowerCase();
        }

        return undefined;
    }

    /**
     * Get MIME type based on file extension
     */
    private getMimeType(path: string): string | undefined {
        const ext = this.getFileExtension(path);

        if (!ext) {
            return undefined;
        }

        // Map common extensions to MIME types
        const mimeTypes: Record<string, string> = {
            'txt': 'text/plain',
            'html': 'text/html',
            'css': 'text/css',
            'js': 'application/javascript',
            'json': 'application/json',
            'xml': 'application/xml',
            'csv': 'text/csv',
            'md': 'text/markdown',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'svg': 'image/svg+xml',
            'pdf': 'application/pdf',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xls': 'application/vnd.ms-excel',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'zip': 'application/zip',
        };

        return mimeTypes[ext];
    }

    /**
     * Clean up resources
     */
    public async cleanup(): Promise<void> {
        // In a real implementation, this would clean up the sandbox environment
        this.virtualFileSystem.clear();
    }
}