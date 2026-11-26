import {escape,languagePath} from './i18n.mjs';

export const archiveTitle={zh:'旧站归档',en:'Old site archive',ru:'Архив старого сайта',ja:'旧サイトのアーカイブ'};
const copy={
 zh:['返回归档','旧站的工具、课前演讲、项目记录和小游戏。','课前演讲','旧站工具箱','FG2002 录像','跳跃游戏','平台游戏','旧站公告','在哔哩哔哩观看','开始','得分','点击画布或按空格跳跃，可二段跳。','返回关于页','游戏结束'],
 en:['Back to archive','Tools, classroom talks, project records and small games from the old site.','Classroom talks','Old toolbox','FG2002 recording','Jump game','Platform game','Original notice','Watch on Bilibili','Start','Score','Tap the board or press Space. Double jumps are allowed.','Back to About','Game over'],
 ru:['Назад в архив','Инструменты, школьные выступления, проекты и игры со старого сайта.','Школьные выступления','Старые инструменты','Запись FG2002','Игра с прыжками','Платформер','Исходное объявление','Смотреть на Bilibili','Начать','Счёт','Коснитесь поля или нажмите пробел. Двойной прыжок доступен.','На страницу «Обо мне»','Игра окончена'],
 ja:['アーカイブに戻る','旧サイトのツール、授業前の発表、プロジェクト記録、ミニゲーム。','授業前の発表','旧ツール集','FG2002 の録画','ジャンプゲーム','アクションゲーム','旧サイトからのお知らせ','Bilibili で見る','開始','スコア','画面をタップするかスペースキーを押します。二段ジャンプができます。','プロフィールに戻る','ゲーム終了']
};

export const legacyGameTitles=locale=>copy[locale].slice(5,7);

const statusCopy={
 zh:{video:'哔哩哔哩未找到原视频',summary:'{count} 条视频流可读取 · 核验于 {date}'},
 en:{video:'Original video unavailable on Bilibili',summary:'{count} video streams reachable · Checked {date}'},
 ru:{video:'Исходное видео недоступно на Bilibili',summary:'Доступно видеопотоков: {count} · Проверено {date}'},
 ja:{video:'Bilibili で元の動画を確認できません',summary:'確認できた動画ストリーム {count} 本 · 確認日 {date}'}
};

