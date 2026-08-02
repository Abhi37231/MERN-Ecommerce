const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  path.join(__dirname, 'src', 'pages', 'Home.jsx'),
  path.join(__dirname, 'src', 'pages', 'Products.jsx'),
  path.join(__dirname, 'src', 'pages', 'ProductDetail.jsx'),
  path.join(__dirname, 'src', 'pages', 'Categories.jsx'),
];

filesToUpdate.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Fix `/ loading="lazy">` to ` loading="lazy" />`
    let count = 0;
    const modified = content.replace(/\/ loading="lazy">/g, (match) => {
      count++;
      return `loading="lazy" />`;
    });

    if (count > 0) {
      fs.writeFileSync(file, modified);
      console.log(`Fixed ${count} tags in ${path.basename(file)}`);
    } else {
      console.log(`No fixes for ${path.basename(file)}`);
    }
  }
});
