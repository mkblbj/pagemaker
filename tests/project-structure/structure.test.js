const fs = require('fs');
const path = require('path');

describe('Project Structure Tests', () => {
  const rootDir = path.resolve(__dirname, '../..');

  test('should have correct monorepo directory structure', () => {
    // 验证主要目录存在
    expect(fs.existsSync(path.join(rootDir, 'apps'))).toBe(true);
    expect(fs.existsSync(path.join(rootDir, 'apps/frontend'))).toBe(true);
    expect(fs.existsSync(path.join(rootDir, 'apps/backend'))).toBe(true);
    expect(fs.existsSync(path.join(rootDir, 'packages'))).toBe(true);
    expect(fs.existsSync(path.join(rootDir, 'packages/shared-types'))).toBe(true);
    expect(fs.existsSync(path.join(rootDir, 'docs'))).toBe(true);
  });

  test('should have backend directory structure', () => {
    const backendDir = path.join(rootDir, 'apps/backend/pagemaker');
    expect(fs.existsSync(backendDir)).toBe(true);
    expect(fs.existsSync(path.join(backendDir, 'api'))).toBe(true);
    expect(fs.existsSync(path.join(backendDir, 'users'))).toBe(true);
    expect(fs.existsSync(path.join(backendDir, 'pages'))).toBe(true);
    expect(fs.existsSync(path.join(backendDir, 'configurations'))).toBe(true);
    expect(fs.existsSync(path.join(backendDir, 'media'))).toBe(true);
  });

  test('should have workspace configuration files', () => {
    expect(fs.existsSync(path.join(rootDir, 'package.json'))).toBe(true);
    expect(fs.existsSync(path.join(rootDir, 'pnpm-workspace.yaml'))).toBe(true);
  });

  test('should have valid package.json with workspace config', () => {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8')
    );
    expect(packageJson.workspaces).toEqual(['apps/*', 'packages/*']);
    expect(packageJson.name).toBe('pagemaker-cms');
    expect(packageJson.private).toBe(true);
  });

  test('should have shared types package configuration', () => {
    const typesPackageJson = JSON.parse(
      fs.readFileSync(path.join(rootDir, 'packages/shared-types/package.json'), 'utf8')
    );
    expect(typesPackageJson.name).toBe('@pagemaker/shared-types');
    expect(fs.existsSync(path.join(rootDir, 'packages/shared-types/src/index.ts'))).toBe(true);
    expect(fs.existsSync(path.join(rootDir, 'packages/shared-types/tsconfig.json'))).toBe(true);
  });

  test('should have configuration files', () => {
    expect(fs.existsSync(path.join(rootDir, '.env.example'))).toBe(true);
    expect(fs.existsSync(path.join(rootDir, '.editorconfig'))).toBe(true);
    expect(fs.existsSync(path.join(rootDir, 'README.md'))).toBe(true);
  });

  test('should have comprehensive README.md', () => {
    const readme = fs.readFileSync(path.join(rootDir, 'README.md'), 'utf8');
    expect(readme).toContain('Pagemaker CMS');
    expect(readme).toContain('快速开始');
    expect(readme).toContain('环境要求');
    expect(readme).toContain('Node.js');
    expect(readme).toContain('Python');
    expect(readme).toContain('MySQL');
  });
}); 