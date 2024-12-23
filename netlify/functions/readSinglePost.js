const fetch = require('node-fetch');  // Pastikan untuk mengimpor fetch jika belum ada

exports.handler = async (event, context) => {
  try {
    // Ambil slug dari query string parameter
    const { slug } = event.queryStringParameters;

    // Jika slug tidak ada, kembalikan error 400
    if (!slug) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Slug parameter is missing" }),
      };
    }

    // Gunakan slug untuk mengambil data dari sumber data Anda
    // Misalnya mengambil data dari formulir Netlify
    const NETLIFY_ACCESS_TOKEN = process.env.NET_TOKEN;  // Token akses untuk API Netlify
           //jobsus addition:
    const FORM_ID = process.env.FORM_ID_postForm;
    const formId = FORM_ID;  // Form ID Anda
    const endpoint = `https://api.netlify.com/api/v1/forms/${formId}/submissions`;

    // Pastikan token akses disediakan
    if (!NETLIFY_ACCESS_TOKEN) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "NET_TOKEN environment variable is missing" }),
      };
    }

    // Mengambil data submission dari Netlify Forms menggunakan API
    const response = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${NETLIFY_ACCESS_TOKEN}`,
      },
    });

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: "Failed to fetch form submissions" }),
      };
    }

    // Parsing response JSON
    const submissions = await response.json();

    // Mencari post yang sesuai dengan slug
    const post = submissions.find(submission => submission.data.slug === slug);

    // Jika post tidak ditemukan, kembalikan error 404
    if (!post) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: `Post with slug '${slug}' not found.` }),
      };
    }

    // Jika post ditemukan, kembalikan status 200 dengan data post
    return {
      statusCode: 200,
      body: JSON.stringify(post),
    };
  } catch (error) {
    // Jika terjadi error, kembalikan error 500
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
