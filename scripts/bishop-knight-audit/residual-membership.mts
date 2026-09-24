export type MembershipBranch = {post:number;children:readonly number[]};
export type MembershipSearch = {root:number;queue:number[];visited:Set<number>;cursor:number;status:'pending'|'loop'|'nonloop'};

/** Closed nodes have been exhaustively expanded. The root must not be among
 * their cyclic labels: then no path entering that closed graph can return it. */
export function startMembershipSearch(root:number,children:readonly number[],closed:ReadonlySet<number>):MembershipSearch {
 const queue=[...new Set(children)].filter(k=>!closed.has(k));
 return {root,queue,visited:new Set(queue),cursor:0,status:queue.length?'pending':'nonloop'};
}
export function advanceMembershipSearch(search:MembershipSearch,closed:ReadonlySet<number>,expand:(node:number)=>readonly MembershipBranch[]) {
 if(search.status!=='pending')return search.status;
 const node=search.queue[search.cursor++]!;
 for(const b of expand(node)){
  if(b.post===search.root){search.status='loop';return search.status;}
  for(const child of b.children)if(!closed.has(child)&&!search.visited.has(child)){search.visited.add(child);search.queue.push(child);}
 }
 if(search.cursor===search.queue.length)search.status='nonloop';
 return search.status;
}
