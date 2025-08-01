const fs = require('fs');
const path = require('path');


function consoleLog(message) {
  if(process.env.ENABLE_LOGS == "Y"){
    const currentdate = new Date(); 
    const log_name = 
      currentdate.getDate() + "" + 
      (currentdate.getMonth()+1) + "" + 
      currentdate.getFullYear() + "@" + 
      currentdate.getHours() + "" + 
      (currentdate.getMinutes() < 10 ? '0' : '') + currentdate.getMinutes() + "" +
      (currentdate.getSeconds() < 10 ? '0' : '') + currentdate.getSeconds();
    
    const logfile_path = path.join(__dirname, '../logs/' + log_name + ".sql");
    const logStream1 = fs.createWriteStream(logfile_path, { flags: 'a' });
    logStream1.write(`${message}\n\n`);
    logStream1.end();
  }
}

module.exports = { consoleLog };