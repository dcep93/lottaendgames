#pragma once
#include <algorithm>
#include <array>
#include <cassert>
#include <cstdint>
#include <fstream>
#include <iostream>
#include <vector>
using namespace std;
constexpr uint32_t SIZE=1u<<24, BLACK=SIZE;
constexpr uint8_t INF=255;
vector<int> kings[64], knights[64];
int dist(int a,int b){return max(abs(a%8-b%8),abs(a/8-b/8));}
uint32_t key(int w,int b,int n,int k){return (w<<18)|(b<<12)|(n<<6)|k;}
array<int,4> pieces(uint32_t p){return {int(p>>18),int((p>>12)&63),int((p>>6)&63),int(p&63)};}
bool bishop(int b,int k,int w,int n){int dx=k%8-b%8,dy=k/8-b/8;if(abs(dx)!=abs(dy)||!dx)return false;int step=(dx>0?1:-1)+(dy>0?8:-8);for(int s=b+step;s!=k;s+=step)if(s==w||s==n)return false;return true;}
bool knight(int n,int k){int x=abs(n%8-k%8),y=abs(n/8-k/8);return x*y==2;}
bool check(int w,int b,int n,int k){return dist(w,k)<=1||knight(n,k)||bishop(b,k,w,n);}
bool valid(int w,int b,int n,int k){return w!=b&&w!=n&&b!=n&&k!=b&&k!=n&&dist(w,k)>1;}
template<class F> void whiteMoves(int w,int b,int n,int k,F emit){
 for(int to:kings[w])if(to!=b&&to!=n&&dist(to,k)>1)emit(key(to,b,n,k));
 for(int to:knights[n])if(to!=w&&to!=b&&to!=k)emit(key(w,b,to,k));
 for(int dx:{-1,1})for(int dy:{-1,1})for(int x=b%8+dx,y=b/8+dy;x>=0&&x<8&&y>=0&&y<8;x+=dx,y+=dy){int to=y*8+x;if(to==w||to==n||to==k)break;emit(key(w,to,n,k));}
}
// Emit SIZE for a legal minor capture: it can never force entry to the four-piece net.
template<class F> void blackMoves(int w,int b,int n,int k,F emit){
 for(int to:kings[k]){if(dist(w,to)<=1)continue;if(to==b){if(!knight(n,to))emit(SIZE);}
 else if(to==n){if(!bishop(b,to,w,-1))emit(SIZE);}
 else if(!knight(n,to)&&!bishop(b,to,w,n))emit(key(w,b,n,to));}
}
