// Opt existing two-hero regression scenarios into a legitimately cleared save.
// Recruitment-specific audits intentionally do not use this fixture.
export async function seedRecruitedRoster(context){
  await context.addInitScript(()=>{
    const record=JSON.parse(localStorage.getItem('lunaria-record-v1')||'{}');
    localStorage.setItem('lunaria-record-v1',JSON.stringify({...record,chapterOneCleared:true}));
  });
}
