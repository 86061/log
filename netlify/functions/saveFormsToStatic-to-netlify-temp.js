const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

exports.handler = async () => {
  try {
    const NETLIFY_ACCESS_TOKEN = process.env.NET_TOKEN;
            //jobsus addition:
    const FORM_ID = process.env.FORM_ID_postForm;
    const formId = FORM_ID;
    const endpoint = `https://api.netlify.com/api/v1/forms/${formId}/submissions`;

    // Fetch submissions dari Netlify API
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

    // Pastikan direktori /tmp/static ada
    const tmpPath = path.join("/tmp", "static");
    if (!fs.existsSync(tmpPath)) {
      fs.mkdirSync(tmpPath, { recursive: true }); // Buat folder jika belum ada
    }

    // Tulis setiap submission ke file HTML di /tmp/static
    submissions.forEach((submission, index) => {
      const htmlContent = `
        <html>
        <head><title>${submission.data.title}</title></head>
        <body>
          <h1>${submission.data.title}</h1>
          <p>Author: ${submission.data.author}</p>
          <p>Body: ${submission.data.bodypost}</p>
        </body>
        </html>
      `;

      // Simpan file
      const filePath = path.join(tmpPath, `submission-${index + 1}.html`);
      fs.writeFileSync(filePath, htmlContent, "utf8");
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Files created successfully!",
        files: fs.readdirSync(tmpPath), // Kirim daftar file yang dibuat
      }),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
