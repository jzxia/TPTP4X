#include <stdio.h>
#include <stdlib.h>

#include "tptp4X_api.h"

static char * ReadWholeFile(const char * Path) {

    FILE * File;
    long Length;
    char * Buffer;

    File = fopen(Path,"rb");
    if (File == NULL) {
        return(NULL);
    }
    if (fseek(File,0,SEEK_END) != 0) {
        fclose(File);
        return(NULL);
    }
    Length = ftell(File);
    if (Length < 0) {
        fclose(File);
        return(NULL);
    }
    rewind(File);
    Buffer = (char *)malloc((size_t)Length + 1);
    if (Buffer == NULL) {
        fclose(File);
        return(NULL);
    }
    if (fread(Buffer,1,(size_t)Length,File) != (size_t)Length) {
        free(Buffer);
        fclose(File);
        return(NULL);
    }
    Buffer[Length] = '\0';
    fclose(File);
    return(Buffer);
}

int main(int argc,char ** argv) {

    char * Input;
    char * Output;

    if (argc != 2) {
        fprintf(stderr,"usage: %s FILE\n",argv[0]);
        return(EXIT_FAILURE);
    }
    Input = ReadWholeFile(argv[1]);
    if (Input == NULL) {
        fprintf(stderr,"could not read %s\n",argv[1]);
        return(EXIT_FAILURE);
    }
    Output = tptp4x_pretty_print_tptp(Input);
    free(Input);
    if (Output == NULL) {
        fprintf(stderr,"pretty print failed\n");
        return(EXIT_FAILURE);
    }
    fputs(Output,stdout);
    tptp4x_free_string(Output);
    return(EXIT_SUCCESS);
}
