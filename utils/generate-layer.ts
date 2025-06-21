#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { basename, dirname, join } from 'path';

interface Framework {
    tagMap: { [tag: string]: string[] };
}

interface Options {
    rules: string;
    framework: string;
    domain: string;
    output?: string;
    post?: string;
}

function parseArgs(): Options {
    const args = process.argv.slice(2);
    const opts: any = { domain: 'enterprise-attack' };
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        switch (arg) {
            case '--rules':
                opts.rules = args[++i];
                break;
            case '--framework':
                opts.framework = args[++i];
                break;
            case '--domain':
                opts.domain = args[++i];
                break;
            case '--output':
                opts.output = args[++i];
                break;
            case '--post':
                opts.post = args[++i];
                break;
            default:
                console.error(`Unknown option: ${arg}`);
                process.exit(1);
        }
    }
    if (!opts.rules || !opts.framework) {
        console.error('Usage: generate-layer.ts --rules <rules.csv|json> --framework <framework.json> [--domain <domain>] [--output <path>] [--post <url>]');
        process.exit(1);
    }
    return opts as Options;
}

function parseRules(path: string): string[][] {
    const data = readFileSync(path, 'utf-8');
    if (path.endsWith('.json')) {
        const arr = JSON.parse(data);
        return arr.map((r: any) => Array.isArray(r.tags) ? r.tags : String(r.tags || '').split(/[,;]\s*/));
    }
    // CSV parsing
    const lines = data.trim().split(/\r?\n/);
    const header = lines.shift();
    if (!header) return [];
    const cols = header.split(/,\s*/);
    const tagIndex = cols.findIndex(c => c.toLowerCase() === 'tags');
    if (tagIndex === -1) throw new Error('tags column not found');
    return lines.map(l => l.split(/,\s*/)[tagIndex].split(/[,;]\s*/));
}

function parseFramework(path: string): Framework {
    const data = JSON.parse(readFileSync(path, 'utf-8'));
    if (data.tagMap) return data as Framework;
    // simple conversion if techniques array provided
    if (Array.isArray(data.techniques)) {
        const map: { [tag: string]: string[] } = {};
        for (const t of data.techniques) {
            const tags = t.tags || [];
            for (const tag of tags) {
                if (!map[tag]) map[tag] = [];
                map[tag].push(t.id || t.attackID);
            }
        }
        return { tagMap: map };
    }
    throw new Error('Invalid framework format');
}

async function main() {
    const opts = parseArgs();
    const ruleTags = parseRules(opts.rules);
    const framework = parseFramework(opts.framework);
    const techniques = new Set<string>();
    for (const tags of ruleTags) {
        for (const tag of tags) {
            const ids = framework.tagMap[tag];
            if (ids) ids.forEach(id => techniques.add(id));
        }
    }
    const layer = {
        versions: { attack: "14" },
        name: basename(opts.rules) + ' layer',
        domain: opts.domain,
        description: `Generated from ${basename(opts.rules)}`,
        techniques: Array.from(techniques).map(id => ({ techniqueID: id }))
    };
    const json = JSON.stringify(layer, null, 2);
    if (opts.output) {
        mkdirSync(dirname(opts.output), { recursive: true });
        writeFileSync(opts.output, json);
        console.log('Layer written to', opts.output);
    }
    if (opts.post) {
        try {
            const res = await fetch(opts.post, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: json });
            console.log('POST', opts.post, res.status);
        } catch (e) {
            console.error('Failed to POST:', e);
        }
    }
}

main();
