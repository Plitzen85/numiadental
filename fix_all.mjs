import fs from 'fs';
import path from 'path';

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.jsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('./src');
files.forEach(filePath => {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Fix select, input, textarea missing title
    content = content.replace(/<input\s+(?![^>]*title=)([^>]+)>/g, '<input title="Campo" $1>');
    content = content.replace(/<select\s+(?![^>]*title=)([^>]+)>/g, '<select title="Opciones" $1>');
    content = content.replace(/<textarea\s+(?![^>]*title=)([^>]+)>/g, '<textarea title="Texto" $1>');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Fixed missing titles in ${filePath}`);
    }
});
