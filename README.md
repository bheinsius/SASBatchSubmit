#SAS Batch Submit WebApp

Submit SAS code in batch from a webapp, right now or sometime later.  
Runs on Linux only for now. Sends email when the job is done.

![Screenshot](screenshot.png?raw=true "Screenshot")

[See it in action](https://www.youtube.com/watch?v=bSpakS9dyPg)

## Technology
Created using AngularJS and SAS Stored Processes

## Installation
1. Import the SAS packages to a metadata location of choice.
2. Copy the SASBatchSubmit folder containing the webapp to the htdocs of your web server
3. Update parameters in SASBatchSubmit/dsParms.js to reflect the metadata location of the SAS packages you imported before
4. Navigate to yourserver.com/SASStoredProcess/SASBatchSubmit/. Note that it will give you an error if you are not logged on to SAS prior to opening the web page. So logon first - or configure sso.
