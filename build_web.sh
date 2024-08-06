build_dir="web"
physical_cores=$(grep ^cpu\\scores /proc/cpuinfo | uniq | awk '{print $4}')

if [ ! -d "$build_dir" ]; then
    emcmake cmake -S . -B $build_dir -DCMAKE_BUILD_TYPE=Release
fi
emmake make -C $build_dir -j $physical_cores