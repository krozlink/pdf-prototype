const PDF = require('pdffiller-aws-lambda');
const AWS = require('aws-sdk');
const S3 = new AWS.S3();
const fs = require('fs');

const TEMP_INPUT = '/tmp/template.pdf';
const TEMP_OUTPUT = '/tmp/formatted.pdf';

exports.handler = (event, context, callback) => {
  const { bucket, inputFile, outputFile, fields } = event;

  console.log(process.env['LAMBDA_TASK_ROOT']);
  console.log(process.env['LAMBDA_TASK_ROOT'] + '/node_modules/pdffiller-aws-lambda/bin');
  fs.readdirSync(process.env['LAMBDA_TASK_ROOT']).forEach(f => {console.log(f)});

  try {
    S3.getObject({ Bucket: bucket, Key: inputFile }, (err, getResp) => {
      if(err) throw err;

      console.log('file read successfully');
    
      fs.writeFile(TEMP_INPUT, getResp.Body, (writeErr) => {
        if(writeErr) throw writeErr;
        console.log('file saved successfully');
  
        PDF.fillFormWithOptions(TEMP_INPUT, TEMP_OUTPUT, fields, true, '/tmp', (fillErr) => {
          if(fillErr) throw fillErr;
          console.log('pdf successfully filled');
  
          fs.readFile(TEMP_OUTPUT, (readErr, readResp) => {
            if(readErr) throw readErr;
  
            const saveParams = {
              Bucket: bucket,
              Key: outputFile,
              Body: new Buffer(readResp, 'binary'),
              ContentType: 'application/pdf'
            };

            S3.putObject(saveParams, (saveErr, data) => {
              if(saveErr) throw saveErr;
              console.log('pdf successfully saved');
              callback(null, true);
            });
          });  
        });
      });
    });
  } catch(e){ 
    console.log('An error occurred');
    console.log(e);
    callback(e, true);
  }
}