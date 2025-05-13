// Run seed-estimate-configs.js with Node.js
const { exec } = require('child_process');

// Execute the seed script
const seed = exec('node ./seed-estimate-configs.js', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error executing seed script: ${error.message}`);
    return;
  }
  
  if (stderr) {
    console.error(`Seed script stderr: ${stderr}`);
    return;
  }
  
  console.log(`Seed script output: ${stdout}`);
  console.log('Seed completed successfully!');
});

seed.on('exit', (code) => {
  if (code !== 0) {
    console.error(`Seed script exited with code ${code}`);
    process.exit(code);
  }
});