#pragma once
#include "geometry.hpp"
namespace knnp {
// Piece kind: queen, rook, bishop, knight. Promotion square is h1.
bool promotedAttack(Position s,int kind,int to){
 int from=7;if(kind==3)return (na[from]>>to)&1;
 int dx=to%8-7,dy=to/8;
 bool diagonal=abs(dx)==abs(dy)&&dx!=0,straight=(dx==0)!=(dy==0);
 if(!((kind!=1&&diagonal)||(kind!=2&&straight)))return false;
 int step=(dx==0?0:dx>0?1:-1)+(dy==0?0:8);
 for(int sq=from+step;sq!=to;sq+=step)if(sq==s.w||sq==s.a||sq==s.b||sq==s.k)return false;
 return true;
}
uint16_t promotionMate(Position s,int kind){
 int best=INF;
 for(int which=0;which<2;which++){
  int from=which?s.b:s.a,other=which?s.a:s.b;
  for(int to:nm[from]){
   if(to==s.w||to==other||to==s.k)continue;
   Position t=s;if(which)t.b=to;else t.a=to;
   if(!attacked(t,t.k))continue;
   bool captured=to==7;
   if(!captured&&promotedAttack(t,kind,t.w))continue;
   bool escape=false;
   for(int dest:km[t.k]){if((!captured&&dest==7)||distance(dest,t.w)<=1)continue;if(!attacked(t,dest))escape=true;}
   if(escape)continue;
   // A knight check cannot be blocked. The promoted piece's only other escape is capturing a checker.
   if(!captured){
    if(((na[t.a]>>t.k)&1)&&!((na[t.b]>>t.k)&1)&&promotedAttack(t,kind,t.a))continue;
    if(((na[t.b]>>t.k)&1)&&!((na[t.a]>>t.k)&1)&&promotedAttack(t,kind,t.b))continue;
   }
   best=min(best,from*64+to);
  }
 }
 return best;
}
vector<uint8_t> promotionCache;
bool safePromotion(uint32_t id){
 if(id>=SLICE)return false;
 if(promotionCache.empty())promotionCache.resize(SLICE);
 if(promotionCache[id])return promotionCache[id]==2;
 auto s=decode(id);bool good=true;
 for(int kind=0;kind<4;kind++)if(promotionMate(s,kind)==INF){good=false;break;}
 promotionCache[id]=good?2:1;return good;
}
}