const platformCopy={
 zh:{help:'共有八关。向右抵达旗帜，踩上短旗平台会保存。方向键或屏幕按钮移动，空格或 ↑ 跳跃。',left:'向左',right:'向右',jump:'跳跃',shards:'星屑',level:'关卡',cleared:'本关通过！',completed:'八关全部通关！',fell:'掉下去了',retry:'重试本关',resume:'从存档点继续',saved:'已保存进度',next:'下一关',replay:'从第一关重玩',switches:'开关',hit:'踩到尖刺了',move:'先观察平台的移动方向，再跳上去。',spikes:'用跳跃越过尖刺，落地前看清位置。',switch:'踩发光的压力板，打开前面的门。',sequence:'按 1 → 2 的顺序踩压力板，有第三块时接着踩 3。',wrong:'顺序不对，重新从 1 开始。',activated:'开关已点亮',opened:'门打开了',fullscreen:'横屏全屏',exitFullscreen:'退出全屏',rotate:'请把手机横过来玩。'},
 en:{help:'Reach the flag in each of eight courses. Land on a short-flag ledge to save. Move with the arrow keys or on-screen buttons, and jump with Space or ↑.',left:'Move left',right:'Move right',jump:'Jump',shards:'Stardust',level:'Level',cleared:'Level cleared!',completed:'All eight levels cleared!',fell:'You fell',retry:'Retry level',resume:'Resume from checkpoint',saved:'Checkpoint saved',next:'Next level',replay:'Replay from level one',switches:'Switches',hit:'You hit the spikes',move:'Watch the platform move, then jump onto it.',spikes:'Jump over the spikes and watch your landing.',switch:'Step on the glowing plate to open the gate.',sequence:'Step on the plates in order: 1, then 2, then 3 if present.',wrong:'Wrong order. Start again at 1.',activated:'Switch activated',opened:'Gate open',fullscreen:'Fullscreen',exitFullscreen:'Exit fullscreen',rotate:'Turn your phone sideways to play.'},
 ru:{help:'Доберитесь до флага на каждом из восьми уровней. Малый флаг отмечает точку сохранения. Управляйте стрелками или кнопками, прыгайте пробелом или ↑.',left:'Влево',right:'Вправо',jump:'Прыжок',shards:'Звёздная пыль',level:'Уровень',cleared:'Уровень пройден!',completed:'Все восемь уровней пройдены!',fell:'Вы упали',retry:'Повторить уровень',resume:'Продолжить с сохранения',saved:'Игра сохранена',next:'Следующий уровень',replay:'Сыграть с первого уровня',switches:'Кнопки',hit:'Вы попали на шипы',move:'Понаблюдайте за платформой, затем запрыгните на неё.',spikes:'Перепрыгните шипы и следите за местом приземления.',switch:'Наступите на светящуюся плиту, чтобы открыть ворота.',sequence:'Наступайте на плиты по порядку: 1, затем 2 и, если есть, 3.',wrong:'Неверный порядок. Начните снова с 1.',activated:'Кнопка включена',opened:'Ворота открыты',fullscreen:'Во весь экран',exitFullscreen:'Выйти из полноэкранного режима',rotate:'Поверните телефон горизонтально.'},
 ja:{help:'全8ステージで旗を目指します。小さな旗のある足場に着地すると保存できます。矢印キーか画面のボタンで移動し、スペースキーか ↑ でジャンプします。',left:'左へ移動',right:'右へ移動',jump:'ジャンプ',shards:'星のかけら',level:'ステージ',cleared:'ステージクリア！',completed:'全8ステージクリア！',fell:'落ちてしまいました',retry:'ステージをやり直す',resume:'チェックポイントから再開',saved:'進行状況を保存しました',next:'次のステージ',replay:'第1ステージから遊ぶ',switches:'スイッチ',hit:'トゲに当たりました',move:'足場の動きを見てから飛び乗りましょう。',spikes:'トゲを跳び越え、着地する場所を確認しましょう。',switch:'光っている床スイッチを踏むと門が開きます。',sequence:'1、2 の順に踏み、3 があれば最後に踏みます。',wrong:'順番が違います。1 からやり直してください。',activated:'スイッチを入れました',opened:'門が開きました',fullscreen:'全画面',exitFullscreen:'全画面を終了',rotate:'端末を横向きにしてください。'}
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
  const fullscreen=mode==='platform'?`<button type="button" data-fullscreen aria-pressed="false">${escape(labels.fullscreen)}</button>`:'';
  const rotate=mode==='platform'?`<p class="legacy-rotate-hint" data-rotate-hint hidden>${escape(labels.rotate)}</p>`:'';
  const messages=mode==='platform'?` data-shard-label="${escape(labels.shards)}" data-cleared="${escape(labels.cleared)}" data-fell="${escape(labels.fell)}" data-retry="${escape(labels.retry)}" data-level-label="${escape(labels.level)}" data-completed="${escape(labels.completed)}" data-resume="${escape(labels.resume)}" data-saved="${escape(labels.saved)}" data-next="${escape(labels.next)}" data-replay="${escape(labels.replay)}"${['switches','hit','move','spikes','switch','sequence','wrong','activated','opened','fullscreen','exitFullscreen'].map(key=>` data-${key.replace(/[A-Z]/g,letter=>'-'+letter.toLowerCase())}="${escape(labels[key])}"`).join('')}`:'';
  return `<p id="legacy-game-help">${escape(help)}</p><div class="legacy-game" data-legacy-game="${mode}" data-score="${escape(score)}" data-game-over="${escape(gameOver)}"${messages}><canvas width="720" height="360" tabindex="0" aria-label="${escape(label)}" aria-describedby="legacy-game-help"></canvas><div class="legacy-controls"><button type="button" data-start>${escape(start)}</button>${controls}<output aria-live="polite"></output>${fullscreen}</div>${rotate}</div><script type="module" src="/assets/legacy-game.js"></script>`;
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
