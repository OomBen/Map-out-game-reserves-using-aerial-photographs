const REGION = "sa-east-1";
const WebSocket = require('ws');
const fs = require('fs');
const AWS = require('aws-sdk');
const S3 = new AWS.S3();
const SNS = new AWS.SNS({ apiVersion: '2010-03-31', region: REGION });
AWS.config.update({ region: REGION });
import { DynamoDB } from 'aws-sdk';
const docClient = new DynamoDB.DocumentClient({ region: REGION });
import fetch from 'node-fetch';
const formdata = require('form-data');

const webODM_URL = "http://localhost:8000/";
const webODM_username = "admin";
const webODM_password = "12345678";
const PENDING_JOBS_TABLE = "PendingJobs-i2e32qtaxjauzoami7sycjlvqy-dev";
const IMAGE_TABLE = "Images-i2e32qtaxjauzoami7sycjlvqy-dev";
const IMAGE_COLLECTION_TABLE = "ImageCollection-i2e32qtaxjauzoami7sycjlvqy-dev";
const COMPLETED_JOBS_TABLE = "CompletedJobs";
const S3_BUCKET = "aerial-mapping-bucket80642-dev";
const POLL_INTERVAL_IN_MS = 10000;
let projectId: number = -1;
let tokenResp: WebODMTokenResponse;
let completedJobs: string[] = [];
let websocket: WebSocket;

interface WebODMTokenResponse {
  token: string;
}

interface WebODMProject {
  created_at: string;
  id: number;
  description: string;
  name: string;
}
interface WebODMProjectsResponse extends Array<WebODMProject> { }

interface WebODMCreateTaskResponse {
  id: string;
  images_count: number;
}

interface WebODMListTasksResponse {
  id: string;
  project: number;
  processing_time: number;
  status: number;
  available_assets: string[];
  created_at: string;
  upload_progress: number;
  resize_progress: number;
  running_progress: number;
  images_count: number;
}

interface CheckTableParam {
  TableName: string;
  ExclusiveStartKey?: any;
}

interface PendingJob {
  jobID: string;
  busy: boolean;
  taskID: string;
}

interface ImageCollection {
  collectionID: string;
  taskID: string;
  parkID: string;
  flightID: string;
  completed: boolean;
  pending: boolean;
  error: boolean;
}

//************************** PROGRAM LOGIC **************************/

//0) authenticate with the WebODM API

//1) fetch all previously completed jobs and populate the global completedJobs array

//2) check for any new pending stitch jobs
//2.1) create new WebODM task for each pending job

//3) open WebSocket and listen for new jobs, fetch new jobs from PendingJobs table

//4) poll WebODM

//******************************************************************/

async function main(): Promise<void> {
  try {
    // 0)
    await authenticateWithWebOdm();

    // 1)
    // fetches all completed jobs from DynamoDB - populates global completedJobs array.
    await refreshCompletedJobs();

    // 2)
    // checks for new pending jobs and calls createMap() for each
    await checkPendingJobs();

    // 3)
    websocket = new WebSocket("wss://ha3u3iiggc.execute-api.sa-east-1.amazonaws.com/production/");

    websocket.onopen = () => {
      console.log("[SERVER] Websocket opened");

      websocket.send(JSON.stringify({
        message: "subscribe", //this selects the 'subscribe' WebSocket API Gateway route (which triggers the onSubscribe lambda function)
        topic: "stitch_jobs" //this is the topic we want to subscribe to
      }));
    }

    websocket.onmessage = function (str: any) {
      const responseData = JSON.parse(str.data);
      console.log("[SERVER] SNS message received: ", responseData);

      //brand new job received, check the pending jobs table for the new job
      checkPendingJobs();
    };

    websocket.onclose = () => {
      console.log("[SERVER] Websocket connection closed");
    }

    // 4)
    // poll list of tasks from WebODM
    pollWebODM();
  } catch (e: any) {
    console.log(e);
  }
}

async function authenticateWithWebOdm(): Promise<void> {
  console.log("[SERVER] Authenticating with WebODM...");

  const body = {
    username: webODM_username,   //thedylpickles1@gmail.com
    password: webODM_password //somethingeasy#1
  }
  //get auth token
  try {
    await fetch(webODM_URL + "api/token-auth/", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" }
    })
      .then(async (response: any) => {
        tokenResp = await response.json();
        await fetch(webODM_URL + "api/projects/", {
          method: "GET",
          headers: { "Authorization": `JWT ${tokenResp.token}` }
        })
          .then(async (data: any) => {
            const projects: any = await data.json();
            projectId = projects[0].id;
          })
          .catch(err => {
            //console.log("Error: ", err);
            throw new Error('\nError while authenticating with WebODM. Make sure WebODM is running.\n\n');
          });
      })
      .catch(err => {
        //console.log("Error: ", err);
        throw new Error('\nError while authenticating with WebODM. Make sure WebODM is running.\n\n');
        //inform user that WebODM is not running here
      });
  } catch (e) {
    throw new Error('\nError while authenticating with WebODM. Make sure WebODM is running.\n\n');
  }
}

