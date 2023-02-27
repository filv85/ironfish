set -x

NAPI_HEADER_DIR=`realpath "$(dirname $(which node))/../include/node"`

zig cc -shared -undefined dynamic_lookup -I $NAPI_HEADER_DIR -o crashy.node src/main.c
