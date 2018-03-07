// relative URL of Stored Process Web Application (SPWA)
var urlSPWA  = '/SASStoredProcess/do'

// folder that contains the stored processes
var folderSP = '/Shared Data/Stored Processes/SASBatchSubmit/';

function urlSTP(stp) {
    return urlSPWA + '?_program=' + folderSP + stp;
}

// if you use a restricted shell for shell escape, you cannot specify '/' in command names.
// you can add shortcuts in the cmdlineShortcuts array that will replace the cmdline settings found is SAS Metadata
// to make this work make shortcut scripts that call the cmdline and that exist in the path, e.g., /usr/local/bin.
var cmdlineShortcuts = [{cmdline:"/apps/sas/SASConfig/Lev5/SASApp/BatchServer/sasbatch.sh", shortcut:"Lev5_SASApp_BatchServer.sh"}
                       ,{cmdline:"/apps/sas/SASConfig/Lev5/SASETL/BatchServer/sasbatch.sh", shortcut:"Lev5_SASETL_BatchServer.sh"}
                       ];
