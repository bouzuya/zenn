import { readFileSync } from 'node:fs';
import fm from 'front-matter';

function main() {
    for (const [date, slug] of Object.entries(JSON.parse(readFileSync('./articles.json')))) {
        const content = readFileSync(`./articles/${slug}.md`, { encoding: 'utf-8' });
        const attrs = fm(content).attributes;
        const publishedAt = attrs['published_at'];
        const pubdate = publishedAt.substring(0, 10);
        const title = attrs['title'];

        const line = [
            '-',
            `[${date}](articles/${slug}.md)`,
            `([${pubdate}](https://zenn.dev/doctormate/articles/${slug}))`,
            title.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
        ].join(' ');
        console.log(line);
    }
}

main();
