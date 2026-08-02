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
    
    // Add loading="lazy" to all img tags that don't have it, except the hero image in Home
    // and the main image in ProductDetail.
    let count = 0;
    const modified = content.replace(/<img([^>]*)>/g, (match, attrs) => {
      if (attrs.includes('loading=')) return match;
      if (attrs.includes('Interior Decor Background')) return match; // Hero image
      if (attrs.includes('activeImage')) return match; // Main product image

      count++;
      return `<img${attrs} loading="lazy">`;
    });

    if (count > 0) {
      fs.writeFileSync(file, modified);
      console.log(`Updated ${count} images in ${path.basename(file)}`);
    } else {
      console.log(`No updates for ${path.basename(file)}`);
    }
  }
});
