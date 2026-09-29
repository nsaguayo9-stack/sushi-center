import fs from 'node:fs/promises';
await fs.rm('dist',{recursive:true,force:true});
await fs.cp('public','dist',{recursive:true});
await fs.cp('src','dist/src',{recursive:true});
console.log('Sitio estático generado en dist/');
