import {createServer} from 'vite';
import {renderToString} from 'react-dom/server';
import {createElement} from 'react';
import {readFileSync,writeFileSync} from 'node:fs';
const server=await createServer({server:{middlewareMode:true},appType:'custom'});
try{
 const {default:App}=await server.ssrLoadModule('/src/App.jsx');
 const markup=renderToString(createElement(App));
 const file='dist/index.html';
 const html=readFileSync(file,'utf8').replace('<div id="root"></div>',`<div id="root">${markup}</div>`);
 writeFileSync(file,html);
 console.log('HTML inicial pré-renderizado para leitura e LCP.');
}finally{await server.close()}
