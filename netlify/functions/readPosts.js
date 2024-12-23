const fetch = require('node-fetch');

exports.handler = async () => {
  try {
    const NETLIFY_ACCESS_TOKEN = process.env.NET_TOKEN;
        //jobsus addition:
    const FORM_ID = process.env.FORM_ID_postForm;
    
    //NET_TOKEN  //nfp_J9noW6zg8YM1XFrUJF1Sa3DYUrbaoJvB8b90
    if (!NETLIFY_ACCESS_TOKEN) {
      throw new Error("NET_TOKEN environment variable is missing");
    }

    const formId = FORM_ID;
    const endpoint = `https://api.netlify.com/api/v1/forms/${formId}/submissions`;

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

    const submissions = await response.json();
    return {
      statusCode: 200,
      body: JSON.stringify(submissions),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
