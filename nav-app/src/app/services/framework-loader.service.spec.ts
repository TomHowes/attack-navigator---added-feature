import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { DataService } from './data.service';
import { ConfigService } from './config.service';
import * as MockData from '../../tests/utils/mock-data';

/** Tests verifying custom framework loading via DataService */
describe('Custom Framework Loading', () => {
    let configService: ConfigService;
    let http: HttpClient;
    let dataService: DataService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [DataService]
        });
        configService = TestBed.inject(ConfigService);
        http = TestBed.inject(HttpClient);
    });

    it('should load techniques from custom framework', async () => {
        configService.frameworks = [
            {
                name: MockData.simpleFramework.name,
                identifier: 'custom',
                version: MockData.simpleFramework.version,
                file: 'assets/custom-framework.json'
            }
        ];
        configService.versions = { enabled: false, entries: [] } as any;
        spyOn(http, 'get').and.returnValue(of(MockData.simpleFramework));

        dataService = new DataService(http, configService);
        const domain = dataService.domains[0];
        expect(domain.isCustom).toBeTrue();
        await dataService.loadDomainData(domain.id, false);
        expect(domain.techniques.length).toEqual(1);
        expect(domain.tactics.length).toEqual(1);
    });
});
