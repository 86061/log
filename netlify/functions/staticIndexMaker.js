const fetch = require("node-fetch");

exports.handler = async () => {
  try {
    // Environment variables
    const NETLIFY_ACCESS_TOKEN = process.env.NET_TOKEN;
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const REPO = process.env.REPO;
    const FILE_PATH = "index-static.html"; // Path untuk file di GitHub root

    const FORM_ID = "673faec750f0a700080c6bac"; // Ganti dengan ID Form Netlify Anda
    const NETLIFY_ENDPOINT = `https://api.netlify.com/api/v1/forms/${FORM_ID}/submissions`;

    if (!NETLIFY_ACCESS_TOKEN || !GITHUB_TOKEN || !REPO) {
      throw new Error("Missing required environment variables");
    }

    // Fetch submissions from Netlify Forms
    const netlifyResponse = await fetch(NETLIFY_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${NETLIFY_ACCESS_TOKEN}`,
      },
    });

    if (!netlifyResponse.ok) {
      return {
        statusCode: netlifyResponse.status,
        body: JSON.stringify({ error: "Failed to fetch form submissions" }),
      };
    }

    const submissions = await netlifyResponse.json();

    // Template HTML
    const templateHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" id="meta-description" content="desc">
  <meta name="author" id="meta-author" content="Roy">
  <meta name="robots" content="index, follow">

  <title id="page-title">Static Page Title</title>

  <!-- Prefetch DNS untuk Cloudinary -->

  <link rel="dns-prefetch" href="https://res.cloudinary.com">


  <link rel="stylesheet" href="/index-html.css">
    
</head>
<body>




<div class="container">

  <header>
    <nav class="menu">
      <a href="/login/">Login</a> | 
      <a href="#search_input" onclick="focusSearchInput()">Search</a>
    </nav>
  
    <!-- Post Title -->
    <h1 style="display: block;">Posts</h1>
    <span id="post-title"></span>
  
  </header>
    
  <div id="post-list" class="grid" style="display: flex;">


    
          {{POSTS}}
  
  
          
          
  </div><!-- class grid ditutup -->
    
  <div id="pagination" class="pagination" style="display: flex;">
      <ul class="pagination">
        <li>
            <a href="#" class="pagination-button active" onclick="changePage(1)">1</a>
        </li>
      </ul>
  </div><!-- class pagination ditutup , diurus belakangan -->

  <br>
  
  <script>
    // Fungsi untuk memindahkan fokus ke input teks pencarian
    function focusSearchInput() {
      const searchInput = document.getElementById('search_input');
      if (searchInput) {
        searchInput.focus();
      }
    }

    const searchFormLocation = document.getElementById('search_Form_Location');
    if (searchFormLocation && searchFormLocation.parentNode) {
      searchFormLocation.parentNode.insertBefore(focusLink, searchFormLocation);
    }
    
  </script>

  <div><!-- start of  Comment Section -->
        <br><br>
               
        <div id="search_Form_Location">
            <form method="get" target="_blank" action="/search/">
              <input type="hidden" name="cx" value="c2e34c8ead538447e">
              <input type="hidden" name="ie" value="UTF-8">
              <input type="text" name="q" placeholder="Search..." id="search_input">
              <button type="submit">Search</button>
            </form>
        </div><!-- id search_Form_Location ditutup -->
        
        <br><br>
        
        
  
  </div><!-- end of  Comment Section -->





  
</div><!-- class container ditutup -->



<!-- Placeholder untuk Footer -->
  <div id="footer-placeholder" class="footer-placeholder"></div>
  <footer style="display: block;">
    <nav class="footer-menu">
      <a href="/login/">Login</a>
      <a href="/privacy">Privacy</a>
      <a href="/tos">Terms</a>
      <a href="/contact-us">Contact</a>
      <a href="/sitemap.xml/">Map</a>
      
    </nav>
    <br>
    
    <p>© <span id="current-year">2024</span> <span id="site-name">POSTNETLIFY.netlify.app</span>. All Rights Reserved.</p>
  </footer>
  
  
  
  </body>
</html>`;

      // Fungsi untuk membersihkan bodypost
const cleanText = (text) => {
  if (!text) return "";
  return text
    .replace(/<[^>]*>/g, "") // Hapus semua HTML tags
    .replace(/[^\x20-\x7E]/g, "") // Hapus simbol non-ASCII
    .trim(); // Menghapus spasi berlebih di awal/akhir
};





    
    // Generate post list as HTML
    const postListHTML = submissions
      .map((submission) => {
        const { title, slug, bodypost, imagefile } = submission.data;
        
        // Bersihkan dan buat snippet
        const cleanBodyPost = cleanText(bodypost);
        const snippet = cleanBodyPost
                        ? cleanBodyPost.split(" ").slice(0, 15).join(" ") + "..."
                        : "No description snippet";

        // Gambar fallback jika tidak ada imagefile
        const imageUrl = imagefile?.url || "/350x600xBW.webp";











        

        return `
<div class="grid-item">
  <a href="/static/${slug}" style="text-decoration: none; color: inherit;">
    <img src="${imageUrl}" alt="${title}" />
    <h2>${title}</h2>
    <p>${snippet}</p>
  </a>
</div>`;
      })
      .join("\n");

    // Replace placeholder in template
    const finalHTML = templateHTML.replace("{{POSTS}}", postListHTML);

    // Encode HTML content to Base64 for GitHub API
    const encodedContent = Buffer.from(finalHTML).toString("base64");

    const GITHUB_API_URL = `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`;

    // Fetch current file data (to get SHA for update)
    const fileResponse = await fetch(GITHUB_API_URL, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
      },
    });

    let sha = null;
    if (fileResponse.ok) {
      const fileData = await fileResponse.json();
      sha = fileData.sha; // Get SHA if file already exists
    }

    // Save or update file on GitHub
    const githubResponse = await fetch(GITHUB_API_URL, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `token ${GITHUB_TOKEN}`,
      },
      body: JSON.stringify({
        message: "Update index-static.html",
        content: encodedContent,
        sha: sha || undefined, // Include SHA if file exists
      }),
    });

    if (!githubResponse.ok) {
      const errorDetails = await githubResponse.text();
      return {
        statusCode: githubResponse.status,
        body: JSON.stringify({ error: errorDetails }),
      };
    }

    const result = await githubResponse.json();
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "index-static.html generated and saved successfully",
        url: result.content.html_url,
      }),
    };
  } catch (error) {
    console.error("Error in combined handler:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
