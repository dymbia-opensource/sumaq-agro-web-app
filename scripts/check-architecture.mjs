import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const root = path.resolve('src/app');
const layers = new Set(['domain', 'application', 'infrastructure', 'presentation']);
const files = [];
const errors = [];
const graph = new Map();
let productionCount = 0;
let testCount = 0;

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(file);
    else files.push(file);
  }
}

function relative(file) {
  return path.relative(root, file).replaceAll('\\', '/');
}

function location(file) {
  const [context, layer] = relative(file).split('/');
  return { context, layer };
}

function fail(file, reason) {
  errors.push(`${relative(file)}: ${reason}`);
}

walk(root);

for (const file of files) {
  const name = relative(file);
  if (/\/presentation\/views\/[^/]+$/.test(name)) {
    fail(
      file,
      'views must contain view folders; keep styles with their component and move tests to tests/.',
    );
  }
  if (!file.endsWith('.ts')) continue;

  const isTest = file.endsWith('.spec.ts');
  const source = ts.createSourceFile(
    file,
    fs.readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
  );
  const from = location(file);
  if (isTest) {
    testCount++;
    if (name !== 'app.spec.ts' && !name.includes('/tests/')) {
      fail(file, 'place context tests in tests/unit or tests/integration.');
    }
  } else {
    productionCount++;
    if (file.endsWith('.guard.ts') && from.layer !== 'infrastructure') {
      fail(file, 'Angular Router guards belong to infrastructure in this project.');
    }
  }

  function dependency(specifier) {
    if (!isTest && from.layer === 'domain' && !specifier.startsWith('.')) {
      fail(
        file,
        `domain must remain independent of external framework/runtime modules: ${specifier}`,
      );
    }
    if (!isTest && from.layer === 'application' && specifier === '@angular/router') {
      fail(file, 'move the Angular Router adapter to infrastructure.');
    }
    if (!specifier.startsWith('.')) return;

    const resolvedModule = ts.resolveModuleName(
      specifier,
      file,
      {
        moduleResolution: ts.ModuleResolutionKind.Bundler,
      },
      ts.sys,
    ).resolvedModule?.resolvedFileName;
    const resolved = resolvedModule ? path.resolve(resolvedModule) : undefined;
    if (!resolved) {
      fail(file, `unresolved local import: ${specifier}`);
      return;
    }
    if (isTest) return;
    if (resolved.endsWith('.spec.ts') || relative(resolved).includes('/tests/')) {
      fail(file, 'production code must not import tests.');
      return;
    }
    if (!graph.has(file)) graph.set(file, []);
    graph.get(file).push(resolved);
    const target = location(resolved);

    if (from.layer === 'domain' && target.layer !== 'domain') {
      fail(file, `domain imports a higher layer: ${relative(resolved)}`);
    }
    if (from.layer === 'domain' && target.context !== from.context && target.context !== 'shared') {
      fail(
        file,
        `domain must reference other contexts by identity, not import their models: ${relative(resolved)}`,
      );
    }
    if (['application', 'infrastructure'].includes(from.layer) && target.layer === 'presentation') {
      fail(file, `${from.layer} must not depend on presentation: ${relative(resolved)}`);
    }
    if (
      from.context === 'shared' &&
      ['domain', 'application'].includes(from.layer) &&
      layers.has(target.layer) &&
      target.context !== 'shared'
    ) {
      fail(file, `shared core cannot own context-specific state: ${relative(resolved)}`);
    }
    if (from.layer === 'application' && !resolved.startsWith(root + path.sep)) {
      fail(file, 'environment/transport configuration belongs in infrastructure.');
    }
  }

  function resource(node) {
    if (!ts.isPropertyAssignment(node)) return;
    const name = node.name.getText(source);
    const values =
      ['styleUrl', 'templateUrl'].includes(name) && ts.isStringLiteral(node.initializer)
        ? [node.initializer]
        : name === 'styleUrls' && ts.isArrayLiteralExpression(node.initializer)
          ? node.initializer.elements.filter(ts.isStringLiteral)
          : [];
    for (const value of values) {
      const resourcePath = path.resolve(path.dirname(file), value.text);
      if (!fs.existsSync(resourcePath)) {
        fail(file, `missing component resource: ${value.text}`);
      }
      if (
        ['styleUrl', 'styleUrls'].includes(name) &&
        path.dirname(resourcePath) !== path.dirname(file)
      ) {
        fail(file, `keep the component stylesheet in its own folder: ${value.text}`);
      }
    }
  }

  function visit(node) {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      dependency(node.moduleSpecifier.text);
    }
    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments[0] &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      dependency(node.arguments[0].text);
    }
    resource(node);
    ts.forEachChild(node, visit);
  }
  visit(source);
}

const visited = new Set();
const active = new Set();
const stack = [];
function checkCycles(file) {
  if (active.has(file)) {
    errors.push(
      `Import cycle: ${[...stack.slice(stack.indexOf(file)), file].map(relative).join(' -> ')}`,
    );
    return;
  }
  if (visited.has(file)) return;
  visited.add(file);
  active.add(file);
  stack.push(file);
  for (const dependency of graph.get(file) ?? []) checkCycles(dependency);
  stack.pop();
  active.delete(file);
}
for (const file of graph.keys()) checkCycles(file);

if (errors.length) {
  console.error(
    `Architecture check failed (${errors.length} findings):\n${errors.map((error) => `- ${error}`).join('\n')}`,
  );
  process.exitCode = 1;
} else {
  console.log(
    `Architecture check passed: ${productionCount} production TypeScript files and ${testCount} test files.`,
  );
  console.log(
    'Checked local imports, file cycles, domain boundaries, layer direction, context ownership, view layout and component resources.',
  );
}
