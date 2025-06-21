import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { SigmaRulesService, SigmaRule } from './sigma-rules.service';
import { ConfigService } from './config.service';
import { TechniqueVM } from '../classes';

/** Tests for Sigma rule recommendation service */
describe('SigmaRulesService', () => {
    let service: SigmaRulesService;
    let config: ConfigService;
    let http: HttpClient;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [SigmaRulesService]
        });
        service = TestBed.inject(SigmaRulesService);
        config = TestBed.inject(ConfigService);
        http = TestBed.inject(HttpClient);
    });

    it('should load rules from YAML', async () => {
        config.sigmaRulePaths = ['assets/sigma/example.yml'];
        config.sigmaRuleUrlTemplate = 'https://example.com/{platform}/{filename}';
        const yaml = `id: example-rule\ntitle: Example\ntags:\n  - attack.t0000`;
        spyOn(http, 'get').and.returnValue(of(yaml));
        await service.loadRules();
        expect(service.rules.length).toBe(1);
        expect(service.rules[0].title).toBe('Example');
        expect(service.rules[0].path).toBe('assets/sigma/example.yml');
        expect(service.rules[0].url).toBe('https://example.com/sigma/example.yml');
    });

    it('should recommend rules for unannotated technique', () => {
        service.rules = [{ title: 'r', tags: ['T0000'], path: 'p', url: 'p' }];
        const tvm = new TechniqueVM('T0000^tactic');
        const vm: any = {
            techniqueVMs: new Map([[tvm.technique_tactic_union_id, tvm]]),
            dataService: { getTechnique: () => ({ attackID: 'T0000', platforms: ['windows'] }) },
            domainVersionID: ''
        };
        const recs = service.getLayerRecommendations(vm);
        expect(recs.get('T0000')?.length).toBe(1);
    });
});
