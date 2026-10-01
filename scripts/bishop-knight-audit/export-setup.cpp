// Export canonical fastest setup moves and verify all physical move/rank equations.
#include "kbn-symmetry.hpp"
int main(int argc,char**argv){assert(argc==4);initializeGeometry();
 vector<uint8_t> dw(SIZE),db(SIZE);ifstream a(argv[1],ios::binary),b(argv[2],ios::binary);a.read((char*)dw.data(),SIZE);b.read((char*)db.data(),SIZE);assert(a.gcount()==SIZE&&b.gcount()==SIZE);
 vector<uint16_t> words(10*(1<<18),65535);uint64_t rows=0,goals=0;
 for(uint32_t p=0;p<SIZE;p++){if(dw[p]==INF||canon(p)!=p)continue;if(dw[p]==0){words[offset(p)]=0;goals++;continue;}assert(dw[p]<15);auto [w,bi,n,k]=pieces(p);int move=4096;whiteMoves(w,bi,n,k,[&](uint32_t to){if(db[to]!=INF&&db[to]+1==dw[p])move=min(move,moveCode(p,to));});assert(move<4096);words[offset(p)]=(dw[p]<<12)|move;rows++;}
 uint64_t checked=0;for(uint32_t p=0;p<SIZE;p++){if(dw[p]==INF||dw[p]==0)continue;auto [w,bi,n,k]=pieces(p);uint32_t c=canon(p);int word=words[offset(c)],chosen=word&4095;assert((word>>12)==dw[p]);for(int t=0;t<8;t++)if(transformed(p,t)==c){int from=inverseT[t][chosen>>6],to=inverseT[t][chosen&63];bool found=false;whiteMoves(w,bi,n,k,[&](uint32_t next){if(moveCode(p,next)==from*64+to){assert(db[next]+1==dw[p]);found=true;}});assert(found);}checked++;}
 ofstream out(argv[3],ios::binary);for(auto word:words){out.put(word&255);out.put(word>>8);}assert(out.good());cout<<"{\"canonicalMoves\":"<<rows<<",\"canonicalGoals\":"<<goals<<",\"physicalMovesVerified\":"<<checked<<",\"bytes\":"<<words.size()*2<<"}\n";
}
