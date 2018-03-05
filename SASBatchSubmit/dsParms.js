// relative URL of Stored Process Web Application (SPWA)
var urlSPWA  = '/SASStoredProcess/do'

// folder that contains the stored processes
var folderSP = '/Shared Data/Stored Processes/SASBatchSubmit/';

function urlSTP(stp) {
    return urlSPWA + '?_program=' + folderSP + stp;
}
