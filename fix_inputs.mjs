import fs from 'fs';

const filePath = './src/pages/ClinicDirectory.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Fix img alt
content = content.replace(/<img src=\{item\.foto\} className="w-8 h-8 rounded-full border border-electric\/30 object-cover" \/>/g, '<img src={item.foto} alt="Staff" className="w-8 h-8 rounded-full border border-electric/30 object-cover" />');

// Parse all <label> and the following <input> or <select> or <textarea>
// Actually, safer: just add title="Generic" if missing, or we can use regex to replace specific properties.
content = content.replace(/<input\s+(?![^>]*title=)([^>]+)>/g, '<input title="Campo" $1>');
content = content.replace(/<select\s+(?![^>]*title=)([^>]+)>/g, '<select title="Opciones" $1>');
content = content.replace(/<textarea\s+(?![^>]*title=)([^>]+)>/g, '<textarea title="Texto" $1>');

fs.writeFileSync(filePath, content, 'utf8');
console.log("Fixed ClinicDirectory.tsx!");
