import {escape,languagePath} from './i18n.mjs';

export const archiveTitle={zh:'旧站归档',en:'Old site archive',ru:'Архив старого сайта',ja:'旧サイトのアーカイブ'};
const copy={
 zh:['返回归档','旧站的工具、课前演讲、项目记录和小游戏。','课前演讲','旧站工具箱','项目文件','消防车控制器','FG2002 录像','2024 年 3 月 17 日录像','跳跃游戏','平台游戏','旧站公告','在哔哩哔哩观看','打开原视频','项目已结束。原记录最后更新于 2022 年 1 月 2 日，新增一段视频。','旧站的两个 APK 未包含在导出包中。','开始','得分','点击画布或按空格跳跃，可二段跳。','使用方向键或屏幕按钮移动和跳跃。','返回关于页','完整演讲合集','游戏结束'],
 en:['Back to archive','Tools, classroom talks, project records and small games from the old site.','Classroom talks','Old toolbox','Project files','Fire car controller','FG2002 recording','March 17, 2024 recording','Jump game','Platform game','Original notice','Watch on Bilibili','Open original video','The project ended. The last recorded update added a video on January 2, 2022.','The two APKs from the old site were absent from the export.','Start','Score','Tap the board or press Space. Double jumps are allowed.','Use the arrow keys or on-screen controls to move and jump.','Back to About','Full talk collection','Game over'],
 ru:['Назад в архив','Инструменты, школьные выступления, проекты и игры со старого сайта.','Школьные выступления','Старые инструменты','Файлы проекта','Управление пожарной машиной','Запись FG2002','Запись от 17 марта 2024','Игра с прыжками','Платформер','Исходное объявление','Смотреть на Bilibili','Открыть оригинальное видео','Проект завершён. Последнее обновление от 2 января 2022 года добавило видео.','Два APK старого сайта отсутствуют в выгрузке.','Начать','Счёт','Коснитесь поля или нажмите пробел. Двойной прыжок доступен.','Используйте стрелки или экранные кнопки для движения и прыжка.','На страницу «Обо мне»','Все выступления','Игра окончена'],
 ja:['アーカイブに戻る','旧サイトのツール、授業前の発表、プロジェクト記録、ミニゲーム。','授業前の発表','旧ツール集','プロジェクト資料','消防車コントローラー','FG2002 の録画','2024年3月17日の録画','ジャンプゲーム','アクションゲーム','旧サイトからのお知らせ','Bilibili で見る','元の動画を開く','プロジェクトは終了しました。最後の更新は2022年1月2日で、動画が追加されました。','旧サイトの APK 2 本はエクスポートに含まれていませんでした。','開始','スコア','画面をタップするかスペースキーを押します。二段ジャンプができます。','矢印キーまたは画面上のボタンで移動とジャンプができます。','プロフィールに戻る','発表の全シリーズ','ゲーム終了']
};

