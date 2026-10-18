#pragma once
#include <vector>
#include <map>
#include <memory>
#include <string>
#include <cstring>
#include <algorithm>
#include <cstdint>
extern bool fakeWriteFailure;
enum SeekMode{SeekSet=0,SeekCur=1,SeekEnd=2};
class File {
 std::shared_ptr<std::vector<uint8_t>> data;size_t pos=0;
public:
 File()=default;explicit File(std::shared_ptr<std::vector<uint8_t>> p):data(p){}
 explicit operator bool()const{return bool(data);}
 bool seek(size_t p,SeekMode m=SeekSet){if(!data)return false;pos=m==SeekEnd?data->size()+p:m==SeekCur?pos+p:p;return true;}
 size_t position()const{return pos;}
 bool isDirectory()const{return false;}
 size_t write(const uint8_t *p,size_t n){if(!data)return 0;if(fakeWriteFailure)n/=2;if(data->size()<pos+n)data->resize(pos+n);std::memcpy(data->data()+pos,p,n);pos+=n;return n;}
 size_t read(uint8_t *p,size_t n){if(!data||pos>=data->size())return 0;n=std::min(n,data->size()-pos);std::memcpy(p,data->data()+pos,n);pos+=n;return n;}
 void close(){data.reset();}
};
struct FakeSPIFFS {
 std::map<std::string,std::shared_ptr<std::vector<uint8_t>>> files;
 bool exists(const char *name){return files.count(name);}
 File open(const char *name,const char *mode){if(mode[0]=='w')files[name]=std::make_shared<std::vector<uint8_t>>();if(!files.count(name))return {};return File(files[name]);}
};
extern FakeSPIFFS SPIFFS;
