// Exhaustive composed-policy distances. Fixed stages are certified separately by the app.
// Unknowns are memoized; any recursion cycle fails. Distances count individual plies.
#include "kbn-symmetry.hpp"
constexpr int UNKNOWN=-1,ACTIVE=-2,DRAW=10000;
vector<int16_t> white(SIZE,UNKNOWN),black(SIZE,UNKNOWN);
vector<uint8_t> ranks(SIZE);
vector<uint16_t> words(10*(1<<18));
uint64_t setupSources=0;
int whiteDistance(uint32_t p);
int blackDistance(uint32_t p){
 if(p==SIZE)return DRAW;
 int old=black[p];if(old>=0)return old;assert(old!=ACTIVE);black[p]=ACTIVE;
 auto [w,b,n,k]=pieces(p);int worst=-1;
 blackMoves(w,b,n,k,[&](uint32_t next){worst=max(worst,whiteDistance(next));});
 return black[p]=worst<0 ? (check(w,b,n,k)?0:DRAW) : min(DRAW,worst+1);
}
int whiteDistance(uint32_t p){
 if(p==SIZE)return DRAW;
 int old=white[p];if(old>=0)return old;assert(old!=ACTIVE);white[p]=ACTIVE;
 auto [w,b,n,k]=pieces(p);bool mate=false;
 // Preserve the framework's first priority, including wins outside the setup attractor.
 whiteMoves(w,b,n,k,[&](uint32_t next){auto [nw,nb,nn,nk]=pieces(next);if(!check(nw,nb,nn,nk))return;int replies=0;blackMoves(nw,nb,nn,nk,[&](uint32_t){replies++;});if(!replies)mate=true;});
 if(mate)return white[p]=1;
 if(ranks[p]==INF)return white[p]=DRAW;
 auto c=canon(p);auto word=words[offset(c)];assert(word!=0&&word!=65535);assert((word>>12)==ranks[p]);
 int chosen=word&4095,worst=0,first=-1;
 for(int t=0;t<8;t++)if(transformed(p,t)==c){
  int from=inverseT[t][chosen>>6],to=inverseT[t][chosen&63];bool found=false;
  whiteMoves(w,b,n,k,[&](uint32_t next){if(moveCode(p,next)!=from*64+to)return;found=true;
   // All replies reduce setup rank unless a higher stage has already taken over.
   auto [nw,nb,nn,nk]=pieces(next);int replies=0;
   blackMoves(nw,nb,nn,nk,[&](uint32_t child){assert(child!=SIZE);assert(ranks[child]<ranks[p]);replies++;});assert(replies);
   int cost=blackDistance(next)+1;assert(cost<DRAW);
   // Stabilizer-equivalent choices have equal costs, so later tie breaks cannot alter them.
   if(first<0)first=cost;else assert(first==cost);worst=max(worst,cost);
  });assert(found);
 }
 setupSources++;return white[p]=worst;
}
int main(int argc,char**argv){assert(argc==5);initializeGeometry();
 ifstream r(argv[1],ios::binary);r.read((char*)ranks.data(),SIZE);assert(r.gcount()==SIZE);
 ifstream binary(argv[2],ios::binary);for(auto &v:words){int lo=binary.get(),hi=binary.get();assert(lo>=0&&hi>=0);v=lo|(hi<<8);}assert(binary.get()==EOF);
 ifstream stages(argv[3]);uint32_t p;int plies;int seeds=0;while(stages>>p>>plies){assert(plies>0&&plies<100);for(int t=0;t<8;t++){auto q=transformed(p,t);assert(white[q]==UNKNOWN||white[q]==plies);white[q]=plies;}seeds++;}
 uint64_t wh[101]={},bh[101]={},wd=0,bd=0,wl=0,bl=0;uint32_t worstW=0,worstB=0;int maxW=0,maxB=0;
 for(p=0;p<SIZE;p++){
  auto [w,b,n,k]=pieces(p);if(!valid(w,b,n,k))continue;
  bl++;int db=blackDistance(p);if(db>=DRAW)bd++;else{int moves=(db+1)/2;assert(moves<=100);bh[moves]++;if(db>maxB){maxB=db;worstB=p;}}
  if(check(w,b,n,k))continue;
  wl++;int dw=whiteDistance(p);if(dw>=DRAW)wd++;else{int moves=(dw+1)/2;assert(moves<=100);wh[moves]++;if(dw>maxW){maxW=dw;worstW=p;}}
 }
 assert(wl==10875504&&bl==13660584);assert(wd==53320&&bd==2472416);assert(max(maxW,maxB)<=90);
 ofstream out(argv[4]);out<<"{\"stageSeeds\":"<<seeds<<",\"setupSources\":"<<setupSources<<",\"whiteLegal\":"<<wl<<",\"blackLegal\":"<<bl<<",\"whiteDrawn\":"<<wd<<",\"blackDrawn\":"<<bd<<",\"maxWhitePlies\":"<<maxW<<",\"maxBlackPlies\":"<<maxB<<",\"worstWhiteKey\":"<<worstW<<",\"worstBlackKey\":"<<worstB<<",\"whiteHistogram\":[";
 for(int i=0;i<=100;i++){if(i)out<<',';out<<wh[i];}out<<"],\"blackHistogram\":[";for(int i=0;i<=100;i++){if(i)out<<',';out<<bh[i];}out<<"]}\n";
 ofstream a(string(argv[4])+".white.i16",ios::binary),b(string(argv[4])+".black.i16",ios::binary);a.write((char*)white.data(),SIZE*2);b.write((char*)black.data(),SIZE*2);
 cout<<"Audited "<<wl+bl<<" legal starts; maximum "<<(max(maxW,maxB)+1)/2<<" White moves.\n";
}
