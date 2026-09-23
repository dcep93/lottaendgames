/** Labels on edges inside cycles; paths merely leading to a cycle do not count. */
export function cyclicEdgeLabels(edges: readonly (readonly (readonly [number,number])[])[]): Set<number> {
 const n=edges.length, reverse:number[][]=Array.from({length:n},()=>[]);
 for(let i=0;i<n;i++)for(const [to] of edges[i]!)reverse[to]!.push(i);
 const seen=new Uint8Array(n),order:number[]=[];
 for(let s=0;s<n;s++){
  if(seen[s])continue;
  const stack:[number,number][]=[[s,0]];seen[s]=1;
  while(stack.length){const top=stack.at(-1)!,v=top[0];
   if(top[1]<edges[v]!.length){const to=edges[v]![top[1]++]![0];if(!seen[to]){seen[to]=1;stack.push([to,0]);}}
   else{order.push(v);stack.pop();}
  }
 }
 const component=new Int32Array(n).fill(-1),size:number[]=[];
 for(const start of order.reverse()){
  if(component[start]!==-1)continue;
  const id=size.length,stack=[start];component[start]=id;let count=0;
  while(stack.length){const v=stack.pop()!;count++;for(const from of reverse[v]!)if(component[from]===-1){component[from]=id;stack.push(from);}}
  size.push(count);
 }
 const labels=new Set<number>();
 for(let from=0;from<n;from++)for(const [to,label] of edges[from]!)
  if(component[from]===component[to]&&(size[component[from]!]!>1||from===to))labels.add(label);
 return labels;
}
