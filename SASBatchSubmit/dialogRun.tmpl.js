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

  // get the list of Batch Server available to the logged-on user
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

          $scope.submitting = false; // used by progress indicator
          $scope.batchServers = response.data['SASTableData+BATCHSERVERS'];

          // if useShortcutCommands == true then replace cmdLines with shortcuts from cmdlineShortcuts array (set in dsParms.js)
          if (useShortcutCommands) {
            for (i=0; i<$scope.batchServers.length; i++) {
              for (j=0; j<cmdlineShortcuts.length; j++) {
                if ($scope.batchServers[i].cmdline == cmdlineShortcuts[j].cmdline) {
                  $scope.batchServers[i].cmdline = cmdlineShortcuts[j].shortcut;
                }
              }
            }
          }

          // get last selected Batch Server from batchServerName cookie
          var selectedBatchServerName = $cookies.get('batchServerName');
          if (selectedBatchServerName == undefined) {
            // set the first item to the selected batch server
            selectedBatchServerName = $scope.batchServers[0].serverName;
            // save selectedBatchServerName in cookie with expire date = now + 14 days
            var expireDate = new Date();
            expireDate.setDate(expireDate.getDate() + 14);
            $cookies.put('batchServerName',selectedBatchServerName,{'expires':expireDate});
          }

          // find selectedBatchServerName in $scope.batchServers
          for (i=0; i<$scope.batchServers.length; i++) {
            if ($scope.batchServers[i].serverName == selectedBatchServerName) {
              $scope.selectedBatchServer = $scope.batchServers[i];
              $log.info("Found: " + selectedBatchServerName);
            }
          }

        } else {
          $scope.status = 'SAS Stored Process Error while retrieving the list of SAS Batch Servers.'
          $log.info(response);
        }
      } else {
        $scope.status = 'SAS Stored Process Error while retrieving the list of SAS Batch Servers.'
        $log.info(response);
      }
    }, function fail(response) {
      $scope.status = 'FAILED retrieving the list of SAS Batch Servers.'
      $log.info(response);
    });
  }
  getBatchServers();

  // to split SAS code into chunks where it gets larger than 32000 characters
  function chunkSubstr(str, size) {
    const numChunks = Math.ceil(str.length / size)
    const chunks = new Array(numChunks)
    for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
      chunks[i] = escape(str.substr(o, size));
    }
    return chunks
  }

  // function pad to pad a number with leading zero's
  function pad(num,size) {
    var s = "0000000000" + num;
    return s.substr(s.length - size);
  }

  // create list self.scheduleTimeOpts to contain scheduling times 00:00 - 24:00
  self.scheduleTimeOpts = [];
  for (var hour=0; hour<24; hour++) {
    for (var minute=0; minute<60; minute = minute + 5) {
      self.scheduleTimeOpts.push(pad(hour,2) + ':' + pad(minute,2));
    }
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
    $scope.selectedRunTime = $scope.optsRunTime[0]; // set default selection to the first item
  }
  $scope.updateOptsRunTime(self.runDate);

  // md-dialog Cancel button
  $scope.cancel = function() {
    $mdDialog.cancel();
  };

  // md-dialog Run button
  $scope.run = function() {

    $scope.status = 'Submitting to ' + $scope.selectedBatchServer.serverName + '...';

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
    httpData = httpData + '&rundate=' + ( $scope.atTime == "now" ? "now" : self.runDate.toISOString().substring(0,10) )
                        + '&runtime=' + ( $scope.atTime == "now" ? "" : $scope.selectedRunTime )
                        + '&sascmd=' + $scope.selectedBatchServer.cmdline
                        ;
    //$log.info(httpData);

    // save $scope.selectedBatchServer.serverName in cookie with expire date = now + 14 days
    var expireDate = new Date();
    expireDate.setDate(expireDate.getDate() + 14);
    $cookies.put('batchServerName',$scope.selectedBatchServer.serverName,{'expires':expireDate});

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
          $scope.status = 'SAS Stored Process Error while submitting the SAS code';
          $log.info(response);
        }
      }, function fail(response) {
        $scope.status = 'ERROR: Failed';
        $log.info(response);
      });

  };

}
