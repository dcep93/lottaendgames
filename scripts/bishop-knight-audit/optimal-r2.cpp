// Full-board retrograde reachability to frozen r1 sources. No chess tablebase dependency.
// Usage: optimal-r2 targets.txt output-prefix
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
