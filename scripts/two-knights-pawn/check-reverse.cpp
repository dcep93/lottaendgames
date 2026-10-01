#include "geometry.hpp"
#include <random>
#include <iostream>
using namespace knnp;
int main(){initialize();mt19937 rng(13);int checks=0;for(int i=0;i<100000;i++){auto id=rng()%SIZE;auto s=decode(id);if(validWhite(s)){white(s,[&](uint32_t to){bool found=false;beforeWhite(decode(to),[&](uint32_t prev){found|=prev==id;});assert(found);checks++;});beforeBlack(s,[&](uint32_t prev){bool found=false;blackAll(decode(prev),[&](uint32_t to){found|=to==id;});assert(found);checks++;});}if(validBlack(s)){blackAll(s,[&](uint32_t to){if(to>=BAD)return;bool found=false;beforeBlack(decode(to),[&](uint32_t prev){found|=prev==id;});assert(found);checks++;});beforeWhite(s,[&](uint32_t prev){bool found=false;white(decode(prev),[&](uint32_t to){found|=to==id;});assert(found);checks++;});}}cerr<<checks<<" forward/reverse checks passed\n";}
