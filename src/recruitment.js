export const RECRUITMENT_NOTE='第1章・第4幕クリアで合流します';
export const recruitmentNote=id=>id==='hehereal'?'第6章・第4幕クリア後に加入します':id==='prim'?'第5章・第4幕クリア後に加入します':id==='shizuku'?'第4章・第4幕クリア後に加入します':id==='mochinyafe'?'第3章・第4幕で救出後に加入します':id==='omsolo'?'第2章・第4幕で救出後に加入します':RECRUITMENT_NOTE;
export function isHeroUnlocked(profile,id){
 return id==='hehereal'&&profile?.story?.chapterSixCleared===true||id==='prim'&&profile?.story?.chapterFiveCleared===true||id==='shizuku'&&profile?.story?.chapterFourCleared===true||id==='nyanluna'||id==='tsukineko'&&(profile?.story?.tsukinekoUnlocked===true||profile?.story?.chapterOneCleared===true)||id==='omsolo'&&profile?.story?.chapterTwoCleared===true||id==='mochinyafe'&&profile?.story?.chapterThreeCleared===true;
}
export function availableHeroes(profile,roster){return roster.filter(hero=>isHeroUnlocked(profile,hero.id));}
