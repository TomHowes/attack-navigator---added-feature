import { execSync } from 'child_process';
import { readFileSync, unlinkSync, writeFileSync } from 'fs';
import { resolve } from 'path';

// simple test for generate-layer.ts script using bundled sample data
const script = resolve(__dirname, 'generate-layer.ts');
const rules = resolve(__dirname, 'security-platform-export.csv');
const framework = resolve(__dirname, 'temp-framework.json');
const output = resolve(__dirname, 'test-layer.json');

// minimal framework mapping tags to technique IDs
writeFileSync(
    framework,
    JSON.stringify({ techniques: [{ id: 'T1059', tags: ['attack.T1059'] }] })
);

execSync(`npx ts-node ${script} --rules ${rules} --framework ${framework} --output ${output}`, { stdio: 'inherit' });
const layer = JSON.parse(readFileSync(output, 'utf8'));
unlinkSync(output);
unlinkSync(framework);

if (!layer.techniques || layer.techniques.length === 0) {
    throw new Error('No techniques produced');
}
console.log('generate-layer spec passed');
