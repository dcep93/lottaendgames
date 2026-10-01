#include "geometry.hpp"
#include <iostream>
#include <random>
using namespace knnp;
int main(){initialize();mt19937 rng(1729);for(int i=0;i<6000;){uint32_t id=rng()%SIZE;auto s=decode(id);if(!base(s))continue;i++;cout<<id<<" "<<s.p<<" "<<s.w<<" "<<s.a<<" "<<s.b<<" "<<s.k<<" "<<validWhite(s)<<" "<<validBlack(s)<<" |";if(validWhite(s))white(s,[&](uint32_t x){cout<<" "<<x;});cout<<" |";if(validBlack(s))blackAll(s,[&](uint32_t x){cout<<" "<<x;});cout<<"\n";}}
