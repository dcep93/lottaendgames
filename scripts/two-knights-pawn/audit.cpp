#include "promotion.hpp"
#include <fstream>
#include <iostream>
#include <map>
#include <string>
using namespace knnp;
template<class T> vector<T> read(const string&p){vector<T> v(SIZE);ifstream f(p,ios::binary);f.read((char*)v.data(),v.size()*sizeof(T));assert(f.gcount()==streamsize(v.size()*sizeof(T)));return v;}
void save(const string&p,const vector<uint16_t>&v){ofstream f(p,ios::binary);f.write((char*)v.data(),v.size()*2);assert(f.good());}
vector<uint16_t> policy,total[2],quiet[2],later[2];vector<uint8_t> stagesB;
uint32_t chosen(uint32_t id){uint32_t result=BAD;auto s=decode(id);white(s,[&](uint32_t to){if(code(s,decode(to))==(policy[id]&4095))result=to;});assert(result!=BAD);return result;}
void visit(uint32_t id,int bt){
 if(total[bt][id]!=INF){assert(total[bt][id]!=INF-1);return;}total[bt][id]=INF-1;
 unsigned t=0,q=0,l=0,degree=0;auto s=decode(id);int stage=bt?stagesB[id]:policy[id]>>12;
 auto edge=[&](uint32_t to){if(to==PROMOTION){assert(bt&&stage==1&&safePromotion(id));degree++;t=max(t,2u);l=max(l,0u);return;}assert(to!=BAD);degree++;int ns=bt?policy[to]>>12:stagesB[to];assert(ns>=1&&ns<=stage);visit(to,!bt);auto target=decode(to);unsigned ct=total[!bt][to];t=max(t,ct+1);
 if(s.p!=target.p){assert(bt);l=max({l,unsigned(quiet[0][to]),unsigned(later[0][to])});}
 else{if(ct!=0)q=max(q,unsigned(quiet[!bt][to])+1);l=max(l,unsigned(later[!bt][to]));}
 };
 if(bt)blackAll(s,edge);else edge(chosen(id));
 if(!degree)assert(bt&&attacked(s,s.k));assert(t<INF-1);total[bt][id]=t;quiet[bt][id]=q;later[bt][id]=l;
}
int main(int argc,char**argv){assert(argc==2);initialize();string dir=argv[1];policy=read<uint16_t>(dir+"/policy.bin");auto r1w=read<uint8_t>(dir+"/r1-white.bin"),r1b=read<uint8_t>(dir+"/r1-black.bin");stagesB.resize(SIZE);uint64_t equations=0;
 for(int stage=1;stage<=3;stage++){
  auto w=read<uint16_t>(dir+"/r"+to_string(stage)+"-dw.bin"),b=read<uint16_t>(dir+"/r"+to_string(stage)+"-db.bin");
  for(uint32_t id=0;id<SIZE;id++){
   auto s=decode(id);
   if(w[id]!=INF && (stage==1||w[id]>0)){assert(validWhite(s));if(stage==1)assert(r1w[id]);
    uint16_t minimum=INF;white(s,[&](uint32_t to){if(b[to]!=INF)minimum=min(minimum,uint16_t(b[to]+1));});assert(w[id]==minimum);equations++;
    assert(policy[id]!=INF);if((policy[id]>>12)==stage){auto to=chosen(id);assert(b[to]!=INF&&b[to]+1==w[id]);}
   }
   if(b[id]!=INF){assert(validBlack(s));if(!stagesB[id])stagesB[id]=stage;if(stage>1&&b[id]==0)continue;
    unsigned degree=0,maximum=0;blackAll(s,[&](uint32_t to){if(to==PROMOTION){assert(stage==1&&safePromotion(id));degree++;maximum=max(maximum,1u);return;}assert(to!=BAD&&w[to]!=INF);if(stage==1)assert(corner(decode(to).k)==corner(s.k));degree++;maximum=max(maximum,unsigned(w[to]));});if(!degree)assert(stage==1&&attacked(s,s.k));assert(b[id]==maximum);equations++;
   }
  }
  cerr<<"Verified stage "<<stage<<"\n";
 }
 for(int t=0;t<2;t++){total[t].assign(SIZE,INF);quiet[t].assign(SIZE,0);later[t].assign(SIZE,0);}
 uint64_t legal[2]={},certified[2]={},failures[2]={};map<int,uint64_t> histogram[2];uint32_t worst[2]={};int maxDistance[2]={};
 for(uint32_t id=0;id<SIZE;id++){
  auto s=decode(id);if(validWhite(s))legal[0]++;if(validBlack(s))legal[1]++;
  for(int bt=0;bt<2;bt++)if(bt?stagesB[id]!=0:policy[id]!=INF){visit(id,bt);certified[bt]++;int moves=(total[bt][id]+(bt?0:1))/2;histogram[bt][moves]++;if(moves>maxDistance[bt]){maxDistance[bt]=moves;worst[bt]=id;}if(max(quiet[bt][id],later[bt][id])>=100)failures[bt]++;}
 }
 for(int bt=0;bt<2;bt++){save(dir+(bt?"/total-b.bin":"/total-w.bin"),total[bt]);save(dir+(bt?"/quiet-b.bin":"/quiet-w.bin"),quiet[bt]);save(dir+(bt?"/later-b.bin":"/later-w.bin"),later[bt]);}
 cout<<"{\"equations\":"<<equations<<",\"turns\":[";
 for(int bt=0;bt<2;bt++){if(bt)cout<<",";cout<<"{\"turn\":\""<<(bt?"b":"w")<<"\",\"legal\":"<<legal[bt]<<",\"certified\":"<<certified[bt]<<",\"freshClockFailures\":"<<failures[bt]<<",\"maxWhiteMoves\":"<<maxDistance[bt]<<",\"worstIndex\":"<<worst[bt]<<",\"histogram\":{";bool first=true;for(auto [d,n]:histogram[bt]){if(!first)cout<<",";first=false;cout<<"\""<<d<<"\":"<<n;}cout<<"}}";}cout<<"]}\n";
}
