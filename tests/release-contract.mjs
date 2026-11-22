import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateRelease} from '../web/release-contract.mjs';
const release=JSON.parse(await readFile('dist/release.json','utf8'));
assert.equal(validateRelease(release),release);
assert(release.files.some(file=>/torch-.*\+pyodide.*\.whl$/.test(file.path)));
for(const path of['../escape','/absolute','runtime/../escape','runtime/%2fescape','runtime/a?query','runtime/a#fragment','releases/escape.js','sw.js']){
 const invalid=structuredClone(release);invalid.files[0].path=path;assert.throws(()=>validateRelease(invalid),undefined,path);
}
const duplicate=structuredClone(release);duplicate.files[1].path=duplicate.files[0].path;assert.throws(()=>validateRelease(duplicate));
console.log('PASS real Python wheel names, unique release paths and traversal/encoding rejection');
