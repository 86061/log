//ini isi file https://jobsus.netlify.app/.netlify/functions/triggerManager_background.js
//Fungsi-fungsi :
  // Fungsi 1: Create static version of the post
  //'https://jobsus.netlify.app/saveFormsToStatic'
  
  // Fungsi 2: Create static index page files
  //'https://jobsus.netlify.app/staticIndexMaker'
  
  // Fungsi 3: Update RSS feed 1 page:
  //'https://jobsus.netlify.app/rssfeed' diberi alternatif baru berupa single proses:
  //https://jobsus.netlify.app/.netlify/functions/generateRSSfeedXML
  //untuk validasi hasilnya rssfeed.xml tunggu netlify build and publish dulu

  // Fungsi 3a: Update RSS feed multi sub page and 1 index page:
  //https://jobsus.netlify.app/.netlify/functions/generateRSSfeedXMLperPage

  
  // Fungsi 4: Update sitemap
  //'https://jobsus.netlify.app/sitemap-xml'

  // Fungsi 4a: Update Site map XML multi sub page and 1 index page:
  //https://jobsus.netlify.app/.netlify/functions/generateSiteMapXMLperPage


//////////////////////////////////////////

const fetch = require('node-fetch');

exports.handler = async () => {
  const functionUrls = [
    'https://jobsus.netlify.app/.netlify/functions/saveFormsToStatic',
    'https://jobsus.netlify.app/.netlify/functions/staticIndexMaker',
    'https://jobsus.netlify.app/.netlify/functions/generateRSSfeedXMLperPage',
    'https://jobsus.netlify.app/.netlify/functions/generateSiteMapXMLperPage'
  ];

  console.log("Starting triggerManager_background function");

  try {
    for (let i = 0; i < functionUrls.length; i++) {
      console.log(`Starting call to function ${i + 1}: ${functionUrls[i]}`);

      const response = await fetch(functionUrls[i]);
      const contentType = response.headers.get('content-type');
      console.log(`Response for function ${i + 1}: HTTP ${response.status} - Content-Type: ${contentType}`);

      let result;
      // Periksa tipe konten respons
      if (contentType.includes('application/json')) {
        result = await response.json();
        console.log(`Function ${i + 1} completed with JSON:`, result);
      } else if (contentType.includes('text/html')) {
        result = await response.text();
        console.log(`Function ${i + 1} completed with HTML:\n${result.substring(0, 200)}...`); // Potong untuk log
      } else if (contentType.includes('text/plain')) {
        result = await response.text();
        console.log(`Function ${i + 1} completed with Text:\n${result.substring(0, 200)}...`); // Potong untuk log
      } else {
        throw new Error(`Function ${i + 1} returned an unrecognized content type: ${contentType}`);
      }
    }

    console.log("All functions executed successfully!");
    return {
      statusCode: 200,
      body: 'All functions executed successfully!'
    };
  } catch (error) {
    console.error('Error while executing functions:', error);
    console.error('Stack trace:', error.stack);
    return {
      statusCode: 500,
      body: `Error while executing functions: ${error.message}`
    };
  }
};
