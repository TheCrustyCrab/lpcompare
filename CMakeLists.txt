cmake_minimum_required(VERSION 3.15)
project(lpcompare VERSION 1.0.0 LANGUAGES CXX C)

add_subdirectory(dep EXCLUDE_FROM_ALL)

add_executable(${CMAKE_PROJECT_NAME} src/main.cpp)
target_link_libraries(${CMAKE_PROJECT_NAME} highs::highs lpsolve55)
if (${CMAKE_SYSTEM_NAME} MATCHES "Emscripten")
    set_target_properties(${CMAKE_PROJECT_NAME} PROPERTIES LINK_FLAGS "-sINVOKE_RUN=0 -sMODULARIZE=1 -sEXPORTED_RUNTIME_METHODS=['FS','callMain'] -sEXPORT_NAME='lpcompare' -sALLOW_MEMORY_GROWTH=1 -sEXPORT_ES6")  
    target_link_options(${CMAKE_PROJECT_NAME} PRIVATE --emit-tsd "$<TARGET_FILE_DIR:lpcompare>/lpcompare.d.ts")
endif ()