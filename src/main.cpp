#include <iostream>
#include "Highs.h"
#include "lp_lib.h"

using namespace std;

enum class Solver {
    Highs,
    Lpsolve
};

enum class FileType {
    Lp,
    Mps
};

struct LpCompareOpts {
    Solver solver;
    FileType fileType;
    string inputFile;
};

bool parseArgs(int argc, char** argv, LpCompareOpts& opts) {
    if (argc != 3) {
        cout << "Invalid argument count, expected 2." << endl;
        return false;
    }

    Solver solver;
    char* solverId = argv[1];
    if (*solverId == '0') {
        solver = Solver::Highs;
    } else if (*solverId == '1') {
        solver = Solver::Lpsolve;
    } else {
        cout << "Invalid solver " << solverId << endl;
        return false;
    }

    string inputFile = argv[2];
    FileType fileType;
    int inputFileLen = inputFile.length();
    if (inputFileLen < 4) {
        cout << "Invalid input file (type)" << endl;
        return false;
    }
    if (inputFile.compare(inputFileLen - 3, 3, ".lp") == 0) {
        fileType = FileType::Lp;
    } else if (inputFile.compare(inputFileLen - 4, 4, ".mps") == 0) {
        fileType = FileType::Mps;
    } else {
        cout << "Invalid input file (type)" << endl;
        return false;
    }

    opts.solver = solver;
    opts.fileType = fileType;
    opts.inputFile = inputFile;
    return true;
}

int main(int argc, char** argv) {
    LpCompareOpts opts;
    if (!parseArgs(argc, argv, opts)) {
        cout << "failed to parse" << endl;
        return -1;
    }
    
    if (opts.solver == Solver::Highs) {
        Highs highs;
        highs.readModel(opts.inputFile);
        HighsStatus status = highs.run();
        return (int)status;
    } else { // lpsolve
        FILE* file = fopen(opts.inputFile.c_str(), "r");
        if (!file) {
            cout << "Input file not found" << endl;
            return -1;
        }

        lprec* lp;
        if (opts.fileType == FileType::Lp) {
            char* lpName = "lpcompare";
            lp = read_lp(file, 0, lpName);
        } else { // Mps
            lp = read_mps(file, NORMAL | MPS_FREE);
        }        
        if (!lp) {
            return -1;
        }

        int status = solve(lp);
        return status;
    }

    return 0;
}