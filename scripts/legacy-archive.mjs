import {escape,languagePath} from './i18n.mjs';

export const archiveTitle={zh:'旧站归档',en:'Old site archive',ru:'Архив старого сайта',ja:'旧サイトのアーカイブ'};
const copy={
 zh:['返回归档','旧站的工具、课前演讲、项目记录和小游戏。','课前演讲','旧站工具箱','FG2002 录像','跳跃游戏','平台游戏','旧站公告','在哔哩哔哩观看','开始','得分','点击画布或按空格跳跃，可二段跳。','返回关于页','游戏结束'],
 en:['Back to archive','Tools, classroom talks, project records and small games from the old site.','Classroom talks','Old toolbox','FG2002 recording','Jump game','Platform game','Original notice','Watch on Bilibili','Start','Score','Tap the board or press Space. Double jumps are allowed.','Back to About','Game over'],
 ru:['Назад в архив','Инструменты, школьные выступления, проекты и игры со старого сайта.','Школьные выступления','Старые инструменты','Запись FG2002','Игра с прыжками','Платформер','Исходное объявление','Смотреть на Bilibili','Начать','Счёт','Коснитесь поля или нажмите пробел. Двойной прыжок доступен.','На страницу «Обо мне»','Игра окончена'],
 ja:['アーカイブに戻る','旧サイトのツール、授業前の発表、プロジェクト記録、ミニゲーム。','授業前の発表','旧ツール集','FG2002 の録画','ジャンプゲーム','アクションゲーム','旧サイトからのお知らせ','Bilibili で見る','開始','スコア','画面をタップするかスペースキーを押します。二段ジャンプができます。','プロフィールに戻る','ゲーム終了']
};

const statusCopy={
 zh:{video:'哔哩哔哩未找到原视频',summary:'{count} 条视频流可读取 · 核验于 {date}'},
 en:{video:'Original video unavailable on Bilibili',summary:'{count} video streams reachable · Checked {date}'},
 ru:{video:'Исходное видео недоступно на Bilibili',summary:'Доступно видеопотоков: {count} · Проверено {date}'},
 ja:{video:'Bilibili で元の動画を確認できません',summary:'確認できた動画ストリーム {count} 本 · 確認日 {date}'}
};

const platformCopy={
 zh:{help:'跳过缺口，抵达右侧旗帜。沿途有三枚星屑可以收集。用方向键、空格或屏幕按钮操作。',left:'向左',right:'向右',jump:'跳跃',shards:'星屑',cleared:'通关！',fell:'掉下去了',retry:'重新开始'},
 en:{help:'Jump across the gaps and reach the flag. Collect up to three stardust pieces along the way. Use the arrow keys, Space or the on-screen controls.',left:'Move left',right:'Move right',jump:'Jump',shards:'Stardust',cleared:'Level cleared!',fell:'You fell',retry:'Restart'},
 ru:{help:'Перепрыгните разрывы и доберитесь до флага. По пути можно собрать три частицы звёздной пыли. Используйте стрелки, пробел или экранные кнопки.',left:'Влево',right:'Вправо',jump:'Прыжок',shards:'Звёздная пыль',cleared:'Уровень пройден!',fell:'Вы упали',retry:'Начать заново'},
 ja:{help:'足場の間を跳び越えて旗を目指します。途中で星のかけらを3つ集められます。矢印キー、スペースキー、画面のボタンで操作できます。',left:'左へ移動',right:'右へ移動',jump:'ジャンプ',shards:'星のかけら',cleared:'クリア！',fell:'落ちてしまいました',retry:'最初から'}
};

