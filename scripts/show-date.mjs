import { readFileSync } from 'node:fs';
import { argv } from 'node:process';

function main() {
    for (const [date, slug] of Object.entries(JSON.parse(readFileSync('./articles.json')))) {
        if (slug === argv[2]) {
            console.log(date);
        }
    }
}

main();
