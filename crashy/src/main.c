#include <assert.h>
#include <node_api.h>
#include <execinfo.h>
#include <signal.h>
#include <stdio.h>
#include <stdlib.h>

static void display_trace()
{
    void *buffer[255];
    const int calls = backtrace(buffer, sizeof(buffer) / sizeof(void *));
    backtrace_symbols_fd(buffer, calls, 1);
    exit(EXIT_FAILURE);
}

static napi_value init_handler(napi_env env, napi_callback_info info)
{
    signal(SIGSEGV, display_trace);

    return 0;
}

static napi_value trigger_segfault(napi_env env, napi_callback_info info)
{
    raise(SIGSEGV);

    return 0;
}

#define DECLARE_NAPI_METHOD(name, func)         \
    {                                           \
        name, 0, func, 0, 0, 0, napi_default, 0 \
    }

static napi_value init(napi_env env, napi_value exports)
{
    napi_status status;

    napi_property_descriptor desc_init_handler = DECLARE_NAPI_METHOD("crashyInitHandler", init_handler);
    status = napi_define_properties(env, exports, 1, &desc_init_handler);
    assert(status == napi_ok);

    napi_property_descriptor desc_trigger_segfault = DECLARE_NAPI_METHOD("crashyTriggerSegfault", trigger_segfault);
    status = napi_define_properties(env, exports, 1, &desc_trigger_segfault);
    assert(status == napi_ok);

    return exports;
}

NAPI_MODULE(helloworld, init)
