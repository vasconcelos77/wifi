import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {copyFileSync,mkdirSync,readdirSync} from 'node:fs';
import {resolve} from 'node:path';

// Originais são preservados no projeto, sem duplicar os arquivos de trabalho na build.
export default defineConfig({
 plugins:[react(),{name:'copy-web-assets',closeBundle(){
  copyFileSync(resolve('public/robots.txt'),resolve('dist/robots.txt'));
  for(const folder of ['assets','fonts']){
   mkdirSync(resolve('dist',folder),{recursive:true});
   for(const item of readdirSync(resolve('public',folder),{withFileTypes:true})){
    if(item.isFile())copyFileSync(resolve('public',folder,item.name),resolve('dist',folder,item.name));
   }
  }
 }}],
 build:{copyPublicDir:false},
 server:{host:'127.0.0.1'},preview:{host:'127.0.0.1'}
});
