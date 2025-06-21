import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { ViewModel } from '../classes';
import { SigmaRulesService, SigmaRule } from '../services/sigma-rules.service';

@Component({
    selector: 'sigma-recommendations',
    templateUrl: './sigma-recommendations.component.html',
    styleUrls: ['./sigma-recommendations.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class SigmaRecommendationsComponent implements OnInit {
    @Input() viewModel: ViewModel;
    public recommendations: { technique: string; rules: SigmaRule[] }[] = [];

    constructor(private sigmaService: SigmaRulesService) {}

    ngOnInit(): void {
        const build = () => {
            const map = this.sigmaService.getLayerRecommendations(this.viewModel);
            map.forEach((rules, tech) => {
                this.recommendations.push({ technique: tech, rules });
            });
        };
        if (this.sigmaService.rules.length === 0) {
            this.sigmaService.loadRules().then(build);
        } else {
            build();
        }
    }
}
