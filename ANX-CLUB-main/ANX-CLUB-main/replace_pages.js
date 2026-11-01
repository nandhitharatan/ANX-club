const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('page.tsx') && file !== path.resolve('./src/app/page.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const pages = walk('./src/app');

const placeholder = `export default function Page() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-4">Under Construction</h1>
      <p className="text-neutral-400">This page is being rebuilt as part of the Phase 2-4 UI overhaul.</p>
    </div>
  );
}
`;

pages.forEach(file => {
  fs.writeFileSync(file, placeholder);
  console.log(`Replaced ${file}`);
});