async function refreshCompletedJobs(): Promise<void> {
  console.log("[SERVER] Refreshing completed jobs...");
  completedJobs = [];

  //pull items from "CompletedJobs" DynamoDB database table
  const params: CheckTableParam = {
    TableName: COMPLETED_JOBS_TABLE,
  };

  let items;
  do {
    items = await docClient.scan(params).promise();

    items.Items?.forEach((item: any) => {
      console.log(item);

      //populate completedJobs array
      completedJobs.push(item.taskID);
    });

    params.ExclusiveStartKey = items.LastEvaluatedKey;
  } while (typeof items.LastEvaluatedKey !== "undefined");
}

function S3download(keyFile) {
  return new Promise(function (success, reject) {
    S3.getObject(
      { Bucket: S3_BUCKET, Key: keyFile },
      function (error, data) {
        if (error) {
          reject(error);
        } else {
          success(data);
        }
      }
    );
  });
}

//continuously poll WebODM for a list of tasks, compare the task statuses
//this function issues SNS notifications to update the frontend
async function pollWebODM() {
  console.log(`\n[SERVER] Polling WebODM...`);

  fetch(webODM_URL + `api/projects/${projectId}/tasks/`, {
    method: "GET",
    headers: { "Authorization": `JWT ${tokenResp.token}` }
  })
    .then(async (resp: any) => {
      const listOfTasks: WebODMListTasksResponse[] = await resp.json();
      console.log("[LIST OF TASKS]", listOfTasks);

      listOfTasks.forEach((task: WebODMListTasksResponse) => {
        //if not in the completedJobs array
        if (completedJobs.find(el => el == task.id) == undefined) {
          //check task status

          if (task.status == 40) {
            //COMPLETED

            // add taskID to "CompletedJobs" db table and completedJobs array
            addCompletedJob(task.id);

            // get image collection with this taskID
            const queryParams = {
              TableName: IMAGE_COLLECTION_TABLE,
              IndexName: 'byTaskId',
              KeyConditionExpression: 'taskID = :task',
              ExpressionAttributeValues: {
                ':task': task.id
              }
            };
            docClient.query(queryParams, function (err, data) {
              if (err) {
                console.log("Query error: ", err);
              }
              else {
                const imgCol = data.Items[0];
                console.log("imgCol: ", imgCol);

                // set 'completed' to true on this image collection
                const params = {
                  TableName: IMAGE_COLLECTION_TABLE,
                  Key: {
                    "collectionID": imgCol.collectionID
                  },
                  UpdateExpression: "set #c = :x, #p = :y",
                  ExpressionAttributeNames: { '#c': 'completed', '#p': 'pending' },
                  ExpressionAttributeValues: {
                    ":x": true,
                    ":y": false
                  }
                }
                docClient.update(params, function (err, data) {
                  if (err) console.log(err);
                  else console.log(data);
                });
              }
            });

            //publish SNS notification
            publishSNSNotification();
          }
          else if (task.status == 30) {
            //FAILED

            //add taskID to completedJobs array and "Completed Jobs " db table
            addCompletedJob(task.id);

            // get image collection with this taskID
            const queryParams = {
              TableName: IMAGE_COLLECTION_TABLE,
              IndexName: 'byTaskId',
              KeyConditionExpression: 'taskID = :task',
              ExpressionAttributeValues: {
                ':task': task.id
              }
            };
            docClient.query(queryParams, function (err, data) {
              if (err) {
                console.log(err);
              }
              else {
                const imgCol = data.Items[0];
                // set relevant bools on image collection table
                const params = {
                  TableName: IMAGE_COLLECTION_TABLE,
                  Key: {
                    "collectionID": imgCol.collectionID
                  },
                  ExpressionAttributeNames: {
                    "#e": "error",
                    "#p": "pending"
                  },
                  UpdateExpression: "set #e = :x, #p = :y",
                  ExpressionAttributeValues: {
                    ":x": true,
                    ":y": false
                  }
                }
                docClient.update(params, function (err, data) {
                  if (err) console.log(err);
                  else console.log(data);
                });
              }
            });

            //publish SNS notification
            publishSNSNotification();
          }
          else if (task.status == 20) {
            //RUNNING - do nothing
          }
          else if (task.status == 10) {
            //QUEUED - do nothing
          }
        }
      });
    })
    .catch((err: any) => {
      //console.log("Error: ", err);
      throw new Error('Error while fetching list of tasks from WebODM. Make sure WebODM is running.');
    });

  //poll again in 10 seconds
  setTimeout(() => { pollWebODM() }, POLL_INTERVAL_IN_MS);
}