export function archivePages(data,locale){
 const [back,intro,talks,tools,recording,jump,platform,notice,bilibili,start,score,jumpHelp,about,gameOver]=copy[locale];
 const route=path=>'/legacy/'+path;
 const status=statusCopy[locale];
 const unavailable=new Set(data.audit.unavailableVideos);
 const badge=kind=>kind?`<small class="legacy-status" data-legacy-status="${kind}">${escape(status[kind])}</small>`:'';
 const link=(url,label,lang='')=>{
  const external=/^https?:\/\//.test(url);
  return `<a class="text-link" href="${escape(url)}"${external?' target="_blank" rel="noopener noreferrer"':''}${lang?' lang="'+lang+'"':''}>${escape(label)}<span aria-hidden="true">${external?'↗':'›'}</span></a>`;
 };
 const video=({bvid,aid,cid},title,lang='')=>{
  if(!/^BV[A-Za-z0-9]{10}$/.test(bvid)||!Number.isSafeInteger(aid)||aid<1||!Number.isSafeInteger(cid)||cid<1)throw new Error('Invalid archived video ID');
  if(unavailable.has(bvid))return `<p class="legacy-video-status">${badge('video')}</p>`;
  return `<iframe class="legacy-video" src="https://player.bilibili.com/player.html?bvid=${bvid}&amp;aid=${aid}&amp;cid=${cid}&amp;page=1&amp;autoplay=0" title="${escape(title)}"${lang?' lang="'+lang+'"':''} loading="lazy" allowfullscreen referrerpolicy="no-referrer"></iframe><p>${link('https://www.bilibili.com/video/'+bvid+'/',bilibili)}</p>`;
 };
 const card=(path,title,meta='')=>`<li><a class="text-link" href="${route(path)}"><strong>${escape(title)}</strong>${meta}<span aria-hidden="true">›</span></a></li>`;
 const game=(mode,label,help)=>{
  const labels=platformCopy[locale];
  const control=(name,symbol)=>`<button type="button" data-control="${name}" aria-label="${escape(labels[name])}">${symbol}</button>`;
  const controls=mode==='platform'?`<div class="legacy-move">${control('left','←')}${control('right','→')}</div>${control('jump','↑')}`:'';
  const messages=mode==='platform'?` data-shard-label="${escape(labels.shards)}" data-cleared="${escape(labels.cleared)}" data-fell="${escape(labels.fell)}" data-retry="${escape(labels.retry)}"`:'';
  return `<p id="legacy-game-help">${escape(help)}</p><div class="legacy-game" data-legacy-game="${mode}" data-score="${escape(score)}" data-game-over="${escape(gameOver)}"${messages}><canvas width="720" height="360" tabindex="0" aria-label="${escape(label)}" aria-describedby="legacy-game-help"></canvas><div class="legacy-controls"><button type="button" data-start>${escape(start)}</button>${controls}<output aria-live="polite"></output></div></div><script type="module" src="/assets/legacy-game.js"></script>`;
 };
 const home=`<p class="lead">${escape(intro)}</p><ul class="legacy-grid">${[
  ['talks/',talks,`<small>${data.talks.length}</small>`],['recording/',recording],['jump/',jump],['platform/',platform]
 ].map(args=>card(...args)).join('')}</ul><section class="legacy-shelf"><h2>${escape(tools)}</h2><ul class="legacy-tools">${data.tools.map(item=>`<li>${link(item.url,item.label,'zh-CN')}</li>`).join('')}</ul></section><details class="legacy-shelf"><summary>${escape(notice)}</summary><div lang="zh-CN">${data.notice.map(line=>`<p>${escape(line)}</p>`).join('')}<p>感谢热铁盒提供数据技术支持。</p></div></details>`;
 const dates=new Intl.DateTimeFormat(locale,{dateStyle:'medium',timeZone:'UTC'});
 const dateMarkup=date=>`<time datetime="${date}">${dates.format(new Date(date))}</time>`;
 const summary=status.summary.replace('{count}',String(data.talks.filter(entry=>!unavailable.has(entry.bvid)).length)).replace('{date}',dates.format(new Date(data.audit.date)));
 const talkList=`<p class="legacy-audit-summary">${escape(summary)}</p><ul class="legacy-grid">${data.talks.map(entry=>`<li><a class="text-link" href="${route('talks/'+entry.date+'/')}" ><strong lang="zh-CN">${escape(entry.topic)}</strong>${dateMarkup(entry.date)}${unavailable.has(entry.bvid)?badge('video'):''}<span aria-hidden="true">›</span></a></li>`).join('')}</ul>`;
 const pages=[
  ['',archiveTitle[locale],home],
  ['talks/',talks,talkList],
  ['recording/',recording,video(data.recording,recording)],
  ['jump/',jump,game('jump',jump,jumpHelp)],
  ['platform/',platform,game('platform',platform,platformCopy[locale].help)],
  ...data.talks.map(entry=>['talks/'+entry.date+'/',entry.topic,dateMarkup(entry.date)+video(entry,entry.topic,'zh-CN'),'zh-CN'])
 ];
 return pages.map(([path,title,body,lang])=>({
  route:'legacy/'+path,title,label:archiveTitle[locale],description:intro,lang,
  body:`<nav class="legacy-back">${path?link(route(path.startsWith('talks/')&&path!=='talks/'?'talks/':''),back):link(languagePath(locale,'about/'),about)}</nav>${body}`
 }));
}