export function archivePages(data,locale){
 const [back,intro,talks,tools,project,controller,recording,recording2024,jump,platform,notice,bilibili,original,projectNote,missing,start,score,jumpHelp,platformHelp,about,series,gameOver]=copy[locale];
 const route=path=>'/legacy/'+path;
 const link=(url,label,lang='')=>{
  const external=/^https?:\/\//.test(url);
  return `<a class="text-link" href="${escape(url)}"${external?' target="_blank" rel="noopener noreferrer"':''}${lang?' lang="'+lang+'"':''}>${escape(label)}<span aria-hidden="true">${external?'↗':'›'}</span></a>`;
 };
 const video=(id,title,lang='')=>{
  if(!/^BV[A-Za-z0-9]{10}$/.test(id))throw new Error('Invalid archived video ID');
  return `<iframe class="legacy-video" src="https://player.bilibili.com/player.html?bvid=${id}&amp;autoplay=0" title="${escape(title)}"${lang?' lang="'+lang+'"':''} loading="lazy" allowfullscreen referrerpolicy="no-referrer"></iframe><p>${link('https://www.bilibili.com/video/'+id+'/',bilibili)}</p>`;
 };
 const card=(path,title,meta='')=>`<li><a class="text-link" href="${route(path)}"><strong>${escape(title)}</strong>${meta}<span aria-hidden="true">›</span></a></li>`;
 const game=(mode,label,help)=>{
  const controls=mode==='platform'?`<button type="button" data-control="left" aria-label="←">←</button><button type="button" data-control="right" aria-label="→">→</button><button type="button" data-control="jump" aria-label="↑">↑</button>`:'';
  return `<p id="legacy-game-help">${escape(help)}</p><div class="legacy-game" data-legacy-game="${mode}" data-score="${escape(score)}" data-game-over="${escape(gameOver)}"><canvas width="720" height="360" tabindex="0" aria-label="${escape(label)}" aria-describedby="legacy-game-help"></canvas><div class="legacy-controls"><button type="button" data-start>${escape(start)}</button>${controls}<output aria-live="polite"></output></div></div><script type="module" src="/assets/legacy-game.js"></script>`;
 };
 const home=`<p class="lead">${escape(intro)}</p><ul class="legacy-grid">${[
  ['talks/',talks,`<small>${data.talks.length}</small>`],['project/',project],['controller/',controller],['recording/',recording],['recording-2024/',recording2024],['jump/',jump],['platform/',platform]
 ].map(args=>card(...args)).join('')}</ul><section class="legacy-shelf"><h2>${escape(tools)}</h2><ul class="legacy-tools">${data.tools.map(item=>`<li>${link(item.url,item.label,'zh-CN')}</li>`).join('')}</ul></section><details class="legacy-shelf"><summary>${escape(notice)}</summary><div lang="zh-CN">${data.notice.map(line=>`<p>${escape(line)}</p>`).join('')}<p>感谢热铁盒提供数据技术支持。</p></div></details>`;
 const dates=new Intl.DateTimeFormat(locale,{dateStyle:'medium',timeZone:'UTC'});
 const dateMarkup=date=>`<time datetime="${date}">${dates.format(new Date(date))}</time>`;
 const talkList=`<ul class="legacy-grid">${data.talks.map(entry=>`<li><a class="text-link" href="${route('talks/'+entry.date+'/')}" ><strong lang="zh-CN">${escape(entry.topic)}</strong>${dateMarkup(entry.date)}<span aria-hidden="true">›</span></a></li>`).join('')}</ul><p>${link('https://space.bilibili.com/551858934/channel/seriesdetail?sid=2290897&ctype=0',series)}</p>`;
 const pages=[
  ['',archiveTitle[locale],home],
  ['talks/',talks,talkList],
  ['project/',project,`<p>${escape(projectNote)}</p><p>${link(data.projectVideo,original)}</p>`],
  ['controller/',controller,`<p>${escape(missing)}</p><ul><li>Fire Car Controller</li><li>btcontroller</li></ul>`],
  ['recording/',recording,video(data.recording,recording)],
  ['recording-2024/',recording2024,`<p>${link(data.recording2024,original)}</p>`],
  ['jump/',jump,game('jump',jump,jumpHelp)],
  ['platform/',platform,game('platform',platform,platformHelp)],
  ...data.talks.map(entry=>['talks/'+entry.date+'/',entry.topic,dateMarkup(entry.date)+video(entry.bvid,entry.topic,'zh-CN'),'zh-CN'])
 ];
 return pages.map(([path,title,body,lang])=>({
  route:'legacy/'+path,title,label:archiveTitle[locale],description:intro,lang,
  body:`<nav class="legacy-back">${path?link(route(path.startsWith('talks/')&&path!=='talks/'?'talks/':''),back):link(languagePath(locale,'about/'),about)}</nav>${body}`
 }));
}
