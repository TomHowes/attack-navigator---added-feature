import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from './config.service';
import { load as loadYAML } from 'js-yaml';
import { ViewModel } from '../classes';

export interface SigmaRule {
    title: string;
    tags: string[];
    path: string;
}

@Injectable({
    providedIn: 'root',
})
export class SigmaRulesService {
    public rules: SigmaRule[] = [];

    constructor(private http: HttpClient, private configService: ConfigService) {}

    public async loadRules(): Promise<void> {
        const paths: string[] = this.configService.sigmaRulePaths || [];
        const requests = paths.map((p) =>
            this.http
                .get(p, { responseType: 'text' })
                .toPromise()
                .then((txt) => {
                    const obj = p.endsWith('.json') ? JSON.parse(txt) : (loadYAML(txt) as any);
                    if (Array.isArray(obj)) {
                        obj.forEach((o) =>
                            this.rules.push({ title: o.title || o.id, tags: o.tags || [], path: p })
                        );
                    } else {
                        this.rules.push({ title: obj.title || obj.id, tags: obj.tags || [], path: p });
                    }
                })
                .catch((err) => console.error('failed loading sigma rule', p, err))
        );
        await Promise.all(requests);
    }

    public getMatches(techID: string, meta: { platforms?: string[]; datasources?: string[] } = {}): SigmaRule[] {
        techID = techID.toLowerCase();
        return this.rules.filter((r) =>
            (r.tags || []).some((t) => {
                t = String(t).toLowerCase();
                if (t === techID) return true;
                if (meta.platforms?.some((p) => t.includes(p.toLowerCase()))) return true;
                if (meta.datasources?.some((d) => t.includes(d.toLowerCase()))) return true;
                return false;
            })
        );
    }

    public getLayerRecommendations(vm: ViewModel): Map<string, SigmaRule[]> {
        const recs = new Map<string, SigmaRule[]>();
        vm.techniqueVMs.forEach((tvm, id) => {
            if (!tvm.annotated()) {
                const tech = vm.dataService.getTechnique(tvm.techniqueID, vm.domainVersionID);
                if (tech) {
                    const matches = this.getMatches(tech.attackID, {
                        platforms: tech.platforms,
                        datasources: tech.datasources ? [tech.datasources] : [],
                    });
                    if (matches.length) recs.set(tech.attackID, matches);
                }
            }
        });
        return recs;
    }
}