async function createMap(jobID: string) {
  console.log("\n[SERVER] Creating map for collectionID: ", jobID);

  //TODO pull images from S3 cloud storage for this collectionID
  var promises = [];
  var fileContentList = [];
  var fileKeyList = [];
  //get all images in this collection (jobID = collectionID) from DynamoDB
  const queryParams = {
    TableName: IMAGE_TABLE,
    IndexName: 'byCollectionId',
    KeyConditionExpression: 'collectionID = :collection',
    ExpressionAttributeValues: {
      ':collection': jobID
    }
  };
  docClient.query(queryParams, function (err, data) {
    if (err) {
      console.log("Query error: ", err);
    }
    else {
      for (let img of data.Items) {
        fileKeyList.push('public/' + jobID + "/images/" + img.imageID);
      }
      //pull the image's content from S3
      for (let key of fileKeyList) {
        promises.push(S3download(key));
      }

      Promise.all(promises)
        .then(async function (results) {
          //add all images from S3 into fileContentList array
          for (let index in results) {
            let content = results[index];
            fileContentList.push(content.Body); //.toString()
            console.log("New File Content: ", content.ETag);
          }

          // append all image's content to formData
          let formData = new formdata();
          let count = 0;
          for (let img of fileContentList) {
            formData.append('data', img, { filename: `${fileKeyList[count]}.png` });
            count++;
          }

          // start new WebODM stitching job - call createTask API endpoint
          let response = await fetch('http://localhost:8000/api/projects/1/tasks/', {
            method: 'POST',
            body: formData,
            headers: {
              "Authorization": `JWT ${tokenResp.token}`
            }
          });
          let result: WebODMCreateTaskResponse = await response.json();
          console.log("CREATE TASK RESULT: ", result);

          const taskID = result.id;

          //set the taskID and set 'pending' to true on this image collection in DynamoDB
          const params = {
            TableName: IMAGE_COLLECTION_TABLE,
            Key: {
              "collectionID": jobID
            },
            ExpressionAttributeNames: {
              "#p": "pending"
            },
            UpdateExpression: "set #p = :x, taskID = :task",
            ExpressionAttributeValues: {
              ":x": true,
              ":task": taskID
            }
          }
          docClient.update(params, function (updateErr, updateRes) {
            if (updateErr) console.log(updateErr);
            else console.log("\n[CREATE MAP] updating image collection: ", updateRes);
          });
        })
        .catch(function (err) {
          console.log(err);
        });
    }
  });
}

async function checkPendingJobs() {
  console.log("\n[SERVER] Checking for pending jobs...")

  const params: CheckTableParam = {
    TableName: PENDING_JOBS_TABLE,
  };

  //scan through pending jobs table and check if each job is pending or not
  let items;
  do {
    items = await docClient.scan(params).promise();

    items.Items?.forEach((item: any) => {
      console.log(item);

      //pass through jobID (jobID = collectionID)
      createMap(item.jobID);

      //delete PendingJob (DynamoDB)
      const deleteParams = {
        TableName: PENDING_JOBS_TABLE,
        Key: {
          'jobID': item.jobID
        }
      };
      docClient.delete(deleteParams, function (err, data) {
        if (err) console.log(err);
        else console.log(data);
      });
    });

    params.ExclusiveStartKey = items.LastEvaluatedKey;
  } while (typeof items.LastEvaluatedKey !== "undefined");
}

function addCompletedJob(taskID: string) {
  console.log("[SERVER] Adding completed job");

  // add a new entry in the completed jobs table (DynamoDB)
  const putParams = {
    TableName: COMPLETED_JOBS_TABLE,
    Item: {
      'taskID': taskID
    }
  };
  docClient.put(putParams, function (err, data) {
    if (err) console.log(err);
    else console.log(data);
  });

  // add the newly completed job to the current global array
  completedJobs.push(taskID);
}

async function publishSNSNotification() {
  console.log("[SERVER] Publishing SNS notification");

  const publishParams = {
    Message: 'New stitched map completed!',
    TopicArn: 'arn:aws:sns:sa-east-1:870416143884:maps'
  };
  const publishMapPromise = SNS.publish(publishParams).promise();
  await publishMapPromise.then((data) => {
    console.log(`'New map' message sent to front-end using SNS`);
  }).catch((err) => {
    console.log("Error in SNS publishing")
    console.error(err, err.stack);
  });
}

// What if WebODM is turned off mid-job?
// What if this js file is stopped mid-job while WebODM continues?

// entry point
main();
