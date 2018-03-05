// =============================================================================================
// RunDialogController
// =============================================================================================
function RunDialogController($scope,$mdDialog,$http,$log,$cookies,sascode) {

  var self = this;

  $scope.atTime          = "now";
  $scope.loading         = false;
  $scope.submitting      = false;
  self.runDate           = new Date(); // today
  $scope.runDate         = self.runDate;
  $scope.minRunDate      = new Date(); // today
  $scope.maxRunDate      = new Date(new Date().setDate(new Date().getDate()+30));  // today + 30 days

  // to split SAS code into chunks where it gets larger than 32000 characters
  function chunkSubstr(str, size) {
    const numChunks = Math.ceil(str.length / size)
    const chunks = new Array(numChunks)
    for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
      chunks[i] = str.substr(o, size)
    }
    return chunks
  }
  
  // get last selected Server Context from cookie serverContext
  $scope.selectedServerContext = $cookies.get('serverContext');
  if ($scope.selectedServerContext == undefined) {
    // no cookie found -> set to SASApp and save in cookie with expire date = now + 14 days
    $scope.selectedServerContext = 'SASApp';
    var expireDate = new Date();
    expireDate.setDate(expireDate.getDate() + 14);
    $cookies.put('serverContext',$scope.selectedServerContext,{'expires':expireDate});
  }

  // create list self.scheduleTimeOpts to contain scheduling times 00:00 - 24:00
  self.scheduleTimeOpts = [];
  for (var hour=0; hour<24; hour++) {
    for (var minute=0; minute<60; minute = minute + 5) {
      self.scheduleTimeOpts.push(pad(hour,2) + ':' + pad(minute,2));
    }
  }

  // function pad to pad a number with leading zero's
  function pad(num,size) {
    var s = "0000000000" + num;
    return s.substr(s.length - size);
  }

  // populate $scope.optsRunTime to contain only times > now
  $scope.updateOptsRunTime = function(runDate) {
    self.runDate = runDate;
    $scope.optsRunTime = [];
    var iarray = 0;
    for (i=0; i<self.scheduleTimeOpts.length; i++) {
      if (new Date(runDate.getFullYear(),runDate.getMonth(),runDate.getDate(),self.scheduleTimeOpts[i].substr(0,2),self.scheduleTimeOpts[i].substr(3,2)) > new Date()) {
        $scope.optsRunTime.push(self.scheduleTimeOpts[i]);
      }
    }
    $scope.selectedRunTime = $scope.optsRunTime[0]; // set default selection
  }
  $scope.updateOptsRunTime(self.runDate);

  // this is needed because the md-select does not update $scope.selectedRunTime by itself
  $scope.updateRunTime = function(runTime) {
    $scope.selectedRunTime = runTime;
  }

  // this is needed because the md-select does not update $scope.selectedSbatchServer by itself
  $scope.updateSelectedBatchServer = function(batchServer) {
    $scope.selectedBatchServer.serverName = batchServer;
    // save in cookie with expire date = now + 14 days
    var expireDate = new Date();
    expireDate.setDate(expireDate.getDate() + 14);
    $cookies.put('batchServer',batchServer,{'expires':expireDate});
  }

  // get the list of SAS Server Contexts available to the logged-on user
  function getBatchServers() {
    $http({
      method: 'POST'
      , headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
      , url: urlSTP("getBatchServers")
    }).then(function successCallback(response) {
      if (response.data['SASTableData+SYSCC'] != undefined) {
        if (response.data['SASTableData+SYSCC'][0].syscc == 0) {
          $scope.submitting = false;
          $scope.batchServers = response.data['SASTableData+BATCHSERVERS'];
          // set the first item to the selected batch server
          $scope.selectedBatchServer = $scope.batchServers[0]; 
        } else {
          $scope.status = 'SAS Error while retrieving SAS Server Contexts.'
          $log.info(response);
        }
      } else {
        $scope.status = 'SAS Error while retrieving SAS Server Contexts.'
        $log.info(response);
      }
    }, function fail(response) {
      $scope.status = 'FAILED retrieving SAS Server Contexts.'
      $log.info(response);
      alert('FAILED.');
    });

  }
  getBatchServers();

  // md-dialog Cancel button
  $scope.cancel = function() {
    $mdDialog.cancel();
  };

  // md-dialog Run button
  $scope.run = function() {
$log.info($scope.selectedBatchServer);
    $scope.status = 'Submitting...';

    // SAS macro variables are limited to 32767 characters length.
    // Therefore, split the SAS code in chunks of 10000 characters, named c1, c2, etc. (= chunk1, chunk2, etc.)
    // The total number of chunks is passed as nc (= num chunks)
    var sascodeChunks = chunkSubstr(sascode,10000);
    var httpData = 'nc=' + sascodeChunks.length;
    var chunkNum = 0;
    sascodeChunks.forEach(function(chunk) {
      chunkNum++;
      httpData = httpData + '&c' + (chunkNum) + '=' + chunk;
    });
    httpData = httpData + '&serverContext=' + $scope.selectedServerContext
                        + '&rundate=' + ( $scope.atTime == "now" ? "now" : self.runDate.toISOString().substring(0,10) )
                        + '&runtime=' + ( $scope.atTime == "now" ? "" : $scope.selectedRunTime )
                        + '&sascmd=' + $scope.selectedBatchServer.cmdline
                        ;
    $log.info(httpData);
    $scope.submitting = true;
    $http({
        method: 'POST'
        , headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
        , url: urlSTP("run")
        , data: httpData
      }).then(function successCallback(response) {

        if (response.data['SASTableData+SYSCC'][0].syscc == 0) {
          $scope.submitting = false;
          result = response.data['SASTableData+RESULT'][0];
          $mdDialog.show(
            $mdDialog.alert()
              .clickOutsideToClose(false)
              .title('Run Results')
              .textContent('Result: ' + result.at_result)
              .ariaLabel('Run Results')
              .ok('Close')
          );
        } else {
          $scope.status = ds_userid + ' / ' + $scope.selectedDsCode + ' FAILED TO SUBMIT.'
          $log.info(response);
        }
      }, function fail(response) {
        $log.info(response);
        alert('failed.');
      });

  };
  
}
