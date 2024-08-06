#include <iostream>
#include <filesystem>
#include <fstream>
#include "Highs.h"
#include "lp_lib.h"

using namespace std;
using namespace std::chrono;

enum class Solver {
    Highs,
    Lpsolve
};

enum class FileType {
    LpsolveLp,
    Mps
};

struct LpCompareOpts {
    Solver solver;
    FileType fileType;
    string inputFile;
    bool logEnabled;
};

bool parseArgs(int argc, char** argv, LpCompareOpts& opts) {
    if (argc != 3 && argc != 4) {
        cout << "Invalid argument count, expected 2 or 3." << endl;
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
        fileType = FileType::LpsolveLp;
    } else if (inputFile.compare(inputFileLen - 4, 4, ".mps") == 0) {
        fileType = FileType::Mps;
    } else {
        cout << "Invalid input file (type)" << endl;
        return false;
    }
    
    bool logEnabled = true;
    if (argc == 4) {
        char* logEnabledFlag = argv[3];
        if (*logEnabledFlag == '0') {
            logEnabled = false;
        } else if (*logEnabledFlag == '1') {
            logEnabled = true;
        } else {
            cout << "Invalid flag to enable logs" << logEnabledFlag << endl;
            return false;
        }
    }

    opts.solver = solver;
    opts.fileType = fileType;
    opts.inputFile = inputFile;
    opts.logEnabled = logEnabled;

    return true;
}

void writeResult(double executionTimeMillis, bool isOptimal, int weightCount, double weights[], double objectiveValue) {
    ofstream result("result.json");
    result << "{";
    result << "\"executionTimeMillis\":" << executionTimeMillis << ",";
    string isOptimalStr = isOptimal ? "true" : "false";
    result << "\"isOptimal\":" << isOptimalStr << ",";
    result << "\"weights\":[";
    for (int i = 0; i < weightCount; i++) {
        double weight = weights[i];
        result << weight;
        if (i < weightCount - 1) {
            result << ",";
        }
    }
    result << "],";
    result << "\"objectiveValue\":" << objectiveValue;
    result << "}";
    result.close();
}

int main(int argc, char** argv) {
    LpCompareOpts opts;
    if (!parseArgs(argc, argv, opts)) {
        cout << "failed to parse" << endl;
        return -1;
    }
    
    if (opts.solver == Solver::Highs) {
        string inputFileName = opts.inputFile;
        if (opts.fileType == FileType::LpsolveLp) {
            // convert to MPS: HiGHS can deal with the CPLEX LP format but not with the Lpsolve LP format
            FILE* file = fopen(opts.inputFile.c_str(), "r");
            if (!file) {
                cout << "Input file not found" << endl;
                return -1;
            }
            inputFileName = "convertedlp.mps";
            char* lpName = "lpcompare";
            lprec* lp = read_lp(file, 0, lpName);
            write_mps(lp, &inputFileName[0]);
            delete_lp(lp);
        }
        auto startTime = chrono::system_clock::now();
        Highs highs;
        HighsStatus readStatus = highs.readModel(inputFileName);
        if (readStatus == HighsStatus::kError) {
            cout << "Input file not found" << endl;
            return -1;
        }
        if (!opts.logEnabled) {
            highs.setOptionValue("log_to_console", false);
        }
        HighsStatus status = highs.run();
        HighsSolution sol = highs.getSolution();
        HighsModelStatus modelStatus = highs.getModelStatus();
        double objectiveValue = highs.getObjectiveValue();
        int varCount = highs.getNumCol();
        double executionTimeMillis = duration_cast<milliseconds>(system_clock::now() - startTime).count();
        bool isOptimal = modelStatus == HighsModelStatus::kOptimal;

        writeResult(executionTimeMillis, isOptimal, varCount, &sol.col_value[0], objectiveValue);
        
        if (opts.fileType == FileType::LpsolveLp) {
            remove(&inputFileName[0]);
        }
        return (int)status;
    } else { // lpsolve
        auto startTime = chrono::system_clock::now();
        FILE* file = fopen(opts.inputFile.c_str(), "r");
        if (!file) {
            cout << "Input file not found" << endl;
            return -1;
        }

        lprec* lp;
        int verbosityOptions = opts.logEnabled ? NORMAL : NEUTRAL;
        if (opts.fileType == FileType::LpsolveLp) {
            char* lpName = "lpcompare";
            lp = read_lp(file, verbosityOptions, lpName);
        } else { // Mps
            lp = read_mps(file, verbosityOptions | MPS_FREE);
        }
        fclose(file);
        if (!lp) {
            return -1;
        }

        int status = solve(lp);
        int varCount = get_Ncolumns(lp);
        double* varCosts = new double[varCount];
        get_variables(lp, varCosts);
        double objectiveValue = get_objective(lp);
        double executionTimeMillis = duration_cast<milliseconds>(system_clock::now() - startTime).count();
        bool isOptimal = status == OPTIMAL;

        writeResult(executionTimeMillis, isOptimal, varCount, varCosts, objectiveValue);

        delete_lp(lp);
        return status;
    }

    return 0;
}