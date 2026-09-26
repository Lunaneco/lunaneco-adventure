// Keep self-contained: the build embeds this function in the service worker.
export async function cachedMediaResponse(request,response){
  const range=request.headers?.get('range');
  if(!range||response.status!==200)return response;
  const match=/^bytes=(\d*)-(\d*)$/.exec(range.trim());
  if(!match||(!match[1]&&!match[2]))return response;
  const blob=await response.blob(),size=blob.size;
  const start=match[1]?Number(match[1]):Math.max(0,size-Number(match[2]));
  const end=match[1]?(match[2]?Math.min(Number(match[2]),size-1):size-1):size-1;
  if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>=size||start>end)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${size}`,'Accept-Ranges':'bytes'}});
  const headers=new Headers(response.headers);headers.set('Content-Range',`bytes ${start}-${end}/${size}`);headers.set('Content-Length',String(end-start+1));headers.set('Accept-Ranges','bytes');headers.delete('Content-Encoding');
  return new Response(blob.slice(start,end+1),{status:206,headers});
}
