// Offline exploration only: Black must stay on files a-e and mate on file a.
// The phase and finishing cage are explicit state, so setup cannot skip a blockade.
#include "promotion.hpp"
#include <filesystem>
#include <cmath>
#include <fstream>
#include <iostream>
#include <map>
#include <string>
using namespace knnp;
struct Table { vector<uint16_t> w,b; };
constexpr array<uint64_t,4> cages={
 (1ull<<56)|(1ull<<57), (1ull<<56)|(1ull<<48),
 (1ull<<0)|(1ull<<1), (1ull<<0)|(1ull<<8)
};
array<Table,4> finish;
Table lockTable,setupTable;
vector<uint8_t> lockW,lockB;
string output;
void save(const string& name,const vector<uint16_t>& data){
 ofstream f(output+"/"+name+".bin",ios::binary);
 f.write(reinterpret_cast<const char*>(data.data()),data.size()*2);assert(f.good());
}
bool twoSquareLock(Position s,int cage){
 if(!blockaded(s)||!(cages[cage]>>s.k&1))return false;
 int guard=s.a==s.p-8?s.b:s.a;
 uint64_t forbidden=ka[s.w]|na[guard]|(1ull<<s.w)|(1ull<<s.p);
 uint64_t region=1ull<<s.k,front=region;
 while(front){uint64_t next=0;while(front){int q=__builtin_ctzll(front);front&=front-1;next|=ka[q];}next&=~forbidden&~region;region|=next;front=next;}
 return !(region>>guard&1)&&!(region&~cages[cage])&&(region&(1ull<<(cage<2?56:0)));
}
Table solve(int stage,int cage=-1){
 Table t{vector<uint16_t>(SIZE,INF),vector<uint16_t>(SIZE,INF)};
 vector<uint8_t> pending(SIZE);vector<vector<uint32_t>> queue;
 auto allowed=[&](Position s){return s.k%8<5&&(stage!=1||(cages[cage]>>s.k&1))&&(stage!=2||blockaded(s));};
 auto put=[&](uint32_t id,bool bt,uint16_t d){auto& a=bt?t.b:t.w;if(a[id]!=INF)return;a[id]=d;if(queue.size()<=d)queue.resize(d+1);queue[d].push_back(id+(bt?SIZE:0));};
 for(uint32_t id=0;id<SIZE;id++){
  auto s=decode(id);if(!base(s)||!allowed(s))continue;
  if(validWhite(s)&&((stage==2&&lockW[id])||(stage==3&&lockTable.w[id]!=INF)))put(id,false,0);
  if(!validBlack(s))continue;
  unsigned degree=0;bool promotion=false;
  // Count ALL replies, including captures and exits to files f-h.
  // Those replies never become successes; therefore they prevent certification.
  blackAll(s,[&](uint32_t to){degree++;promotion|=to==PROMOTION;});pending[id]=degree;
  if(stage==1&&promotion&&safePromotion(id)){--pending[id];if(!pending[id])put(id,true,1);}
  if((stage==1&&!degree&&attacked(s,s.k)&&s.k%8==0)||(stage==2&&lockB[id])||(stage==3&&lockTable.b[id]!=INF))put(id,true,0);
 }
 uint64_t count=0;
 for(size_t d=0;d<queue.size();d++){
  for(size_t j=0;j<queue[d].size();j++){
   uint32_t node=queue[d][j],id=node%SIZE;auto s=decode(id);count++;
   if(node>=SIZE)beforeWhite(s,[&](uint32_t p){if(allowed(decode(p)))put(p,false,d+1);});
   else beforeBlack(s,[&](uint32_t p){if(!allowed(decode(p))||t.b[p]!=INF)return;assert(pending[p]);if(--pending[p]==0)put(p,true,stage==1&&promotionCache.size()>p&&promotionCache[p]==2?max(size_t(1),d):d);});
  }
  vector<uint32_t>().swap(queue[d]);
 }
 cerr<<"stage "<<stage<<" cage "<<cage<<" solved "<<count<<" max phase distance "<<queue.size()-1<<"\n";
 // Check every solved AND/OR equation, independently of predecessor propagation.
 for(uint32_t id=0;id<SIZE;id++){
  auto s=decode(id);
  if(t.w[id]!=INF&&t.w[id]>0){uint16_t best=INF;white(s,[&](uint32_t c){if(t.b[c]!=INF)best=min(best,uint16_t(t.b[c]+1));});assert(best==t.w[id]);}
  if(t.b[id]!=INF&&t.b[id]>0){unsigned worst=0;blackAll(s,[&](uint32_t c){if(c==PROMOTION){assert(stage==1&&safePromotion(id));worst=max(worst,1u);}else{assert(c<SIZE&&t.w[c]!=INF);worst=max(worst,unsigned(t.w[c]));}});assert(worst==t.b[id]);}
 }
 return t;
}
uint32_t choose(uint32_t id,const Table& t){
 uint32_t result=BAD;int best=4096;auto s=decode(id);
 white(s,[&](uint32_t to){if(t.b[to]!=INF&&t.b[to]+1==t.w[id]){int m=code(s,decode(to));if(m<best){best=m;result=to;}}});assert(result!=BAD);return result;
}
struct Metrics {unsigned plies,quiet,later;};
map<uint64_t,Metrics> memo;
struct State {uint32_t id;bool bt;int stage,cage;};
State enter(State s){
 if(s.stage==3&&(s.bt?lockTable.b[s.id]:lockTable.w[s.id])!=INF)s.stage=2;
 if(s.stage==2){int c=s.bt?lockB[s.id]:lockW[s.id];if(c){s.stage=1;s.cage=c-1;}}
 return s;
}
const Table& table(State s){return s.stage==1?finish[s.cage]:s.stage==2?lockTable:setupTable;}
Metrics audit(State state){
 auto s=enter(state);uint64_t key=(uint64_t(s.stage*4+(s.stage==1?s.cage:0))*2+s.bt)*SIZE+s.id;
 if(auto i=memo.find(key);i!=memo.end())return i->second;
 auto pos=decode(s.id);assert(pos.k%8<5);if(s.stage==1)assert(cages[s.cage]>>pos.k&1);if(s.stage==2)assert(blockaded(pos));
 Metrics m{};unsigned degree=0;
 auto edge=[&](uint32_t to){degree++;if(to==PROMOTION){assert(s.stage==1&&safePromotion(s.id));m.plies=max(m.plies,2u);return;}
  assert(to<SIZE);auto child=enter(State{to,!s.bt,s.stage,s.cage});assert((child.bt?table(child).b[to]:table(child).w[to])!=INF);
  if(child.stage==s.stage){auto& t=table(s);auto d=s.bt?t.b[s.id]:t.w[s.id];auto cd=child.bt?t.b[to]:t.w[to];assert(s.bt?cd<=d:cd<d);}
  auto cm=audit(child);m.plies=max(m.plies,cm.plies+1);
  if(decode(to).p!=pos.p)m.later=max({m.later,cm.quiet,cm.later});
  else{if(cm.plies)m.quiet=max(m.quiet,cm.quiet+1);m.later=max(m.later,cm.later);}
 };
 if(s.bt)blackAll(pos,edge);else edge(choose(s.id,table(s)));
 if(!degree)assert(s.bt&&attacked(pos,pos.k)&&pos.k%8==0);
 memo[key]=m;return m;
}
void witness(Position pos){
 uint32_t id=key(pos);cout<<"START "<<pos.p<<" "<<pos.w<<" "<<pos.a<<" "<<pos.b<<" "<<pos.k<<" setup="<<setupTable.w[id];
 if(setupTable.w[id]==INF){cout<<" unsolved\n";return;}
 auto m=audit({id,false,3,0});cout<<" mate="<<(m.plies+1)/2<<" quiet="<<m.quiet<<" later="<<m.later<<"\n";
 State s{id,false,3,0};cout<<"LINE";
 for(unsigned ply=0;ply<m.plies;ply++){
  s=enter(s);auto p=decode(s.id);uint32_t to=BAD;unsigned score=0;
  if(!s.bt)to=choose(s.id,table(s));
  else blackAll(p,[&](uint32_t c){unsigned v=c==PROMOTION?2:audit({c,false,s.stage,s.cage}).plies+1;if(to==BAD||v>score){score=v;to=c;}});
  if(to==PROMOTION){cout<<" promotion\n";return;}assert(to<SIZE);
  auto q=decode(to);int move=s.bt?(p.k!=q.k?p.k*64+q.k:p.p*64+q.p):code(p,q);
  cout<<" "<<move<<":"<<s.stage;s={to,!s.bt,s.stage,s.cage};
 }
 cout<<"\n";
}
int main(int argc,char**argv){assert(argc==2);output=argv[1];filesystem::create_directories(output);initialize();lockW.assign(SIZE,0);lockB.assign(SIZE,0);
 for(int c=0;c<4;c++){
  finish[c]=solve(1,c);save("finish"+to_string(c)+"-w",finish[c].w);save("finish"+to_string(c)+"-b",finish[c].b);
  uint64_t nw=0,nb=0;
  for(uint32_t id=0;id<SIZE;id++)if((finish[c].w[id]!=INF||finish[c].b[id]!=INF)&&twoSquareLock(decode(id),c)){
   if(finish[c].w[id]!=INF){nw++;if(!lockW[id]||finish[c].w[id]<finish[lockW[id]-1].w[id])lockW[id]=c+1;}
   if(finish[c].b[id]!=INF){nb++;if(!lockB[id]||finish[c].b[id]<finish[lockB[id]-1].b[id])lockB[id]=c+1;}
  }
  cout<<"CAGE "<<c<<" locked seeds white="<<nw<<" black="<<nb<<"\n";
 }
 ofstream seeds(output+"/lock-seeds.txt");
 for(uint32_t id=0;id<SIZE;id++){if(lockW[id])seeds<<id<<" 0 "<<int(lockW[id]-1)<<"\n";if(lockB[id])seeds<<id<<" 1 "<<int(lockB[id]-1)<<"\n";}seeds.close();
 lockTable=solve(2);save("lock-w",lockTable.w);save("lock-b",lockTable.b);
 setupTable=solve(3);save("setup-w",setupTable.w);save("setup-b",setupTable.b);
 for(auto s:{Position{55,20,6,37,56},Position{55,2,1,6,56},Position{55,41,43,47,56},Position{55,50,27,6,56},Position{55,35,28,47,56},Position{55,42,13,47,56}})witness(s);
 // Rank all certified a8/h7 starts by total Euclidean proximity to h1.
 vector<pair<double,uint32_t>> starts;
 for(int w=0;w<64;w++)for(int a=0;a<64;a++)for(int b=a+1;b<64;b++){
  auto id=key(Position{55,w,a,b,56});if(setupTable.w[id]==INF)continue;
  auto distance=[](int sq){int x=7-sq%8,y=sq/8;return sqrt(double(x*x+y*y));};
  starts.push_back({distance(w)+distance(a)+distance(b),id});
 }
 sort(starts.begin(),starts.end());cout<<"A8_H7 certified starts "<<starts.size()<<"\n";
 int found=0;for(auto [distance,id]:starts){auto m=audit({id,false,3,0});if(max(m.quiet,m.later)>=100||m.plies>39)continue;cout<<"CLOSE score="<<distance<<" ";witness(decode(id));if(++found==5)break;}
 uint64_t count=0,failures=0;unsigned longest=0;
 for(uint32_t id=0;id<SIZE;id++)if(setupTable.w[id]!=INF){auto m=audit({id,false,3,0});count++;failures+=max(m.quiet,m.later)>=100;longest=max(longest,(m.plies+1)/2);}
 cout<<"AUDIT white="<<count<<" clock_failures="<<failures<<" max_mate="<<longest<<" memo="<<memo.size()<<"\n";
 ofstream proof(output+"/proof.txt");
 for(auto [key,m]:memo){uint32_t id=key%SIZE;auto tag=key/SIZE;bool bt=tag%2;tag/=2;int stage=tag/4,cage=tag%4;State s{id,bt,stage,cage};
  proof<<id<<" "<<bt<<" "<<stage<<" "<<cage<<" "<<m.plies<<" "<<m.quiet<<" "<<m.later<<" "<<(bt?-1:code(decode(id),decode(choose(id,table(s)))))<<"\n";
 }
 cerr<<"Audited memo states "<<memo.size()<<"\n";
}
