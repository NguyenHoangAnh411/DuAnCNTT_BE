const { exec } = require('child_process');

const services = [
  { name: 'personalized', port: 3001 },
  { name: 'premium', port: 3002 },
  { name: 'chatbot', port: 3003 },
  { name: 'admin', port: 3004 },
  { name: 'chat', port: 3005 },
  { name: 'forum', port: 3006 },
  { name: 'course', port: 3007 },
  { name: 'vocabulary', port: 3008 },
  { name: 'lesson', port: 3009 },
  { name: 'exercise', port: 3010 },
  { name: 'user', port: 3011 },
  { name: 'games', port: 3012 },
];

services.forEach((service) => {
  const command = `node ${service.name}_service/server.js`;
  const childProcess = exec(command);

  childProcess.stdout.on('data', (data) => {
    console.log(`[${service.name}] ${data}`);
  });

  childProcess.stderr.on('data', (data) => {
    console.error(`[${service.name}] ERROR: ${data}`);
  });

  childProcess.on('close', (code) => {
    console.log(`[${service.name}] Process exited with code ${code}`);
  });
});

console.log('All services are starting...');