import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {articleLink} from '../dist/assets/food-core.js';
test('CacheTide encoded article slugs match its published canonical/client routes',()=>{
 const place={articleUrl:'https://cachetide.top/posts/%E5%9D%9D%E5%9D%9D%E8%B9%84%E8%8A%B1?ref=atlas#details'};
 const before=place.articleUrl;
 assert.equal(articleLink(place),'https://cachetide.top/posts/%25E5%259D%259D%25E5%259D%259D%25E8%25B9%2584%25E8%258A%25B1?ref=atlas#details');
 assert.equal(place.articleUrl,before);
 assert.equal(articleLink({articleUrl:articleLink(place)}),articleLink(place));
});
test('other sites, ASCII posts and non-article routes keep their original URLs',()=>{
 for(const url of ['https://frostmoonrui.com/posts/%E5%9D%9D','https://cachetide.top/posts/git-and-lazygit-note','https://cachetide.top/food-map','https://cachetide.top/other/%E5%9D%9D','https://cachetide.top.evil.example/posts/%E5%9D%9D'])assert.equal(articleLink({articleUrl:url}),url);
 for(const url of ['javascript:alert(1)','https://user:secret@cachetide.top/posts/a','http://cachetide.top/posts/a',''])assert.equal(articleLink({articleUrl:url}),null);
});
test('all imported article links are adapted without modifying the exchange cache',()=>{
 const feed=JSON.parse(fs.readFileSync(new URL('../dist/data/food.json',import.meta.url)));
 const snapshot=JSON.stringify(feed);
 for(const place of feed.spots){const url=new URL(articleLink(place));assert.equal(url.origin,'https://cachetide.top');assert.equal(url.pathname,encodeURI(new URL(place.articleUrl).pathname));}
 assert.equal(JSON.stringify(feed),snapshot);
 const runtime=fs.readFileSync(new URL('../dist/assets/food-map.js',import.meta.url),'utf8');
 assert.equal((runtime.match(/const original=articleLink\(p\)/g)||[]).length,2);
});
