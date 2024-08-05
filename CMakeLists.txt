cmake_minimum_required(VERSION 3.15)
project(lpcompare VERSION 1.0.0 LANGUAGES CXX)

add_subdirectory(dep)

add_executable(lpcompare src/main.cpp)
target_link_libraries(lpcompare highs::highs lpsolve55)