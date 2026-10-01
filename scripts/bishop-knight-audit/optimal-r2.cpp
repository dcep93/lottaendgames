// Full-board retrograde reachability to frozen r1 sources. No chess tablebase dependency.
// Usage: optimal-r2 targets.txt output-prefix
#include "kbn-geometry.hpp"
int main(int argc,char**argv){assert(argc==3);for(int a=0;a<64;a++)for(int b=0;b<64;b++){if(dist(a,b)==1)kings[a].push_back(b);if(knight(a,b))knights[a].push_back(b);}
 vector<uint8_t> dw(SIZE,INF),db(SIZE,INF),left(SIZE,0),goal(SIZE,0);vector<uint32_t> queue;queue.reserve(25000000);
 uint64_t legalW=0,legalB=0;
 for(uint32_t p=0;p<SIZE;p++){auto [w,b,n,k]=pieces(p);if(!valid(w,b,n,k))continue;legalB++;if(!check(w,b,n,k))legalW++;blackMoves(w,b,n,k,[&](uint32_t){left[p]++;});}
 ifstream in(argv[1]);uint32_t p;while(in>>p){auto [w,b,n,k]=pieces(p);assert(valid(w,b,n,k)&&!check(w,b,n,k));if(!goal[p]){goal[p]=1;dw[p]=0;queue.push_back(p);}}
 cerr<<"Domain W="<<legalW<<" B="<<legalB<<" targets="<<queue.size()<<endl;
 for(size_t i=0;i<queue.size();i++){uint32_t node=queue[i],p=node&(SIZE-1);auto [w,b,n,k]=pieces(p);
 if(node&BLACK){ // White predecessors of this Black-to-move board.
  whiteMoves(w,b,n,k,[&](uint32_t prev){auto [pw,pb,pn,pk]=pieces(prev);if(dw[prev]!=INF||check(pw,pb,pn,pk))return;assert(db[p]<253);dw[prev]=db[p]+1;queue.push_back(prev);});
 }else{ // Black predecessors: the current White board is already out of check.
  for(int prev:kings[k]){if(!valid(w,b,n,prev))continue;uint32_t q=key(w,b,n,prev);assert(left[q]>0);if(--left[q]==0){db[q]=dw[p];queue.push_back(q|BLACK);}}
 }
 if(i&&i%5000000==0)cerr<<"Processed "<<i<<" discovered "<<queue.size()<<endl;
 }
 // Exhaustive Bellman certificate, including unreachable states (not just the exported policy).
 uint64_t solvedW=0,solvedB=0;int maxW=0,maxB=0;
 for(uint32_t p=0;p<SIZE;p++){auto [w,b,n,k]=pieces(p);if(!valid(w,b,n,k))continue;
 int worst=0,count=0;blackMoves(w,b,n,k,[&](uint32_t ch){count++;worst=max(worst,ch==SIZE?255:int(dw[ch]));});if(!count)worst=255;assert(db[p]==worst);
 if(db[p]!=INF){solvedB++;maxB=max(maxB,int(db[p]));}
 if(check(w,b,n,k))continue;
 int best=255;whiteMoves(w,b,n,k,[&](uint32_t ch){best=min(best,db[ch]==INF?255:int(db[ch])+1);});if(goal[p])best=0;assert(dw[p]==best);
 if(dw[p]!=INF){solvedW++;maxW=max(maxW,int(dw[p]));}
 }
 string out=argv[2];ofstream(out+".white.bin",ios::binary).write((char*)dw.data(),dw.size());ofstream(out+".black.bin",ios::binary).write((char*)db.data(),db.size());
 ofstream meta(out+".json");meta<<"{\"legalWhite\":"<<legalW<<",\"legalBlack\":"<<legalB<<",\"solvedWhite\":"<<solvedW<<",\"solvedBlack\":"<<solvedB<<",\"maxWhite\":"<<maxW<<",\"maxBlack\":"<<maxB<<",\"bellmanVerified\":true}\n";
 cerr<<"Solved W="<<solvedW<<" B="<<solvedB<<" max="<<maxW<<","<<maxB<<"; all Bellman equations verified"<<endl;
}
