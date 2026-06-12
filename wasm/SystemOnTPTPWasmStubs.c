#include <string.h>

#include "Utilities.h"
#include "SystemOnTPTP.h"

SZSResultType StringToSZSResult(char * SZSResult) {

    (void)SZSResult;
    return(nonszsresult);
}

char * SZSResultToUserString(SZSResultType SZSResult) {

    (void)SZSResult;
    return("NoSuccess");
}

char * SZSResultToString(SZSResultType SZSResult) {

    (void)SZSResult;
    return("NOS");
}

int StringIsASZSResult(char * PossibleResult) {

    (void)PossibleResult;
    return(0);
}

int StringIsASZSResultTLA(char * PossibleResultTLA) {

    (void)PossibleResultTLA;
    return(0);
}

SZSOutputType StringToSZSOutput(char * SZSOutput) {

    (void)SZSOutput;
    return(nonszsoutput);
}

char * SZSOutputToUserString(SZSOutputType SZSOutput) {

    (void)SZSOutput;
    return("None");
}

char * SZSOutputToString(SZSOutputType SZSOutput) {

    (void)SZSOutput;
    return("Non");
}

int StringIsASZSOutput(char * PossibleOutput) {

    (void)PossibleOutput;
    return(0);
}

int StringIsASZSOutputTLA(char * PossibleOutputTLA) {

    (void)PossibleOutputTLA;
    return(0);
}

int SZSIsA(SZSResultType SZSResult,SZSResultType DesiredResult) {

    return(SZSResult == DesiredResult);
}

int SZSOutputIsA(SZSOutputType SZSOutput,SZSOutputType DesiredOutput) {

    return(SZSOutput == DesiredOutput);
}

void SystemOnTPTPFileName(char * Directory,char * BaseName,char * Extension,
String FileName) {

    strcpy(FileName,Directory == NULL ? "" : Directory);
    strcat(FileName,BaseName == NULL ? "" : BaseName);
    strcat(FileName,Extension == NULL ? "" : Extension);
}

int MakeProblemFile(char * FilesDirectory,char * BaseName,char * Extension,
String ProblemFileName,LISTNODE Head,StatusType AxiomsStatus,
ANNOTATEDFORMULA Conjecture,StatusType ConjectureStatus) {

    (void)FilesDirectory;
    (void)BaseName;
    (void)Extension;
    (void)ProblemFileName;
    (void)Head;
    (void)AxiomsStatus;
    (void)Conjecture;
    (void)ConjectureStatus;
    return(0);
}

int SystemOnTPTP(LISTNODE Axioms,ANNOTATEDFORMULA Conjecture,char * PositiveChecker,
char * PositiveResult,int TestNegative,char * NegativeChecker,char * NegativeResult,
int TimeLimit,char * SystemOutputPrefix,char * OptionalFlags,int KeepOutputFiles,
char * FilesDirectory,char * UsersOutputFileName,String OutputFileName,int LocalSoT) {

    (void)Axioms;
    (void)Conjecture;
    (void)PositiveChecker;
    (void)PositiveResult;
    (void)TestNegative;
    (void)NegativeChecker;
    (void)NegativeResult;
    (void)TimeLimit;
    (void)SystemOutputPrefix;
    (void)OptionalFlags;
    (void)KeepOutputFiles;
    (void)FilesDirectory;
    (void)UsersOutputFileName;
    (void)OutputFileName;
    (void)LocalSoT;
    return(0);
}

int SystemOnTPTPAvailable(int UseLocalSoT) {

    (void)UseLocalSoT;
    return(0);
}

int SystemOnTPTPGetResult(int QuietnessLevel,char * ProblemFileName,
char * ATPSystem,int TimeLimit,char * X2TSTPFlag,char * SystemOutputPrefix,
char * OptionalFlags,int KeepOutputFiles,char * FilesDirectory,
char * UsersOutputFileName,char * OutputFileName,char * PutResultHere,
char * PutOutputHere,int LocalSoT) {

    (void)QuietnessLevel;
    (void)ProblemFileName;
    (void)ATPSystem;
    (void)TimeLimit;
    (void)X2TSTPFlag;
    (void)SystemOutputPrefix;
    (void)OptionalFlags;
    (void)KeepOutputFiles;
    (void)FilesDirectory;
    (void)UsersOutputFileName;
    (void)OutputFileName;
    (void)LocalSoT;
    if (PutResultHere != NULL) {
        strcpy(PutResultHere,"NOS");
    }
    if (PutOutputHere != NULL) {
        strcpy(PutOutputHere,"Non");
    }
    return(0);
}

SZSResultType SZSSystemOnTPTP(LISTNODE Axioms,ANNOTATEDFORMULA Conjecture,
char * System,SZSResultType DesiredResult,int QuietnessLevel,int TimeLimit,
char * X2TSTPFlag,char * SystemOutputPrefix,char * OptionalFlags,
int KeepOutputFiles,char * FilesDirectory,char * UsersOutputFileName,
String OutputFileName,SZSOutputType * SZSOutput,int LocalSoT) {

    (void)Axioms;
    (void)Conjecture;
    (void)System;
    (void)DesiredResult;
    (void)QuietnessLevel;
    (void)TimeLimit;
    (void)X2TSTPFlag;
    (void)SystemOutputPrefix;
    (void)OptionalFlags;
    (void)KeepOutputFiles;
    (void)FilesDirectory;
    (void)UsersOutputFileName;
    (void)OutputFileName;
    (void)LocalSoT;
    if (SZSOutput != NULL) {
        *SZSOutput = nonszsoutput;
    }
    return(NOS);
}

LISTNODE ApplyExternalProgram(LISTNODE Head,StatusType AsStatus,
ANNOTATEDFORMULA Conjecture,const char * ExecuteFormatString,SIGNATURE Signature) {

    (void)AsStatus;
    (void)Conjecture;
    (void)ExecuteFormatString;
    (void)Signature;
    return(Head);
}
