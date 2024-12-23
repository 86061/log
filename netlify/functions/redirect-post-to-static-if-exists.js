const fs = require('fs');
const path = require('path');

exports.handler = async (event) => {
  const { slug } = event.queryStringParameters;

  if (!slug) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Slug is required' }),
    };
  }

  const filePath = path.join(__dirname, `../../static/${slug}.html`);

  // Cek apakah file statis ada
  if (fs.existsSync(filePath)) {
    // Jika file statis ada, arahkan ke URL statis
    return {
      statusCode: 301,
      headers: {
        Location: `/static/${slug}.html`,  // Redirect ke file statis
      },
    };
  }

  // Jika file statis tidak ada, lanjutkan untuk menyajikan konten dinamis
  const dynamicUrl = `https://jobsus.netlify.app/post/${slug}.html`;
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Serve dynamic content', url: dynamicUrl }),
  };
};
