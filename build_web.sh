build_dir="web"
physical_cores=$(grep ^cpu\\scores /proc/cpuinfo | uniq | awk '{print $4}')

rm -rf $build_dir &&
mkdir $build_dir &&
cd $build_dir &&
emcmake cmake .. -DCMAKE_BUILD_TYPE=Release &&
emmake make -j $physical_cores