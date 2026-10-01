#pragma once
#include "kbn-geometry.hpp"
int trans[8][64],inverseT[8][64],kingSlot[64];
uint32_t transformed(uint32_t p,int t){auto [w,b,n,k]=pieces(p);return key(trans[t][w],trans[t][b],trans[t][n],trans[t][k]);}
uint32_t canon(uint32_t p){uint32_t c=p;for(int t=1;t<8;t++)c=min(c,transformed(p,t));return c;}
uint32_t offset(uint32_t p){assert(kingSlot[p>>18]>=0);return (kingSlot[p>>18]<<18)|(p&((1<<18)-1));}
int moveCode(uint32_t from,uint32_t to){auto a=pieces(from),b=pieces(to);for(int i=0;i<3;i++)if(a[i]!=b[i])return a[i]*64+b[i];assert(false);return 0;}
void initializeGeometry(){for(int a=0;a<64;a++)for(int b=0;b<64;b++){if(dist(a,b)==1)kings[a].push_back(b);if(knight(a,b))knights[a].push_back(b);}
 for(int s=0;s<64;s++){int x=s%8,y=s/8;int xy[8][2]={{x,y},{7-y,x},{7-x,7-y},{y,7-x},{7-x,y},{x,7-y},{y,x},{7-y,7-x}};for(int t=0;t<8;t++){trans[t][s]=xy[t][0]+8*xy[t][1];inverseT[t][trans[t][s]]=s;}}
 fill(kingSlot,kingSlot+64,-1);int slot=0;for(int s=0;s<64;s++){bool minimal=true;for(int t=0;t<8;t++)if(trans[t][s]<s)minimal=false;if(minimal)kingSlot[s]=slot++;}assert(slot==10);
}
