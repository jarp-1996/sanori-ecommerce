import https from 'https';

https.get('https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=qyomWr_C_jA&format=json', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log(data);
  });
}).on('error', (err) => {
  console.log("Error: " + err.message);
});
