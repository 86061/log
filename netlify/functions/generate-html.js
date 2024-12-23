const axios = require("axios");

exports.handler = async (event) => {
  const { slug } = event.queryStringParameters;

  if (!slug) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Slug is required" }),
    };
  }

  try {
    // Step 1: Ambil HTML dari URL
    const url = `https://jobsus.netlify.app/post/${slug}.html`;
    console.log("Fetching HTML from URL:", url);

    const response = await axios.get(url);
    const htmlContent = response.data;
    console.log("HTML Content fetched successfully");

    // Step 2: Ambil variabel lingkungan
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const REPO = process.env.REPO;
    const FILE_PATH = `static/${slug}.html`; // File path relatif dalam repo

    if (!GITHUB_TOKEN || !REPO) {
      console.error("Environment variables missing: GITHUB_TOKEN or REPO");
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Missing environment variables" }),
      };
    }

    const GITHUB_API_URL = `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`;
    console.log("GitHub API URL:", GITHUB_API_URL);
    console.log("File Path:", FILE_PATH);

    // Step 3: Encode konten HTML ke Base64
    const encodedContent = Buffer.from(htmlContent).toString("base64");

    // Step 4: Cek apakah file sudah ada
    let sha = null;
    try {
      console.log("Checking if file exists on GitHub...");
      const fileResponse = await axios.get(GITHUB_API_URL, {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
        },
      });
      if (fileResponse.status === 200) {
        sha = fileResponse.data.sha; // Ambil SHA jika file sudah ada
        console.log("File exists, SHA:", sha);
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log("File does not exist, will create a new file");
      } else {
        console.error("Error fetching file info:", error.message);
        return {
          statusCode: 500,
          body: JSON.stringify({
            error: "Error checking file on GitHub",
            details: error.message,
          }),
        };
      }
    }

    // Step 5: Simpan atau perbarui file di GitHub
    console.log("Saving file to GitHub...");
    const saveResponse = await axios.put(
      GITHUB_API_URL,
      {
        message: `Update ${slug}.html via Netlify Function`,
        content: encodedContent,
        sha: sha || undefined, // Tambahkan SHA jika file ada
      },
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
        },
      }
    );

    console.log("File saved successfully:", saveResponse.data.content.html_url);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `File ${slug}.html saved successfully to GitHub`,
        url: saveResponse.data.content.html_url,
      }),
    };
  } catch (error) {
    console.error("Error during file save process:", error.message);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to save HTML to GitHub",
        details: error.message,
      }),
    };
  }
};
