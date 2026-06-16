cmake_minimum_required(VERSION 3.18)

if(NOT DEFINED CMAKE_TOOLCHAIN_FILE)
  set(CMAKE_C_COMPILER gcc CACHE FILEPATH "C compiler")
endif()

project(TPTP4X
  LANGUAGES C
)

# set(CMAKE_EXPORT_COMPILE_COMMANDS ON)    # provide clues to IDE IntelliSense

if(DEFINED ENV{TPTP_HOME})
  set(TPTP_HOME "$ENV{TPTP_HOME}" CACHE PATH "TPTP installation root")
else()
  set(TPTP_HOME "/home/tptp"      CACHE PATH "TPTP installation root")
endif()

################################################################################
# download jjparser at CMake configuration time
# but ignore jjparser's own CMake project

include(FetchContent)

set(JJPARSER_GIT_TAG "master" CACHE STRING "Git tag, branch, or commit to use for JJParser")

FetchContent_Declare(
  jjparser
  GIT_REPOSITORY https://github.com/TPTPWorld/JJParser.git
  GIT_TAG        "${JJPARSER_GIT_TAG}"
  SOURCE_SUBDIR  cmake-do-not-add
  #[[
  `SOURCE_SUBDIR` points to a non-existent directory.
  This is to avoid building any targets defined in JJParser's own `CMakeLists.txt`.
  This is allowed by the official documentation:
  https://cmake.org/cmake/help/latest/module/FetchContent.html#command:fetchcontent_makeavailable
  #]]
)

FetchContent_MakeAvailable(jjparser)

set(JJPARSER_SOURCES
  ListStatistics.c
  List.c
  Examine.c
  Modify.c
  Tree.c
  TreeStatistics.c
  ParseTPTP.c
  ParseTSTP.c
  PrintTSTP.c
  Parsing.c
  Signature.c
  Tokenizer.c
  Utilities.c
  Compare.c
  Interpret.c
  PrintXML.c
  PrintSMT2.c
  PrintDFG.c
  PrintOtter.c
  PrintKIF.c
  PrintSUMO.c
  PrintLP.c
  PrintDK.c
  FileUtilities.c
  SystemOnTPTP.c
  Statistics.c
)
list(TRANSFORM JJPARSER_SOURCES PREPEND "${jjparser_SOURCE_DIR}/")

################################################################################
# compile to WebAssembly

if(EMSCRIPTEN)

  set(JJPARSER_WASM_SOURCES ${JJPARSER_SOURCES})
  list(REMOVE_ITEM JJPARSER_WASM_SOURCES "${jjparser_SOURCE_DIR}/SystemOnTPTP.c")

  add_executable(tptp4X_wasm
    tptp4X_api.c
    wasm/SystemOnTPTPWasmStubs.c
    ${JJPARSER_WASM_SOURCES}
  )
  target_include_directories(tptp4X_wasm PRIVATE
    "${CMAKE_CURRENT_SOURCE_DIR}"
    "${jjparser_SOURCE_DIR}"
  )
  target_compile_definitions(tptp4X_wasm PRIVATE
    TPTP_HOME="${TPTP_HOME}"
    _GNU_SOURCE
  )
  target_compile_options(tptp4X_wasm PRIVATE
    -Wall
  )
  target_link_options(tptp4X_wasm PRIVATE
    "SHELL:-s MODULARIZE=1"
    "SHELL:-s EXPORT_NAME=createTPTP4X"
    "SHELL:-s ALLOW_MEMORY_GROWTH=1"
    # Let JJParser's fatal exit path terminate the disposable child process.
    "SHELL:-s EXIT_RUNTIME=1"
    "SHELL:-s EXPORTED_FUNCTIONS=['_malloc','_free','_tptp4x_pretty_print_tptp','_tptp4x_free_string']"
    "SHELL:-s EXPORTED_RUNTIME_METHODS=['UTF8ToString','stringToUTF8','lengthBytesUTF8']"
  )

else()

################################################################################
# configuration of jjparser for tptp4X (linked to curl and math library)

find_package(CURL REQUIRED)

add_library(jjparser_for_tptp4X STATIC ${JJPARSER_SOURCES})
target_include_directories(jjparser_for_tptp4X PUBLIC "${jjparser_SOURCE_DIR}")
target_compile_definitions(jjparser_for_tptp4X PRIVATE TPTP_HOME="${TPTP_HOME}")
target_link_libraries(jjparser_for_tptp4X PUBLIC CURL::libcurl m)

add_library(tptp4X_api STATIC
  tptp4X_api.c
  ${JJPARSER_SOURCES}
)
target_include_directories(tptp4X_api PUBLIC
  "${CMAKE_CURRENT_SOURCE_DIR}"
  "${jjparser_SOURCE_DIR}"
)
target_compile_definitions(tptp4X_api PRIVATE
  TPTP_HOME="${TPTP_HOME}"
  _GNU_SOURCE
)
target_link_libraries(tptp4X_api PUBLIC CURL::libcurl m)

################################################################################
# configuration of tptp4X

add_executable(tptp4X
  tptp4X.c
  AddEquality.c
  FOFify.c
  NumberNames.c
  Randomize.c
)

target_compile_definitions(tptp4X PRIVATE TPTP_HOME="${TPTP_HOME}")
target_link_libraries(tptp4X PRIVATE jjparser_for_tptp4X)

add_executable(tptp4X_api_smoke Test4X/TestPrettyPrintAPI.c)
target_link_libraries(tptp4X_api_smoke PRIVATE tptp4X_api)

################################################################################
# gcc warning flags

set(TPTP4X_CFLAGS_WARNINGS
  -Wall
  -Wno-format-overflow
)

target_compile_options(jjparser_for_tptp4X PRIVATE ${TPTP4X_CFLAGS_WARNINGS})
target_compile_options(tptp4X PRIVATE ${TPTP4X_CFLAGS_WARNINGS})
target_compile_options(tptp4X_api PRIVATE ${TPTP4X_CFLAGS_WARNINGS})
target_compile_options(tptp4X_api_smoke PRIVATE ${TPTP4X_CFLAGS_WARNINGS})

################################################################################
# installation of the executable binary

install(TARGETS tptp4X RUNTIME DESTINATION "${TPTP_HOME}/ServiceTools")

################################################################################

endif()    # EMSCRIPTEN
