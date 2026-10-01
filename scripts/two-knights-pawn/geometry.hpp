#pragma once
#include <algorithm>
#include <array>
#include <cassert>
#include <cstdint>
#include <vector>
using namespace std;
namespace knnp {
constexpr uint32_t PAIRS=2016, SLICE=64*PAIRS*64, SIZE=6*SLICE, BAD=SIZE, PROMOTION=SIZE+1;
constexpr uint16_t INF=65535;
array<vector<int>,64> km,nm;
int pairId[64][64]; array<array<int,2>,PAIRS> pairSquares;
uint64_t ka[64],na[64];
int distance(int a,int b){return max(abs(a%8-b%8),abs(a/8-b/8));}
void initialize(){int j=0;for(int a=0;a<64;a++)for(int b=a+1;b<64;b++){pairId[a][b]=pairId[b][a]=j;pairSquares[j++]={a,b};}
 for(int a=0;a<64;a++)for(int b=0;b<64;b++){int x=abs(a%8-b%8),y=abs(a/8-b/8);if(max(x,y)==1){km[a].push_back(b);ka[a]|=1ull<<b;}if(x*y==2){nm[a].push_back(b);na[a]|=1ull<<b;}}
}
struct Position {int p,w,a,b,k;};
uint32_t key(int p,int w,int a,int b,int k){return (((p/8-1)*64+w)*PAIRS+pairId[a][b])*64+k;}
uint32_t key(Position s){return key(s.p,s.w,s.a,s.b,s.k);}
Position decode(uint32_t id){int k=id%64;id/=64;auto ab=pairSquares[id%PAIRS];id/=PAIRS;int w=id%64;return {int(id/64+1)*8+7,w,ab[0],ab[1],k};}
bool base(Position s){return s.w!=s.a&&s.w!=s.b&&s.p!=s.w&&s.p!=s.a&&s.p!=s.b&&s.k!=s.p&&s.k!=s.a&&s.k!=s.b&&distance(s.w,s.k)>1;}
bool attacked(Position s,int sq){return ((ka[s.w]|na[s.a]|na[s.b])>>sq)&1;}
bool validWhite(Position s){return base(s)&&!attacked(s,s.k);}
bool validBlack(Position s){return base(s)&&s.w!=s.p-9;}
bool blockaded(Position s){return s.a==s.p-8||s.b==s.p-8;}
int corner(int sq){int x=sq%8,y=sq/8;if(x>=3&&x<=4)return -1;if(y>=3&&y<=4)return -1;return (x>=5)+2*(y>=5);}
int code(Position s,Position t){if(s.w!=t.w)return s.w*64+t.w;if(s.a!=t.a&&s.a!=t.b)return s.a*64+(t.a!=s.b?t.a:t.b);return s.b*64+(t.a!=s.a?t.a:t.b);}
// Every supported White successor has the same five pieces. Captures are intentionally outside this method.
template<class F> void white(Position s,F emit){
 for(int to:km[s.w])if(to!=s.a&&to!=s.b&&to!=s.p&&to!=s.k&&distance(to,s.k)>1&&to!=s.p-9)emit(key(s.p,to,s.a,s.b,s.k));
 if(s.w==s.p-9)return; // Knight moves cannot answer this adjacent pawn check without capturing the pawn.
 for(int to:nm[s.a])if(to!=s.w&&to!=s.b&&to!=s.p&&to!=s.k)emit(key(s.p,s.w,to,s.b,s.k));
 for(int to:nm[s.b])if(to!=s.w&&to!=s.a&&to!=s.p&&to!=s.k)emit(key(s.p,s.w,s.a,to,s.k));
}
template<class F> void black(Position s,F emit){
 for(int to:km[s.k]){if(to==s.p||distance(to,s.w)<=1)continue;
  if(to==s.a){if(!((na[s.b]>>to)&1))emit(BAD);}
  else if(to==s.b){if(!((na[s.a]>>to)&1))emit(BAD);}
  else if(!attacked(s,to))emit(key(s.p,s.w,s.a,s.b,to));
 }
 // Pawn moves must answer a check on the king (pawns cannot block knight checks).
 if(attacked(s,s.k))return;
 int to=s.p-8;
 if(to!=s.w&&to!=s.a&&to!=s.b&&to!=s.k){
  if(to<8)emit(PROMOTION);else emit(key(to,s.w,s.a,s.b,s.k));
  if(s.p==55){int two=s.p-16;if(two!=s.w&&two!=s.a&&two!=s.b&&two!=s.k)emit(key(two,s.w,s.a,s.b,s.k));}
 }
 // Pawn can capture a checking knight, removing its attack. Such material-changing replies are failures.
 int capture=s.p-9;
 if(capture==s.a||capture==s.b)emit(BAD);
}
// Capturing a checking knight with the pawn can evade check; include it even when ordinary pawn moves cannot.
template<class F> void blackAll(Position s,F emit){
 black(s,emit);
 if(attacked(s,s.k)){
  int cap=s.p-9;
  if(cap==s.a&&!(((ka[s.w]|na[s.b])>>s.k)&1))emit(BAD);
  if(cap==s.b&&!(((ka[s.w]|na[s.a])>>s.k)&1))emit(BAD);
 }
}
template<class F> void beforeWhite(Position s,F emit){
 for(int from:km[s.w]){Position t=s;t.w=from;if(validWhite(t))emit(key(t));}
 for(int from:nm[s.a]){Position t=s;t.a=from;if(from!=s.b&&validWhite(t))emit(key(t));}
 for(int from:nm[s.b]){Position t=s;t.b=from;if(from!=s.a&&validWhite(t))emit(key(t));}
}
template<class F> void beforeBlack(Position s,F emit){
 for(int from:km[s.k]){Position t=s;t.k=from;if(validBlack(t))emit(key(t));}
 if(s.p<55){Position t=s;t.p+=8;if(validBlack(t))emit(key(t));}
 if(s.p==39&&s.w!=47&&s.a!=47&&s.b!=47&&s.k!=47){Position t=s;t.p=55;if(validBlack(t))emit(key(t));}
}
bool lockedSeed(Position s){
 if(!blockaded(s)||corner(s.k)<0)return false;
 int guard=s.a==s.p-8?s.b:s.a;
 uint64_t forbidden=ka[s.w]|na[guard]|(1ull<<s.w)|(1ull<<s.p);
 uint64_t region=1ull<<s.k,front=region;
 while(front){uint64_t next=0;while(front){int q=__builtin_ctzll(front);front&=front-1;next|=ka[q];}next&=~forbidden&~region;region|=next;front=next;}
 if(region&(1ull<<guard))return false; // The guarding knight itself must not be capturable after release.
 int c=corner(s.k),cs=(c%2?7:0)+(c/2?56:0);
 if(!(region&(1ull<<cs)))return false;
 while(region){int q=__builtin_ctzll(region);region&=region-1;if(corner(q)!=c)return false;}
 return true;
}
}
