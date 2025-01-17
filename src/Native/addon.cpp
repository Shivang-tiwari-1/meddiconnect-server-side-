#include <napi.h>

Napi::Number Add(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  int arg1 = info[0].As<Napi::Number>().Int32Value();
  int arg2 = info[1].As<Napi::Number>().Int32Value();

  return Napi::Number::New(env, arg1 + arg2);
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set("add", Napi::Function::New(env, Add));
  return exports;
}

NODE_API_MODULE(addon, Init)