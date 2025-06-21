export class Link {
    public label: string;
    public url: string;
    /** optional rule URL to open in new tab */
    public ruleURL?: string;
    public divider: boolean;

    constructor() {
        // intentionally left blank
    }

    public serialize(): object {
        if (this.label && this.url) {
            let obj: any = { label: this.label, url: this.url };
            if (this.ruleURL) obj.ruleURL = this.ruleURL;
            return obj;
        }
        return { divider: this.divider };
    }

    public deserialize(rep: any): void {
        let obj = typeof rep == 'string' ? JSON.parse(rep) : rep;
        if ('url' in obj) {
            // label & url object
            if (typeof obj.url === 'string') this.url = obj.url;
            else console.error("TypeError: Link field 'url' is not a string");

            if ('label' in obj) {
                if (typeof obj.label === 'string') this.label = obj.label;
                else console.error("TypeError: Link field 'label' is not a string");
            } else console.error("Error: Link required field 'label' not present");

            if ('ruleURL' in obj) {
                if (typeof obj.ruleURL === 'string') this.ruleURL = obj.ruleURL;
                else console.error("TypeError: Link field 'ruleURL' is not a string");
            }
        } else if ('divider' in obj) {
            // divider object
            if (typeof obj.divider === 'boolean') this.divider = obj.divider;
            else console.error("TypeError: Link field 'divider' is not a boolean");
        } else console.error("Error: Link required field 'url' or 'divider' not present");
    }

    public valid(): boolean {
        return (this.label && this.label.length > 0 && this.url && this.url.length > 0) || this.divider !== undefined;
    }
}
