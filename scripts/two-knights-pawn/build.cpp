#include "promotion.hpp"
#include <fstream>
#include <iostream>
#include <string>
#include <chrono>
using namespace knnp;
vector<uint16_t> dw,db;
vector<uint8_t> pending,r1w,r1b;
vector<uint16_t> policy;
vector<vector<uint32_t>> buckets;
void put(uint32_t id,bool blackTurn,uint16_t d){auto &v=blackTurn?db:dw;if(v[id]!=INF)return;v[id]=d;if(buckets.size()<=d)buckets.resize(d+1);buckets[d].push_back(id+(blackTurn?SIZE:0));}
bool allowed(uint32_t id,Position s,int stage,bool blackTurn){
 if(stage==1)return corner(s.k)>=0;
 if(stage==2)return blockaded(s)||(blackTurn?r1b[id]:r1w[id]);
 return true;
}
void solve(int stage){
 cerr<<"Initialize stage "<<stage<<"\n";
 vector<uint16_t> previousW,previousB;
 if(stage==3){previousW=std::move(dw);previousB=std::move(db);}
 dw.assign(SIZE,INF);db.assign(SIZE,INF);pending.assign(SIZE,0);buckets.clear();
 uint64_t seeds=0;
 for(uint32_t id=0;id<SIZE;id++){
  Position s=decode(id);if(!base(s))continue;
  if(validWhite(s)&&allowed(id,s,stage,false)){
   if((stage==2&&r1w[id])||(stage==3&&previousW[id]!=INF)){put(id,false,0);seeds++;}
  }
  if(!validBlack(s)||!allowed(id,s,stage,true))continue;
  unsigned degree=0;bool promotion=false;blackAll(s,[&](uint32_t to){degree++;promotion|=to==PROMOTION;});assert(degree<=12);pending[id]=degree;
  if((stage==1||stage==4)&&promotion&&safePromotion(id)){--pending[id];if(!pending[id])put(id,true,1);}
  if(((stage==1||stage==4)&&!degree&&attacked(s,s.k))||(stage==2&&r1b[id])||(stage==3&&previousB[id]!=INF)){put(id,true,0);seeds++;}
 }
 previousW.clear();previousB.clear();previousW.shrink_to_fit();previousB.shrink_to_fit();
 cerr<<"Seeds "<<seeds<<"\n";
 uint64_t count=0;
 for(size_t d=0;d<buckets.size();d++){
  for(size_t i=0;i<buckets[d].size();i++){
   uint32_t node=buckets[d][i],id=node%SIZE;Position s=decode(id);bool bt=node>=SIZE;count++;
   if(bt){beforeWhite(s,[&](uint32_t prev){Position p=decode(prev);if(allowed(prev,p,stage,false))put(prev,false,d+1);});}
   else{beforeBlack(s,[&](uint32_t prev){Position p=decode(prev);if(!allowed(prev,p,stage,true)||db[prev]!=INF)return;
     if(stage==1&&corner(p.k)!=corner(s.k))return;
     assert(pending[prev]>0);if(--pending[prev]==0)put(prev,true,(stage==1||stage==4)&&promotionCache.size()>prev&&promotionCache[prev]==2?max(size_t(1),d):d);
   });}
  }
  if(d%10==0)cerr<<"Stage "<<stage<<" distance "<<d<<" reached "<<count<<"\n";
  vector<uint32_t>().swap(buckets[d]);
 }
 cerr<<"Stage "<<stage<<" certified "<<count<<" nodes, maximum distance "<<buckets.size()-1<<"\n";
}
uint16_t best(uint32_t id){Position s=decode(id);int mv=4096;white(s,[&](uint32_t to){if(db[to]!=INF&&db[to]+1==dw[id])mv=min(mv,code(s,decode(to)));});assert(mv<4096);return mv;}
uint32_t chosen(uint32_t id,int mv){uint32_t to=BAD;Position s=decode(id);white(s,[&](uint32_t t){if(code(s,decode(t))==mv)to=t;});assert(to!=BAD);return to;}
void collectR1(){
 r1w.assign(SIZE,0);r1b.assign(SIZE,0);vector<uint32_t> q;uint64_t seeds=0;
 auto add=[&](uint32_t id,bool bt){auto &v=bt?r1b:r1w;if(!v[id]){v[id]=1;q.push_back(id+(bt?SIZE:0));}};
 for(uint32_t id=0;id<SIZE;id++)if((dw[id]!=INF||db[id]!=INF)&&lockedSeed(decode(id))){
  if(dw[id]!=INF){add(id,false);seeds++;}if(db[id]!=INF){add(id,true);seeds++;}
 }
 cerr<<"Locked seeds "<<seeds<<"\n";
 for(size_t i=0;i<q.size();i++){uint32_t id=q[i]%SIZE;if(q[i]>=SIZE){blackAll(decode(id),[&](uint32_t to){if(to==PROMOTION){assert(safePromotion(id));return;}assert(to!=BAD&&dw[to]!=INF);add(to,false);});}
 else{int mv=best(id);policy[id]=(1<<12)|mv;add(chosen(id,mv),true);}}
 cerr<<"Reachable r1 nodes "<<q.size()<<"\n";
}
void save(const string &path,const void *data,size_t size){ofstream f(path,ios::binary);f.write((const char*)data,size);assert(f.good());}
int main(int argc,char**argv){assert(argc==2);string dir=argv[1];initialize();policy.assign(SIZE,INF);
 solve(1);collectR1();save(dir+"/r1-white.bin",r1w.data(),SIZE);save(dir+"/r1-black.bin",r1b.data(),SIZE);
 // Save the actual reachable r1 distance, not the larger candidate finishing domain.
 for(uint32_t i=0;i<SIZE;i++){if(!r1w[i])dw[i]=INF;if(!r1b[i])db[i]=INF;}
 save(dir+"/r1-dw.bin",dw.data(),SIZE*2);save(dir+"/r1-db.bin",db.data(),SIZE*2);
 ofstream promotions(dir+"/promotions.json");promotions<<"[";bool first=true;for(uint32_t id=0;id<SLICE;id++)if(r1b[id]){bool has=false;blackAll(decode(id),[&](uint32_t to){has|=to==PROMOTION;});if(has){assert(safePromotion(id));if(!first)promotions<<",";first=false;promotions<<"["<<id;for(int kind=0;kind<4;kind++)promotions<<","<<promotionMate(decode(id),kind);promotions<<"]";}}promotions<<"]";
 solve(2);
 for(uint32_t i=0;i<SIZE;i++)if(dw[i]!=INF&&dw[i]>0)policy[i]=(2<<12)|best(i);
 save(dir+"/r2-dw.bin",dw.data(),SIZE*2);save(dir+"/r2-db.bin",db.data(),SIZE*2);
 solve(3);
 for(uint32_t i=0;i<SIZE;i++)if(dw[i]!=INF&&dw[i]>0)policy[i]=(3<<12)|best(i);
 save(dir+"/r3-dw.bin",dw.data(),SIZE*2);save(dir+"/r3-db.bin",db.data(),SIZE*2);
 save(dir+"/policy.bin",policy.data(),SIZE*2);
 for(Position s: {Position{55,3,1,6,59},Position{55,4,1,6,60}}){auto id=key(s);cerr<<"Standard "<<id<<" word "<<policy[id]<<" setup distance "<<dw[id]<<"\n";}
}
