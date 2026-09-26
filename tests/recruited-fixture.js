import {Adventure} from '../src/model.js';

// Combat/party regressions exercise the roster after chapter one's recruitment.
// Fresh-save and guest behavior are tested separately in recruitment.test.js.
export class RecruitedAdventure extends Adventure{
  constructor(options={}){super({...options,progression:{...options.progression,story:{version:2,actClears:[true,true,true,true],chapterOneCleared:true,tsukinekoUnlocked:true}}});}
}
